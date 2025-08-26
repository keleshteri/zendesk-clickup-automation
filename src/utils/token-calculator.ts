/**
 * @ai-metadata
 * @component: TokenCalculator
 * @description: Utility class for calculating token usage and costs across different AI providers
 * @last-update: 2025-01-15
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/token-calculator.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["../types/index.js"]
 * @tests: ["./tests/token-calculator.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Utility for token counting and cost calculation across AI providers (Google Gemini, OpenAI, OpenRouter)"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 */

import { TokenUsage } from '../types/index.js';

export interface ProviderPricing {
  input_cost_per_1k: number;
  output_cost_per_1k: number;
  currency: string;
}

export class TokenCalculator {
  private static readonly PRICING: Record<string, ProviderPricing> = {
    'googlegemini': {
      input_cost_per_1k: 0.00015,  // $0.00015 per 1K input tokens for Gemini 1.5 Flash
      output_cost_per_1k: 0.0006,  // $0.0006 per 1K output tokens for Gemini 1.5 Flash
      currency: 'USD'
    },
    'openai': {
      input_cost_per_1k: 0.0015,   // $0.0015 per 1K input tokens for GPT-3.5-turbo
      output_cost_per_1k: 0.002,   // $0.002 per 1K output tokens for GPT-3.5-turbo
      currency: 'USD'
    },
    'openrouter': {
      input_cost_per_1k: 0.001,    // Average pricing for OpenRouter
      output_cost_per_1k: 0.002,   // Average pricing for OpenRouter
      currency: 'USD'
    }
  };

  /**
   * Estimate token count for text (rough approximation)
   * More accurate counting would require the actual tokenizer
   */
  static estimateTokenCount(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    // This is a simplified approach, real tokenizers are more complex
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate token usage and cost
   */
  static calculateUsage(
    provider: string,
    inputText: string,
    outputText: string,
    actualInputTokens?: number,
    actualOutputTokens?: number
  ): TokenUsage {
    const pricing = this.PRICING[provider.toLowerCase()];
    if (!pricing) {
      throw new Error(`Pricing not configured for provider: ${provider}`);
    }

    // Use actual token counts if provided, otherwise estimate
    const inputTokens = actualInputTokens ?? this.estimateTokenCount(inputText);
    const outputTokens = actualOutputTokens ?? this.estimateTokenCount(outputText);
    const totalTokens = inputTokens + outputTokens;

    // Calculate cost
    const inputCost = (inputTokens / 1000) * pricing.input_cost_per_1k;
    const outputCost = (outputTokens / 1000) * pricing.output_cost_per_1k;
    const totalCost = inputCost + outputCost;

    return {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      cost: Math.round(totalCost * 100000) / 100000, // Round to 5 decimal places
      currency: pricing.currency
    };
  }

  /**
   * Format token usage for display in Slack footer
   */
  static formatUsageFooter(usage: TokenUsage, provider: string): string {
    return `:moneybag: input tokens: ${usage.input_tokens} | output tokens: ${usage.output_tokens} | cost: $${usage.cost.toFixed(5)} | provider: ${provider}`;
  }

  /**
   * Update pricing for a provider (useful for configuration updates)
   */
  static updatePricing(provider: string, pricing: ProviderPricing): void {
    this.PRICING[provider.toLowerCase()] = pricing;
  }

  /**
   * Get current pricing for a provider
   */
  static getPricing(provider: string): ProviderPricing | null {
    return this.PRICING[provider.toLowerCase()] || null;
  }
}