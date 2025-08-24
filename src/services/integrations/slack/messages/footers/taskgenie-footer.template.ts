/**
 * @ai-metadata
 * @component: TaskGenieFooterTemplate
 * @description: Standard TaskGenie footer template for Slack messages
 * @last-update: 2025-01-14
 * @last-editor: ai-assistant
 * @stability: experimental
 * @edit-permissions: "full"
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Standard footer template with branding and system status"
 */

import type { SlackBlock } from '../types';

/**
 * TaskGenie footer configuration
 */
export interface TaskGenieFooterConfig {
  version?: string;
  showSystemStatus?: boolean;
  zendeskDomain?: string;
}

/**
 * Creates a standard TaskGenie footer block for Slack messages
 * @param config Footer configuration options
 * @returns Slack context block with TaskGenie branding and system status
 */
export function createTaskGenieFooter(config: TaskGenieFooterConfig = {}): SlackBlock {
  const {
    version = 'v0.0.2',
    showSystemStatus = true,
    zendeskDomain = '2damcreative.zendesk.com'
  } = config;

  const brandingText = `:robot_face: TaskGenie ${version} • Made by 2DC Team • Powered by AI`;
  
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
export function createSimpleTaskGenieFooter(version: string = 'v0.0.2'): SlackBlock {
  return createTaskGenieFooter({ version, showSystemStatus: false });
}

/**
 * Footer with custom Zendesk domain
 */
export function createCustomDomainFooter(zendeskDomain: string, version: string = 'v0.0.2'): SlackBlock {
  return createTaskGenieFooter({ version, zendeskDomain, showSystemStatus: true });
}