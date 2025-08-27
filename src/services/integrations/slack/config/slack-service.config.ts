/**
 * @ai-metadata
 * @component: SlackServiceConfig
 * @description: Configuration object pattern for centralizing Slack service settings
 * @last-update: 2025-01-13
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["@slack/web-api", "../../../../types"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Configuration pattern implementation for Slack services with type safety and validation"
 */

import type { LogLevel } from '@slack/web-api';
import type { Env } from '../../../../types';

/**
 * Retry configuration for Slack API calls
 */
export interface SlackRetryConfig {
  /** Number of retry attempts */
  retries: number;
  /** Backoff factor for exponential retry */
  factor: number;
  /** Minimum delay between retries in milliseconds */
  minTimeout?: number;
  /** Maximum delay between retries in milliseconds */
  maxTimeout?: number;
  /** Whether to randomize retry delays */
  randomize?: boolean;
}

/**
 * WebClient configuration options
 */
export interface SlackWebClientConfig {
  /** Slack bot token */
  token: string;
  /** Log level for Slack client */
  logLevel?: LogLevel;
  /** Retry configuration */
  retryConfig?: SlackRetryConfig;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Custom user agent string */
  userAgent?: string;
  /** Whether to automatically paginate results */
  autoPageinate?: boolean;
}

/**
 * Messaging service configuration
 */
export interface SlackMessagingConfig {
  /** Default channel for system messages */
  defaultChannel?: string;
  /** Maximum message length before truncation */
  maxMessageLength?: number;
  /** Whether to enable emoji reactions */
  enableEmojis?: boolean;
  /** Default emoji set to use */
  defaultEmojiSet?: string[];
  /** Message formatting options */
  formatting?: {
    /** Whether to enable markdown formatting */
    enableMarkdown?: boolean;
    /** Whether to enable link unfurling */
    enableLinkUnfurling?: boolean;
    /** Whether to enable media unfurling */
    enableMediaUnfurling?: boolean;
  };
  /** Rate limiting configuration */
  rateLimiting?: {
    /** Messages per minute limit */
    messagesPerMinute?: number;
    /** Burst limit for messages */
    burstLimit?: number;
  };
}

/**
 * Bot manager configuration
 */
export interface SlackBotManagerConfig {
  /** Bot display name */
  botName?: string;
  /** Bot avatar emoji */
  botAvatar?: string;
  /** Channels to auto-join */
  autoJoinChannels?: string[];
  /** Whether to track channel membership */
  trackChannelMembership?: boolean;
  /** Channel tracking data retention in days */
  channelDataRetentionDays?: number;
  /** Bot presence configuration */
  presence?: {
    /** Whether to set bot as active */
    setActive?: boolean;
    /** Custom status message */
    statusMessage?: string;
    /** Status emoji */
    statusEmoji?: string;
  };
}

/**
 * Event handler configuration
 */
export interface SlackEventHandlerConfig {
  /** Events to handle */
  enabledEvents?: {
    /** Handle app mentions */
    appMention?: boolean;
    /** Handle member joined channel */
    memberJoinedChannel?: boolean;
    /** Handle message events */
    message?: boolean;
    /** Handle reaction events */
    reaction?: boolean;
    /** Handle file events */
    file?: boolean;
  };
  /** Command configuration */
  commands?: {
    /** Enable status command */
    enableStatus?: boolean;
    /** Enable summarization command */
    enableSummarization?: boolean;
    /** Enable ticket listing command */
    enableTicketListing?: boolean;
    /** Enable analytics command */
    enableAnalytics?: boolean;
    /** Custom command prefix */
    commandPrefix?: string;
  };
  /** Event processing options */
  processing?: {
    /** Maximum concurrent event processing */
    maxConcurrentEvents?: number;
    /** Event processing timeout in milliseconds */
    eventTimeout?: number;
    /** Whether to queue events during high load */
    enableEventQueue?: boolean;
  };
}

/**
 * Security service configuration
 */
