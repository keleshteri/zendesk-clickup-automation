/**
 * Represents a compiled prompt template
 */
export interface PromptTemplate {
  /** Unique identifier for the template */
  id?: string;
  /** Internal representation of the template */
  template: unknown;
  /** Original template string */
  source: string;
}