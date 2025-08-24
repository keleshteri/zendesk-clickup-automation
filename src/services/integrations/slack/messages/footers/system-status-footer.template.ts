/**
 * @ai-metadata
 * @component: SystemStatusFooterTemplate
 * @description: System status footer template for integration health monitoring
 * @last-update: 2025-01-14
 * @last-editor: ai-assistant
 * @stability: experimental
 * @edit-permissions: "full"
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Footer template for displaying system integration status"
 */

import type { SlackBlock } from '../types';

/**
 * System integration status
 */
export interface SystemStatus {
  zendesk: 'online' | 'offline' | 'degraded';
  clickup: 'online' | 'offline' | 'degraded';
  ai: 'online' | 'offline' | 'degraded';
  zendeskDomain?: string;
}

/**
 * Status icon mapping
 */
const STATUS_ICONS = {
  online: ':large_green_circle:',
  offline: ':red_circle:',
  degraded: ':large_yellow_circle:'
} as const;

/**
 * Creates a system status footer block
 * @param status Current system status
 * @returns Slack context block with system status indicators
 */
export function createSystemStatusFooter(status: SystemStatus): SlackBlock {
  const {
    zendesk,
    clickup,
    ai,
    zendeskDomain = '2damcreative.zendesk.com'
  } = status;

  const zendeskStatus = `${STATUS_ICONS[zendesk]} Zendesk (${zendeskDomain})`;
  const clickupStatus = `${STATUS_ICONS[clickup]} ClickUp`;
  const aiStatus = `${STATUS_ICONS[ai]} AI Provider`;

  return {
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `${zendeskStatus} | ${clickupStatus} | ${aiStatus}`
      }
    ]
  };
}

/**
 * Creates a minimal status footer (just online/offline indicators)
 */
export function createMinimalStatusFooter(allOnline: boolean = true): SlackBlock {
  const icon = allOnline ? ':large_green_circle:' : ':red_circle:';
  const status = allOnline ? 'All systems operational' : 'Some systems experiencing issues';
  
  return {
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `${icon} ${status}`
      }
    ]
  };
}