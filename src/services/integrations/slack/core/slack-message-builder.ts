/**
 * @ai-metadata
 * @component: SlackMessageBuilder
 * @description: Rich message builder for Slack notifications with templates, formatters, and multi-agent response handling
 * @last-update: 2024-01-21
 * @last-editor: system@zendesk-clickup-automation.com
 * @changelog: ./docs/changelog/slack-message-builder.md
 * @stability: stable
 * @edit-permissions: "method-specific"
 * @method-permissions: { "buildIntelligentNotification": "allow", "buildMultiAgentAnalysis": "allow", "buildTeamMentionMessage": "allow", "buildErrorMessage": "allow", "buildSuccessMessage": "allow", "buildProgressMessage": "allow", "reset": "allow", "addSection": "allow", "addHeader": "allow", "getBlocks": "read-only" }
 * @dependencies: ["../../../../types/index.ts", "../types/slack-message-types.ts", "../utils/slack-formatters.ts", "../utils/slack-emojis.ts", "../utils/slack-constants.ts", "../slack-utils.ts"]
 * @tests: ["./tests/slack-message-builder.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Message builder that creates rich Slack notifications for tickets, analysis, and multi-agent responses. Changes here affect the appearance and structure of all Slack messages."
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

import { ZendeskTicket, TicketAnalysis, AssignmentRecommendation, TokenUsage } from '../../../../types/index';
import { SlackMessage, SlackBlockType } from '../types/slack-message-types';
import { SlackFormatters } from '../utils/slack-formatters';
import { SlackEmojis } from '../utils/slack-emojis';
import { SlackConstants } from '../utils/slack-constants';
import { SlackUtils } from '../slack-utils';
// Version constant to avoid package.json import issues
const TASKGENIE_VERSION = '0.0.2';

export interface MultiAgentResponse {
  agentType: string;
  feedback: string;
  recommendations?: string[];
  timeEstimate?: string;
  confidence?: number;
  processingTime?: number;
}

export interface WorkflowContext {
  ticket: ZendeskTicket;
  analysis: TicketAnalysis;
  channel: string;
  threadTs?: string;
  workflow: string;
  assignment?: AssignmentRecommendation;
}

export interface NotificationTemplate {
  header: string;
  sections: string[];
  footer: string;
}

/**
 * Builds rich Slack messages using templates and formatters
 * Centralizes message construction logic for consistency
 */
export class SlackMessageBuilder {
  /**
   * Build intelligent notification message for ticket analysis
   */
  buildIntelligentNotification(
    ticket: ZendeskTicket,
    analysis: TicketAnalysis,
    clickupUrl: string,
    assignment?: AssignmentRecommendation
  ): SlackMessage {
    const urgencyEmoji = SlackEmojis.getUrgencyEmoji(analysis.sentiment || 'neutral', ticket.priority);
    const categoryEmoji = SlackEmojis.getCategoryEmoji(analysis.category || 'general');
    const priorityEmoji = SlackEmojis.getPriorityEmoji(ticket.priority);

    const blocks: SlackBlockType[] = [
      // Header
      {
        type: 'section' as const,
        text: {
          type: 'mrkdwn' as const,
          text: `🧞 *TaskGenie* ${urgencyEmoji}`
        }
      },
      
      // Ticket Information
      {
        type: 'section' as const,
        fields: [
          {
            type: 'mrkdwn' as const,
            text: `*Zendesk Ticket:*\n<${ticket.url}|#${ticket.id}>`
          },
          {
            type: 'mrkdwn' as const,
            text: `*ClickUp Task:*\n<${clickupUrl}|View Task>`
          },
          {
            type: 'mrkdwn' as const,
            text: `*Priority:* ${priorityEmoji} ${ticket.priority}`
          },
          {
            type: 'mrkdwn' as const,
            text: `*Category:* ${categoryEmoji} ${analysis.category || 'General'}`
          }
        ]
      },

      // AI Summary
      {
        type: 'section' as const,
        text: {
          type: 'mrkdwn' as const,
          text: `*AI Summary:*\n${SlackFormatters.truncateText(analysis.summary || 'No summary available', 500)}`
        }
      }
    ];

    // Add urgency indicators if high priority
    if (ticket.priority === 'urgent' || ticket.priority === 'high') {
      blocks.push({
        type: 'section' as const,
        text: {
          type: 'mrkdwn' as const,
          text: `🚨 *Urgency Indicators:*\n• ${analysis.sentiment === 'angry' || analysis.sentiment === 'frustrated' ? 'Customer frustration detected' : 'High priority ticket'}\n• Immediate attention recommended`
        }
      });
    }

    // Add assignment recommendation if available
    if (assignment) {
      blocks.push({
        type: 'section' as const,
        text: {
          type: 'mrkdwn' as const,
          text: `👥 *Recommended Assignment:*\n• Team: ${assignment.team}\n• Confidence: ${Math.round((assignment.confidence || 0) * 100)}%`
        }
      });
    }

    // Add action items
    blocks.push({
      type: 'section' as const,
      text: {
        type: 'mrkdwn' as const,
        text: `📋 *Next Steps:*\n• Review ticket details\n• Assign to appropriate team member\n• Update customer with timeline`
      }
    });

    // Add divider and footer
    blocks.push({ type: 'divider' as const });
    blocks.push(this.createTaskGenieFooter());

    return {
      channel: '',
      text: '🧞 TaskGenie - Intelligent Notification',
      blocks
    };
  }

