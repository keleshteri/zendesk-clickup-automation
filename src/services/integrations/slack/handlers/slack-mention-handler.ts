/**
 * @ai-metadata
 * @component: SlackMentionHandler
 * @description: Processes mentions, handles team mentions, escalation logic, and notification acknowledgments
 * @last-update: 2024-01-21
 * @last-editor: system@zendesk-clickup-automation.com
 * @changelog: ./docs/changelog/slack-mention-handler.md
 * @stability: stable
 * @edit-permissions: "method-specific"
 * @method-permissions: { "processMention": "read-only", "handleTeamMention": "allow", "escalateMention": "allow" }
 * @dependencies: ["../core/slack-api-client.ts", "../core/slack-message-builder.ts", "../utils/slack-constants.ts", "../utils/slack-validators.ts", "../utils/slack-formatters.ts", "../utils/slack-emojis.ts"]
 * @tests: ["./tests/slack-mention-handler.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Handles mention processing and team notification logic. Critical for escalation workflows and team coordination."
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
// Logger functionality replaced with console logging

/**
 * Interfaces for mention handling
 */
export interface MentionEvent {
  type: "user" | "channel" | "team" | "here" | "everyone";
  mentionedId: string;
  mentionedBy: string;
  channel: string;
  threadTs?: string;
  messageTs: string;
  text: string;
  context: MentionContext;
}

export interface MentionContext {
  isUrgent: boolean;
  priority: "low" | "medium" | "high" | "critical";
  category: string;
  keywords: string[];
  sentiment: "positive" | "neutral" | "negative";
  requiresResponse: boolean;
  escalationLevel: number;
}

export interface MentionRule {
  id: string;
  name: string;
  conditions: MentionCondition[];
  actions: MentionAction[];
  priority: number;
  enabled: boolean;
  cooldown?: number; // minutes
}

export interface MentionCondition {
  type: "keyword" | "user" | "channel" | "time" | "sentiment" | "urgency";
  operator: "equals" | "contains" | "matches" | "in_range";
  value: any;
  negate?: boolean;
}

export interface MentionAction {
  type:
    | "notify"
    | "escalate"
    | "assign"
    | "create_thread"
    | "add_reaction"
    | "forward";
  config: Record<string, any>;
  delay?: number; // seconds
}

export interface TeamMention {
  teamId: string;
  teamName: string;
  members: string[];
  channels: string[];
  escalationPath: string[];
  responseTime: number; // minutes
  availability: TeamAvailability;
}

export interface TeamAvailability {
  timezone: string;
  workingHours: {
    start: string; // HH:mm
    end: string; // HH:mm
  };
  workingDays: number[]; // 0-6, Sunday = 0
  holidays: string[]; // ISO dates
  onCall?: string; // user ID
}

export interface MentionNotification {
  id: string;
  mentionId: string;
  recipientId: string;
  type: "direct" | "escalation" | "summary";
  status: "pending" | "sent" | "acknowledged" | "expired";
  sentAt?: Date;
  acknowledgedAt?: Date;
  expiresAt: Date;
}

/**
 * Handles Slack mentions, team notifications, and escalation logic
 * Manages intelligent routing and response tracking
 */
export class SlackMentionHandler {
  private readonly logger = {
    info: (msg: string, data?: any) =>
      console.log(`[SlackMentionHandler] ${msg}`, data || ""),
    error: (msg: string, data?: any) =>
      console.error(`[SlackMentionHandler] ${msg}`, data || ""),
    warn: (msg: string, data?: any) =>
      console.warn(`[SlackMentionHandler] ${msg}`, data || ""),
    debug: (msg: string, data?: any) =>
      console.log(`[SlackMentionHandler] ${msg}`, data || ""),
  };
  private readonly mentionRules = new Map<string, MentionRule>();
  private readonly teamMentions = new Map<string, TeamMention>();
  private readonly activeNotifications = new Map<string, MentionNotification>();
  private readonly ruleCooldowns = new Map<string, Date>();
  private readonly mentionHistory = new Map<string, Date[]>();

  constructor(
    private readonly apiClient: SlackApiClient,
    private readonly messageBuilder: SlackMessageBuilder
  ) {
    this.setupCleanupInterval();
    this.loadDefaultRules();
  }

