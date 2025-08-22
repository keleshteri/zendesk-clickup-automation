/**
 * @ai-metadata
 * @component: SlackSecurityService
 * @description: Security service for Slack integration handling request verification, token rotation, and security auditing
 * @last-update: 2024-01-21
 * @last-editor: system@zendesk-clickup-automation.com
 * @changelog: ./docs/changelog/slack-security-service.md
 * @stability: stable
 * @edit-permissions: "method-specific"
 * @method-permissions: { "verifySlackRequest": "read-only", "rotateTokens": "allow", "auditSecurityEvent": "allow", "getSecurityMetrics": "read-only", "validateTokens": "read-only", "isTokenExpired": "read-only", "generateSecurityReport": "read-only" }
 * @dependencies: ["crypto", "../config/index.ts"]
 * @tests: ["./tests/slack-security-service.test.ts"]
 * @breaking-changes-risk: high
 * @review-required: true
 * @ai-context: "Critical security service that handles Slack request verification and token management. Changes here affect the security posture of the entire Slack integration."
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

import { Env } from '../../../../types/index.js';

/**
 * Verification result interface
 */
export interface VerificationResult {
  isValid: boolean;
  error?: string;
  timestamp?: number;
  signature?: string;
}

/**
 * Slack request headers interface
 */
export interface SlackRequestHeaders {
  'x-slack-signature'?: string;
  'x-slack-request-timestamp'?: string;
  'content-type'?: string;
  'user-agent'?: string;
}

/**
 * Token rotation configuration
 */
export interface TokenRotationConfig {
  enabled: boolean;
  rotationIntervalHours: number;
  gracePeriodHours: number;
  notifyBeforeRotationHours: number;
  backupTokenCount: number;
}

/**
 * Security audit log entry
 */
export interface SecurityAuditEntry {
  timestamp: string;
  event: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  source: string;
  userId?: string;
  teamId?: string;
}

/**
 * Token metadata
 */
export interface TokenMetadata {
  tokenId: string;
  type: 'bot' | 'user' | 'app';
  createdAt: string;
  expiresAt?: string;
  lastUsed?: string;
  rotationCount: number;
  status: 'active' | 'rotating' | 'expired' | 'revoked';
  scopes: string[];
}

/**
 * Security metrics
 */
export interface SecurityMetrics {
  totalRequests: number;
  verifiedRequests: number;
  failedVerifications: number;
  suspiciousActivity: number;
  tokenRotations: number;
  lastRotation?: string;
  averageRequestAge: number;
}

/**
 * Enhanced Slack security service with token rotation and advanced verification
 */
export class SlackSecurityService {
  private env: Env;
  private readonly SLACK_SIGNING_SECRET: string;
  private readonly MAX_REQUEST_AGE = 5 * 60; // 5 minutes in seconds
  private tokenRotationConfig: TokenRotationConfig;
  private auditLog: SecurityAuditEntry[] = [];
  private securityMetrics: SecurityMetrics;
  private tokenMetadata: Map<string, TokenMetadata> = new Map();
  private rotationTimer?: NodeJS.Timeout;

