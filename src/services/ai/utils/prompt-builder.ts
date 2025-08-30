/**
 * @ai-metadata
 * @component: PromptBuilder
 * @description: Utility class for building AI prompts from templates with variable substitution
 * @last-update: 2025-01-20
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/prompt-builder.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["../../../types/index.ts", "../../integrations/zendesk/interfaces.ts"]
 * @tests: ["./tests/prompt-builder.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Core utility for AI prompt generation and template management"
 */
export interface PromptTemplate {
  name: string;
  template: string;
  variables: string[];
  description: string;
}

export interface PromptContext {
  operation: string;
  maxTokens?: number;
  temperature?: number;
  responseFormat?: 'json' | 'text' | 'markdown';
  systemContext?: string;
}

export class PromptBuilder {
  private static readonly SYSTEM_CONTEXT = `
You are TaskGenie, an AI assistant specialized in Zendesk ticket analysis and ClickUp task management.
You work for 2dc, a WordPress development and support company.

Key capabilities:
- Analyze Zendesk tickets for priority, category, sentiment, and complexity
- Detect duplicate tickets and suggest consolidation
- Generate ClickUp task descriptions with actionable insights
- Provide business intelligence and trend analysis
- Classify user intents for automation workflows

Always provide structured, actionable responses that help streamline support operations.
`;

  private static readonly TEMPLATES: Record<string, PromptTemplate> = {
    TICKET_ANALYSIS: {
      name: 'Ticket Analysis',
      template: 'Analyze this ticket: {{ticketContent}}',
      variables: ['ticketContent'],
      description: 'Analyzes Zendesk tickets for comprehensive insights'
    }
  };

  static buildFromTemplate(
    templateName: keyof typeof PromptBuilder.TEMPLATES,
    variables: Record<string, any>
  ): string {
    const template = this.TEMPLATES[templateName];
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }
    return template.template;
  }

  static getAvailableTemplates(): string[] {
    return Object.keys(this.TEMPLATES);
  }
}