/**
 * @ai-metadata
 * @component: AI Providers Index
 * @description: Barrel exports for all AI provider implementations
 * @last-update: 2025-01-15
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/ai-providers.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./gemini-nlp.ts", "./gemini-analysis.ts", "./gemini-response.ts"]
 * @tests: ["./tests/providers.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Centralized exports for all AI provider domain implementations"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 */

// NLP Domain Implementations
export {
  GeminiNLPProcessor,
  GeminiIntentClassifier,
  GeminiEntityExtractor,
  GeminiTextPreprocessor
} from './gemini-nlp';

// Analysis Domain Implementations
export {
  GeminiTicketAnalyzer,
  GeminiDuplicateDetector,
  GeminiPriorityAnalyzer,
  GeminiSentimentAnalyzer,
  GeminiCategoryClassifier,
  GeminiInsightsGenerator
} from './gemini-analysis';

// Response Generation Domain Implementations
export {
  GeminiResponseGenerator,
  GeminiContextualResponder,
  GeminiTemplateManager,
  GeminiSmartReply,
  GeminiAutoResponse
} from './gemini-response';

// Re-export types for convenience
export type {
  INLPProcessor,
  IIntentClassifier,
  IEntityExtractor,
  ITextPreprocessor
} from '../interfaces/nlp';

export type {
  ITicketAnalyzer,
  IDuplicateDetector,
  IPriorityAnalyzer,
  ISentimentAnalyzer,
  ICategoryClassifier,
  IInsightsGenerator
} from '../interfaces/analysis';

export type {
  IResponseGenerator,
  IContextualResponder,
  ITemplateManager,
  ISmartReply,
  IAutoResponse
} from '../interfaces/response';