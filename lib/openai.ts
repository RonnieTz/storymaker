// Re-export everything from the modular OpenAI structure
export type {
  StoryGenerationResult,
  StoryStreamResult,
  StreamMessage,
} from './openai/types';
export {
  openai,
  ensureValidJsonResponse,
  cleanResponse,
  generateInitialStory,
  generateInitialStoryStream,
  continueStory,
  continueStoryStream,
} from './openai/index';