  constructor(env: Env, rotationConfig?: Partial<TokenRotationConfig>) {
    this.env = env;
    this.SLACK_SIGNING_SECRET = env.SLACK_SIGNING_SECRET;
    
    if (!this.SLACK_SIGNING_SECRET) {
      console.warn('⚠️ SLACK_SIGNING_SECRET not configured - request verification will fail');
    }
    
    // Default token rotation configuration
    this.tokenRotationConfig = {
      enabled: false,
      rotationIntervalHours: 24 * 30, // 30 days
      gracePeriodHours: 24, // 1 day grace period
      notifyBeforeRotationHours: 24 * 7, // 1 week notice
      backupTokenCount: 2,
      ...rotationConfig
    };

    // Initialize security metrics
    this.securityMetrics = {
      totalRequests: 0,
      verifiedRequests: 0,
      failedVerifications: 0,
      suspiciousActivity: 0,
      tokenRotations: 0,
      averageRequestAge: 0
    };

    this.initializeTokenMetadata();
    this.startTokenRotationScheduler();
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
   * Verify Slack request with enhanced security auditing
   */
  async verifyRequestWithAudit(
    body: string,
    headers: SlackRequestHeaders,
    source: string = 'webhook'
  ): Promise<VerificationResult & { auditId: string }> {
    const startTime = Date.now();
    this.securityMetrics.totalRequests++;

    try {
      // Perform standard verification
      const result = await this.verifySlackRequest(body, headers);
      
      // Calculate request age for metrics
      const timestamp = headers['x-slack-request-timestamp'];
      if (timestamp) {
        const requestAge = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
        this.updateAverageRequestAge(requestAge);
      }

      // Log verification result
      const auditEntry: SecurityAuditEntry = {
        timestamp: new Date().toISOString(),
        event: result.isValid ? 'request_verified' : 'verification_failed',
        severity: result.isValid ? 'low' : 'medium',
        details: {
          source,
          signature: result.signature,
          timestamp: result.timestamp,
          error: result.error,
          processingTime: Date.now() - startTime
        },
        source
      };

      const auditId = this.addAuditEntry(auditEntry);

      if (result.isValid) {
        this.securityMetrics.verifiedRequests++;
      } else {
        this.securityMetrics.failedVerifications++;
        
        // Check for suspicious activity patterns
        await this.detectSuspiciousActivity(headers, result.error);
      }

      return { ...result, auditId };
    } catch (error) {
      const auditEntry: SecurityAuditEntry = {
        timestamp: new Date().toISOString(),
        event: 'verification_error',
        severity: 'high',
        details: {
          source,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime: Date.now() - startTime
        },
        source
      };

      const auditId = this.addAuditEntry(auditEntry);
      this.securityMetrics.failedVerifications++;

      return {
        isValid: false,
        error: 'Security verification failed',
        auditId
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
  async validateSlackRequestComprehensive(
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
        const validation = await this.validateSlackRequestComprehensive(body, headers, parsedBody);

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

  /**
   * Initialize token rotation system
   */
  async initializeTokenRotation(): Promise<void> {
    if (!this.tokenRotationConfig.enabled) {
      console.log('🔒 Token rotation is disabled');
      return;
    }

    try {
      // Check current token status
      await this.validateCurrentTokens();
      
      // Schedule next rotation if needed
      await this.scheduleNextRotation();
      
      console.log('🔄 Token rotation initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize token rotation:', error);
      this.addAuditEntry({
        timestamp: new Date().toISOString(),
        event: 'token_rotation_init_failed',
        severity: 'high',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        source: 'security_service'
      });
    }
  }

  /**
   * Rotate bot token
   */
  async rotateBotToken(): Promise<{ success: boolean; newToken?: string; error?: string }> {
    try {
      console.log('🔄 Starting bot token rotation...');
      
      // Generate new token via Slack API
      const rotationResult = await this.performTokenRotation('bot');
      
      if (rotationResult.success && rotationResult.newToken) {
        // Update environment with new token
        this.env.SLACK_BOT_TOKEN = rotationResult.newToken;
        
        // Update token metadata
        this.updateTokenMetadata('bot', rotationResult.newToken);
        
        // Log successful rotation
        this.addAuditEntry({
          timestamp: new Date().toISOString(),
          event: 'token_rotated',
          severity: 'low',
          details: {
            tokenType: 'bot',
            rotationId: rotationResult.rotationId
          },
          source: 'security_service'
        });
        
        this.securityMetrics.tokenRotations++;
        this.securityMetrics.lastRotation = new Date().toISOString();
        
        console.log('✅ Bot token rotation completed successfully');
        return { success: true, newToken: rotationResult.newToken };
      }
      
      throw new Error(rotationResult.error || 'Token rotation failed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Bot token rotation failed:', errorMessage);
      
      this.addAuditEntry({
        timestamp: new Date().toISOString(),
        event: 'token_rotation_failed',
        severity: 'critical',
        details: { tokenType: 'bot', error: errorMessage },
        source: 'security_service'
      });
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): SecurityMetrics {
    return { ...this.securityMetrics };
  }

  /**
   * Get audit log entries
   */
  getAuditLog(limit: number = 100, severity?: SecurityAuditEntry['severity']): SecurityAuditEntry[] {
    let entries = [...this.auditLog];
    
    if (severity) {
      entries = entries.filter(entry => entry.severity === severity);
    }
    
    return entries
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get token metadata
   */
  getTokenMetadata(): TokenMetadata[] {
    return Array.from(this.tokenMetadata.values());
  }

  /**
   * Update token rotation configuration
   */
  updateRotationConfig(config: Partial<TokenRotationConfig>): void {
    this.tokenRotationConfig = { ...this.tokenRotationConfig, ...config };
    
    this.addAuditEntry({
      timestamp: new Date().toISOString(),
      event: 'rotation_config_updated',
      severity: 'low',
      details: { newConfig: config },
      source: 'security_service'
    });
    
    // Restart scheduler with new config
    this.startTokenRotationScheduler();
  }

  /**
   * Force token rotation
   */
  async forceTokenRotation(tokenType: 'bot' | 'user' | 'app' = 'bot'): Promise<{ success: boolean; error?: string }> {
    try {
      switch (tokenType) {
        case 'bot':
          const result = await this.rotateBotToken();
          return { success: result.success, error: result.error };
        default:
          throw new Error(`Token rotation for type '${tokenType}' not implemented`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if tokens need rotation
   */
  async checkTokenRotationStatus(): Promise<{
    needsRotation: boolean;
    nextRotation?: string;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    
    if (!this.tokenRotationConfig.enabled) {
      return { needsRotation: false, warnings: ['Token rotation is disabled'] };
    }
    
    // Check bot token
    const botTokenMeta = this.tokenMetadata.get('bot');
    if (botTokenMeta) {
      const tokenAge = Date.now() - new Date(botTokenMeta.createdAt).getTime();
      const rotationInterval = this.tokenRotationConfig.rotationIntervalHours * 60 * 60 * 1000;
      const notifyBefore = this.tokenRotationConfig.notifyBeforeRotationHours * 60 * 60 * 1000;
      
      if (tokenAge >= rotationInterval) {
        return { needsRotation: true, warnings: ['Bot token has expired and needs immediate rotation'] };
      }
      
      if (tokenAge >= (rotationInterval - notifyBefore)) {
        const nextRotation = new Date(new Date(botTokenMeta.createdAt).getTime() + rotationInterval).toISOString();
        warnings.push(`Bot token will need rotation soon: ${nextRotation}`);
        return { needsRotation: false, nextRotation, warnings };
      }
    }
    
    return { needsRotation: false, warnings };
  }

  /**
   * Shutdown security service
   */
  shutdown(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = undefined;
    }
    
    this.addAuditEntry({
      timestamp: new Date().toISOString(),
      event: 'security_service_shutdown',
      severity: 'low',
      details: {},
      source: 'security_service'
    });
    
    console.log('🔒 Security service shutdown completed');
  }

  // Private methods

  private initializeTokenMetadata(): void {
    // Initialize bot token metadata
    if (this.env.SLACK_BOT_TOKEN) {
      this.tokenMetadata.set('bot', {
        tokenId: 'bot',
        type: 'bot',
        createdAt: new Date().toISOString(),
        rotationCount: 0,
        status: 'active',
        scopes: ['chat:write', 'channels:read', 'users:read'] // Default scopes
      });
    }
  }

  private startTokenRotationScheduler(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }
    
    if (!this.tokenRotationConfig.enabled) {
      return;
    }
    
    // Check every hour for rotation needs
    this.rotationTimer = setInterval(async () => {
      const status = await this.checkTokenRotationStatus();
      if (status.needsRotation) {
        await this.rotateBotToken();
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  private async validateCurrentTokens(): Promise<void> {
    // Validate bot token
    if (this.env.SLACK_BOT_TOKEN) {
      try {
        const response = await fetch('https://slack.com/api/auth.test', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.env.SLACK_BOT_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json() as { ok: boolean; error?: string };
        if (!data.ok) {
          throw new Error(`Bot token validation failed: ${data.error}`);
        }
        
        console.log('✅ Bot token validation successful');
      } catch (error) {
        console.error('❌ Bot token validation failed:', error);
        throw error;
      }
    }
  }

  private async scheduleNextRotation(): Promise<void> {
    const status = await this.checkTokenRotationStatus();
    if (status.nextRotation) {
      console.log(`🔄 Next token rotation scheduled for: ${status.nextRotation}`);
    }
  }

  private async performTokenRotation(tokenType: 'bot' | 'user' | 'app'): Promise<{
    success: boolean;
    newToken?: string;
    rotationId?: string;
    error?: string;
  }> {
    try {
      // This would integrate with Slack's token rotation API
      // For now, this is a placeholder implementation
      
      const response = await fetch('https://slack.com/api/auth.revoke', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test: true // This would be the actual rotation request
        })
      });
      
      // Placeholder: In a real implementation, this would:
      // 1. Call Slack's token rotation API
      // 2. Receive new token
      // 3. Update stored credentials
      // 4. Verify new token works
      
      return {
        success: false,
        error: 'Token rotation API not yet implemented - this is a placeholder'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private updateTokenMetadata(tokenType: 'bot' | 'user' | 'app', newToken: string): void {
    const existing = this.tokenMetadata.get(tokenType);
    if (existing) {
      existing.rotationCount++;
      existing.createdAt = new Date().toISOString();
      existing.lastUsed = new Date().toISOString();
      existing.status = 'active';
    }
  }

  private addAuditEntry(entry: SecurityAuditEntry): string {
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.auditLog.push({ ...entry });
    
    // Keep only last 1000 entries to prevent memory issues
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
    
    return auditId;
  }

  private updateAverageRequestAge(requestAge: number): void {
    const totalRequests = this.securityMetrics.totalRequests;
    const currentAverage = this.securityMetrics.averageRequestAge;
    
    // Calculate running average
    this.securityMetrics.averageRequestAge = 
      ((currentAverage * (totalRequests - 1)) + requestAge) / totalRequests;
  }

  private async detectSuspiciousActivity(
    headers: SlackRequestHeaders,
    error?: string
  ): Promise<void> {
    // Simple suspicious activity detection
    const recentFailures = this.auditLog
      .filter(entry => 
        entry.event === 'verification_failed' &&
        Date.now() - new Date(entry.timestamp).getTime() < 5 * 60 * 1000 // Last 5 minutes
      ).length;
    
    if (recentFailures > 5) {
      this.securityMetrics.suspiciousActivity++;
      
      this.addAuditEntry({
        timestamp: new Date().toISOString(),
        event: 'suspicious_activity_detected',
        severity: 'high',
        details: {
          recentFailures,
          userAgent: headers['user-agent'],
          lastError: error
        },
        source: 'security_service'
      });
      
      console.warn(`⚠️ Suspicious activity detected: ${recentFailures} failed verifications in 5 minutes`);
    }
  }
}