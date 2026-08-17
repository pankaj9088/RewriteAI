export type RewriteMode =
  | 'grammar'
  | 'professional'
  | 'friendly'
  | 'formal'
  | 'concise'
  | 'expand'
  | 'paraphrase'
  | 'translate'
  | 'custom';

export interface RewriteModeConfig {
  id: RewriteMode;
  name: string;
  shortDesc: string;
  icon: string;
  examplePrompt: string;
}

export interface RewriteRequestPayload {
  text: string;
  mode: RewriteMode;
  customInstruction?: string;
  targetLanguage?: string;
}

export interface RewriteResponseData {
  result: string;
  mode: string;
  model: string;
  stats?: {
    originalLength: number;
    resultLength: number;
    originalWords: number;
    resultWords: number;
    durationMs: number;
  };
}

export interface HistoryItem {
  id: string;
  originalText: string;
  rewrittenText: string;
  mode: RewriteMode;
  timestamp: number;
  durationMs?: number;
}
