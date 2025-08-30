// AI services exports
export { AIService } from './ai-service';
export { GoogleGeminiProvider } from './gemini-service';

// Core AI interfaces
export * from './interfaces/core';

// NLP domain interfaces
export * from './interfaces/nlp';

// Analysis domain interfaces
export * from './interfaces/analysis';

// Response generation interfaces
export * from './interfaces/response';

// Domain-specific implementations
export { GeminiNLPProcessor } from './providers/gemini-nlp';
export { GeminiTicketAnalyzer } from './providers/gemini-analysis';
export { GeminiResponseGenerator } from './providers/gemini-response';