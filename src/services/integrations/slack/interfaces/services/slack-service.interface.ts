/**
 * @ai-metadata
 * @component: ISlackService
 * @description: Main interface defining the contract for the Slack service orchestrator
 * @last-update: 2025-01-13
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./slack-messaging.interface", "./slack-bot-manager.interface", "./slack-event-handler.interface", "./slack-security.interface", "../types"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Core interface for dependency injection pattern implementation in main Slack service orchestration"
 */

import type { ISlackServiceOrchestrator } from './slack-service-orchestrator.interface';

/**
 * Main interface for Slack service operations
 * Extends focused interfaces following ISP principles
 */
export interface ISlackService extends ISlackServiceOrchestrator {
  // This interface now extends the orchestrator and can be used for backward compatibility
  // Additional methods specific to the main service can be added here if needed
}