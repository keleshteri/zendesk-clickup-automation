/**
 * Configuration for Slack bot initialization
 */
export interface SlackBotConfig {
  /** Bot token for authentication */
  botToken: string;
  /** Bot user ID for mentions */
  botUserId?: string;
  /** Signing secret for request verification */
  signingSecret?: string;
  /** Custom port for HTTP mode */
  port?: number;
}