  /**
   * Process a mention event
   */
  async processMention(event: MentionEvent): Promise<void> {
    try {
      this.logger.info("Processing mention event", {
        type: event.type,
        mentionedId: event.mentionedId,
        channel: event.channel,
      });

      // Validate mention event
      if (!this.validateMentionEvent(event)) {
        this.logger.warn("Invalid mention event", { event });
        return;
      }

      // Track mention frequency
      this.trackMentionFrequency(event);

      // Analyze mention context
      const context = await this.analyzeMentionContext(event);
      event.context = context;

      // Find matching rules
      const matchingRules = this.findMatchingRules(event);

      if (matchingRules.length === 0) {
        this.logger.debug("No matching rules for mention", {
          mentionedId: event.mentionedId,
        });
        return;
      }

      // Execute rules in priority order
      const sortedRules = matchingRules.sort((a, b) => b.priority - a.priority);

      for (const rule of sortedRules) {
        if (this.isRuleOnCooldown(rule.id)) {
          this.logger.debug("Rule on cooldown, skipping", { ruleId: rule.id });
          continue;
        }

        await this.executeRule(rule, event);

        if (rule.cooldown) {
          this.setRuleCooldown(rule.id, rule.cooldown);
        }
      }
    } catch (error) {
      this.logger.error("Failed to process mention", { error, event });
      throw error;
    }
  }

  /**
   * Handle team mention
   */
  async handleTeamMention(
    teamId: string,
    event: MentionEvent,
    options: { urgent?: boolean; escalate?: boolean } = {}
  ): Promise<void> {
    try {
      const team = this.teamMentions.get(teamId);
      if (!team) {
        this.logger.warn("Team not found for mention", { teamId });
        return;
      }

      this.logger.info("Handling team mention", {
        teamId,
        teamName: team.teamName,
      });

      // Check team availability
      const availability = this.checkTeamAvailability(team);

      if (!availability.isAvailable && !options.urgent) {
        await this.handleOutOfHoursMention(team, event, availability);
        return;
      }

      // Determine notification strategy
      const strategy = this.determineNotificationStrategy(team, event, options);

      // Send notifications based on strategy
      await this.executeNotificationStrategy(team, event, strategy);

      // Set up response tracking
      await this.setupResponseTracking(team, event);
    } catch (error) {
      this.logger.error("Failed to handle team mention", { error, teamId });
      throw error;
    }
  }

  /**
   * Escalate mention if no response received
   */
  async escalateMention(mentionId: string, level: number = 1): Promise<void> {
    try {
      const notification = this.activeNotifications.get(mentionId);
      if (!notification) {
        this.logger.warn("Notification not found for escalation", {
          mentionId,
        });
        return;
      }

      this.logger.info("Escalating mention", { mentionId, level });

      // Find team for escalation
      const team = Array.from(this.teamMentions.values()).find((t) =>
        t.members.includes(notification.recipientId)
      );

      if (!team || level >= team.escalationPath.length) {
        this.logger.warn("No escalation path available", { mentionId, level });
        return;
      }

      // Get next escalation target
      const escalationTarget = team.escalationPath[level];

      // Create escalation notification
      const escalationNotification: MentionNotification = {
        id: this.generateNotificationId(),
        mentionId,
        recipientId: escalationTarget,
        type: "escalation",
        status: "pending",
        expiresAt: new Date(Date.now() + team.responseTime * 60 * 1000),
      };

      // Send escalation message
      await this.sendEscalationMessage(escalationNotification, level);

      // Track escalation
      this.activeNotifications.set(
        escalationNotification.id,
        escalationNotification
      );

      // Schedule next escalation if needed
      if (level + 1 < team.escalationPath.length) {
        setTimeout(
          () => {
            this.escalateMention(mentionId, level + 1);
          },
          team.responseTime * 60 * 1000
        );
      }
    } catch (error) {
      this.logger.error("Failed to escalate mention", {
        error,
        mentionId,
        level,
      });
      throw error;
    }
  }

