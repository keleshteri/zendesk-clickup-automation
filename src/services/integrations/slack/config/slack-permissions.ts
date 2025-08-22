/**
 * @ai-metadata
 * @component: SlackPermissions
 * @description: User role and permission management system for Slack integration access control
 * @last-update: 2024-01-21
 * @last-editor: system@zendesk-clickup-automation.com
 * @changelog: ./docs/changelog/slack-permissions.md
 * @stability: stable
 * @edit-permissions: "method-specific"
 * @method-permissions: { "getRolePermissions": "read-only", "hasPermission": "read-only", "getChannelAccess": "read-only", "canExecuteCommand": "read-only", "createUserPermissions": "allow", "updateUserPermissions": "allow", "grantPermission": "allow", "revokePermission": "allow" }
 * @dependencies: ["../utils/slack-constants.ts"]
 * @tests: ["./tests/slack-permissions.test.ts"]
 * @breaking-changes-risk: high
 * @review-required: true
 * @ai-context: "Security-critical permission system that controls user access to Slack features and commands. Changes here directly impact system security and user capabilities."
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

import { SlackConstants } from '../utils/slack-constants';

/**
 * User role definitions
 */
export type UserRole = 'admin' | 'manager' | 'agent' | 'viewer' | 'guest';

/**
 * Permission types for different operations
 */
export type PermissionType = 
  | 'read_tickets' | 'create_tickets' | 'update_tickets' | 'delete_tickets' | 'assign_tickets'
  | 'read_tasks' | 'create_tasks' | 'update_tasks' | 'delete_tasks' | 'assign_tasks'
  | 'send_messages' | 'send_dm' | 'mention_users' | 'mention_channels'
  | 'create_threads' | 'manage_threads' | 'delete_messages'
  | 'view_analytics' | 'export_data' | 'manage_integrations'
  | 'admin_settings' | 'user_management' | 'channel_management'
  | 'webhook_access' | 'api_access' | 'system_commands';

/**
 * Channel access levels
 */
export type ChannelAccessLevel = 'none' | 'read' | 'write' | 'admin';

/**
 * User permission configuration
 */
export interface UserPermissions {
  userId: string;
  role: UserRole;
  permissions: PermissionType[];
  channelAccess: Record<string, ChannelAccessLevel>;
  restrictions: {
    maxMessagesPerHour?: number;
    maxThreadsPerDay?: number;
    allowedCommands?: string[];
    blockedCommands?: string[];
    allowedChannels?: string[];
    blockedChannels?: string[];
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    notes?: string;
  };
}

/**
 * Role-based permission template
 */
export interface RolePermissions {
  role: UserRole;
  description: string;
  permissions: PermissionType[];
  defaultChannelAccess: ChannelAccessLevel;
  restrictions: {
    maxMessagesPerHour: number;
    maxThreadsPerDay: number;
    allowedCommands: string[];
    canAccessPrivateChannels: boolean;
    canMentionEveryone: boolean;
    canDeleteOwnMessages: boolean;
    canDeleteOtherMessages: boolean;
  };
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  restrictions?: string[];
}

/**
 * Main Slack permissions configuration class
 */
