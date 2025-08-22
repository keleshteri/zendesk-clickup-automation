/**
 * @ai-metadata
 * @component: SlackValidators
 * @description: Comprehensive validation utilities for Slack-related data including IDs, messages, events, and API responses
 * @last-update: 2025-01-21
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/slack-validators.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 * @tests: ["./tests/slack-validators.test.ts"]
 * @breaking-changes-risk: high
 * @review-required: true
 * @ai-context: "Critical validation utilities for all Slack data - ensures data integrity and security"
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
 *   - require-dev-approval-for: ["breaking-changes", "validation-logic-changes", "security-related"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

/**
 * Comprehensive validation utilities for Slack-related data
 * Provides validation for IDs, messages, events, and API responses
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export class SlackValidators {
  /**
   * Validate Slack IDs
   */
  static validateUserId(userId: string): ValidationResult {
    const errors: string[] = [];
    
    if (!userId) {
      errors.push('User ID is required');
    } else if (!/^U[A-Z0-9]{8,}$/.test(userId)) {
      errors.push('Invalid user ID format. Must start with "U" followed by 8+ alphanumeric characters');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  static validateChannelId(channelId: string): ValidationResult {
    const errors: string[] = [];
    
    if (!channelId) {
      errors.push('Channel ID is required');
    } else if (!/^C[A-Z0-9]{8,}$/.test(channelId)) {
      errors.push('Invalid channel ID format. Must start with "C" followed by 8+ alphanumeric characters');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  static validateTeamId(teamId: string): ValidationResult {
    const errors: string[] = [];
    
    if (!teamId) {
      errors.push('Team ID is required');
    } else if (!/^T[A-Z0-9]{8,}$/.test(teamId)) {
      errors.push('Invalid team ID format. Must start with "T" followed by 8+ alphanumeric characters');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  static validateTimestamp(timestamp: string): ValidationResult {
    const errors: string[] = [];
    
    if (!timestamp) {
      errors.push('Timestamp is required');
    } else if (!/^\d{10}\.\d{6}$/.test(timestamp)) {
      errors.push('Invalid timestamp format. Must be in format "1234567890.123456"');
    } else {
      const [seconds] = timestamp.split('.');
      const date = new Date(parseInt(seconds) * 1000);
      if (isNaN(date.getTime())) {
        errors.push('Invalid timestamp value');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }

  static validateThreadTs(threadTs: string): ValidationResult {
    // Thread timestamp follows same format as regular timestamp
    return this.validateTimestamp(threadTs);
  }

  /**
   * Validate message content
   */
  static validateMessageText(text: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!text) {
      errors.push('Message text is required');
    } else {
      // Check length limits
      if (text.length > 4000) {
        errors.push('Message text exceeds 4000 character limit');
      } else if (text.length > 3000) {
        warnings.push('Message text is approaching 4000 character limit');
      }
      
      // Check for potentially problematic content
      if (text.includes('\u0000')) {
        errors.push('Message contains null characters');
      }
      
      // Check for excessive formatting
      const markdownCount = (text.match(/[*_~`]/g) || []).length;
      if (markdownCount > text.length * 0.3) {
        warnings.push('Message contains excessive markdown formatting');
      }
    }
    
    return { isValid: errors.length === 0, errors, warnings };
  }

  static validateBlocks(blocks: any[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!Array.isArray(blocks)) {
      errors.push('Blocks must be an array');
      return { isValid: false, errors };
    }
    
    if (blocks.length > 50) {
      errors.push('Maximum 50 blocks allowed per message');
    }
    
    blocks.forEach((block, index) => {
      if (!block.type) {
        errors.push(`Block ${index} missing required "type" field`);
      }
      
      // Validate specific block types
      switch (block.type) {
        case 'section':
          if (!block.text && !block.fields) {
            errors.push(`Section block ${index} must have either "text" or "fields"`);
          }
          break;
        case 'divider':
          // Divider blocks don't need additional validation
          break;
        case 'image':
          if (!block.image_url) {
            errors.push(`Image block ${index} missing required "image_url"`);
          }
          if (!block.alt_text) {
            errors.push(`Image block ${index} missing required "alt_text"`);
          }
          break;
        case 'actions':
          if (!block.elements || !Array.isArray(block.elements)) {
            errors.push(`Actions block ${index} missing required "elements" array`);
          } else if (block.elements.length > 5) {
            errors.push(`Actions block ${index} can have maximum 5 elements`);
          }
          break;
        default:
          warnings.push(`Unknown block type "${block.type}" at index ${index}`);
      }
    });
    
    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate Slack events
   */
  static validateSlackEvent(event: any): ValidationResult {
    const errors: string[] = [];
    
    if (!event) {
      errors.push('Event object is required');
      return { isValid: false, errors };
    }
    
    // Required fields for all events
    if (!event.type) {
      errors.push('Event type is required');
    }
    
    if (!event.team_id) {
      errors.push('Team ID is required');
    } else {
      const teamValidation = this.validateTeamId(event.team_id);
      if (!teamValidation.isValid) {
        errors.push(...teamValidation.errors);
      }
    }
    
    // Validate specific event types
    switch (event.type) {
      case 'message':
        if (!event.channel) {
          errors.push('Message event missing channel');
        }
        if (!event.user && !event.bot_id) {
          errors.push('Message event missing user or bot_id');
        }
        if (!event.ts) {
          errors.push('Message event missing timestamp');
        }
        break;
        
      case 'app_mention':
        if (!event.channel) {
          errors.push('App mention event missing channel');
        }
        if (!event.user) {
          errors.push('App mention event missing user');
        }
        if (!event.text) {
          errors.push('App mention event missing text');
        }
        break;
        
      case 'reaction_added':
      case 'reaction_removed':
        if (!event.reaction) {
          errors.push('Reaction event missing reaction');
        }
        if (!event.user) {
          errors.push('Reaction event missing user');
        }
        if (!event.item) {
          errors.push('Reaction event missing item');
        }
        break;
    }
    
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate Slack API responses
   */
  static validateApiResponse(response: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!response) {
      errors.push('API response is required');
      return { isValid: false, errors };
    }
    
    // Check for Slack API error structure
    if (response.ok === false) {
      errors.push(`Slack API error: ${response.error || 'Unknown error'}`);
      
      // Add specific error details if available
      if (response.response_metadata?.messages) {
        response.response_metadata.messages.forEach((msg: string) => {
          warnings.push(msg);
        });
      }
    }
    
    // Check for rate limiting
    if (response.headers && response.headers['retry-after']) {
      warnings.push(`Rate limited. Retry after ${response.headers['retry-after']} seconds`);
    }
    
    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate webhook signatures
   */
  static validateWebhookSignature(signature: string, timestamp: string, body: string, secret: string): ValidationResult {
    const errors: string[] = [];
    
    if (!signature) {
      errors.push('Webhook signature is required');
    }
    
    if (!timestamp) {
      errors.push('Webhook timestamp is required');
    } else {
      const requestTime = parseInt(timestamp);
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check if request is too old (5 minutes)
      if (Math.abs(currentTime - requestTime) > 300) {
        errors.push('Webhook request timestamp is too old');
      }
    }
    
    if (!body) {
      errors.push('Webhook body is required');
    }
    
    if (!secret) {
      errors.push('Webhook secret is required');
    }
    
    // If all required fields are present, validate the signature
    if (errors.length === 0) {
      try {
        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(`v0:${timestamp}:${body}`);
        const expectedSignature = `v0=${hmac.digest('hex')}`;
        
        if (signature !== expectedSignature) {
          errors.push('Invalid webhook signature');
        }
      } catch (error) {
        errors.push('Error validating webhook signature');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate message attachments
   */
  static validateAttachments(attachments: any[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!Array.isArray(attachments)) {
      errors.push('Attachments must be an array');
      return { isValid: false, errors };
    }
    
    if (attachments.length > 20) {
      errors.push('Maximum 20 attachments allowed per message');
    }
    
    attachments.forEach((attachment, index) => {
      if (typeof attachment !== 'object') {
        errors.push(`Attachment ${index} must be an object`);
        return;
      }
      
      // Check for deprecated attachment usage
      if (Object.keys(attachment).length > 0) {
        warnings.push(`Attachment ${index}: Attachments are deprecated, consider using blocks instead`);
      }
      
      // Validate color if present
      if (attachment.color && !/^(#[0-9A-Fa-f]{6}|good|warning|danger)$/.test(attachment.color)) {
        errors.push(`Attachment ${index}: Invalid color format`);
      }
    });
    
    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate user permissions
   */
  static validateUserPermissions(userId: string, requiredPermissions: string[], userPermissions: string[]): ValidationResult {
    const errors: string[] = [];
    
    if (!userId) {
      errors.push('User ID is required for permission validation');
    }
    
    if (!Array.isArray(requiredPermissions)) {
      errors.push('Required permissions must be an array');
    }
    
    if (!Array.isArray(userPermissions)) {
      errors.push('User permissions must be an array');
    }
    
    if (errors.length === 0) {
      const missingPermissions = requiredPermissions.filter(
        permission => !userPermissions.includes(permission)
      );
      
      if (missingPermissions.length > 0) {
        errors.push(`User ${userId} missing required permissions: ${missingPermissions.join(', ')}`);
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate rate limiting
   */
  static validateRateLimit(requestCount: number, timeWindow: number, limit: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (requestCount >= limit) {
      errors.push(`Rate limit exceeded: ${requestCount}/${limit} requests in ${timeWindow}ms`);
    } else if (requestCount >= limit * 0.8) {
      warnings.push(`Approaching rate limit: ${requestCount}/${limit} requests in ${timeWindow}ms`);
    }
    
    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate configuration
   */
  static validateSlackConfig(config: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Required configuration fields
    const requiredFields = ['botToken', 'signingSecret'];
    
    requiredFields.forEach(field => {
      if (!config[field]) {
        errors.push(`Missing required configuration: ${field}`);
      }
    });
    
    // Validate token format
    if (config.botToken && !config.botToken.startsWith('xoxb-')) {
      errors.push('Bot token must start with "xoxb-"');
    }
    
    // Validate optional fields
    if (config.appToken && !config.appToken.startsWith('xapp-')) {
      warnings.push('App token should start with "xapp-"');
    }
    
    if (config.userToken && !config.userToken.startsWith('xoxp-')) {
      warnings.push('User token should start with "xoxp-"');
    }
    
    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Comprehensive validation for message sending
   */
  static validateMessageForSending(message: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate channel
    if (!message.channel) {
      errors.push('Channel is required');
    } else {
      const channelValidation = this.validateChannelId(message.channel);
      if (!channelValidation.isValid) {
        errors.push(...channelValidation.errors);
      }
    }
    
    // Validate content (text or blocks required)
    if (!message.text && !message.blocks) {
      errors.push('Either text or blocks is required');
    }
    
    // Validate text if present
    if (message.text) {
      const textValidation = this.validateMessageText(message.text);
      if (!textValidation.isValid) {
        errors.push(...textValidation.errors);
      }
      if (textValidation.warnings) {
        warnings.push(...textValidation.warnings);
      }
    }
    
    // Validate blocks if present
    if (message.blocks) {
      const blocksValidation = this.validateBlocks(message.blocks);
      if (!blocksValidation.isValid) {
        errors.push(...blocksValidation.errors);
      }
      if (blocksValidation.warnings) {
        warnings.push(...blocksValidation.warnings);
      }
    }
    
    // Validate attachments if present
    if (message.attachments) {
      const attachmentsValidation = this.validateAttachments(message.attachments);
      if (!attachmentsValidation.isValid) {
        errors.push(...attachmentsValidation.errors);
      }
      if (attachmentsValidation.warnings) {
        warnings.push(...attachmentsValidation.warnings);
      }
    }
    
    // Validate thread_ts if present
    if (message.thread_ts) {
      const threadValidation = this.validateThreadTs(message.thread_ts);
      if (!threadValidation.isValid) {
        errors.push(...threadValidation.errors);
      }
    }
    
    return { isValid: errors.length === 0, errors, warnings };
  }
}