  /**
   * Build multi-agent analysis message
   */
  buildMultiAgentAnalysis(agentResponse: MultiAgentResponse): SlackMessage {
    const agentEmoji = SlackEmojis.getAgentEmoji(agentResponse.agentType);
    const confidenceBar = SlackFormatters.formatProgressBar(agentResponse.confidence || 0);

    const blocks: SlackBlockType[] = [
      {
        type: 'section' as const,
        text: {
          type: 'mrkdwn' as const,
          text: `${agentEmoji} *${agentResponse.agentType} Agent Analysis*`
        }
      },
      {
        type: 'section' as const,
        text: {
          type: 'mrkdwn' as const,
          text: `*Feedback:*\n${agentResponse.feedback}`
        }
      }
    ];

    // Add recommendations if available
    if (agentResponse.recommendations && agentResponse.recommendations.length > 0) {
      const recommendationText = agentResponse.recommendations
        .map(rec => `• ${rec}`)
        .join('\n');
      
      blocks.push({
        type: 'section' as const,
        text: {
          type: 'mrkdwn' as const,
          text: `*Recommendations:*\n${recommendationText}`
        }
      });
    }

    // Add confidence and timing info
    const metaFields = [];
    if (agentResponse.confidence !== undefined) {
      metaFields.push({
        type: 'mrkdwn' as const,
        text: `*Confidence:* ${confidenceBar} ${Math.round(agentResponse.confidence * 100)}%`
      });
    }
    if (agentResponse.timeEstimate) {
      metaFields.push({
        type: 'mrkdwn' as const,
        text: `*Time Estimate:* ${agentResponse.timeEstimate}`
      });
    }
    if (agentResponse.processingTime) {
      metaFields.push({
        type: 'mrkdwn' as const,
        text: `*Processing Time:* ${agentResponse.processingTime}ms`
      });
    }

    if (metaFields.length > 0) {
      blocks.push({
        type: 'section' as const,
        fields: metaFields
      });
    }

    return {
      channel: '',
      text: `${agentEmoji} ${agentResponse.agentType} Agent Analysis`,
      blocks
    };
  }

