export { mentionGreetingTemplate } from './mention-greeting.template.js';
export { botStatusTemplate } from './bot-status.template.js';

import { mentionGreetingTemplate } from './mention-greeting.template.js';
import { botStatusTemplate } from './bot-status.template.js';

/**
 * All custom message templates
 */
export const customTemplates = [
  mentionGreetingTemplate,
  botStatusTemplate
] as const;