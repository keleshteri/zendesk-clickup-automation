/**
 * @ai-metadata
 * @component: SlackConstants
 * @description: Centralized constants for Slack integration including API limits, events, emojis, and configuration
 * @last-update: 2025-01-21
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/slack-constants.md
 * @stability: stable
 * @edit-permissions: "add-only"
 * @dependencies: []
 * @tests: ["./tests/slack-constants.test.ts"]
 * @breaking-changes-risk: high
 * @review-required: true
 * @ai-context: "Critical constants file - changes can affect all Slack integrations and API interactions"
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
 *   - require-dev-approval-for: ["breaking-changes", "api-limit-changes", "constant-value-changes"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

/**
 * Centralized constants for Slack integration
 * Provides consistent values across all Slack-related modules
 */
export class SlackConstants {
  /**
   * Application Version
   */
  static readonly VERSION = 'v1.0.0';

  /**
   * API Configuration
   */
  static readonly API = {
    BASE_URL: 'https://slack.com/api',
    RATE_LIMIT: {
      TIER_1: 1, // 1+ requests per minute (posting messages, file uploads)
      TIER_2: 20, // 20+ requests per minute (most Web API methods)
      TIER_3: 50, // 50+ requests per minute (simple read operations)
      TIER_4: 100, // 100+ requests per minute (very simple methods like auth.test)
      SPECIAL: 1000, // 1000+ requests per minute (special tier for high-volume apps)
      // Message posting specific limits
      MESSAGE_POSTING: 1, // 1 message per second per channel
      PROFILE_UPDATES: 10, // 10 profile updates per minute
      EVENTS_API: 30000 // 30,000 Events API deliveries per hour per workspace
    },
    RETRY: {
      MAX_ATTEMPTS: 3,
      BASE_DELAY: 1000, // 1 second
      MAX_DELAY: 30000, // 30 seconds
      BACKOFF_FACTOR: 2
    },
    RATE_LIMIT_DELAY: 1000, // 1 second delay for rate limiting
    TIMEOUT: {
      DEFAULT: 10000, // 10 seconds
      UPLOAD: 30000, // 30 seconds
      LONG_RUNNING: 60000 // 60 seconds
    }
  } as const;

  /**
   * Message Limits
   */
  static readonly LIMITS = {
    MESSAGE: {
      TEXT_LENGTH: 4000,
      BLOCKS_COUNT: 50,
      ATTACHMENTS_COUNT: 20,
      THREAD_REPLIES: 1000
    },
    BLOCKS: {
      SECTION_FIELDS: 10,
      ACTION_ELEMENTS: 5,
      CONTEXT_ELEMENTS: 10,
      INPUT_ELEMENTS: 100
    },
    ELEMENTS: {
      BUTTON_TEXT: 75,
      SELECT_OPTIONS: 100,
      OVERFLOW_OPTIONS: 5
    },
    FILES: {
      MAX_SIZE: 1024 * 1024 * 1024, // 1GB
      SNIPPET_LENGTH: 1000000 // 1MB for text snippets
    }
  } as const;

  /**
   * Event Types
   */
  static readonly EVENTS = {
    MESSAGE: 'message',
    APP_MENTION: 'app_mention',
    REACTION_ADDED: 'reaction_added',
    REACTION_REMOVED: 'reaction_removed',
    MEMBER_JOINED_CHANNEL: 'member_joined_channel',
    MEMBER_LEFT_CHANNEL: 'member_left_channel',
    CHANNEL_CREATED: 'channel_created',
    CHANNEL_DELETED: 'channel_deleted',
    CHANNEL_RENAME: 'channel_rename',
    CHANNEL_ARCHIVE: 'channel_archive',
    CHANNEL_UNARCHIVE: 'channel_unarchive',
    USER_CHANGE: 'user_change',
    TEAM_JOIN: 'team_join',
    FILE_SHARED: 'file_shared',
    FILE_UNSHARED: 'file_unshared'
  } as const;

  /**
   * Message Subtypes
   */
  static readonly MESSAGE_SUBTYPES = {
    BOT_MESSAGE: 'bot_message',
    FILE_SHARE: 'file_share',
    FILE_COMMENT: 'file_comment',
    FILE_MENTION: 'file_mention',
    PINNED_ITEM: 'pinned_item',
    UNPINNED_ITEM: 'unpinned_item',
    CHANNEL_JOIN: 'channel_join',
    CHANNEL_LEAVE: 'channel_leave',
    CHANNEL_TOPIC: 'channel_topic',
    CHANNEL_PURPOSE: 'channel_purpose',
    CHANNEL_NAME: 'channel_name',
    CHANNEL_ARCHIVE: 'channel_archive',
    CHANNEL_UNARCHIVE: 'channel_unarchive',
    GROUP_JOIN: 'group_join',
    GROUP_LEAVE: 'group_leave',
    GROUP_TOPIC: 'group_topic',
    GROUP_PURPOSE: 'group_purpose',
    GROUP_NAME: 'group_name',
    GROUP_ARCHIVE: 'group_archive',
    GROUP_UNARCHIVE: 'group_unarchive'
  } as const;

