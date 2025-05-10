/**
 * Authentication test utilities
 * 
 * This file provides utility functions for testing authentication methods
 * in Actual Budget.
 */

import * as asyncStorage from '../platform/server/asyncStorage';
import { handlers } from './auth-api';

/**
 * Mocks a successful password authentication
 * @param {string} password - The password to authenticate with
 * @returns {Promise<string>} The authentication token
 */
export async function mockPasswordAuth(password: string): Promise<string> {
  const response = await handlers['api/login-password']({ password });
  if ('error' in response) {
    throw new Error(`Authentication failed: ${response.error}`);
  }
  return response;
}

/**
 * Mocks a successful OIDC authentication flow
 * @param {string} returnUrl - The return URL for the OIDC flow
 * @param {string} code - The authorization code
 * @param {string} state - The state parameter
 * @param {string} [password] - Optional password for hybrid auth
 * @returns {Promise<string>} The authentication token
 */
export async function mockOidcAuth(
  returnUrl: string, 
  code: string, 
  state: string,
  password?: string
): Promise<string> {
  // Step 1: Get OIDC login URL
  const loginResponse = await handlers['api/login-oidc']({ returnUrl, password });
  if ('error' in loginResponse) {
    throw new Error(`OIDC initialization failed: ${loginResponse.error}`);
  }
  
  // Step 2: Exchange code for token (in real flow, user would be redirected)
  const tokenResponse = await handlers['api/oidc-token']({ code, state });
  if ('error' in tokenResponse) {
    throw new Error(`OIDC token exchange failed: ${tokenResponse.error}`);
  }
  
  return tokenResponse;
}

/**
 * Mocks a successful header authentication
 * @param {string} headerValue - The header value to authenticate with
 * @returns {Promise<string>} The authentication token
 */
export async function mockHeaderAuth(headerValue: string): Promise<string> {
  const response = await handlers['api/login-header']({ headerValue });
  if ('error' in response) {
    throw new Error(`Header authentication failed: ${response.error}`);
  }
  return response;
}

/**
 * Gets the stored authentication token
 * @returns {Promise<string|null>} The stored token or null if not set
 */
export async function getStoredToken(): Promise<string | null> {
  return await asyncStorage.getItem('user-token');
}

/**
 * Clears the stored authentication token
 * @returns {Promise<void>}
 */
export async function clearStoredToken(): Promise<void> {
  await asyncStorage.removeItem('user-token');
}
