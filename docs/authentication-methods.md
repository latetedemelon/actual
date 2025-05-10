# Authentication Methods in Actual Budget

Actual Budget supports multiple authentication methods to provide flexibility for various deployment scenarios. This document outlines the available authentication methods and how they can be configured.

## Available Authentication Methods

### 1. Password Authentication

The default authentication method uses server-side password validation.

- **API Method**: `loginWithPassword(password: string)`
- **Usage**: Direct password validation against the server
- **Configuration**: Set up during initial server bootstrapping

### 2. OpenID Connect (OIDC) Authentication

Enable third-party authentication through any OIDC-compatible identity provider (e.g., Auth0, Okta, Keycloak).

- **API Methods**:
  - `loginWithOidc(returnUrl: string, password?: string)`: Initiates the OIDC authentication flow
  - `getOidcToken(code: string, state: string, iss?: string)`: Exchanges the authorization code for a token
- **Usage**: Redirects users to the configured identity provider for authentication
- **Configuration**: Configure OIDC provider details through the server settings

### 3. Header-Based Authentication

Allows authentication via trusted proxy headers, useful for integrations with reverse proxies like Nginx, Apache, or Traefik that handle authentication.

- **API Method**: `loginWithHeader(headerValue: string)`
- **Usage**: The server validates the authentication header provided by a trusted proxy
- **Configuration**: Configure the trusted proxies and header name in the server settings

### 4. Get Available Login Methods

Retrieves the authentication methods available on the server.

- **API Method**: `getLoginMethods()`
- **Returns**: Array of authentication methods with display names and active status

## Using Multiple Authentication Methods

The Actual Budget UI automatically adapts to show the appropriate authentication options based on the server configuration. Users can switch between available authentication methods using the selector in the login UI.

## Server-Side Configuration

Authentication methods are configured on the server side. By default, password authentication is enabled. Additional methods can be enabled through the server configuration.

### OIDC Configuration Example

```javascript
{
  "openid": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "issuerUrl": "https://your-identity-provider.com",
    "scope": "openid profile email",
    "buttonText": "Sign in with Your Provider"
  }
}
```

### Header Authentication Example

```javascript
{
  "headerAuth": {
    "headerName": "X-Actual-Password",
    "trustedProxies": ["192.168.1.10", "10.0.0.1"]
  }
}
```

## Security Considerations

1. **OIDC**: Ensure your client secret is kept secure and your redirect URIs are properly configured
2. **Header Authentication**: Only use in environments where proxies are trusted, as header spoofing is possible in untrusted environments
3. **Multiple Methods**: Consider security implications when enabling multiple authentication methods