  /**
   * Block Types - Updated with latest Block Kit elements
   */
  static readonly BLOCK_TYPES = {
    SECTION: 'section',
    DIVIDER: 'divider',
    IMAGE: 'image',
    ACTIONS: 'actions',
    CONTEXT: 'context',
    INPUT: 'input',
    FILE: 'file',
    HEADER: 'header',
    VIDEO: 'video',
    // New Block Kit elements
    RICH_TEXT: 'rich_text'
  } as const;

  /**
   * Element Types - Updated with latest Block Kit elements
   */
  static readonly ELEMENT_TYPES = {
    // Interactive elements
    BUTTON: 'button',
    STATIC_SELECT: 'static_select',
    EXTERNAL_SELECT: 'external_select',
    USERS_SELECT: 'users_select',
    CONVERSATIONS_SELECT: 'conversations_select',
    CHANNELS_SELECT: 'channels_select',
    OVERFLOW: 'overflow',
    DATEPICKER: 'datepicker',
    TIMEPICKER: 'timepicker',
    DATETIMEPICKER: 'datetimepicker',
    
    // Input elements
    PLAIN_TEXT_INPUT: 'plain_text_input',
    EMAIL_INPUT: 'email_text_input',
    URL_INPUT: 'url_text_input',
    NUMBER_INPUT: 'number_input',
    FILE_INPUT: 'file_input',
    
    // Selection elements
    CHECKBOXES: 'checkboxes',
    RADIO_BUTTONS: 'radio_buttons',
    
    // Multi-select elements
    MULTI_STATIC_SELECT: 'multi_static_select',
    MULTI_EXTERNAL_SELECT: 'multi_external_select',
    MULTI_USERS_SELECT: 'multi_users_select',
    MULTI_CONVERSATIONS_SELECT: 'multi_conversations_select',
    MULTI_CHANNELS_SELECT: 'multi_channels_select',
    
    // Display elements
    IMAGE: 'image',
    
    // Rich text elements
    RICH_TEXT_SECTION: 'rich_text_section',
    RICH_TEXT_LIST: 'rich_text_list',
    RICH_TEXT_PREFORMATTED: 'rich_text_preformatted',
    RICH_TEXT_QUOTE: 'rich_text_quote',
    
    // Workflow elements
    WORKFLOW_BUTTON: 'workflow_button'
  } as const;

  /**
   * Text Object Types
   */
  static readonly TEXT_TYPES = {
    PLAIN_TEXT: 'plain_text',
    MARKDOWN: 'mrkdwn'
  } as const;

  /**
   * Button Styles - Updated with latest options
   */
  static readonly BUTTON_STYLES = {
    DEFAULT: 'default',
    PRIMARY: 'primary',
    DANGER: 'danger'
  } as const;

  /**
   * Rich Text Styles
   */
  static readonly RICH_TEXT_STYLES = {
    BOLD: 'bold',
    ITALIC: 'italic',
    STRIKE: 'strike',
    CODE: 'code'
  } as const;

  /**
   * Rich Text List Types
   */
  static readonly RICH_TEXT_LIST_TYPES = {
    BULLET: 'bullet',
    ORDERED: 'ordered'
  } as const;

  /**
   * Input Dispatch Actions
   */
  static readonly DISPATCH_ACTIONS = {
    ON_ENTER_PRESSED: 'on_enter_pressed',
    ON_CHARACTER_ENTERED: 'on_character_entered'
  } as const;

  /**
   * Colors
   */
  static readonly COLORS = {
    GOOD: 'good',
    WARNING: 'warning',
    DANGER: 'danger',
    PRIMARY: '#1264a3',
    SUCCESS: '#36a64f',
    ERROR: '#ff0000',
    INFO: '#439fe0'
  } as const;

  /**
   * Channel Types
   */
  static readonly CHANNEL_TYPES = {
    PUBLIC: 'public_channel',
    PRIVATE: 'private_channel',
    MPIM: 'mpim',
    IM: 'im'
  } as const;

