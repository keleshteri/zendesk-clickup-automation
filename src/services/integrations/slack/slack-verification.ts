import { Env } from '../../../types/index.js';

export interface VerificationResult {
  isValid: boolean;
  error?: string;
  timestamp?: number;
  signature?: string;
}

export interface SlackRequestHeaders {
  'x-slack-signature'?: string;
  'x-slack-request-timestamp'?: string;
  'content-type'?: string;
  'user-agent'?: string;
}

export class SlackVerification {
  private env: Env;
  private readonly SLACK_SIGNING_SECRET: string;
  private readonly MAX_REQUEST_AGE = 5 * 60; // 5 minutes in seconds

  constructor(env: Env) {
    this.env = env;
    this.SLACK_SIGNING_SECRET = env.SLACK_SIGNING_SECRET;
    
    if (!this.SLACK_SIGNING_SECRET) {
      console.warn('⚠️ SLACK_SIGNING_SECRET not configured - request verification will fail');
    }
  }

  /**
   * Verify Slack request signature and timestamp
   */
  async verifySlackRequest(
    body: string,
    headers: SlackRequestHeaders
  ): Promise<VerificationResult> {
    try {
      // Check if signing secret is configured
      if (!this.SLACK_SIGNING_SECRET) {
        return {
          isValid: false,
          error: 'Slack signing secret not configured'
        };
      }

      // Extract headers
      const slackSignature = headers['x-slack-signature'];
      const slackTimestamp = headers['x-slack-request-timestamp'];

      // Validate required headers
      if (!slackSignature) {
        return {
          isValid: false,
          error: 'Missing x-slack-signature header'
        };
      }

      if (!slackTimestamp) {
        return {
          isValid: false,
          error: 'Missing x-slack-request-timestamp header'
        };
      }

      // Parse timestamp
      const timestamp = parseInt(slackTimestamp, 10);
      if (isNaN(timestamp)) {
        return {
          isValid: false,
          error: 'Invalid timestamp format'
        };
      }

      // Check request age (prevent replay attacks)
      const currentTime = Math.floor(Date.now() / 1000);
      const requestAge = currentTime - timestamp;
      
      if (requestAge > this.MAX_REQUEST_AGE) {
        return {
          isValid: false,
          error: `Request too old: ${requestAge}s (max: ${this.MAX_REQUEST_AGE}s)`,
          timestamp
        };
      }

      // Verify signature
      const isSignatureValid = await this.verifySignature(
        body,
        slackTimestamp,
        slackSignature
      );

      if (!isSignatureValid) {
        return {
          isValid: false,
          error: 'Invalid signature',
          timestamp,
          signature: slackSignature
        };
      }

      return {
        isValid: true,
        timestamp,
        signature: slackSignature
      };
    } catch (error) {
      console.error('Error verifying Slack request:', error);
      return {
        isValid: false,
        error: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Verify Slack signature using HMAC-SHA256
   */
  private async verifySignature(
    body: string,
    timestamp: string,
    receivedSignature: string
  ): Promise<boolean> {
    try {
      // Create the signature base string
      const signatureBaseString = `v0:${timestamp}:${body}`;

      // Create HMAC-SHA256 hash
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(this.SLACK_SIGNING_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(signatureBaseString)
      );

      // Convert to hex string
      const hashArray = Array.from(new Uint8Array(signature));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      const expectedSignature = `v0=${hashHex}`;

      // Compare signatures using constant-time comparison
      return this.constantTimeCompare(expectedSignature, receivedSignature);
    } catch (error) {
      console.error('Error creating signature:', error);
      return false;
    }
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Verify Slack event subscription challenge
   */
  verifyChallenge(body: any): string | null {
    try {
      if (body && typeof body === 'object' && body.type === 'url_verification' && body.challenge) {
        console.log('✅ Slack challenge verification successful');
        return body.challenge;
      }
      return null;
    } catch (error) {
      console.error('Error verifying Slack challenge:', error);
      return null;
    }
  }

  /**
   * Validate Slack event structure
   */
  validateSlackEvent(body: any): {
    isValid: boolean;
    error?: string;
    eventType?: string;
  } {
    try {
      // Check basic structure
      if (!body || typeof body !== 'object') {
        return {
          isValid: false,
          error: 'Invalid request body structure'
        };
      }

      // Handle URL verification
      if (body.type === 'url_verification') {
        return {
          isValid: true,
          eventType: 'url_verification'
        };
      }

      // Handle event callbacks
      if (body.type === 'event_callback') {
        if (!body.event || typeof body.event !== 'object') {
          return {
            isValid: false,
            error: 'Missing or invalid event object'
          };
        }

        if (!body.event.type) {
          return {
            isValid: false,
            error: 'Missing event type'
          };
        }

        return {
          isValid: true,
          eventType: body.event.type
        };
      }

      // Handle slash commands
      if (body.command) {
        return {
          isValid: true,
          eventType: 'slash_command'
        };
      }

      // Handle interactive components
      if (body.type === 'interactive_message' || body.type === 'block_actions') {
        return {
          isValid: true,
          eventType: body.type
        };
      }

      return {
        isValid: false,
        error: `Unknown request type: ${body.type || 'undefined'}`
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Event validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check if request is from Slack based on User-Agent
   */
  validateUserAgent(userAgent?: string): boolean {
    if (!userAgent) {
      return false;
    }

    // Slack typically sends requests with User-Agent containing "Slackbot"
    return userAgent.toLowerCase().includes('slackbot');
  }

  /**
   * Validate Content-Type header
   */
  validateContentType(contentType?: string): boolean {
    if (!contentType) {
      return false;
    }

    const validContentTypes = [
      'application/json',
      'application/x-www-form-urlencoded'
    ];

    return validContentTypes.some(validType => 
      contentType.toLowerCase().includes(validType)
    );
  }

  /**
   * Comprehensive request validation
   */
  async validateSlackRequest(
    body: string,
    headers: SlackRequestHeaders,
    parsedBody?: any
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    verificationResult?: VerificationResult;
    eventValidation?: { isValid: boolean; error?: string; eventType?: string };
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Verify signature and timestamp
    const verificationResult = await this.verifySlackRequest(body, headers);
    if (!verificationResult.isValid) {
      errors.push(verificationResult.error || 'Signature verification failed');
    }

    // Validate User-Agent
    if (!this.validateUserAgent(headers['user-agent'])) {
      warnings.push('User-Agent does not appear to be from Slack');
    }

    // Validate Content-Type
    if (!this.validateContentType(headers['content-type'])) {
      warnings.push('Unexpected Content-Type header');
    }

    // Validate event structure if body is parsed
    let eventValidation;
    if (parsedBody) {
      eventValidation = this.validateSlackEvent(parsedBody);
      if (!eventValidation.isValid) {
        errors.push(eventValidation.error || 'Event validation failed');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      verificationResult,
      eventValidation
    };
  }

  /**
   * Create verification middleware for request handling
   */
  createVerificationMiddleware() {
    return async (request: Request): Promise<{
      isValid: boolean;
      response?: Response;
      body?: string;
      parsedBody?: any;
    }> => {
      try {
        // Extract headers
        const headers: SlackRequestHeaders = {
          'x-slack-signature': request.headers.get('x-slack-signature') || undefined,
          'x-slack-request-timestamp': request.headers.get('x-slack-request-timestamp') || undefined,
          'content-type': request.headers.get('content-type') || undefined,
          'user-agent': request.headers.get('user-agent') || undefined
        };

        // Get request body
        const body = await request.text();
        let parsedBody;

        try {
          parsedBody = JSON.parse(body);
        } catch {
          // Body might be form-encoded for slash commands
          if (headers['content-type']?.includes('application/x-www-form-urlencoded')) {
            parsedBody = Object.fromEntries(new URLSearchParams(body));
          }
        }

        // Handle URL verification challenge
        if (parsedBody?.type === 'url_verification') {
          const challenge = this.verifyChallenge(parsedBody);
          if (challenge) {
            return {
              isValid: true,
              response: new Response(challenge, {
                headers: { 'Content-Type': 'text/plain' }
              })
            };
          }
        }

        // Perform comprehensive validation
        const validation = await this.validateSlackRequest(body, headers, parsedBody);

        if (!validation.isValid) {
          console.error('❌ Slack request validation failed:', validation.errors);
          return {
            isValid: false,
            response: new Response('Unauthorized', { status: 401 })
          };
        }

        if (validation.warnings.length > 0) {
          console.warn('⚠️ Slack request validation warnings:', validation.warnings);
        }

        return {
          isValid: true,
          body,
          parsedBody
        };
      } catch (error) {
        console.error('Error in verification middleware:', error);
        return {
          isValid: false,
          response: new Response('Internal Server Error', { status: 500 })
        };
      }
    };
  }
}