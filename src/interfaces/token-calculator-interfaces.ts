/**
 * @ai-metadata
 * @component: TokenCalculatorInterfaces
 * @description: Interface definitions for token calculation and AI provider pricing
 * @last-update: 2025-01-28
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/token-calculator-interfaces.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 * @tests: ["../utils/tests/token-calculator.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Token calculation and cost estimation interfaces for AI providers"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 */

/**
 * Pricing configuration for AI providers
 */
export interface ProviderPricing {
  /** Cost per 1000 input tokens */
  input_cost_per_1k: number;
  /** Cost per 1000 output tokens */
  output_cost_per_1k: number;
  /** Currency for pricing */
  currency: string;
}