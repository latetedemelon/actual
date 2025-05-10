import * as methods from './methods';
import { send } from './send';

jest.mock('./send');

describe('API authentication methods', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('loginWithPassword', () => {
    it('should call send with correct parameters', async () => {
      (send as jest.Mock).mockResolvedValue({ token: 'mock-token' });
      
      await methods.loginWithPassword('test-password');
      
      expect(send).toHaveBeenCalledWith('api/login-password', { password: 'test-password' });
    });
  });

  describe('loginWithOidc', () => {
    it('should call send with returnUrl and optional password', async () => {
      const mockResult = { returnUrl: 'https://auth.example.com/authorize' };
      (send as jest.Mock).mockResolvedValue(mockResult);
      
      const result = await methods.loginWithOidc('https://app.example.com/callback', 'optional-password');
      
      expect(send).toHaveBeenCalledWith('api/login-oidc', {
        returnUrl: 'https://app.example.com/callback',
        password: 'optional-password'
      });
      expect(result).toEqual(mockResult);
    });

    it('should call send with only returnUrl when password is not provided', async () => {
      const mockResult = { returnUrl: 'https://auth.example.com/authorize' };
      (send as jest.Mock).mockResolvedValue(mockResult);
      
      const result = await methods.loginWithOidc('https://app.example.com/callback');
      
      expect(send).toHaveBeenCalledWith('api/login-oidc', {
        returnUrl: 'https://app.example.com/callback',
        password: undefined
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('getOidcToken', () => {
    it('should call send with code, state, and optional iss', async () => {
      (send as jest.Mock).mockResolvedValue({ token: 'mock-oidc-token' });
      
      await methods.getOidcToken('auth-code', 'state-value', 'https://auth.example.com');
      
      expect(send).toHaveBeenCalledWith('api/oidc-token', {
        code: 'auth-code',
        state: 'state-value',
        iss: 'https://auth.example.com'
      });
    });

    it('should call send without iss when not provided', async () => {
      (send as jest.Mock).mockResolvedValue({ token: 'mock-oidc-token' });
      
      await methods.getOidcToken('auth-code', 'state-value');
      
      expect(send).toHaveBeenCalledWith('api/oidc-token', {
        code: 'auth-code',
        state: 'state-value',
        iss: undefined
      });
    });
  });

  describe('loginWithHeader', () => {
    it('should call send with headerValue', async () => {
      (send as jest.Mock).mockResolvedValue({ token: 'mock-header-token' });
      
      await methods.loginWithHeader('test-header-value');
      
      expect(send).toHaveBeenCalledWith('api/login-header', { headerValue: 'test-header-value' });
    });
  });

  describe('getLoginMethods', () => {
    it('should call send without parameters', async () => {
      const mockMethods = [
        { method: 'password', displayName: 'Password', active: true },
        { method: 'openid', displayName: 'OpenID Connect', active: false },
        { method: 'header', displayName: 'Header Auth', active: false }
      ];
      (send as jest.Mock).mockResolvedValue(mockMethods);
      
      const result = await methods.getLoginMethods();
      
      expect(send).toHaveBeenCalledWith('api/login-methods');
      expect(result).toEqual(mockMethods);
    });
  });
});