  /**
   * Build team mention message
   */
  buildTeamMentionMessage(
    mentions: string[],
    context: WorkflowContext,
    enhancedMessage?: string,
    timeline?: string,
    nextSteps?: string[]
  ): SlackMessage {
    const mentionText = mentions.map(mention => `<@${mention}>`).join(' ');
    
    const blocks: SlackBlockType[] = [
      {
        type: 'section' as const,
        text: {
          type: 'mrkdwn' as const,
          text: `👥 *Team Assignment*\n\n${mentionText}`
        }
      }
    ];

    if (enhancedMessage) {
      blocks.push({
        type: 'section' as const,
        text: {
          type: 'mrkdwn' as const,
          text: `*Context:*\n${enhancedMessage}`
        }
      });
    }

    // Add ticket reference
    blocks.push({
      type: 'section' as const,
      fields: [
        {
          type: 'mrkdwn' as const,
          text: `*Ticket:* <${context.ticket.url}|#${context.ticket.id}>`
        },
        {
          type: 'mrkdwn' as const,
          text: `*Priority:* ${SlackEmojis.getPriorityEmoji(context.ticket.priority)} ${context.ticket.priority}`
        }
      ]
    });

    if (timeline) {
      blocks.push({
        type: 'section' as const,
        text: {
          type: 'mrkdwn' as const,
          text: `⏰ *Timeline:* ${timeline}`
        }
      });
    }

    if (nextSteps && nextSteps.length > 0) {
      const stepsText = nextSteps.map(step => `• ${step}`).join('\n');
      blocks.push({
        type: 'section' as const,
        text: {
          type: 'mrkdwn' as const,
          text: `📋 *Next Steps:*\n${stepsText}`
        }
      });
    }

    return {
      channel: '',
      text: `👥 Team Assignment - Ticket #${context.ticket.id}`,
      blocks
    };
  }

  /**
   * Build error message
   */
  buildErrorMessage(error: Error, context?: any): SlackMessage {
    const blocks: SlackBlockType[] = [
      {
        type: 'section' as const,
        text: {
          type: 'mrkdwn' as const,
          text: `❌ *Error Occurred*\n\n${error.message}`
        }
      }
    ];

    if (context) {
      blocks.push({
        type: 'section' as const,
        text: {
          type: 'mrkdwn' as const,
          text: `*Context:* ${JSON.stringify(context, null, 2)}`
        }
      });
    }

    blocks.push(this.createTaskGenieFooter());

    return {
      channel: '',
      text: `❌ Error: ${error.message}`,
      blocks
    };
  }

  /**
   * Build success message
   */
  buildSuccessMessage(message: string, data?: any): SlackMessage {
    const blocks: SlackBlockType[] = [
      {
        type: 'section' as const,
        text: {
          type: 'mrkdwn' as const,
          text: `✅ *Success*\n\n${message}`
        }
      }
    ];

    if (data) {
      blocks.push({
        type: 'section' as const,
        text: {
          type: 'mrkdwn' as const,
          text: `*Details:* ${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}`
        }
      });
    }

    blocks.push(this.createTaskGenieFooter());

    return {
      channel: '',
      text: `✅ ${message}`,
      blocks
    };
  }

  /**
   * Build progress message
   */
  buildProgressMessage(step: string, progress: number): SlackMessage {
    const progressBar = SlackFormatters.formatProgressBar(progress);
    
    return {
      channel: '',
      text: `🔄 ${step} - ${Math.round(progress * 100)}%`,
      blocks: [
        {
          type: 'section' as const,
          text: {
            type: 'mrkdwn' as const,
            text: `🔄 *${step}*\n\n${progressBar} ${Math.round(progress * 100)}%`
          }
        }
      ]
    };
  }

  /**
   * Create TaskGenie footer
   */
  private createTaskGenieFooter(tokenUsage?: TokenUsage, provider?: string): SlackBlockType {
    let footerText = `🧞 TaskGenie v${TASKGENIE_VERSION}`;
    
    if (tokenUsage) {
      footerText += ` | ${SlackFormatters.formatTokenUsage(tokenUsage)}`;
    }
    
    if (provider) {
      footerText += ` | ${SlackUtils.formatAIProvider(provider)}`;
    }
    
    footerText += ` | ${SlackFormatters.formatTimestamp()}`;

    return {
      type: 'context' as const,
      elements: [
        {
          type: 'mrkdwn' as const,
          text: footerText
        }
      ]
    };
  }

  /**
   * Reset the message builder state (placeholder method)
   */
  reset(): SlackMessageBuilder {
    // This method can be used to reset any internal state if needed
    return this;
  }

  addSection(text: string): SlackMessageBuilder {
    // This method can be used to add sections to a message being built
    // For now, it's a placeholder that returns this for method chaining
    return this;
  }

  addHeader(text: string): SlackMessageBuilder {
    // This method can be used to add headers to a message being built
    // For now, it's a placeholder that returns this for method chaining
    return this;
  }

  getBlocks(): any[] {
    // This method returns the blocks for the message
    // For now, it returns an empty array
    return [];
  }
}