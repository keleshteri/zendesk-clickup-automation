/**
 * Base interface for all Slack events
 * @see https://api.slack.com/events
 */
export interface SlackEvent {
  type: string;
  event_ts: string;
}