import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { generateInitialStory, continueStory } from '@/lib/openai';
import {
  Story,
  StorySegment,
  StoryCreationRequest,
  StoryContinuationRequest,
} from '@/types';

export class StoryService {
  private async getDatabase() {
    return await getDatabase();
  }

  async createStory(data: StoryCreationRequest, userId: string) {
    const {
      initialPrompt,
      title,
      content,
      suggestions,
      wordCount,
      skipGeneration,
    } = data;

    if (!initialPrompt) {
      throw new Error('Initial prompt is required');
    }

    const db = await this.getDatabase();

    let result;

    if (skipGeneration && content) {
      // Use provided content and suggestions (from streaming)
      result = {
        content,
        suggestions: suggestions || [],
        wordCount: wordCount || content.split(' ').length,
      };
    } else {
      // Generate the initial story using OpenAI
      result = await generateInitialStory(initialPrompt);
    }

    // Create the first story segment
    const firstSegment: StorySegment = {
      content: result.content,
      wordCount: result.wordCount,
      createdAt: new Date(),
      userPrompt: initialPrompt,
    };

    // Create the story document
    const story: Omit<Story, '_id'> = {
      title: title || 'Untitled Story',
      userId: new ObjectId(userId),
      segments: [firstSegment],
      currentSuggestions: result.suggestions,
      isComplete: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalWordCount: result.wordCount,
    };

    const insertResult = await db.collection<Story>('stories').insertOne(story);

    return {
      storyId: insertResult.insertedId,
      content: result.content,
      suggestions: result.suggestions,
      wordCount: result.wordCount,
    };
  }

  async continueStory(data: StoryContinuationRequest, userId: string) {
    const {
      storyId,
      userChoice,
      isCustomInput,
      maxWords,
      content,
      suggestions,
      skipGeneration,
    } = data;

    if (!storyId || !userChoice) {
      throw new Error('Story ID and user choice are required');
    }

    const db = await this.getDatabase();

    // Get the existing story
    const story = await db.collection<Story>('stories').findOne({
      _id: new ObjectId(storyId),
      userId: new ObjectId(userId),
    });

    if (!story) {
      throw new Error('Story not found');
    }

    let result;

    if (skipGeneration && content) {
      // Use provided content and suggestions (from streaming)
      result = {
        content,
        suggestions: suggestions || [],
        wordCount: content.split(' ').length,
      };
    } else {
      // Get the full story content so far
      const previousContent = story.segments
        .map((segment) => segment.content)
        .join('\n\n');

      // Generate the continuation using OpenAI with the specified word limit
      result = await continueStory(
        previousContent,
        userChoice,
        isCustomInput,
        maxWords || 150 // Default to 150 words if not specified
      );
    }

    // Create new story segment
    const newSegment: StorySegment = {
      content: result.content,
      wordCount: result.wordCount,
      createdAt: new Date(),
      userPrompt: userChoice,
    };

    // Update the story with the new segment
    await db.collection<Story>('stories').updateOne(
      { _id: new ObjectId(storyId) },
      {
        $push: { segments: newSegment },
        $set: {
          currentSuggestions: result.suggestions,
          updatedAt: new Date(),
          totalWordCount: story.totalWordCount + result.wordCount,
        },
      }
    );

    return {
      content: result.content,
      suggestions: result.suggestions,
      wordCount: result.wordCount,
      totalWordCount: story.totalWordCount + result.wordCount,
    };
  }

  async getStory(storyId: string, userId: string) {
    const db = await this.getDatabase();

    const story = await db.collection<Story>('stories').findOne({
      _id: new ObjectId(storyId),
      userId: new ObjectId(userId),
    });

    if (!story) {
      throw new Error('Story not found');
    }

    return story;
  }

  async getUserStories(userId: string) {
    const db = await this.getDatabase();

    const stories = await db
      .collection<Story>('stories')
      .find({ userId: new ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .toArray();

    return stories;
  }

  async deleteStory(storyId: string, userId: string) {
    const db = await this.getDatabase();

    const deleteResult = await db.collection<Story>('stories').deleteOne({
      _id: new ObjectId(storyId),
      userId: new ObjectId(userId),
    });

    if (deleteResult.deletedCount === 0) {
      throw new Error('Story not found or unauthorized');
    }

    return { message: 'Story deleted successfully' };
  }
}
