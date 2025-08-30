/**
 * @ai-metadata
 * @component: AIErrorHandler
 * @description: Centralized error handling utility for AI services with proper logging and fallback mechanisms
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/ai-error-handler.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 * @tests: ["./tests/ai-error-handler.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Utility class for consistent error handling across AI services with proper logging and fallback strategies"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 * 
 * @approval-rules:
 *   - require-dev-approval-for: ["breaking-changes"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

export interface AIErrorContext {
  operation: string;
  provider?: string;
  model?: string;
  inputLength?: number;
  timestamp: string;
  additionalData?: Record<string, any>;
}

export interface AIErrorResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  fallbackUsed: boolean;
  context: AIErrorContext;
}

export class AIErrorHandler {
  private static readonly ERROR_PATTERNS = {
    API_KEY: /api.?key|authentication|unauthorized/i,
    RATE_LIMIT: /rate.?limit|quota|too.?many.?requests/i,
    QUOTA: /quota|billing|payment/i,
    NETWORK: /network|connection|timeout|fetch/i,
    CONTENT: /content.?filter|safety|blocked/i,
    MODEL: /model|not.?found|invalid.?model/i
  };

  /**
   * Handle AI operation with comprehensive error handling and fallback
   */
  static async handleOperation<T>(
    operation: () => Promise<T>,
    fallback: () => T,
    context: Omit<AIErrorContext, 'timestamp'>
  ): Promise<AIErrorResult<T>> {
    const fullContext: AIErrorContext = {
      ...context,
      timestamp: new Date().toISOString()
    };

    try {
      console.log(`🤖 Executing AI operation: ${context.operation}`);
      const data = await operation();
      
      console.log(`✅ AI operation completed successfully: ${context.operation}`);
      return {
        success: true,
        data,
        fallbackUsed: false,
        context: fullContext
      };
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      const errorType = this.classifyError(errorMessage);
      
      console.error(`❌ AI operation failed: ${context.operation}`);
      console.error(`Error type: ${errorType}`);
      console.error(`Error details:`, error);
      
      // Use fallback for recoverable errors
      if (this.isRecoverableError(errorType)) {
        console.log(`🔄 Using fallback for operation: ${context.operation}`);
        const fallbackData = fallback();
        
        return {
          success: false,
          data: fallbackData,
          error: this.createUserFriendlyMessage(errorType, errorMessage),
          fallbackUsed: true,
          context: fullContext
        };
      }
      
      // For non-recoverable errors, throw with enhanced message
      throw new Error(this.createUserFriendlyMessage(errorType, errorMessage));
    }
  }

  /**
   * Extract meaningful error message from various error types
   */
  private static extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as any).message);
    }
    return 'Unknown error occurred';
  }

  /**
   * Classify error type based on message patterns
   */
  private static classifyError(message: string): string {
    for (const [type, pattern] of Object.entries(this.ERROR_PATTERNS)) {
      if (pattern.test(message)) {
        return type;
      }
    }
    return 'UNKNOWN';
  }

  /**
   * Determine if error is recoverable with fallback
   */
  private static isRecoverableError(errorType: string): boolean {
    const recoverableTypes = ['RATE_LIMIT', 'NETWORK', 'CONTENT', 'UNKNOWN'];
    return recoverableTypes.includes(errorType);
  }

  /**
   * Create user-friendly error messages
   */
  private static createUserFriendlyMessage(errorType: string, originalMessage: string): string {
    const messages = {
      API_KEY: 'AI service authentication failed. Please check your API key configuration.',
      RATE_LIMIT: 'AI service rate limit exceeded. Please try again in a few moments.',
      QUOTA: 'AI service quota exceeded. Please check your billing settings.',
      NETWORK: 'Network connection issue. Please check your internet connection and try again.',
      CONTENT: 'Content was filtered by AI safety systems. Please try rephrasing your request.',
      MODEL: 'AI model configuration error. Please contact support.',
      UNKNOWN: `AI service encountered an unexpected error: ${originalMessage}`
    };
    
    return messages[errorType as keyof typeof messages] || messages.UNKNOWN;
  }

  /**
   * Log performance metrics for AI operations
   */
  static logPerformanceMetrics(context: AIErrorContext, duration: number, success: boolean): void {
    console.log(`📊 AI Performance Metrics:`);
    console.log(`  Operation: ${context.operation}`);
    console.log(`  Provider: ${context.provider || 'unknown'}`);
    console.log(`  Model: ${context.model || 'unknown'}`);
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Success: ${success}`);
    console.log(`  Input Length: ${context.inputLength || 0} characters`);
    console.log(`  Timestamp: ${context.timestamp}`);
  }
}