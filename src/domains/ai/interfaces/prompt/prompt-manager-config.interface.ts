import { PromptVariables } from "../../types";

/**
 * Configuration for the POML prompt manager
 */
export interface PromptManagerConfig {
  /** Directory or location where templates are stored */
  templateLocation?: string;
  /** Default variables to include in all templates */
  defaultVariables?: PromptVariables;
}