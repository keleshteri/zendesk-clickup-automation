/**
 * @ai-metadata
 * @component: SlackCommandHandler
 * @description: Handles Slack slash commands, hashtag commands, and keyword triggers with permissions and metrics
 * @last-update: 2024-01-21
 * @last-editor: system@zendesk-clickup-automation.com
 * @changelog: ./docs/changelog/slack-command-handler.md
 * @stability: stable
 * @edit-permissions: "method-specific"
 * @method-permissions: { "executeCommand": "read-only", "registerCommand": "allow", "parseCommand": "allow" }
 * @dependencies: ["../core/slack-api-client.ts", "../core/slack-security-service.ts", "../core/slack-message-builder.ts"]
 * @tests: ["./tests/slack-command-handler.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Core command processing system for Slack integration. Handles command parsing, execution, and security validation."
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

import { SlackApiClient } from "../core/slack-api-client";
import { SlackMessageBuilder } from "../core/slack-message-builder";
import { SlackConstants } from "../utils/slack-constants";
import { SlackValidators } from "../utils/slack-validators";
import { SlackFormatters } from "../utils/slack-formatters";
import { SlackEmojis } from "../utils/slack-emojis";
import { SlackTextObject } from "../types/slack-message-types";
// Logger functionality replaced with console logging

/**
 * Interfaces for command handling
 */
export interface SlackCommand {
  type: "slash" | "hashtag" | "mention" | "keyword";
  command: string;
  args: string[];
  rawText: string;
  userId: string;
  channelId: string;
  threadTs?: string;
  messageTs: string;
  triggerId?: string;
  responseUrl?: string;
}

export interface CommandDefinition {
  id: string;
  command: string;
  type: "slash" | "hashtag" | "mention" | "keyword";
  description: string;
  usage: string;
  examples: string[];
  permissions: CommandPermission[];
  handler: CommandHandler;
  options: CommandOptions;
}

export interface CommandPermission {
  type: "user" | "role" | "channel" | "team";
  value: string;
  allow: boolean;
}

export interface CommandOptions {
  requiresArgs: boolean;
  minArgs?: number;
  maxArgs?: number;
  allowInDM: boolean;
  allowInThread: boolean;
  cooldown?: number; // seconds
  ephemeral?: boolean;
  requiresConfirmation?: boolean;
}

export interface CommandHandler {
  execute: (
    command: SlackCommand,
    context: CommandContext
  ) => Promise<CommandResponse>;
}

export interface CommandContext {
  apiClient: SlackApiClient;
  messageBuilder: SlackMessageBuilder;
  user: SlackUser;
  channel: SlackChannel;
  permissions: string[];
  metadata: Record<string, any>;
}

export interface CommandResponse {
  type: "message" | "modal" | "ephemeral" | "error" | "success";
  content: any;
  followUp?: CommandResponse[];
  delay?: number;
}

export interface SlackUser {
  id: string;
  name: string;
  email?: string;
  roles: string[];
  permissions: string[];
  timezone?: string;
}

export interface SlackChannel {
  id: string;
  name: string;
  type: "public" | "private" | "dm" | "group";
  members?: string[];
  topic?: string;
}

export interface CommandExecution {
  id: string;
  commandId: string;
  userId: string;
  channelId: string;
  executedAt: Date;
  duration: number;
  status: "success" | "error" | "timeout";
  error?: string;
  result?: any;
}

export interface CommandMetrics {
  totalExecutions: number;
  successRate: number;
  averageDuration: number;
  popularCommands: Array<{ command: string; count: number }>;
  errorRate: number;
  userActivity: Array<{ userId: string; count: number }>;
}

/**
 * Handles Slack command parsing, validation, and execution
 * Supports slash commands, hashtag commands, and keyword triggers
 */
export class SlackCommandHandler {
  private readonly logger = {
    info: (msg: string, data?: any) =>
      console.log(`[SlackCommandHandler] ${msg}`, data || ""),
    error: (msg: string, data?: any) =>
      console.error(`[SlackCommandHandler] ${msg}`, data || ""),
    warn: (msg: string, data?: any) =>
      console.warn(`[SlackCommandHandler] ${msg}`, data || ""),
    debug: (msg: string, data?: any) =>
      console.log(`[SlackCommandHandler] ${msg}`, data || ""),
  };
  private readonly commands = new Map<string, CommandDefinition>();
  private readonly executions = new Map<string, CommandExecution>();
  private readonly userCooldowns = new Map<string, Map<string, Date>>();
  private readonly commandAliases = new Map<string, string>();

