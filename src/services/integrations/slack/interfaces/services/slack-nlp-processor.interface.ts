/**
 * @ai-metadata
 * @component: ISlackNLPProcessor
 * @description: Interface for natural language processing in Slack interactions following ISP
 * @last-update: 2025-01-20
 * @last-editor: ai-assistant
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Segregated interface for NLP processing following ISP principles"
 */

/**
 * Interface for natural language processing operations
 * Follows ISP by focusing only on NLP and intent recognition
 */
export interface ISlackNLPProcessor {
  /**
   * Check if text is a natural language query
   * @param text - The text to analyze
   * @returns True if it's a natural language query
   */
  isNaturalLanguageQuery(text: string): boolean;

  /**
   * Check if text is a help query
   * @param text - The text to analyze
   * @returns True if it's a help query
   */
  isHelpQuery(text: string): boolean;

  /**
   * Process natural language query and extract intent
   * @param text - The text to process
   * @param user - The user ID making the query
   * @returns Promise that resolves to intent object
   */
  processNaturalLanguageQuery(text: string, user: string): Promise<any>;

  /**
   * Route natural language intent to appropriate handler
   * @param intent - The extracted intent
   * @param channel - The channel ID
   * @param threadTs - The thread timestamp
   * @param user - The user ID
   * @returns Promise that resolves when routing is complete
   */
  routeNaturalLanguageIntent(intent: any, channel: string, threadTs: string, user: string): Promise<void>;

  /**
   * Handle direct help queries
   * @param text - The help query text
   * @param channel - The channel ID
   * @param threadTs - The thread timestamp
   * @param user - Optional user ID
   * @returns Promise that resolves when help is provided
   */
  handleDirectHelpQuery(text: string, channel: string, threadTs: string, user?: string): Promise<void>;
}