  /**
   * User Types
   */
  static readonly USER_TYPES = {
    HUMAN: 'human',
    BOT: 'bot',
    APP: 'app',
    WORKFLOW: 'workflow'
  } as const;

  /**
   * Scopes - Updated for latest Slack API
   * Note: Some legacy scopes are deprecated and replaced with conversations:* scopes
   */
  static readonly SCOPES = {
    BOT: {
      // Modern conversation scopes (recommended)
      CONVERSATIONS_READ: 'conversations:read',
      CONVERSATIONS_WRITE: 'conversations:write',
      CONVERSATIONS_HISTORY: 'conversations:history',
      CONVERSATIONS_CONNECT_MANAGE: 'conversations.connect:manage',
      
      // Chat scopes
      CHAT_WRITE: 'chat:write',
      CHAT_WRITE_PUBLIC: 'chat:write.public',
      CHAT_WRITE_CUSTOMIZE: 'chat:write.customize',
      
      // User scopes
      USERS_READ: 'users:read',
      USERS_READ_EMAIL: 'users:read.email',
      
      // File scopes
      FILES_READ: 'files:read',
      FILES_WRITE: 'files:write',
      
      // Reaction scopes
      REACTIONS_READ: 'reactions:read',
      REACTIONS_WRITE: 'reactions:write',
      
      // Team scopes
      TEAM_READ: 'team:read',
      
      // New scopes
      APP_MENTIONS_READ: 'app_mentions:read',
      BOOKMARKS_READ: 'bookmarks:read',
      BOOKMARKS_WRITE: 'bookmarks:write',
      CALLS_READ: 'calls:read',
      CALLS_WRITE: 'calls:write',
      CANVASES_READ: 'canvases:read',
      CANVASES_WRITE: 'canvases:write',
      COMMANDS: 'commands',
      DND_READ: 'dnd:read',
      DND_WRITE: 'dnd:write',
      EMOJI_READ: 'emoji:read',
      LINKS_READ: 'links:read',
      LINKS_WRITE: 'links:write',
      METADATA_MESSAGE_READ: 'metadata.message:read',
      PINS_READ: 'pins:read',
      PINS_WRITE: 'pins:write',
      
      // Legacy scopes (deprecated but still supported)
      CHANNELS_READ: 'channels:read', // Use conversations:read instead
      CHANNELS_WRITE: 'channels:write', // Use conversations:write instead
      GROUPS_READ: 'groups:read', // Use conversations:read instead
      GROUPS_WRITE: 'groups:write', // Use conversations:write instead
      IM_READ: 'im:read', // Use conversations:read instead
      IM_WRITE: 'im:write', // Use conversations:write instead
      MPIM_READ: 'mpim:read', // Use conversations:read instead
      MPIM_WRITE: 'mpim:write' // Use conversations:write instead
    },
    USER: {
      // Modern conversation scopes
      CONVERSATIONS_READ: 'conversations:read',
      CONVERSATIONS_WRITE: 'conversations:write',
      CONVERSATIONS_HISTORY: 'conversations:history',
      
      // Chat scopes
      CHAT_WRITE: 'chat:write:user',
      
      // User scopes
      USERS_READ: 'users:read',
      
      // Identity scopes
      IDENTITY_BASIC: 'identity.basic',
      IDENTITY_EMAIL: 'identity.email',
      IDENTITY_AVATAR: 'identity.avatar',
      IDENTITY_TEAM: 'identity.team',
      
      // Legacy scopes (deprecated)
      CHANNELS_READ: 'channels:read',
      CHANNELS_WRITE: 'channels:write',
      GROUPS_READ: 'groups:read',
      GROUPS_WRITE: 'groups:write',
      IM_READ: 'im:read',
      IM_WRITE: 'im:write',
      MPIM_READ: 'mpim:read',
      MPIM_WRITE: 'mpim:write'
    },
    ADMIN: {
      // Admin scopes for enterprise features
      ADMIN_ANALYTICS_READ: 'admin.analytics:read',
      ADMIN_APPS_READ: 'admin.apps:read',
      ADMIN_APPS_WRITE: 'admin.apps:write',
      ADMIN_CHAT_WRITE: 'admin.chat:write',
      ADMIN_CONVERSATIONS_READ: 'admin.conversations:read',
      ADMIN_CONVERSATIONS_WRITE: 'admin.conversations:write',
      ADMIN_INVITES_READ: 'admin.invites:read',
      ADMIN_INVITES_WRITE: 'admin.invites:write',
      ADMIN_TEAMS_READ: 'admin.teams:read',
      ADMIN_TEAMS_WRITE: 'admin.teams:write',
      ADMIN_USERS_READ: 'admin.users:read',
      ADMIN_USERS_WRITE: 'admin.users:write'
    }
  } as const;