export interface SlackSecurityConfig {
  /** Slack signing secret for request verification */
  signingSecret: string;
  /** Request timestamp tolerance in seconds */
  timestampTolerance?: number;
  /** Whether to enable request verification */
  enableRequestVerification?: boolean;
  /** Audit configuration */
  audit?: {
    /** Whether to enable security auditing */
    enabled?: boolean;
    /** Audit log retention in days */
    retentionDays?: number;
    /** Events to audit */
    auditEvents?: string[];
  };
  /** Token management */
  tokenManagement?: {
    /** Whether to validate tokens */
    validateTokens?: boolean;
    /** Token refresh interval in hours */
    refreshInterval?: number;
    /** Whether to rotate tokens automatically */
    autoRotate?: boolean;
  };
}

/**
 * Error reporting configuration
 */
export interface SlackErrorReportingConfig {
  /** Whether to enable error reporting */
  enabled?: boolean;
  /** Error reporting channel */
  errorChannel?: string;
  /** Error severity levels to report */
  reportLevels?: ('error' | 'warn' | 'info' | 'debug')[];
  /** Maximum errors to store */
  maxStoredErrors?: number;
  /** Error retention in hours */
  errorRetentionHours?: number;
  /** Whether to include stack traces */
  includeStackTrace?: boolean;
  /** Error grouping configuration */
  grouping?: {
    /** Whether to group similar errors */
    enabled?: boolean;
    /** Time window for grouping in minutes */
    timeWindow?: number;
    /** Maximum group size */
    maxGroupSize?: number;
  };
}

/**
 * Development and debugging configuration
 */
export interface SlackDevelopmentConfig {
  /** Whether development mode is enabled */
  enabled?: boolean;
  /** Debug logging configuration */
  debug?: {
    /** Enable verbose logging */
    verbose?: boolean;
    /** Log API requests */
    logRequests?: boolean;
    /** Log API responses */
    logResponses?: boolean;
    /** Log performance metrics */
    logPerformance?: boolean;
  };
  /** Testing configuration */
  testing?: {
    /** Whether to use mock services */
    useMocks?: boolean;
    /** Test data configuration */
    testData?: {
      /** Test channel ID */
      testChannel?: string;
      /** Test user ID */
      testUser?: string;
    };
  };
}

/**
 * Performance monitoring configuration
 */
export interface SlackPerformanceConfig {
  /** Whether to enable performance monitoring */
  enabled?: boolean;
  /** Metrics collection interval in seconds */
  metricsInterval?: number;
  /** Performance thresholds */
  thresholds?: {
    /** API response time threshold in milliseconds */
    apiResponseTime?: number;
    /** Message processing time threshold in milliseconds */
    messageProcessingTime?: number;
    /** Memory usage threshold in MB */
    memoryUsage?: number;
  };
  /** Whether to report performance metrics */
  reportMetrics?: boolean;
  /** Performance reporting channel */
  reportingChannel?: string;
}

/**
 * Main Slack service configuration interface
 */
export interface SlackServiceConfig {
  /** Environment configuration */
  env: Env;
  /** WebClient configuration */
  webClient: SlackWebClientConfig;
  /** Messaging service configuration */
  messaging?: SlackMessagingConfig;
  /** Bot manager configuration */
  botManager?: SlackBotManagerConfig;
  /** Event handler configuration */
  eventHandler?: SlackEventHandlerConfig;
  /** Security service configuration */
  security: SlackSecurityConfig;
  /** Error reporting configuration */
  errorReporting?: SlackErrorReportingConfig;
  /** Development configuration */
  development?: SlackDevelopmentConfig;
  /** Performance monitoring configuration */
  performance?: SlackPerformanceConfig;
  /** Task genie instance */

}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  /** Whether the configuration is valid */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
}

/**
 * Default configuration values
 */