  constructor(
    private readonly apiClient: SlackApiClient,
    private readonly messageBuilder: SlackMessageBuilder
  ) {
    this.setupCleanupInterval();
    this.loadDefaultCommands();
  }

  /**
   * Parse text for commands
   */
  parseCommand(
    text: string,
    userId: string,
    channelId: string,
    messageTs: string,
    threadTs?: string
  ): SlackCommand | null {
    try {
      // Try different command patterns
      let command =
        this.parseSlashCommand(text) ||
        this.parseHashtagCommand(text) ||
        this.parseKeywordCommand(text);

      if (!command) {
        return null;
      }

      // Add context information
      command.userId = userId;
      command.channelId = channelId;
      command.messageTs = messageTs;
      command.threadTs = threadTs;
      command.rawText = text;

      this.logger.debug("Command parsed", {
        type: command.type,
        command: command.command,
        args: command.args,
        userId,
      });

      return command;
    } catch (error) {
      this.logger.error("Failed to parse command", { error, text, userId });
      return null;
    }
  }

  /**
   * Execute a parsed command
   */
  async executeCommand(command: SlackCommand): Promise<CommandResponse> {
    const executionId = this.generateExecutionId();
    const startTime = Date.now();

    try {
      this.logger.info("Executing command", {
        executionId,
        command: command.command,
        type: command.type,
        userId: command.userId,
      });

      // Find command definition
      const definition = this.findCommandDefinition(command.command);
      if (!definition) {
        return this.createErrorResponse(`Unknown command: ${command.command}`);
      }

      // Validate command
      const validation = await this.validateCommand(command, definition);
      if (!validation.isValid) {
        return this.createErrorResponse(validation.error!);
      }

      // Check cooldown
      if (
        this.isUserOnCooldown(
          command.userId,
          command.command,
          definition.options.cooldown
        )
      ) {
        return this.createErrorResponse(
          "Command is on cooldown. Please wait before using it again."
        );
      }

      // Build execution context
      const context = await this.buildCommandContext(command);

      // Execute command
      const response = await definition.handler.execute(command, context);

      // Record successful execution
      const execution: CommandExecution = {
        id: executionId,
        commandId: definition.id,
        userId: command.userId,
        channelId: command.channelId,
        executedAt: new Date(),
        duration: Date.now() - startTime,
        status: "success",
        result: response,
      };
      this.executions.set(executionId, execution);

      // Set cooldown
      if (definition.options.cooldown) {
        this.setUserCooldown(
          command.userId,
          command.command,
          definition.options.cooldown
        );
      }

      // Process follow-up responses
      if (response.followUp) {
        this.processFollowUpResponses(response.followUp, command);
      }

      this.logger.info("Command executed successfully", {
        executionId,
        command: command.command,
        duration: execution.duration,
      });

      return response;
    } catch (error) {
      // Record failed execution
      const execution: CommandExecution = {
        id: executionId,
        commandId: command.command,
        userId: command.userId,
        channelId: command.channelId,
        executedAt: new Date(),
        duration: Date.now() - startTime,
        status: "error",
        error: (error as Error).message,
      };
      this.executions.set(executionId, execution);

      this.logger.error("Command execution failed", {
        error,
        executionId,
        command: command.command,
      });

      return this.createErrorResponse(
        `Command execution failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Register a new command
   */
  registerCommand(definition: CommandDefinition): void {
    this.commands.set(definition.command, definition);
    this.logger.info("Command registered", {
      command: definition.command,
      type: definition.type,
      description: definition.description,
    });
  }

  /**
   * Register command alias
   */
  registerAlias(alias: string, command: string): void {
    this.commandAliases.set(alias, command);
    this.logger.debug("Command alias registered", { alias, command });
  }

  /**
   * Get command help
   */
  async getCommandHelp(
    commandName?: string,
    userId?: string
  ): Promise<CommandResponse> {
    try {
      if (commandName) {
        // Get help for specific command
        const definition = this.findCommandDefinition(commandName);
        if (!definition) {
          return this.createErrorResponse(`Command not found: ${commandName}`);
        }

        const helpMessage = await this.buildCommandHelpMessage(definition);
        return {
          type: "ephemeral",
          content: helpMessage,
        };
      } else {
        // Get list of all available commands
        const availableCommands = Array.from(this.commands.values())
          .filter(
            (cmd) => !userId || this.hasPermission(userId, cmd.permissions)
          )
          .sort((a, b) => a.command.localeCompare(b.command));

        const helpMessage =
          await this.buildCommandListMessage(availableCommands);
        return {
          type: "ephemeral",
          content: helpMessage,
        };
      }
    } catch (error) {
      this.logger.error("Failed to get command help", {
        error,
        commandName,
        userId,
      });
      return this.createErrorResponse("Failed to retrieve command help.");
    }
  }

  /**
   * Get command metrics
   */
  getCommandMetrics(
    timeframe: "hour" | "day" | "week" = "day"
  ): CommandMetrics {
    const now = Date.now();
    const timeframeMs = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
    }[timeframe];

    const cutoff = now - timeframeMs;
    const recentExecutions = Array.from(this.executions.values()).filter(
      (exec) => exec.executedAt.getTime() > cutoff
    );

    const totalExecutions = recentExecutions.length;
    const successfulExecutions = recentExecutions.filter(
      (exec) => exec.status === "success"
    );
    const successRate =
      totalExecutions > 0 ? successfulExecutions.length / totalExecutions : 0;
    const averageDuration =
      successfulExecutions.length > 0
        ? successfulExecutions.reduce((sum, exec) => sum + exec.duration, 0) /
          successfulExecutions.length
        : 0;

    // Calculate popular commands
    const commandCounts = new Map<string, number>();
    recentExecutions.forEach((exec) => {
      const count = commandCounts.get(exec.commandId) || 0;
      commandCounts.set(exec.commandId, count + 1);
    });

    const popularCommands = Array.from(commandCounts.entries())
      .map(([command, count]) => ({ command, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate user activity
    const userCounts = new Map<string, number>();
    recentExecutions.forEach((exec) => {
      const count = userCounts.get(exec.userId) || 0;
      userCounts.set(exec.userId, count + 1);
    });

    const userActivity = Array.from(userCounts.entries())
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const errorRate =
      totalExecutions > 0
        ? recentExecutions.filter((exec) => exec.status === "error").length /
          totalExecutions
        : 0;

    return {
      totalExecutions,
      successRate,
      averageDuration,
      popularCommands,
      errorRate,
      userActivity,
    };
  }

  /**
   * Private parsing methods
   */
  private parseSlashCommand(text: string): SlackCommand | null {
    const slashPattern = /^\/([a-zA-Z0-9_-]+)(?:\s+(.*))?$/;
    const match = text.match(slashPattern);

    if (!match) return null;

    const command = match[1];
    const argsText = match[2] || "";
    const args = argsText ? this.parseArguments(argsText) : [];

    return {
      type: "slash",
      command,
      args,
      rawText: text,
      userId: "",
      channelId: "",
      messageTs: "",
    };
  }

  private parseHashtagCommand(text: string): SlackCommand | null {
    const hashtagPattern = /#([a-zA-Z0-9_-]+)(?:\s+(.*))?/;
    const match = text.match(hashtagPattern);

    if (!match) return null;

    const command = match[1];
    const argsText = match[2] || "";
    const args = argsText ? this.parseArguments(argsText) : [];

    return {
      type: "hashtag",
      command,
      args,
      rawText: text,
      userId: "",
      channelId: "",
      messageTs: "",
    };
  }

  private parseKeywordCommand(text: string): SlackCommand | null {
    // Check for registered keyword commands
    const words = text.toLowerCase().split(/\s+/);

    for (const [keyword, commandName] of Array.from(this.commandAliases.entries())) {
      if (words.includes(keyword.toLowerCase())) {
        const args = words.filter((word) => word !== keyword.toLowerCase());

        return {
          type: "keyword",
          command: commandName,
          args,
          rawText: text,
          userId: "",
          channelId: "",
          messageTs: "",
        };
      }
    }

    return null;
  }

  private parseArguments(argsText: string): string[] {
    // Simple argument parsing - can be enhanced for quoted strings, etc.
    return argsText
      .trim()
      .split(/\s+/)
      .filter((arg) => arg.length > 0);
  }

  /**
   * Command validation and execution helpers
   */
  private findCommandDefinition(
    command: string
  ): CommandDefinition | undefined {
    // Check direct command
    let definition = this.commands.get(command);
    if (definition) return definition;

    // Check aliases
    const aliasedCommand = this.commandAliases.get(command);
    if (aliasedCommand) {
      definition = this.commands.get(aliasedCommand);
    }

    return definition;
  }

  private async validateCommand(
    command: SlackCommand,
    definition: CommandDefinition
  ): Promise<{ isValid: boolean; error?: string }> {
    // Check argument requirements
    if (definition.options.requiresArgs && command.args.length === 0) {
      return { isValid: false, error: "This command requires arguments." };
    }

    if (
      definition.options.minArgs &&
      command.args.length < definition.options.minArgs
    ) {
      return {
        isValid: false,
        error: `This command requires at least ${definition.options.minArgs} arguments.`,
      };
    }

    if (
      definition.options.maxArgs &&
      command.args.length > definition.options.maxArgs
    ) {
      return {
        isValid: false,
        error: `This command accepts at most ${definition.options.maxArgs} arguments.`,
      };
    }

    // Check channel permissions
    const channel = await this.getChannelInfo(command.channelId);
    if (channel.type === "dm" && !definition.options.allowInDM) {
      return {
        isValid: false,
        error: "This command cannot be used in direct messages.",
      };
    }

    if (command.threadTs && !definition.options.allowInThread) {
      return {
        isValid: false,
        error: "This command cannot be used in threads.",
      };
    }

    // Check user permissions
    if (!this.hasPermission(command.userId, definition.permissions)) {
      return {
        isValid: false,
        error: "You do not have permission to use this command.",
      };
    }

    return { isValid: true };
  }

  private async buildCommandContext(
    command: SlackCommand
  ): Promise<CommandContext> {
    const user = await this.getUserInfo(command.userId);
    const channel = await this.getChannelInfo(command.channelId);

    return {
      apiClient: this.apiClient,
      messageBuilder: this.messageBuilder,
      user,
      channel,
      permissions: user.permissions,
      metadata: {
        executionTime: new Date(),
        threadTs: command.threadTs,
        messageTs: command.messageTs,
      },
    };
  }

  private async getUserInfo(userId: string): Promise<SlackUser> {
    try {
      const userInfo = await this.apiClient.getUserInfo(userId);
      return {
        id: userId,
        name: userInfo.name || "Unknown",
        email: userInfo.profile?.email,
        roles: [], // Would be populated from your user management system
        permissions: [], // Would be populated from your permission system
        timezone: userInfo.tz || undefined,
      };
    } catch (error) {
      this.logger.warn("Failed to get user info", { error, userId });
      return {
        id: userId,
        name: "Unknown",
        roles: [],
        permissions: [],
      };
    }
  }

  private async getChannelInfo(channelId: string): Promise<SlackChannel> {
    try {
      const channelInfo = await this.apiClient.getChannelInfo(channelId);
      return {
        id: channelId,
        name: channelInfo.name || "Unknown",
        type: this.determineChannelType(channelInfo),
        topic: channelInfo.topic?.value,
      };
    } catch (error) {
      this.logger.warn("Failed to get channel info", { error, channelId });
      return {
        id: channelId,
        name: "Unknown",
        type: "public",
      };
    }
  }

  private determineChannelType(
    channelInfo: any
  ): "public" | "private" | "dm" | "group" {
    if (channelInfo.is_im) return "dm";
    if (channelInfo.is_group) return "group";
    if (channelInfo.is_private) return "private";
    return "public";
  }

  private hasPermission(
    userId: string,
    permissions: CommandPermission[]
  ): boolean {
    if (permissions.length === 0) return true;

    // For now, return true - implement actual permission checking
    // This would integrate with your user/role management system
    return true;
  }

  private isUserOnCooldown(
    userId: string,
    command: string,
    cooldownSeconds?: number
  ): boolean {
    if (!cooldownSeconds) return false;

    const userCooldowns = this.userCooldowns.get(userId);
    if (!userCooldowns) return false;

    const lastUsed = userCooldowns.get(command);
    if (!lastUsed) return false;

    const cooldownEnd = new Date(lastUsed.getTime() + cooldownSeconds * 1000);
    return cooldownEnd > new Date();
  }

  private setUserCooldown(
    userId: string,
    command: string,
    cooldownSeconds: number
  ): void {
    let userCooldowns = this.userCooldowns.get(userId);
    if (!userCooldowns) {
      userCooldowns = new Map();
      this.userCooldowns.set(userId, userCooldowns);
    }

    userCooldowns.set(command, new Date());
  }

  /**
   * Response building helpers
   */
  private createErrorResponse(message: string): CommandResponse {
    return {
      type: "error",
      content: {
        text: `${SlackEmojis.getStatusEmoji("error")} ${message}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `${SlackEmojis.getStatusEmoji("error")} ${SlackFormatters.bold("Error")}\n${message}`,
            },
          },
        ],
      },
    };
  }

  private async buildCommandHelpMessage(
    definition: CommandDefinition
  ): Promise<any> {
    const blocks = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${SlackEmojis.getActionEmoji("help")} ${SlackFormatters.bold(definition.command)}\n${definition.description}`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Usage:*\n${SlackFormatters.code(definition.usage)}`,
          },
          {
            type: "mrkdwn",
            text: `*Type:*\n${definition.type}`,
          },
        ],
      },
    ];

    if (definition.examples.length > 0) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Examples:*\n${definition.examples.map((ex) => SlackFormatters.code(ex)).join("\n")}`,
        },
      });
    }

    return { blocks };
  }

  private async buildCommandListMessage(
    commands: CommandDefinition[]
  ): Promise<any> {
    const blocks = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${SlackEmojis.getActionEmoji("help")} ${SlackFormatters.bold("Available Commands")}`,
        },
      },
    ];

    // Group commands by type
    const commandsByType = commands.reduce(
      (acc, cmd) => {
        if (!acc[cmd.type]) acc[cmd.type] = [];
        acc[cmd.type].push(cmd);
        return acc;
      },
      {} as Record<string, CommandDefinition[]>
    );

    for (const [type, typeCommands] of Object.entries(commandsByType)) {
      const commandList = typeCommands
        .map(
          (cmd) => `${SlackFormatters.code(cmd.command)} - ${cmd.description}`
        )
        .join("\n");

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${type.charAt(0).toUpperCase() + type.slice(1)} Commands:*\n${commandList}`,
        },
      });
    }

    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "Use `/help <command>` for detailed information about a specific command.",
        } as SlackTextObject,
      ],
    } as any);

    return { blocks };
  }

  private async processFollowUpResponses(
    followUps: CommandResponse[],
    originalCommand: SlackCommand
  ): Promise<void> {
    for (const followUp of followUps) {
      if (followUp.delay) {
        await new Promise((resolve) =>
          setTimeout(resolve, followUp.delay! * 1000)
        );
      }

      // Send follow-up response
      await this.sendCommandResponse(followUp, originalCommand);
    }
  }

  private async sendCommandResponse(
    response: CommandResponse,
    command: SlackCommand
  ): Promise<void> {
    try {
      const messageOptions: any = {
        channel: command.channelId,
        thread_ts: command.threadTs,
        ...response.content,
      };

      if (response.type === "ephemeral") {
        // For ephemeral messages, we'd need to use a different API method
        // This is a simplified implementation
        messageOptions.user = command.userId;
      }

      await this.apiClient.postMessage(messageOptions);
    } catch (error) {
      this.logger.error("Failed to send command response", {
        error,
        command: command.command,
      });
    }
  }

  /**
   * Utility methods
   */
  private generateExecutionId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupCleanupInterval(): void {
    setInterval(() => {
      this.cleanupOldExecutions();
      this.cleanupExpiredCooldowns();
    }, SlackConstants.TIME.CLEANUP_INTERVAL);
  }

  private cleanupOldExecutions(): void {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
    for (const [id, execution] of Array.from(this.executions.entries())) {
      if (execution.executedAt < cutoff) {
        this.executions.delete(id);
      }
    }
  }

  private cleanupExpiredCooldowns(): void {
    const now = new Date();
    for (const [userId, userCooldowns] of Array.from(this.userCooldowns.entries())) {
      for (const [command, lastUsed] of Array.from(userCooldowns.entries())) {
        // Assume max cooldown of 1 hour for cleanup
        const maxCooldownEnd = new Date(lastUsed.getTime() + 60 * 60 * 1000);
        if (maxCooldownEnd < now) {
          userCooldowns.delete(command);
        }
      }

      if (userCooldowns.size === 0) {
        this.userCooldowns.delete(userId);
      }
    }
  }

  private loadDefaultCommands(): void {
    // Load some default commands
    const defaultCommands: CommandDefinition[] = [
      {
        id: "help",
        command: "help",
        type: "slash",
        description: "Get help about available commands",
        usage: "/help [command]",
        examples: ["/help", "/help status"],
        permissions: [],
        handler: {
          execute: async (command: SlackCommand) => {
            const helpCommand = command.args[0];
            return await this.getCommandHelp(helpCommand, command.userId);
          },
        },
        options: {
          requiresArgs: false,
          allowInDM: true,
          allowInThread: true,
          ephemeral: true,
        },
      },
      {
        id: "status",
        command: "status",
        type: "slash",
        description: "Check system status",
        usage: "/status",
        examples: ["/status"],
        permissions: [],
        handler: {
          execute: async (command: SlackCommand, context: CommandContext) => {
            const statusMessage =
              await context.messageBuilder.buildSuccessMessage(
                "System Status: All systems are operational",
                { includeTimestamp: true }
              );

            return {
              type: "message",
              content: statusMessage,
            };
          },
        },
        options: {
          requiresArgs: false,
          allowInDM: true,
          allowInThread: true,
          cooldown: 30,
        },
      },
    ];

    defaultCommands.forEach((cmd) => this.registerCommand(cmd));

    // Register some aliases
    this.registerAlias("help", "help");
    this.registerAlias("?", "help");
  }
}
