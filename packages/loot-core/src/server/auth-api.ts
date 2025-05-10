// This file contains API handlers for authentication methods
import * as asyncStorage from '../platform/server/asyncStorage';
import { PostError } from './errors';
import { post } from './post';
import { getServer } from './server-config';

// API handlers for authentication
export const handlers = {
  // Handler for password authentication
  'api/login-password': async function ({ password }: { password: string }) {
    try {
      const serverConfig = getServer();
      if (!serverConfig) {
        throw new Error('No sync server configured.');
      }
      
      const res = await post(serverConfig.SIGNUP_SERVER + '/login', {
        password,
        loginMethod: 'password'
      });

      if (res.token) {
        await asyncStorage.setItem('user-token', res.token);
        return res.token;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      if (err instanceof PostError) {
        return {
          error: err.reason || 'network-failure',
        };
      }
      throw err;
    }
  },

  // Handler for OIDC authentication initiation
  'api/login-oidc': async function ({ returnUrl, password }: { returnUrl: string, password?: string }) {
    try {
      const serverConfig = getServer();
      if (!serverConfig) {
        throw new Error('No sync server configured.');
      }

      const res = await post(serverConfig.SIGNUP_SERVER + '/login', {
        returnUrl,
        loginMethod: 'openid',
        password
      });

      if (res.returnUrl) {
        return { returnUrl: res.returnUrl };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      if (err instanceof PostError) {
        return {
          error: err.reason || 'network-failure',
        };
      }
      throw err;
    }
  },

  // Handler for OIDC authentication callback
  'api/oidc-token': async function ({ code, state, iss }: { code: string, state: string, iss?: string }) {
    try {
      const serverConfig = getServer();
      if (!serverConfig) {
        throw new Error('No sync server configured.');
      }
      
      // Send to OIDC callback endpoint
      const res = await post(serverConfig.BASE_SERVER + '/openid/callback', {
        code,
        state,
        iss
      });

      if (res.token) {
        await asyncStorage.setItem('user-token', res.token);
        return res.token;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      if (err instanceof PostError) {
        return {
          error: err.reason || 'network-failure',
        };
      }
      throw err;
    }
  },

  // Handler for header-based authentication
  'api/login-header': async function ({ headerValue }: { headerValue: string }) {
    try {
      const serverConfig = getServer();
      if (!serverConfig) {
        throw new Error('No sync server configured.');
      }

      // Send with header auth
      const res = await post(serverConfig.SIGNUP_SERVER + '/login', 
        { loginMethod: 'header' },
        { 'x-actual-password': headerValue }
      );

      if (res.token) {
        await asyncStorage.setItem('user-token', res.token);
        return res.token;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      if (err instanceof PostError) {
        return {
          error: err.reason || 'network-failure',
        };
      }
      throw err;
    }
  },

  // Handler for getting available login methods
  'api/login-methods': async function () {
    try {
      const serverConfig = getServer();
      if (!serverConfig) {
        throw new Error('No sync server configured.');
      }

      const res = await post(serverConfig.SIGNUP_SERVER + '/login-methods', {});
      return res.methods || [];
    } catch (err) {
      if (err instanceof PostError) {
        return {
          error: err.reason || 'network-failure',
        };
      }
      throw err;
    }
  }
};
