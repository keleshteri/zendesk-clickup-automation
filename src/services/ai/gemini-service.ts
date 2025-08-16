import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, AIResponse, Env, TicketAnalysis, TicketMetadata, DuplicateAnalysis, ZendeskTicket, AIInsights, TokenUsage } from '../../types/index.js';
import { TokenCalculator } from '../token-calculator.js';

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