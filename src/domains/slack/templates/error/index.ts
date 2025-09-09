export { unknownCommandTemplate } from './unknown-command.template.js';
export { errorGenericTemplate } from './error-generic.template.js';

import { unknownCommandTemplate } from './unknown-command.template.js';
import { errorGenericTemplate } from './error-generic.template.js';

/**
 * All error message templates
 */
export const errorTemplates = [
  unknownCommandTemplate,
  errorGenericTemplate
] as const;