  /**
   * Acknowledge mention response
   */
  async acknowledgeMention(
    notificationId: string,
    responderId: string
  ): Promise<void> {
    try {
      const notification = this.activeNotifications.get(notificationId);
      if (!notification) {
        this.logger.warn("Notification not found for acknowledgment", {
          notificationId,
        });
        return;
      }

      notification.status = "acknowledged";
      notification.acknowledgedAt = new Date();

      this.logger.info("Mention acknowledged", {
        notificationId,
        responderId,
        responseTime:
          notification.acknowledgedAt.getTime() -
          (notification.sentAt?.getTime() || 0),
      });

      // Cancel any pending escalations for this mention
      this.cancelPendingEscalations(notification.mentionId);

      // Send acknowledgment confirmation
      await this.sendAcknowledgmentConfirmation(notification, responderId);
    } catch (error) {
      this.logger.error("Failed to acknowledge mention", {
        error,
        notificationId,
      });
      throw error;
    }
  }

  /**
   * Register a mention rule
   */
  registerRule(rule: MentionRule): void {
    this.mentionRules.set(rule.id, rule);
    this.logger.info("Mention rule registered", {
      ruleId: rule.id,
      name: rule.name,
    });
  }

  /**
   * Register a team for mentions
   */
  registerTeam(team: TeamMention): void {
    this.teamMentions.set(team.teamId, team);
    this.logger.info("Team registered for mentions", {
      teamId: team.teamId,
      name: team.teamName,
    });
  }

  /**
   * Get mention statistics
   */
  getMentionStats(
    timeframe: "hour" | "day" | "week" = "day"
  ): Record<string, any> {
    const now = Date.now();
    const timeframeMs = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
    }[timeframe];

    const cutoff = now - timeframeMs;
    const stats = {
      totalMentions: 0,
      uniqueUsers: new Set<string>(),
      averageResponseTime: 0,
      escalationRate: 0,
      topMentionedUsers: new Map<string, number>(),
    };

    // Calculate stats from mention history and notifications
    for (const [userId, mentions] of Array.from(this.mentionHistory.entries())) {
      const recentMentions = mentions.filter((date) => date.getTime() > cutoff);
      if (recentMentions.length > 0) {
        stats.totalMentions += recentMentions.length;
        stats.uniqueUsers.add(userId);
        stats.topMentionedUsers.set(userId, recentMentions.length);
      }
    }