export class SlackPermissions {
  /**
   * Role-based permission templates
   */
  static readonly ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
    admin: {
      role: 'admin',
      description: 'Full system access with all permissions',
      permissions: [
        'read_tickets', 'create_tickets', 'update_tickets', 'delete_tickets', 'assign_tickets',
        'read_tasks', 'create_tasks', 'update_tasks', 'delete_tasks', 'assign_tasks',
        'send_messages', 'send_dm', 'mention_users', 'mention_channels',
        'create_threads', 'manage_threads', 'delete_messages',
        'view_analytics', 'export_data', 'manage_integrations',
        'admin_settings', 'user_management', 'channel_management',
        'webhook_access', 'api_access', 'system_commands'
      ],
      defaultChannelAccess: 'admin',
      restrictions: {
        maxMessagesPerHour: 1000,
        maxThreadsPerDay: 100,
        allowedCommands: ['*'],
        canAccessPrivateChannels: true,
        canMentionEveryone: true,
        canDeleteOwnMessages: true,
        canDeleteOtherMessages: true
      }
    },
    manager: {
      role: 'manager',
      description: 'Management access with oversight permissions',
      permissions: [
        'read_tickets', 'create_tickets', 'update_tickets', 'assign_tickets',
        'read_tasks', 'create_tasks', 'update_tasks', 'assign_tasks',
        'send_messages', 'send_dm', 'mention_users', 'mention_channels',
        'create_threads', 'manage_threads',
        'view_analytics', 'export_data',
        'user_management', 'channel_management'
      ],
      defaultChannelAccess: 'write',
      restrictions: {
        maxMessagesPerHour: 500,
        maxThreadsPerDay: 50,
        allowedCommands: ['help', 'status', 'assign', 'report', 'analytics'],
        canAccessPrivateChannels: true,
        canMentionEveryone: true,
        canDeleteOwnMessages: true,
        canDeleteOtherMessages: false
      }
    },
    agent: {
      role: 'agent',
      description: 'Standard agent access for daily operations',
      permissions: [
        'read_tickets', 'create_tickets', 'update_tickets', 'assign_tickets',
        'read_tasks', 'create_tasks', 'update_tasks',
        'send_messages', 'send_dm', 'mention_users',
        'create_threads'
      ],
      defaultChannelAccess: 'write',
      restrictions: {
        maxMessagesPerHour: 200,
        maxThreadsPerDay: 25,
        allowedCommands: ['help', 'status', 'assign', 'create', 'update'],
        canAccessPrivateChannels: false,
        canMentionEveryone: false,
        canDeleteOwnMessages: true,
        canDeleteOtherMessages: false
      }
    },
    viewer: {
      role: 'viewer',
      description: 'Read-only access for monitoring and reporting',
      permissions: [
        'read_tickets', 'read_tasks', 'send_messages', 'view_analytics'
      ],
      defaultChannelAccess: 'read',
      restrictions: {
        maxMessagesPerHour: 50,
        maxThreadsPerDay: 5,
        allowedCommands: ['help', 'status', 'view'],
        canAccessPrivateChannels: false,
        canMentionEveryone: false,
        canDeleteOwnMessages: false,
        canDeleteOtherMessages: false
      }
    },
    guest: {
      role: 'guest',
      description: 'Limited access for external users',
      permissions: [
        'read_tickets', 'send_messages'
      ],
      defaultChannelAccess: 'read',
      restrictions: {
        maxMessagesPerHour: 20,
        maxThreadsPerDay: 2,
        allowedCommands: ['help'],
        canAccessPrivateChannels: false,
        canMentionEveryone: false,
        canDeleteOwnMessages: false,
        canDeleteOtherMessages: false
      }
    }
  };

  /**
   * Channel-specific permission overrides
   */
  static readonly CHANNEL_PERMISSIONS: Record<string, Record<UserRole, ChannelAccessLevel>> = {
    'support-urgent': {
      admin: 'admin',
      manager: 'write',
      agent: 'write',
      viewer: 'read',
      guest: 'none'
    },
    'system-alerts': {
      admin: 'admin',
      manager: 'read',
      agent: 'read',
      viewer: 'read',
      guest: 'none'
    },
    'ai-insights': {
      admin: 'admin',
      manager: 'write',
      agent: 'read',
      viewer: 'read',
      guest: 'none'
    },
    'daily-reports': {
      admin: 'admin',
      manager: 'write',
      agent: 'read',
      viewer: 'read',
      guest: 'none'
    }
  };

  /**
   * Command permissions mapping
   */
  static readonly COMMAND_PERMISSIONS: Record<string, PermissionType[]> = {
    '/help': [],
    '/status': ['read_tickets', 'read_tasks'],
    '/create-ticket': ['create_tickets'],
    '/assign-ticket': ['assign_tickets'],
    '/update-ticket': ['update_tickets'],
    '/close-ticket': ['update_tickets'],
    '/create-task': ['create_tasks'],
    '/assign-task': ['assign_tasks'],
    '/analytics': ['view_analytics'],
    '/export': ['export_data'],
    '/admin': ['admin_settings'],
    '/manage-users': ['user_management'],
    '/manage-channels': ['channel_management']
  };

  /**
   * User permissions cache
   */
  private static userPermissionsCache: Map<string, UserPermissions> = new Map();

  /**
   * Get role permissions
   */
  static getRolePermissions(role: UserRole): RolePermissions {
    return this.ROLE_PERMISSIONS[role];
  }

  /**
   * Check if user has specific permission
   */
  static hasPermission(userId: string, permission: PermissionType): boolean {
    const userPerms = this.getUserPermissions(userId);
    if (!userPerms) return false;
    
    return userPerms.permissions.includes(permission);
  }

  /**
   * Check channel access level for user
   */
  static getChannelAccess(userId: string, channelName: string): ChannelAccessLevel {
    const userPerms = this.getUserPermissions(userId);
    if (!userPerms) return 'none';

    // Check specific channel access
    if (userPerms.channelAccess[channelName]) {
      return userPerms.channelAccess[channelName];
    }

    // Check channel-specific role permissions
    if (this.CHANNEL_PERMISSIONS[channelName]) {
      return this.CHANNEL_PERMISSIONS[channelName][userPerms.role] || 'none';
    }

    // Fall back to default role access
    const rolePerms = this.getRolePermissions(userPerms.role);
    return rolePerms.defaultChannelAccess;
  }

  /**
   * Check if user can execute command
   */
  static canExecuteCommand(userId: string, command: string): PermissionCheckResult {
    const userPerms = this.getUserPermissions(userId);
    if (!userPerms) {
      return { allowed: false, reason: 'User not found' };
    }

    const rolePerms = this.getRolePermissions(userPerms.role);
    
    // Check if command is in blocked list
    if (userPerms.restrictions.blockedCommands?.includes(command)) {
      return { allowed: false, reason: 'Command is blocked for this user' };
    }

    // Check if command is in allowed list (if specified)
    if (userPerms.restrictions.allowedCommands && 
        !userPerms.restrictions.allowedCommands.includes(command) &&
        !userPerms.restrictions.allowedCommands.includes('*')) {
      return { allowed: false, reason: 'Command not in allowed list' };
    }

    // Check role-based command permissions
    if (!rolePerms.restrictions.allowedCommands.includes('*') &&
        !rolePerms.restrictions.allowedCommands.includes(command.replace('/', ''))) {
      return { allowed: false, reason: 'Insufficient role permissions' };
    }

    // Check specific command permissions
    const requiredPerms = this.COMMAND_PERMISSIONS[command];
    if (requiredPerms) {
      const missingPerms = requiredPerms.filter(perm => !userPerms.permissions.includes(perm));
      if (missingPerms.length > 0) {
        return { 
          allowed: false, 
          reason: 'Missing required permissions',
          restrictions: missingPerms
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Check rate limits for user
   */
  static checkRateLimit(userId: string, action: 'message' | 'thread'): PermissionCheckResult {
    const userPerms = this.getUserPermissions(userId);
    if (!userPerms) {
      return { allowed: false, reason: 'User not found' };
    }

    // This would typically check against a rate limiting store
    // For now, just return the limits
    const restrictions = userPerms.restrictions;
    
    if (action === 'message' && restrictions.maxMessagesPerHour) {
      // Check message rate limit (implementation would track actual usage)
      return { allowed: true, restrictions: [`Max ${restrictions.maxMessagesPerHour} messages per hour`] };
    }

    if (action === 'thread' && restrictions.maxThreadsPerDay) {
      // Check thread rate limit (implementation would track actual usage)
      return { allowed: true, restrictions: [`Max ${restrictions.maxThreadsPerDay} threads per day`] };
    }

    return { allowed: true };
  }

  /**
   * Get user permissions (from cache or database)
   */
  static getUserPermissions(userId: string): UserPermissions | null {
    // Check cache first
    if (this.userPermissionsCache.has(userId)) {
      return this.userPermissionsCache.get(userId)!;
    }

    // In a real implementation, this would fetch from database
    // For now, return default agent permissions
    const defaultPerms = this.createUserPermissions(userId, 'agent');
    this.userPermissionsCache.set(userId, defaultPerms);
    return defaultPerms;
  }

  /**
   * Create user permissions from role template
   */
  static createUserPermissions(
    userId: string, 
    role: UserRole, 
    overrides?: Partial<UserPermissions>
  ): UserPermissions {
    const rolePerms = this.getRolePermissions(role);
    
    const userPerms: UserPermissions = {
      userId,
      role,
      permissions: [...rolePerms.permissions],
      channelAccess: {},
      restrictions: {
        maxMessagesPerHour: rolePerms.restrictions.maxMessagesPerHour,
        maxThreadsPerDay: rolePerms.restrictions.maxThreadsPerDay,
        allowedCommands: [...rolePerms.restrictions.allowedCommands]
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      ...overrides
    };

    return userPerms;
  }

  /**
   * Update user permissions
   */
  static updateUserPermissions(userId: string, updates: Partial<UserPermissions>): void {
    const current = this.getUserPermissions(userId);
    if (!current) return;

    const updated = {
      ...current,
      ...updates,
      metadata: {
        ...current.metadata,
        updatedAt: new Date()
      }
    };

    this.userPermissionsCache.set(userId, updated);
  }

  /**
   * Grant permission to user
   */
  static grantPermission(userId: string, permission: PermissionType): void {
    const userPerms = this.getUserPermissions(userId);
    if (!userPerms) return;

    if (!userPerms.permissions.includes(permission)) {
      userPerms.permissions.push(permission);
      userPerms.metadata.updatedAt = new Date();
      this.userPermissionsCache.set(userId, userPerms);
    }
  }

  /**
   * Revoke permission from user
   */
  static revokePermission(userId: string, permission: PermissionType): void {
    const userPerms = this.getUserPermissions(userId);
    if (!userPerms) return;

    const index = userPerms.permissions.indexOf(permission);
    if (index > -1) {
      userPerms.permissions.splice(index, 1);
      userPerms.metadata.updatedAt = new Date();
      this.userPermissionsCache.set(userId, userPerms);
    }
  }

  /**
   * Set channel access for user
   */
  static setChannelAccess(userId: string, channelName: string, access: ChannelAccessLevel): void {
    const userPerms = this.getUserPermissions(userId);
    if (!userPerms) return;

    userPerms.channelAccess[channelName] = access;
    userPerms.metadata.updatedAt = new Date();
    this.userPermissionsCache.set(userId, userPerms);
  }

  /**
   * Check if user can access channel
   */
  static canAccessChannel(userId: string, channelName: string, requiredLevel: ChannelAccessLevel = 'read'): boolean {
    const userAccess = this.getChannelAccess(userId, channelName);
    
    const accessLevels = ['none', 'read', 'write', 'admin'];
    const userLevel = accessLevels.indexOf(userAccess);
    const requiredLevelIndex = accessLevels.indexOf(requiredLevel);
    
    return userLevel >= requiredLevelIndex;
  }

  /**
   * Get all users with specific permission
   */
  static getUsersWithPermission(permission: PermissionType): string[] {
    const users: string[] = [];
    
    this.userPermissionsCache.forEach((userPerms, userId) => {
      if (userPerms.permissions.includes(permission)) {
        users.push(userId);
      }
    });
    
    return users;
  }

  /**
   * Get all users with specific role
   */
  static getUsersWithRole(role: UserRole): string[] {
    const users: string[] = [];
    
    this.userPermissionsCache.forEach((userPerms, userId) => {
      if (userPerms.role === role) {
        users.push(userId);
      }
    });
    
    return users;
  }

  /**
   * Clear permissions cache
   */
  static clearCache(): void {
    this.userPermissionsCache.clear();
  }

  /**
   * Validate permission configuration
   */
  static validatePermissions(permissions: UserPermissions): boolean {
    return !!(
      permissions.userId &&
      permissions.role &&
      Array.isArray(permissions.permissions) &&
      permissions.channelAccess &&
      permissions.restrictions &&
      permissions.metadata
    );
  }
}