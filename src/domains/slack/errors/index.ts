// Base error class and type guard
export { SlackBaseError, isSlackError } from './slack-base.error.js';

// Specific error classes
export { SlackAuthError, isSlackAuthError } from './slack-auth.error.js';
export { SlackConfigError } from './slack-config.error.js';
export { SlackApiError } from './slack-api.error.js';
export { SlackRateLimitError, isSlackRateLimitError } from './slack-rate-limit.error.js';
export { SlackTemplateError, isSlackTemplateError } from './slack-template.error.js';
export { SlackMessageError, isSlackMessageError } from './slack-message.error.js';
export { SlackBotError } from './slack-bot.error.js';
export { SlackChannelError } from './slack-channel.error.js';
export { SlackUserError } from './slack-user.error.js';
export { SlackValidationError } from './slack-validation.error.js';

// Error factory
export { SlackErrorFactory } from './slack-error.factory.js';