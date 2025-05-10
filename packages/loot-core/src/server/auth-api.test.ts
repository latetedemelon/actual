import { handlers } from './auth-api';
import * as asyncStorage from '../platform/server/asyncStorage';
import { post } from './post';
import { getServer } from './server-config';

jest.mock('./post');
jest.mock('./server-config');
jest.mock('../platform/server/asyncStorage');

describe('auth-api', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (getServer as jest.Mock).mockReturnValue({
      SIGNUP_SERVER: 'https://example.com',
      BASE_SERVER: 'https://example.com'
    });
    (asyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('api/login-password', () => {
    it('should login with password and return token', async () => {
      (post as jest.Mock).mockResolvedValue({ token: 'mock-token' });

      const result = await handlers['api/login-password']({ password: 'test-password' });

      expect(post).toHaveBeenCalledWith('https://example.com/login', {
        password: 'test-password',
        loginMethod: 'password'
      });
      expect(asyncStorage.setItem).toHaveBeenCalledWith('user-token', 'mock-token');
      expect(result).toBe('mock-token');
    });

    it('should return error when login fails', async () => {
      const mockError = new Error('Invalid password');
      mockError['reason'] = 'invalid-password';
      (post as jest.Mock).mockRejectedValue(mockError);

      const result = await handlers['api/login-password']({ password: 'wrong-password' });

      expect(result).toEqual({ error: 'invalid-password' });
    });
  });

  describe('api/login-oidc', () => {
    it('should initialize OIDC login and return redirect URL', async () => {
      (post as jest.Mock).mockResolvedValue({ returnUrl: 'https://auth.example.com/authorize' });

      const result = await handlers['api/login-oidc']({ 
        returnUrl: 'https://app.example.com/callback', 
        password: 'optional-password' 
      });

      expect(post).toHaveBeenCalledWith('https://example.com/login', {
        returnUrl: 'https://app.example.com/callback',
        loginMethod: 'openid',
        password: 'optional-password'
      });
      expect(result).toEqual({ returnUrl: 'https://auth.example.com/authorize' });
    });

    it('should return error when OIDC initialization fails', async () => {
      const mockError = new Error('Network error');
      mockError['reason'] = 'network-failure';
      (post as jest.Mock).mockRejectedValue(mockError);

      const result = await handlers['api/login-oidc']({ returnUrl: 'https://app.example.com/callback' });

      expect(result).toEqual({ error: 'network-failure' });
    });
  });

  describe('api/oidc-token', () => {
    it('should exchange OIDC code for token', async () => {
      (post as jest.Mock).mockResolvedValue({ token: 'mock-oidc-token' });

      const result = await handlers['api/oidc-token']({ 
        code: 'auth-code', 
        state: 'state-value',
        iss: 'https://auth.example.com'
      });

      expect(post).toHaveBeenCalledWith('https://example.com/openid/callback', {
        code: 'auth-code',
        state: 'state-value',
        iss: 'https://auth.example.com'
      });
      expect(asyncStorage.setItem).toHaveBeenCalledWith('user-token', 'mock-oidc-token');
      expect(result).toBe('mock-oidc-token');
    });

    it('should return error when token exchange fails', async () => {
      const mockError = new Error('Invalid code');
      mockError['reason'] = 'invalid-code';
      (post as jest.Mock).mockRejectedValue(mockError);

      const result = await handlers['api/oidc-token']({ code: 'invalid-code', state: 'state-value' });

      expect(result).toEqual({ error: 'invalid-code' });
    });
  });

  describe('api/login-header', () => {
    it('should login with header and return token', async () => {
      (post as jest.Mock).mockResolvedValue({ token: 'mock-header-token' });

      const result = await handlers['api/login-header']({ headerValue: 'test-header-value' });

      expect(post).toHaveBeenCalledWith(
        'https://example.com/login', 
        { loginMethod: 'header' },
        { 'x-actual-password': 'test-header-value' }
      );
      expect(asyncStorage.setItem).toHaveBeenCalledWith('user-token', 'mock-header-token');
      expect(result).toBe('mock-header-token');
    });

    it('should return error when header login fails', async () => {
      const mockError = new Error('Invalid header');
      mockError['reason'] = 'invalid-header';
      (post as jest.Mock).mockRejectedValue(mockError);

      const result = await handlers['api/login-header']({ headerValue: 'invalid-header' });

      expect(result).toEqual({ error: 'invalid-header' });
    });
  });

  describe('api/login-methods', () => {
    it('should return available login methods', async () => {
      const mockMethods = [
        { method: 'password', displayName: 'Password', active: true },
        { method: 'openid', displayName: 'OpenID Connect', active: true },
        { method: 'header', displayName: 'Header Auth', active: false }
      ];
      (post as jest.Mock).mockResolvedValue({ methods: mockMethods });

      const result = await handlers['api/login-methods']();

      expect(post).toHaveBeenCalledWith('https://example.com/login-methods', {});
      expect(result).toEqual(mockMethods);
    });

    it('should return error when fetching methods fails', async () => {
      const mockError = new Error('Network error');
      mockError['reason'] = 'network-failure';
      (post as jest.Mock).mockRejectedValue(mockError);

      const result = await handlers['api/login-methods']();

      expect(result).toEqual({ error: 'network-failure' });
    });

    it('should return empty array when no methods are returned', async () => {
      (post as jest.Mock).mockResolvedValue({});

      const result = await handlers['api/login-methods']();

      expect(result).toEqual([]);
    });
  });
});
