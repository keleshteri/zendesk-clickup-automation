export { welcomeBasicTemplate } from './welcome-basic.template.js';
export { welcomeDetailedTemplate } from './welcome-detailed.template.js';

import { welcomeBasicTemplate } from './welcome-basic.template.js';
import { welcomeDetailedTemplate } from './welcome-detailed.template.js';

/**
 * All welcome message templates
 */
export const welcomeTemplates = [
  welcomeBasicTemplate,
  welcomeDetailedTemplate
] as const;