    return {
      ...stats,
      uniqueUsers: stats.uniqueUsers.size,
      topMentionedUsers: Array.from(stats.topMentionedUsers.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10),
    };
  }

  /**
   * Private helper methods
   */
  private validateMentionEvent(event: MentionEvent): boolean {
    return !!(
      event.mentionedId &&
      event.mentionedBy &&
      event.channel &&
      event.messageTs
    );
  }

  private trackMentionFrequency(event: MentionEvent): void {
    const history = this.mentionHistory.get(event.mentionedId) || [];
    history.push(new Date());

    // Keep only last 100 mentions
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }

    this.mentionHistory.set(event.mentionedId, history);
  }

  private async analyzeMentionContext(
    event: MentionEvent
  ): Promise<MentionContext> {
    const text = event.text.toLowerCase();

    // Analyze urgency keywords
    const urgentKeywords = [
      "urgent",
      "asap",
      "emergency",
      "critical",
      "help",
      "issue",
      "problem",
      "down",
      "broken",
    ];
    const isUrgent = urgentKeywords.some((keyword) => text.includes(keyword));

    // Determine priority
    let priority: "low" | "medium" | "high" | "critical" = "medium";
    if (text.includes("critical") || text.includes("emergency")) {
      priority = "critical";
    } else if (isUrgent || text.includes("urgent")) {
      priority = "high";
    } else if (text.includes("when you can") || text.includes("no rush")) {
      priority = "low";
    }

    // Extract keywords
    const keywords = text.match(/\b\w{3,}\b/g) || [];

    // Analyze sentiment (simplified)
    const positiveWords = ["thanks", "great", "awesome", "good", "excellent"];
    const negativeWords = [
      "problem",
      "issue",
      "error",
      "broken",
      "failed",
      "wrong",
    ];

    let sentiment: "positive" | "neutral" | "negative" = "neutral";
    if (positiveWords.some((word) => text.includes(word))) {
      sentiment = "positive";
    } else if (negativeWords.some((word) => text.includes(word))) {
      sentiment = "negative";
    }

    // Check if response is required
    const questionWords = [
      "?",
      "how",
      "what",
      "when",
      "where",
      "why",
      "can you",
      "could you",
    ];
    const requiresResponse = questionWords.some((word) => text.includes(word));

    return {
      isUrgent,
      priority,
      category: this.categorizeMessage(text),
      keywords,
      sentiment,
      requiresResponse,
      escalationLevel: 0,
    };
  }

  private categorizeMessage(text: string): string {
    const categories = {
      technical: ["bug", "error", "issue", "problem", "broken", "fix", "code"],
      support: ["help", "question", "how", "what", "support"],
      feature: ["feature", "enhancement", "improvement", "add", "new"],
      urgent: ["urgent", "critical", "emergency", "asap", "immediately"],
      meeting: ["meeting", "call", "discuss", "sync", "standup"],
      general: [],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        return category;
      }
    }

    return "general";
  }

  private findMatchingRules(event: MentionEvent): MentionRule[] {
    const matchingRules: MentionRule[] = [];

    for (const rule of Array.from(this.mentionRules.values())) {
      if (!rule.enabled) continue;

      const matches = rule.conditions.every((condition) =>
        this.evaluateCondition(condition, event)
      );

      if (matches) {
        matchingRules.push(rule);
      }
    }

    return matchingRules;
  }

  private evaluateCondition(
    condition: MentionCondition,
    event: MentionEvent
  ): boolean {
    let result = false;

    switch (condition.type) {
      case "keyword":
        result = event.text
          .toLowerCase()
          .includes(String(condition.value).toLowerCase());
        break;
      case "user":
        result = event.mentionedId === condition.value;
        break;
      case "channel":
        result = event.channel === condition.value;
        break;
      case "urgency":
        result = event.context?.isUrgent === condition.value;
        break;
      case "sentiment":
        result = event.context?.sentiment === condition.value;
        break;
      default:
        result = false;
    }

    return condition.negate ? !result : result;
  }

  private async executeRule(
    rule: MentionRule,
    event: MentionEvent
  ): Promise<void> {
    this.logger.debug("Executing mention rule", {
      ruleId: rule.id,
      name: rule.name,
    });

    for (const action of rule.actions) {
      if (action.delay) {
        await new Promise((resolve) =>
          setTimeout(resolve, action.delay! * 1000)
        );
      }

      await this.executeAction(action, event);
    }
  }

  private async executeAction(
    action: MentionAction,
    event: MentionEvent
  ): Promise<void> {
    switch (action.type) {
      case "notify":
        await this.sendNotification(action.config, event);
        break;
      case "escalate":
        await this.escalateMention(event.messageTs, action.config.level || 1);
        break;
      case "assign":
        await this.assignMention(action.config, event);
        break;
      case "create_thread":
        await this.createMentionThread(action.config, event);
        break;
      case "add_reaction":
        await this.addMentionReaction(action.config, event);
        break;
      case "forward":
        await this.forwardMention(action.config, event);
        break;
    }
  }

  private checkTeamAvailability(team: TeamMention): {
    isAvailable: boolean;
    reason?: string;
    onCall?: string;
  } {
    const now = new Date();
    const availability = team.availability;

    // Check if it's a working day
    const dayOfWeek = now.getDay();
    if (!availability.workingDays.includes(dayOfWeek)) {
      return {
        isAvailable: false,
        reason: "outside_working_days",
        onCall: availability.onCall,
      };
    }

    // Check working hours
    const currentTime = now.toTimeString().slice(0, 5); // HH:mm
    if (
      currentTime < availability.workingHours.start ||
      currentTime > availability.workingHours.end
    ) {
      return {
        isAvailable: false,
        reason: "outside_working_hours",
        onCall: availability.onCall,
      };
    }

    // Check holidays
    const currentDate = now.toISOString().slice(0, 10);
    if (availability.holidays.includes(currentDate)) {
      return {
        isAvailable: false,
        reason: "holiday",
        onCall: availability.onCall,
      };
    }

    return { isAvailable: true };
  }

  private determineNotificationStrategy(
    team: TeamMention,
    event: MentionEvent,
    options: { urgent?: boolean; escalate?: boolean }
  ): "broadcast" | "sequential" | "oncall" {
    if (options.urgent || event.context?.priority === "critical") {
      return "broadcast";
    }

    if (team.availability.onCall) {
      return "oncall";
    }

    return "sequential";
  }

  private async executeNotificationStrategy(
    team: TeamMention,
    event: MentionEvent,
    strategy: "broadcast" | "sequential" | "oncall"
  ): Promise<void> {
    switch (strategy) {
      case "broadcast":
        await this.broadcastToTeam(team, event);
        break;
      case "sequential":
        await this.notifySequentially(team, event);
        break;
      case "oncall":
        await this.notifyOnCall(team, event);
        break;
    }
  }

  private async broadcastToTeam(
    team: TeamMention,
    event: MentionEvent
  ): Promise<void> {
    // Create a mock WorkflowContext for the message builder
    const mockContext = {
      ticket: {
        id: 'unknown',
        url: '#',
        priority: 'medium'
      },
      analysis: {},
      channel: event.channel,
      workflow: 'team-mention'
    };

    const message = this.messageBuilder.buildTeamMentionMessage(
      team.members,
      mockContext as any,
      `Team mention from <@${event.mentionedBy}>: ${event.text}`,
      undefined,
      [`Respond to mention in ${event.channel}`]
    );

    for (const memberId of team.members) {
      await this.apiClient.postMessage({
        channel: memberId, // DM
        text: message.text || `Team mention: ${event.text}`,
        ...message,
      });
    }
  }

  private async notifySequentially(
    team: TeamMention,
    event: MentionEvent
  ): Promise<void> {
    // Notify first available team member
    const firstMember = team.members[0];
    if (firstMember) {
      const notification = await this.createNotification(
        firstMember,
        event,
        "direct"
      );
      await this.sendDirectNotification(notification, event);
    }
  }

  private async notifyOnCall(
    team: TeamMention,
    event: MentionEvent
  ): Promise<void> {
    if (team.availability.onCall) {
      const notification = await this.createNotification(
        team.availability.onCall,
        event,
        "direct"
      );
      await this.sendDirectNotification(notification, event);
    }
  }

  private async handleOutOfHoursMention(
    team: TeamMention,
    event: MentionEvent,
    availability: { reason?: string; onCall?: string }
  ): Promise<void> {
    let message = `${SlackEmojis.getTimeEmoji("night")} Team ${SlackFormatters.bold(team.teamName)} is currently out of office.`;

    if (availability.onCall) {
      message += ` However, ${SlackFormatters.userMention(availability.onCall)} is on call and has been notified.`;
      await this.notifyOnCall(team, event);
    } else {
      message += ` Your message will be reviewed during business hours.`;
    }

    await this.apiClient.postMessage({
      channel: event.channel,
      thread_ts: event.threadTs,
      text: message,
    });
  }

  private async setupResponseTracking(
    team: TeamMention,
    event: MentionEvent
  ): Promise<void> {
    // Set up automatic escalation if no response
    setTimeout(
      () => {
        this.checkForResponse(event.messageTs);
      },
      team.responseTime * 60 * 1000
    );
  }

  private async checkForResponse(messageTs: string): Promise<void> {
    // Check if there have been any responses to the mention
    // This would involve checking thread replies or reactions
    // For now, we'll assume no response and escalate
    await this.escalateMention(messageTs);
  }

  private generateNotificationId(): string {
    return `mention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async createNotification(
    recipientId: string,
    event: MentionEvent,
    type: "direct" | "escalation" | "summary"
  ): Promise<MentionNotification> {
    return {
      id: this.generateNotificationId(),
      mentionId: event.messageTs,
      recipientId,
      type,
      status: "pending",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    };
  }

  private async sendDirectNotification(
    notification: MentionNotification,
    event: MentionEvent
  ): Promise<void> {
    // Create a mock ticket and analysis for the notification
    const mockTicket = {
      id: `mention-${event.messageTs}`,
      url: `https://slack.com/archives/${event.channel}/p${event.messageTs}`,
      priority: event.context?.priority || 'medium',
      subject: `Mention from ${event.mentionedBy}`,
      status: 'new'
    };

    const mockAnalysis = {
      priority: event.context?.priority || 'medium',
      category: event.context?.category || 'mention',
      sentiment: event.context?.sentiment || 'neutral',
      summary: event.text
    };

    const message = this.messageBuilder.buildIntelligentNotification(
      mockTicket as any,
      mockAnalysis as any,
      `https://slack.com/archives/${event.channel}/p${event.messageTs}`
    );

    await this.apiClient.postMessage({
      channel: notification.recipientId,
      text: message.text || `Mention notification: ${event.text}`,
      ...message,
    });

    notification.status = "sent";
    notification.sentAt = new Date();
    this.activeNotifications.set(notification.id, notification);
  }

  private async sendEscalationMessage(
    notification: MentionNotification,
    level: number
  ): Promise<void> {
    const message = {
      text: `${SlackEmojis.getAlertEmoji("escalation")} Escalation Level ${level}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${SlackEmojis.getAlertEmoji("escalation")} ${SlackFormatters.bold("Escalation Level " + level)}\n\nA mention requires your attention as previous team members have not responded.`,
          },
        },
      ],
    };

    await this.apiClient.postMessage({
      channel: notification.recipientId,
      ...message,
    });

    notification.status = "sent";
    notification.sentAt = new Date();
  }

  private async sendAcknowledgmentConfirmation(
    notification: MentionNotification,
    responderId: string
  ): Promise<void> {
    const message = {
      text: `${SlackEmojis.getStatusEmoji("acknowledged")} Mention acknowledged by ${SlackFormatters.userMention(responderId)}`,
    };

    // Send confirmation to original channel
    // This would require storing the original event details
  }

  private cancelPendingEscalations(mentionId: string): void {
    for (const [id, notification] of Array.from(this.activeNotifications.entries())) {
      if (
        notification.mentionId === mentionId &&
        notification.status === "pending"
      ) {
        notification.status = "acknowledged";
      }
    }
  }

  private isRuleOnCooldown(ruleId: string): boolean {
    const cooldownEnd = this.ruleCooldowns.get(ruleId);
    return cooldownEnd ? cooldownEnd > new Date() : false;
  }

  private setRuleCooldown(ruleId: string, minutes: number): void {
    const cooldownEnd = new Date(Date.now() + minutes * 60 * 1000);
    this.ruleCooldowns.set(ruleId, cooldownEnd);
  }

  private setupCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpiredNotifications();
      this.cleanupOldMentionHistory();
    }, SlackConstants.TIME.CLEANUP_INTERVAL);
  }

  private cleanupExpiredNotifications(): void {
    const now = new Date();
    for (const [id, notification] of Array.from(this.activeNotifications.entries())) {
      if (notification.expiresAt < now) {
        this.activeNotifications.delete(id);
      }
    }
  }

  private cleanupOldMentionHistory(): void {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
    for (const [userId, history] of Array.from(this.mentionHistory.entries())) {
      const filtered = history.filter((date) => date > cutoff);
      if (filtered.length === 0) {
        this.mentionHistory.delete(userId);
      } else {
        this.mentionHistory.set(userId, filtered);
      }
    }
  }

  private loadDefaultRules(): void {
    // Load some default mention rules
    const defaultRules: MentionRule[] = [
      {
        id: "urgent_mention",
        name: "Urgent Mention Handler",
        conditions: [{ type: "urgency", operator: "equals", value: true }],
        actions: [
          { type: "notify", config: { immediate: true } },
          { type: "add_reaction", config: { emoji: "eyes" } },
        ],
        priority: 100,
        enabled: true,
        cooldown: 5,
      },
      {
        id: "critical_mention",
        name: "Critical Mention Handler",
        conditions: [
          { type: "keyword", operator: "contains", value: "critical" },
        ],
        actions: [
          { type: "escalate", config: { level: 1 } },
          { type: "notify", config: { broadcast: true } },
        ],
        priority: 200,
        enabled: true,
        cooldown: 10,
      },
    ];

    defaultRules.forEach((rule) => this.registerRule(rule));
  }

  // Action implementation methods
  private async sendNotification(
    config: any,
    event: MentionEvent
  ): Promise<void> {
    // Implementation for sending notifications
  }

  private async assignMention(config: any, event: MentionEvent): Promise<void> {
    // Implementation for assigning mentions
  }

  private async createMentionThread(
    config: any,
    event: MentionEvent
  ): Promise<void> {
    // Implementation for creating mention threads
  }

  private async addMentionReaction(
    config: any,
    event: MentionEvent
  ): Promise<void> {
    // Implementation for adding reactions to mentions
  }

  private async forwardMention(
    config: any,
    event: MentionEvent
  ): Promise<void> {
    // Implementation for forwarding mentions
  }
}
