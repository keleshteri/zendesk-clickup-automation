/**
 * @ai-metadata
 * @component: BotFooterTemplate
 * @description: Standard bot footer template for Slack messages
 * @last-update: 2025-01-14
 * @last-editor: ai-assistant
 * @stability: experimental
 * @edit-permissions: "full"
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Standard footer template for bot Slack messages with branding and status"
 */

import type { SlackBlock } from '../types';

/**
 * Bot footer configuration
 */
export interface BotFooterConfig {
  version?: string;
  showSystemStatus?: boolean;
  zendeskDomain?: string;
}

/**
 * Creates a standard bot footer block for Slack messages
 * Includes branding, version, and optional system status
 * @param config Footer configuration options
 * @returns Slack context block with bot branding and system status
 */
export function createBotFooter(config: BotFooterConfig = {}): SlackBlock {
  const {
    version = 'v0.0.2',
    showSystemStatus = true,
    zendeskDomain = '2damcreative.zendesk.com'
  } = config;

  const brandingText = `:robot_face: Bot ${version} • Made by 2DC Team • Powered by AI`;
  
  const systemStatusText = showSystemStatus 
    ? `\n:large_green_circle: Zendesk (${zendeskDomain}) | :large_green_circle: ClickUp | :large_green_circle: AI Provider`
    : '';

  return {
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: brandingText + systemStatusText
      }
    ]
  };
}

/**
 * Simple footer with just branding (no system status)
 */
export function createSimpleBotFooter(version: string = 'v0.0.2'): SlackBlock {
  return createBotFooter({ version, showSystemStatus: false });
}

/**
 * Footer with custom Zendesk domain
 */
export function createCustomDomainFooter(zendeskDomain: string, version: string = 'v0.0.2'): SlackBlock {
  return createBotFooter({ version, zendeskDomain, showSystemStatus: true });
}