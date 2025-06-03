import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { generateInitialStoryStream, continueStoryStream } from '@/lib/openai';
import { Story, StoryCreationRequest, StoryContinuationRequest } from '@/types';

export class StoryStreamingService {
  async createStoryStream(data: StoryCreationRequest) {
    const { initialPrompt } = data;

    if (!initialPrompt) {
      throw new Error('Initial prompt is required');
    }

    const { stream } = await generateInitialStoryStream(initialPrompt);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }

  async continueStoryStream(data: StoryContinuationRequest, userId?: string) {
    const { storyId, userChoice, isCustomInput, maxWords, previousContent } =
      data;

    if (!userChoice) {
      throw new Error('User choice is required');
    }

    // For guest mode, use provided previousContent
    let fullPreviousContent = previousContent;

    // For authenticated users, get content from database
    if (userId && storyId) {
      if (!storyId) {
        throw new Error('Story ID is required for authenticated users');
      }

      const db = await getDatabase();

      // Get the existing story
      const story = await db.collection<Story>('stories').findOne({
        _id: new ObjectId(storyId),
        userId: new ObjectId(userId),
      });

      if (!story) {
        throw new Error('Story not found');
      }

      // Get the full story content so far
      fullPreviousContent = story.segments
        .map((segment) => segment.content)
        .join('\n\n');
    }

    if (!fullPreviousContent) {
      throw new Error('Previous content is required');
    }

    const { stream } = await continueStoryStream(
      fullPreviousContent,
      userChoice,
      isCustomInput,
      maxWords || 150
    );

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }
}
