import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, AIResponse, Env } from '../types/index.js';

export class GoogleGeminiProvider implements AIProvider {
  name: 'googlegemini' = 'googlegemini';
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async summarize(text: string): Promise<string> {
    try {
      const prompt = `Please provide a concise summary of this Zendesk ticket content. Focus on the main issue, key details, and any action items. Keep it under 200 words:\n\n${text}`;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Google Gemini API error:', error);
      throw new Error('Failed to generate summary with Google Gemini');
    }
  }
}

export class AIService {
  private provider: AIProvider;
  private env: Env;

  constructor(env: Env) {
    this.env = env;
    this.provider = this.createProvider();
  }

  private createProvider(): AIProvider {
    switch (this.env.AI_PROVIDER) {
      case 'googlegemini':
        if (!this.env.GOOGLE_GEMINI_API_KEY) {
          throw new Error('Google Gemini API key is required');
        }
        return new GoogleGeminiProvider(this.env.GOOGLE_GEMINI_API_KEY);
      
      case 'openai':
        // TODO: Implement OpenAI provider
        throw new Error('OpenAI provider not yet implemented');
      
      case 'openrouter':
        // TODO: Implement OpenRouter provider
        throw new Error('OpenRouter provider not yet implemented');
      
      default:
        throw new Error(`Unsupported AI provider: ${this.env.AI_PROVIDER}`);
    }
  }

  async summarizeTicket(ticketContent: string): Promise<AIResponse> {
    try {
      const summary = await this.provider.summarize(ticketContent);
      
      return {
        summary,
        provider: this.provider.name,
        model: this.env.AI_PROVIDER === 'googlegemini' ? 'gemini-pro' : undefined,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('AI summarization error:', error);
      throw error;
    }
  }

  isConfigured(): boolean {
    try {
      this.createProvider();
      return true;
    } catch {
      return false;
    }
  }

  getProviderName(): string {
    return this.provider.name;
  }
}