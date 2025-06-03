export interface StoryGenerationResult {
  content: string;
  suggestions: string[];
  wordCount: number;
}

export interface StoryStreamResult {
  stream: ReadableStream<Uint8Array>;
}

export interface StreamMessage {
  type:
    | 'content'
    | 'generating_suggestions'
    | 'suggestion'
    | 'complete'
    | 'error';
  content?: string;
  suggestions?: string[];
  suggestion?: string; // New field for individual suggestions
  suggestionIndex?: number; // Index of the suggestion being streamed
  wordCount?: number;
  error?: string;
}