  /**
   * Error Codes
   */
  static readonly ERROR_CODES = {
    // Authentication errors
    NOT_AUTHED: 'not_authed',
    INVALID_AUTH: 'invalid_auth',
    ACCOUNT_INACTIVE: 'account_inactive',
    TOKEN_REVOKED: 'token_revoked',
    NO_PERMISSION: 'no_permission',
    
    // Rate limiting
    RATE_LIMITED: 'rate_limited',
    
    // Channel errors
    CHANNEL_NOT_FOUND: 'channel_not_found',
    NOT_IN_CHANNEL: 'not_in_channel',
    IS_ARCHIVED: 'is_archived',
    
    // Message errors
    MESSAGE_NOT_FOUND: 'message_not_found',
    CANT_UPDATE_MESSAGE: 'cant_update_message',
    CANT_DELETE_MESSAGE: 'cant_delete_message',
    TOO_LONG: 'too_long',
    NO_TEXT: 'no_text',
    
    // User errors
    USER_NOT_FOUND: 'user_not_found',
    USER_NOT_VISIBLE: 'user_not_visible',
    
    // File errors
    FILE_NOT_FOUND: 'file_not_found',
    FILE_DELETED: 'file_deleted',
    
    // General errors
    INVALID_ARGUMENTS: 'invalid_arguments',
    UNKNOWN_ERROR: 'unknown_error',
    INTERNAL_ERROR: 'internal_error',
    FATAL_ERROR: 'fatal_error'
  } as const;

