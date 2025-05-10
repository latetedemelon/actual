# Authentication System

This folder contains the core authentication system for Actual Budget. The system supports multiple authentication methods:

1. Password authentication (traditional login)
2. OpenID Connect (OIDC) authentication for integration with identity providers
3. Header-based authentication for use with reverse proxies

## Architecture

The authentication system consists of three main components:

1. **API Methods** (`packages/api/methods.ts`): Client-facing methods for authentication operations
2. **Auth API Handlers** (`packages/loot-core/src/server/auth-api.ts`): Server-side handlers that process authentication requests
3. **Frontend Components** (`packages/desktop-client/src/components/manager/subscribe/Login.tsx`): UI components that enable users to authenticate

## Authentication Flow

### Password Authentication

1. User enters password in the UI
2. `loginWithPassword()` API method is called
3. `api/login-password` handler validates the password
4. On success, a token is returned and stored in async storage

### OpenID Connect (OIDC) Authentication

1. User clicks "Sign in with OpenID" button
2. `loginWithOidc()` API method is called with the return URL
3. `api/login-oidc` handler initiates the OIDC flow and returns a redirect URL
4. User is redirected to the identity provider for authentication
5. After authentication, the identity provider redirects back with a code
6. `getOidcToken()` API method is called with the code and state
7. `api/oidc-token` handler exchanges the code for a token
8. On success, the token is returned and stored in async storage

### Header-based Authentication

1. `loginWithHeader()` API method is called automatically when header auth is configured
2. `api/login-header` handler validates the header value against trusted proxies
3. On success, a token is returned and stored in async storage

## Available Login Methods

The UI displays available login methods using the `getLoginMethods()` API method, which calls the `api/login-methods` handler on the server. This returns an array of authentication methods with their display names and active status.

## Testing

Unit tests are provided for both the API methods and server handlers:

- `packages/api/auth-methods.test.ts`: Tests for the client-facing API methods
- `packages/loot-core/src/server/auth-api.test.ts`: Tests for the server-side handlers

## Security Considerations

1. Token storage uses async storage mechanisms appropriate for each platform
2. OIDC implementation follows security best practices with state validation
3. Header authentication should only be used with trusted reverse proxies
