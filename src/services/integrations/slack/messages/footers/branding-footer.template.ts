/**
 * @ai-metadata
 * @component: BrandingFooterTemplate
 * @description: Branding footer templates for different contexts and styles
 * @last-update: 2025-01-14
 * @last-editor: ai-assistant
 * @stability: experimental
 * @edit-permissions: "full"
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Various branding footer styles for different message contexts"
 */

import type { SlackBlock } from '../types';

/**
 * Branding footer configuration
 */
export interface BrandingFooterConfig {
  version?: string;
  showTeam?: boolean;
  showPoweredBy?: boolean;
  customText?: string;
}

/**
 * Creates a full branding footer with team and powered by text
 * Example: :robot_face: TaskGenie v0.0.2 • Made by 2DC Team • Powered by AI
 */
export function createFullBrandingFooter(config: BrandingFooterConfig = {}): SlackBlock {
  const {
    version = 'v0.0.2',
    showTeam = true,
    showPoweredBy = true,
    customText
  } = config;

  let text = `:robot_face: TaskGenie ${version}`;
  
  if (showTeam) {
    text += ' • Made by 2DC Team';
  }
  
  if (showPoweredBy) {
    text += ' • Powered by AI';
  }
  
  if (customText) {
    text += ` • ${customText}`;
  }

  return {
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text
      }
    ]
  };
}

/**
 * Creates a minimal branding footer with just TaskGenie name and version
 * Example: TaskGenie v0.0.2
 */
export function createMinimalBrandingFooter(version: string = 'v0.0.2'): SlackBlock {
  return {
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `TaskGenie ${version}`
      }
    ]
  };
}

/**
 * Creates a team-focused branding footer
 * Example: :robot_face: Made by 2DC Team
 */
export function createTeamBrandingFooter(): SlackBlock {
  return {
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: ':robot_face: Made by 2DC Team'
      }
    ]
  };
}

/**
 * Creates a custom branding footer with user-defined text
 */
export function createCustomBrandingFooter(text: string, includeIcon: boolean = true): SlackBlock {
  const finalText = includeIcon ? `:robot_face: ${text}` : text;
  
  return {
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: finalText
      }
    ]
  };
}