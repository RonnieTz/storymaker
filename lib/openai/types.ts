export interface StoryGenerationResult {
  content: string;
  suggestions: string[];
  wordCount: number;
}

export interface StoryStreamResult {
  stream: ReadableStream<Uint8Array>;
}

export interface StreamMessage {
  type: 'content' | 'complete' | 'error';
  content?: string;
  suggestions?: string[];
  wordCount?: number;
  error?: string;
}