export const DEFAULT_SLACK_CONFIG: Partial<SlackServiceConfig> = {
  messaging: {
    maxMessageLength: 4000,
    enableEmojis: true,
    defaultEmojiSet: ['✅', '❌', '⚠️', 'ℹ️', '🔄'],
    formatting: {
      enableMarkdown: true,
      enableLinkUnfurling: true,
      enableMediaUnfurling: false
    },
    rateLimiting: {
      messagesPerMinute: 60,
      burstLimit: 10
    }
  },
  botManager: {
    trackChannelMembership: true,
    channelDataRetentionDays: 30,
    presence: {
      setActive: true,
      statusMessage: 'Zendesk-ClickUp Automation Bot',
      statusEmoji: '🤖'
    }
  },
  eventHandler: {
    enabledEvents: {
      appMention: true,
      memberJoinedChannel: true,
      message: true,
      reaction: false,
      file: false
    },
    commands: {
      enableStatus: true,
      enableSummarization: true,
      enableTicketListing: true,
      enableAnalytics: true,
      commandPrefix: '/'
    },
    processing: {
      maxConcurrentEvents: 10,
      eventTimeout: 30000,
      enableEventQueue: true
    }
  },
  security: {
    signingSecret: '', // Will be set from environment
    timestampTolerance: 300,
    enableRequestVerification: true,
    audit: {
      enabled: true,
      retentionDays: 90,
      auditEvents: ['message_sent', 'command_executed', 'error_occurred']
    },
    tokenManagement: {
      validateTokens: true,
      refreshInterval: 24,
      autoRotate: false
    }
  },
  errorReporting: {
    enabled: true,
    reportLevels: ['error', 'warn'],
    maxStoredErrors: 1000,
    errorRetentionHours: 168, // 7 days
    includeStackTrace: true,
    grouping: {
      enabled: true,
      timeWindow: 60,
      maxGroupSize: 50
    }
  },
  development: {
    enabled: false,
    debug: {
      verbose: false,
      logRequests: false,
      logResponses: false,
      logPerformance: false
    },
    testing: {
      useMocks: false
    }
  },
  performance: {
    enabled: true,
    metricsInterval: 300, // 5 minutes
    thresholds: {
      apiResponseTime: 5000,
      messageProcessingTime: 10000,
      memoryUsage: 512
    },
    reportMetrics: false
  }
};

/**
 * Configuration builder class for creating Slack service configurations
 */
export class SlackConfigBuilder {
  private config: Partial<SlackServiceConfig> = {};

  /**
   * Set environment configuration
   * @param env - Environment configuration
   * @returns Builder instance
   */
  withEnvironment(env: Env): SlackConfigBuilder {
    this.config.env = env;
    return this;
  }

  /**
   * Set WebClient configuration
   * @param webClientConfig - WebClient configuration
   * @returns Builder instance
   */
  withWebClient(webClientConfig: SlackWebClientConfig): SlackConfigBuilder {
    this.config.webClient = webClientConfig;
    return this;
  }

  /**
   * Set security configuration
   * @param securityConfig - Security configuration
   * @returns Builder instance
   */
  withSecurity(securityConfig: SlackSecurityConfig): SlackConfigBuilder {
    this.config.security = securityConfig;
    return this;
  }

  /**
   * Set messaging configuration
   * @param messagingConfig - Messaging configuration
   * @returns Builder instance
   */
  withMessaging(messagingConfig: SlackMessagingConfig): SlackConfigBuilder {
    this.config.messaging = { ...DEFAULT_SLACK_CONFIG.messaging, ...messagingConfig };
    return this;
  }

  /**
   * Set bot manager configuration
   * @param botManagerConfig - Bot manager configuration
   * @returns Builder instance
   */
  withBotManager(botManagerConfig: SlackBotManagerConfig): SlackConfigBuilder {
    this.config.botManager = { ...DEFAULT_SLACK_CONFIG.botManager, ...botManagerConfig };
    return this;
  }

  /**
   * Set event handler configuration
   * @param eventHandlerConfig - Event handler configuration
   * @returns Builder instance
   */
  withEventHandler(eventHandlerConfig: SlackEventHandlerConfig): SlackConfigBuilder {
    this.config.eventHandler = { ...DEFAULT_SLACK_CONFIG.eventHandler, ...eventHandlerConfig };
    return this;
  }