  /**
   * HTTP Status Codes
   */
  static readonly HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504
  } as const;

  /**
   * Emoji Shortcuts
   */
  static readonly EMOJIS = {
    // Status
    SUCCESS: '✅',
    ERROR: '❌',
    WARNING: '⚠️',
    INFO: 'ℹ️',
    LOADING: '⏳',
    
    // Priority
    URGENT: '🚨',
    HIGH: '🔴',
    MEDIUM: '🟡',
    LOW: '🟢',
    
    // Actions
    CREATE: '➕',
    UPDATE: '✏️',
    DELETE: '🗑️',
    ASSIGN: '👤',
    ESCALATE: '⬆️',
    
    // Categories
    BUG: '🐛',
    FEATURE: '✨',
    SUPPORT: '🎧',
    BILLING: '💳',
    TECHNICAL: '🔧',
    
    // General
    ROBOT: '🤖',
    FIRE: '🔥',
    ROCKET: '🚀',
    THUMBS_UP: '👍',
    THUMBS_DOWN: '👎',
    EYES: '👀',
    THINKING: '🤔'
  } as const;

  /**
   * Time Constants
   */
  static readonly TIME = {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000,
    
    // Slack-specific timeouts
    MESSAGE_TIMEOUT: 5 * 60 * 1000, // 5 minutes
    THREAD_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
    WEBHOOK_TIMEOUT: 5 * 60 * 1000, // 5 minutes
    
    // Cleanup intervals
    CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour
    THREAD_CLEANUP: 7 * 24 * 60 * 60 * 1000 // 7 days
  } as const;

  /**
   * Regular Expressions
   */
  static readonly REGEX = {
    USER_ID: /^U[A-Z0-9]{8,}$/,
    CHANNEL_ID: /^C[A-Z0-9]{8,}$/,
    TEAM_ID: /^T[A-Z0-9]{8,}$/,
    TIMESTAMP: /^\d{10}\.\d{6}$/,
    BOT_TOKEN: /^xoxb-[a-zA-Z0-9-]+$/,
    USER_TOKEN: /^xoxp-[a-zA-Z0-9-]+$/,
    APP_TOKEN: /^xapp-[a-zA-Z0-9-]+$/,
    
    // Message formatting
    USER_MENTION: /<@([A-Z0-9]+)>/g,
    CHANNEL_MENTION: /<#([A-Z0-9]+)\|?([^>]*)>/g,
    URL: /<(https?:\/\/[^|>]+)\|?([^>]*)>/g,
    EMAIL: /<mailto:([^|>]+)\|?([^>]*)>/g,
    
    // Command parsing
    SLASH_COMMAND: /^\/([a-zA-Z0-9_-]+)\s*(.*)?$/,
    HASHTAG_COMMAND: /^#([a-zA-Z0-9_-]+)\s*(.*)?$/,
    MENTION_COMMAND: /^<@[A-Z0-9]+>\s*([a-zA-Z0-9_-]+)\s*(.*)?$/
  } as const;

  /**
   * Default Values
   */
  static readonly DEFAULTS = {
    CHANNEL: 'general',
    USERNAME: 'Bot',
    ICON_EMOJI: ':robot_face:',
    THREAD_BROADCAST: false,
    UNFURL_LINKS: true,
    UNFURL_MEDIA: true,
    PARSE: 'none',
    LINK_NAMES: true,
    REPLY_BROADCAST: false,
    
    // Message formatting
    MAX_MESSAGE_LENGTH: 4000,
    TRUNCATE_SUFFIX: '...',
    
    // Retry configuration
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    
    // Cache TTL
    CACHE_TTL: 5 * 60 * 1000, // 5 minutes
    
    // Pagination
    PAGE_SIZE: 100,
    MAX_PAGE_SIZE: 1000
  } as const;

  /**
   * Environment Variables
   */
  static readonly ENV_VARS = {
    BOT_TOKEN: 'SLACK_BOT_TOKEN',
    SIGNING_SECRET: 'SLACK_SIGNING_SECRET',
    APP_TOKEN: 'SLACK_APP_TOKEN',
    CLIENT_ID: 'SLACK_CLIENT_ID',
    CLIENT_SECRET: 'SLACK_CLIENT_SECRET',
    VERIFICATION_TOKEN: 'SLACK_VERIFICATION_TOKEN',
    
    // Optional configuration
    DEFAULT_CHANNEL: 'SLACK_DEFAULT_CHANNEL',
    LOG_LEVEL: 'SLACK_LOG_LEVEL',
    RATE_LIMIT_ENABLED: 'SLACK_RATE_LIMIT_ENABLED',
    RETRY_ENABLED: 'SLACK_RETRY_ENABLED'
  } as const;

  /**
   * API Methods
   */
  static readonly API_METHODS = {
    // Authentication
    AUTH_TEST: 'auth.test',
    
    // Conversations
    CONVERSATIONS_LIST: 'conversations.list',
    CONVERSATIONS_INFO: 'conversations.info',
    CONVERSATIONS_HISTORY: 'conversations.history',
    CONVERSATIONS_REPLIES: 'conversations.replies',
    CONVERSATIONS_CREATE: 'conversations.create',
    CONVERSATIONS_INVITE: 'conversations.invite',
    CONVERSATIONS_KICK: 'conversations.kick',
    CONVERSATIONS_LEAVE: 'conversations.leave',
    CONVERSATIONS_JOIN: 'conversations.join',
    
    // Chat
    CHAT_POST_MESSAGE: 'chat.postMessage',
    CHAT_UPDATE: 'chat.update',
    CHAT_DELETE: 'chat.delete',
    CHAT_GET_PERMALINK: 'chat.getPermalink',
    CHAT_POST_EPHEMERAL: 'chat.postEphemeral',
    CHAT_SCHEDULE_MESSAGE: 'chat.scheduleMessage',
    CHAT_DELETE_SCHEDULED_MESSAGE: 'chat.deleteScheduledMessage',
    
    // Users
    USERS_LIST: 'users.list',
    USERS_INFO: 'users.info',
    USERS_LOOKUP_BY_EMAIL: 'users.lookupByEmail',
    USERS_GET_PRESENCE: 'users.getPresence',
    USERS_SET_PRESENCE: 'users.setPresence',
    
    // Files
    FILES_UPLOAD: 'files.upload',
    FILES_INFO: 'files.info',
    FILES_LIST: 'files.list',
    FILES_DELETE: 'files.delete',
    FILES_SHARE_PUBLIC_URL: 'files.sharedPublicURL',
    
    // Reactions
    REACTIONS_ADD: 'reactions.add',
    REACTIONS_REMOVE: 'reactions.remove',
    REACTIONS_GET: 'reactions.get',
    
    // Team
    TEAM_INFO: 'team.info',
    
    // Bots
    BOTS_INFO: 'bots.info'
  } as const;

  /**
   * Priority Levels
   */
  static readonly PRIORITY = {
    URGENT: 'urgent',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
  } as const;

  /**
   * Agent Types
   */
  static readonly AGENT_TYPES = {
    TECHNICAL: 'technical',
    CUSTOMER_SUCCESS: 'customer-success',
    CUSTOMER_SUPPORT: 'customer-support',
    PRODUCT: 'product',
    SALES: 'sales',
    BILLING: 'billing',
    SECURITY: 'security',
    DEVOPS: 'devops',
    QA: 'qa',
    DESIGN: 'design',
    MARKETING: 'marketing',
    MANAGEMENT: 'management',
    AI: 'ai'
  } as const;
}