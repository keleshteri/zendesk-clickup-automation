/**
 * @ai-metadata
 * @component: GeminiNLPProcessor
 * @description: Google Gemini implementation for NLP processing including intent classification and entity extraction
 * @last-update: 2025-01-15
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/gemini-nlp.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["@google/generative-ai", "../interfaces/nlp.ts"]
 * @tests: ["./tests/gemini-nlp.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "NLP domain implementation for Google Gemini with intent classification and entity extraction"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  IIntentClassifier, 
  IEntityExtractor, 
  INLPProcessor,
  ITextPreprocessor,
  INLPPipelineConfig
} from '../interfaces/nlp';
import { UserIntent, NLPResponse } from '../../../types';

export class GeminiNLPProcessor implements INLPProcessor {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private intentClassifier: IIntentClassifier;
  private entityExtractor: IEntityExtractor;
  private textPreprocessor: ITextPreprocessor;

  constructor(
    apiKey: string, 
    modelName: string = 'gemini-1.5-flash',
    config?: INLPPipelineConfig
  ) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: modelName });
    
    this.intentClassifier = new GeminiIntentClassifier(this.model);
    this.entityExtractor = new GeminiEntityExtractor(this.model);
    this.textPreprocessor = new GeminiTextPreprocessor();
  }

  async processText(text: string): Promise<NLPResponse> {
    const startTime = Date.now();
    
    try {
      // Preprocess text
      const preprocessedText = await this.textPreprocessor.preprocess(text);
      
      // Classify intent
      const intent = await this.intentClassifier.classifyIntent(preprocessedText);
      
      return {
        intent,
        originalText: text,
        processedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('NLP processing error:', error);
      throw new Error('Failed to process text with NLP pipeline');
    }
  }

  async extractActionableInfo(text: string, intent: UserIntent): Promise<Record<string, any>> {
    return this.entityExtractor.extractEntities(text, intent);
  }

  isAvailable(): boolean {
    return this.model !== null;
  }
}

export class GeminiIntentClassifier implements IIntentClassifier {
  constructor(private model: any) {}

  getSupportedCategories(): string[] {
    return ['zendesk_query', 'zendesk_action', 'clickup_create', 'clickup_query', 'general'];
  }

  validateIntent(intent: UserIntent): boolean {
    return this.getSupportedCategories().includes(intent.category) && 
           intent.confidence >= 0 && intent.confidence <= 1;
  }

  async classifyIntent(text: string): Promise<UserIntent> {
    try {
      const prompt = this.buildIntentClassificationPrompt(text);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      // Parse JSON response
      try {
        const intentData = JSON.parse(responseText.replace(/```json|```/g, '').trim());
        
        return {
          category: intentData.category || 'general',
          action: intentData.action || 'unknown',
          entities: {
            ticketId: intentData.entities?.ticketId,
            priority: intentData.entities?.priority,
            timeframe: intentData.entities?.timeframe,
            taskName: intentData.entities?.taskName,
            description: intentData.entities?.description,
            userId: intentData.entities?.userId,
            status: intentData.entities?.status,
            assignee: intentData.entities?.assignee
          },
          confidence: intentData.confidence || 0.5
        };
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return this.createFallbackIntent();
      }
    } catch (error) {
      console.error('Intent classification error:', error);
      throw new Error('Failed to classify intent');
    }
  }

  private buildIntentClassificationPrompt(text: string): string {
    return `You are an AI assistant that classifies user intents for a Zendesk-ClickUp automation system.

Analyze the following user message and classify the intent:

"${text}"

Classify into one of these categories:
- zendesk_query: Questions about tickets, status, or Zendesk data
- zendesk_action: Actions to perform on tickets (reply, update, close)
- clickup_create: Creating new ClickUp tasks or projects
- clickup_query: Questions about ClickUp tasks, status, or data
- general: General conversation, greetings, or unclear requests

Extract entities like:
- ticketId: Ticket numbers (e.g., #12345)
- priority: low, medium, high, urgent
- timeframe: today, this week, yesterday, etc.
- taskName: Name for new tasks
- description: Task or ticket descriptions
- userId: User mentions or IDs
- status: Status values (open, closed, in progress, etc.)
- assignee: Person assignments

Provide confidence score (0-1) based on clarity of intent.

Respond with ONLY a JSON object:
{
  "category": "category_name",
  "action": "specific_action_description",
  "entities": {
    "ticketId": "extracted_ticket_id",
    "priority": "extracted_priority",
    "timeframe": "extracted_timeframe",
    "taskName": "extracted_task_name",
    "description": "extracted_description",
    "userId": "extracted_user_id",
    "status": "extracted_status",
    "assignee": "extracted_assignee"
  },
  "confidence": 0.85
}`;
  }

  private createFallbackIntent(): UserIntent {
    return {
      category: 'general',
      action: 'unknown',
      entities: {},
      confidence: 0.3
    };
  }
}

export class GeminiEntityExtractor implements IEntityExtractor {
  constructor(private model: any) {}

  getSupportedEntities(category: string): string[] {
    const entityMap: Record<string, string[]> = {
      'zendesk_query': ['ticketId', 'priority', 'timeframe', 'status'],
      'zendesk_action': ['ticketId', 'priority', 'status', 'assignee'],
      'clickup_create': ['taskName', 'description', 'priority', 'assignee', 'dueDate'],
      'clickup_query': ['taskName', 'status', 'assignee', 'timeframe'],
      'general': ['keywords', 'topics']
    };
    return entityMap[category] || [];
  }

  validateEntities(entities: Record<string, any>, intent: UserIntent): boolean {
    const supportedEntities = this.getSupportedEntities(intent.category);
    return Object.keys(entities).every(key => 
      supportedEntities.includes(key) || key === 'rawText' || key === 'intent'
    );
  }

  async extractEntities(text: string, intent: UserIntent): Promise<Record<string, any>> {
    try {
      const intentCategory = intent.category || 'general';
      const prompt = this.buildEntityExtractionPrompt(text, intentCategory);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      // Parse JSON response
      try {
        const extractedData = JSON.parse(responseText.replace(/```json|```/g, '').trim());
        return extractedData || {};
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return { rawText: text, intent: intentCategory };
      }
    } catch (error) {
      console.error('Entity extraction error:', error);
      throw new Error('Failed to extract entities');
    }
  }

  private buildEntityExtractionPrompt(text: string, intent: string): string {
    return `Extract actionable information from this user message for intent "${intent}":

"${text}"

Extract relevant data based on the intent:
- For zendesk_query/zendesk_action: ticket IDs, priorities, timeframes, status
- For clickup_create/clickup_query: task names, descriptions, assignees, due dates
- For general: key topics or requests

Respond with ONLY a JSON object containing the extracted information:
{
  "ticketId": "extracted_ticket_id",
  "taskName": "extracted_task_name",
  "description": "extracted_description",
  "priority": "extracted_priority",
  "assignee": "extracted_assignee",
  "dueDate": "extracted_due_date",
  "status": "extracted_status",
  "timeframe": "extracted_timeframe",
  "additionalInfo": "any_other_relevant_data"
}`;
  }
}

export class GeminiTextPreprocessor implements ITextPreprocessor {
  preprocess(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  sanitize(text: string): string {
    // Remove potential sensitive information patterns
    return text
      .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD_NUMBER]') // Credit card numbers
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]') // Email addresses
      .replace(/\b\d{3}[\s-]?\d{2}[\s-]?\d{4}\b/g, '[SSN]') // Social Security Numbers
      .replace(/\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/g, '[PHONE]') // Phone numbers
      .replace(/\b(?:password|pwd|pass)\s*[:=]\s*\S+/gi, '[PASSWORD]'); // Passwords
  }

  tokenize(text: string): string[] {
    // Simple tokenization - split by whitespace and punctuation
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 10);
  }
}