  /**
   * Set error reporting configuration
   * @param errorReportingConfig - Error reporting configuration
   * @returns Builder instance
   */
  withErrorReporting(errorReportingConfig: SlackErrorReportingConfig): SlackConfigBuilder {
    this.config.errorReporting = { ...DEFAULT_SLACK_CONFIG.errorReporting, ...errorReportingConfig };
    return this;
  }

  /**
   * Set development configuration
   * @param developmentConfig - Development configuration
   * @returns Builder instance
   */
  withDevelopment(developmentConfig: SlackDevelopmentConfig): SlackConfigBuilder {
    this.config.development = { ...DEFAULT_SLACK_CONFIG.development, ...developmentConfig };
    return this;
  }

  /**
   * Set performance configuration
   * @param performanceConfig - Performance configuration
   * @returns Builder instance
   */
  withPerformance(performanceConfig: SlackPerformanceConfig): SlackConfigBuilder {
    this.config.performance = { ...DEFAULT_SLACK_CONFIG.performance, ...performanceConfig };
    return this;
  }

  /**
   * Set task genie instance
   

  /**
   * Enable development mode with sensible defaults
   * @returns Builder instance
   */
  enableDevelopmentMode(): SlackConfigBuilder {
    this.config.development = {
      enabled: true,
      debug: {
        verbose: true,
        logRequests: true,
        logResponses: false,
        logPerformance: true
      },
      testing: {
        useMocks: false
      }
    };
    return this;
  }

  /**
   * Enable production mode with optimized settings
   * @returns Builder instance
   */
  enableProductionMode(): SlackConfigBuilder {
    this.config.development = {
      enabled: false,
      debug: {
        verbose: false,
        logRequests: false,
        logResponses: false,
        logPerformance: false
      }
    };
    this.config.performance = {
      ...DEFAULT_SLACK_CONFIG.performance,
      enabled: true,
      reportMetrics: true
    };
    return this;
  }

  /**
   * Build the configuration with validation
   * @returns Complete Slack service configuration
   */
  build(): SlackServiceConfig {
    const finalConfig = {
      ...DEFAULT_SLACK_CONFIG,
      ...this.config
    } as SlackServiceConfig;

    const validation = this.validateConfig(finalConfig);
    if (!validation.isValid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    if (validation.warnings.length > 0) {
      console.warn('Configuration warnings:', validation.warnings.join(', '));
    }

    return finalConfig;
  }

  /**
   * Validate the configuration
   * @param config - Configuration to validate
   * @returns Validation result
   */
  private validateConfig(config: SlackServiceConfig): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!config.env) {
      errors.push('Environment configuration is required');
    }

    if (!config.webClient?.token) {
      errors.push('Slack bot token is required');
    } else if (!config.webClient.token.startsWith('xoxb-')) {
      warnings.push('Bot token should start with "xoxb-" for bot tokens');
    }

    if (!config.security?.signingSecret) {
      errors.push('Slack signing secret is required for security');
    }

    // Configuration consistency validation
    if (config.errorReporting?.enabled && !config.errorReporting.errorChannel) {
      warnings.push('Error reporting is enabled but no error channel is specified');
    }

    if (config.performance?.reportMetrics && !config.performance.reportingChannel) {
      warnings.push('Performance metrics reporting is enabled but no reporting channel is specified');
    }

    // Value range validation
    if (config.messaging?.maxMessageLength && config.messaging.maxMessageLength > 40000) {
      warnings.push('Maximum message length exceeds Slack limits (40,000 characters)');
    }

    if (config.security?.timestampTolerance && config.security.timestampTolerance > 600) {
      warnings.push('Timestamp tolerance is very high (>10 minutes), consider reducing for security');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

/**
 * Create a new configuration builder
 * @returns New configuration builder instance
 */
export function createSlackConfig(): SlackConfigBuilder {
  return new SlackConfigBuilder();
}