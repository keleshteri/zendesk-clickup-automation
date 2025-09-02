/**
 * @type: types
 * @domain: clickup
 * @validation: zod
 * @immutable: yes
 */

import { z } from 'zod';

// OAuth Configuration
export const OAuthConfigSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client secret is required'),
  redirectUri: z.string().url('Valid redirect URI is required'),
  authorizationUrl: z.string().url().default('https://app.clickup.com/api'),
  tokenUrl: z.string().url().default('https://api.clickup.com/api/v2/oauth/token'),
  scopes: z.array(z.string()).optional(),
});

export type OAuthConfig = z.infer<typeof OAuthConfigSchema>;

// OAuth State for CSRF protection
export const OAuthStateSchema = z.object({
  state: z.string().min(1, 'State parameter is required'),
  codeVerifier: z.string().optional(), // For PKCE if needed
  redirectTo: z.string().optional(),
  timestamp: z.number(),
});

export type OAuthState = z.infer<typeof OAuthStateSchema>;

// OAuth Token Response from ClickUp
export const OAuthTokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string().default('Bearer'),
  expires_in: z.number().optional(), // Currently doesn't expire per docs
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
});

export type OAuthTokenResponse = z.infer<typeof OAuthTokenResponseSchema>;

// Authorization URL parameters
export const AuthorizationUrlParamsSchema = z.object({
  client_id: z.string(),
  redirect_uri: z.string().url(),
  state: z.string().optional(),
  response_type: z.literal('code').default('code'),
});

export type AuthorizationUrlParams = z.infer<typeof AuthorizationUrlParamsSchema>;

// Token exchange request
export const TokenExchangeRequestSchema = z.object({
  client_id: z.string(),
  client_secret: z.string(),
  code: z.string(),
  grant_type: z.literal('authorization_code').default('authorization_code'),
});

export type TokenExchangeRequest = z.infer<typeof TokenExchangeRequestSchema>;

// Refresh token request
export const RefreshTokenRequestSchema = z.object({
  client_id: z.string(),
  client_secret: z.string(),
  refresh_token: z.string(),
  grant_type: z.literal('refresh_token').default('refresh_token'),
});

export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;

// OAuth Error Response
export const OAuthErrorSchema = z.object({
  error: z.string(),
  error_description: z.string().optional(),
  error_uri: z.string().optional(),
  state: z.string().optional(),
});

export type OAuthError = z.infer<typeof OAuthErrorSchema>;