/**
 * Slack User ID Constants
 * Centralized location for all Slack user IDs to avoid circular dependencies
 */

export const SLACK_IDS = {
  STEVE: "UGK1YA9EE",
  TALHA: "UGJ9606V6", 
  FRANCIS: "U07G3Q6DE1K",
  MIKE: "U0570RF4CHG",
  SAMUEL: "U03115JMADR",
  PAT: "U08MCUF919T",
  CAMILLE: "U0508K1V51P"
} as const;

export type SlackIdKey = keyof typeof SLACK_IDS;
export type SlackIdValue = typeof SLACK_IDS[SlackIdKey];