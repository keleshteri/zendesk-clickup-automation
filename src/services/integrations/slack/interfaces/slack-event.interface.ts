/**
 * @ai-metadata
 * @component: SlackEventInterface
 * @description: Base interface for all Slack events providing common event properties
 * @last-update: 2024-01-13
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 */

/**
 * Base interface for all Slack events
 * @see https://api.slack.com/events
 */
export interface SlackEvent {
  type: string;
  event_ts: string;
}