/**
 * @ai-metadata
 * @component: ClickUpOAuthInterfaces
 * @description: ClickUp OAuth-related type definitions and token structures
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/clickup-oauth-interfaces.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 * @tests: []
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Defines OAuth token structures and authentication types for ClickUp integration"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - dev-approved-by: ""
 *   - dev-approved-date: ""
 *   - code-review-approved: false
 *   - code-review-approved-by: ""
 *   - code-review-date: ""
 *   - qa-approved: false
 *   - qa-approved-by: ""
 *   - qa-approved-date: ""
 * 
 * @approval-rules:
 *   - require-dev-approval-for: ["breaking-changes", "security-related"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

/**
 * OAuth Tokens interface
 * Represents OAuth token data for authentication
 */
export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  token_type?: string;
  scope?: string;
}

/**
 * ClickUp OAuth Response interface
 * Represents the response from ClickUp OAuth token exchange
 */
export interface ClickUpOAuthResponse {
  access_token: string;
  token_type: string;
}

/**
 * User OAuth Data interface
 * Represents OAuth data associated with a user
 */
export interface UserOAuthData {
  user_id: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  scope?: string;
  team_id?: string;
  authorized_at?: string;
  scopes?: string[];
}