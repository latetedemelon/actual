import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Login } from '../components/manager/subscribe/Login';
import { ServerProvider } from '../components/ServerContext';
import { useDispatch } from '../redux';
import { loggedIn } from 'loot-core/client/users/usersSlice';
import { send } from 'loot-core/platform/client/fetch';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
jest.mock('../redux', () => ({
  useDispatch: jest.fn(),
}));

jest.mock('loot-core/client/users/usersSlice', () => ({
  loggedIn: jest.fn(),
}));

jest.mock('loot-core/platform/client/fetch', () => ({
  send: jest.fn(),
}));

// Mock the hooks and context values
jest.mock('../components/ServerContext', () => {
  const originalModule = jest.requireActual('../components/ServerContext');
  return {
    ...originalModule,
    ServerProvider: ({ children }) => <div>{children}</div>,
    useLoginMethod: jest.fn(),
    useAvailableLoginMethods: jest.fn(),
  };
});

jest.mock('react-router-dom', () => {
  const originalModule = jest.requireActual('react-router-dom');
  return {
    ...originalModule,
    useSearchParams: () => [new URLSearchParams(), jest.fn()],
    useNavigate: () => jest.fn(),
  };
});

jest.mock('./common', () => ({
  useBootstrapped: () => ({ checked: true }),
  Title: ({ text }) => <h1>{text}</h1>,
}));

describe('Login Component', () => {
  const mockDispatch = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    useDispatch.mockReturnValue(mockDispatch);
  });
  
  describe('Password Authentication', () => {
    beforeEach(() => {
      require('../components/ServerContext').useLoginMethod.mockReturnValue('password');
      require('../components/ServerContext').useAvailableLoginMethods.mockReturnValue([
        { method: 'password', displayName: 'Password', active: true }
      ]);
    });
    
    it('should render password login form', () => {
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );
      
      expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
    });
    
    it('should handle password login submission', async () => {
      send.mockResolvedValue({});
      
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );
      
      fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'test-password' } });
      fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));
      
      await waitFor(() => {
        expect(send).toHaveBeenCalledWith('subscribe-sign-in', {
          password: 'test-password',
          loginMethod: 'password',
        });
        expect(mockDispatch).toHaveBeenCalled();
        expect(loggedIn).toHaveBeenCalled();
      });
    });
    
    it('should display error on failed login', async () => {
      send.mockResolvedValue({ error: 'invalid-password' });
      
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );
      
      fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'wrong-password' } });
      fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid password/i)).toBeInTheDocument();
      });
    });
  });
  
  describe('OpenID Connect Authentication', () => {
    beforeEach(() => {
      require('../components/ServerContext').useLoginMethod.mockReturnValue('openid');
      require('../components/ServerContext').useAvailableLoginMethods.mockReturnValue([
        { method: 'openid', displayName: 'OpenID Connect', active: true }
      ]);
    });
    
    it('should render OIDC login button', () => {
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );
      
      expect(screen.getByRole('button', { name: /Sign in with OpenID/i })).toBeInTheDocument();
    });
    
    it('should handle OIDC login submission', async () => {
      global.window = Object.create(window);
      global.window.location = { href: '', origin: 'https://example.com' };
      send.mockResolvedValue({ redirectUrl: 'https://auth.example.com/authorize' });
      
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );
      
      fireEvent.click(screen.getByRole('button', { name: /Sign in with OpenID/i }));
      
      await waitFor(() => {
        expect(send).toHaveBeenCalledWith('subscribe-sign-in', {
          returnUrl: 'https://example.com',
          loginMethod: 'openid',
          password: '',
        });
        expect(window.location.href).toBe('https://auth.example.com/authorize');
      });
    });
  });
  
  describe('Header-based Authentication', () => {
    beforeEach(() => {
      require('../components/ServerContext').useLoginMethod.mockReturnValue('header');
      require('../components/ServerContext').useAvailableLoginMethods.mockReturnValue([
        { method: 'header', displayName: 'Header Auth', active: true }
      ]);
      send.mockReset();
    });
    
    it('should show loading state for header authentication', () => {
      send.mockResolvedValue({});
      
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );
      
      expect(screen.getByText(/Checking Header Token Login/i)).toBeInTheDocument();
    });
    
    it('should automatically attempt header login on mount', async () => {
      send.mockResolvedValue({});
      
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );
      
      await waitFor(() => {
        expect(send).toHaveBeenCalledWith('subscribe-sign-in', {
          password: '',
          loginMethod: 'header',
        });
        expect(mockDispatch).toHaveBeenCalled();
        expect(loggedIn).toHaveBeenCalled();
      });
    });
    
    it('should show password fallback option on header auth failure', async () => {
      send.mockResolvedValue({ error: 'invalid-header' });
      
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/Log in with password/i)).toBeInTheDocument();
      });
    });
  });
  
  describe('Multiple Authentication Methods', () => {
    beforeEach(() => {
      require('../components/ServerContext').useLoginMethod.mockReturnValue('password');
      require('../components/ServerContext').useAvailableLoginMethods.mockReturnValue([
        { method: 'password', displayName: 'Password', active: true },
        { method: 'openid', displayName: 'OpenID Connect', active: false },
        { method: 'header', displayName: 'Header Auth', active: false }
      ]);
    });
    
    it('should render method selector when multiple methods are available', () => {
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );
      
      expect(screen.getByText(/Select the login method/i)).toBeInTheDocument();
    });
  });
});
