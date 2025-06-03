import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { StoryService } from '@/lib/services/story-service';
import { StoryStreamingService } from '@/lib/services/story-streaming-service';
import { StoryCreationRequest, StoryContinuationRequest } from '@/types';

const storyService = new StoryService();
const streamingService = new StoryStreamingService();

export class StoryRequestHandlers {
  async handlePost(request: NextRequest) {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { action, stream } = body;

      // Check if streaming is requested
      if (stream) {
        if (action === 'create') {
          return await this.handleCreateStoryStream(body);
        } else if (action === 'continue') {
          return await this.handleContinueStoryStream(body, session.user.id);
        }
      }

      // Non-streaming (original) behavior
      if (action === 'create') {
        return await this.handleCreateStory(body, session.user.id);
      } else if (action === 'continue') {
        return await this.handleContinueStory(body, session.user.id);
      } else {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }
    } catch (error) {
      console.error('Story API error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  async handleGet(request: NextRequest) {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { searchParams } = new URL(request.url);
      const storyId = searchParams.get('id');

      if (storyId) {
        // Get specific story
        const story = await storyService.getStory(storyId, session.user.id);
        return NextResponse.json(story);
      } else {
        // Get all user stories
        const stories = await storyService.getUserStories(session.user.id);
        return NextResponse.json(stories);
      }
    } catch (error) {
      console.error('Get stories error:', error);
      if (error instanceof Error && error.message === 'Story not found') {
        return NextResponse.json({ error: 'Story not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  async handleDelete(request: NextRequest) {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { searchParams } = new URL(request.url);
      const storyId = searchParams.get('id');

      if (!storyId) {
        return NextResponse.json(
          { error: 'Story ID is required' },
          { status: 400 }
        );
      }

      const result = await storyService.deleteStory(storyId, session.user.id);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Delete story error:', error);
      if (
        error instanceof Error &&
        error.message === 'Story not found or unauthorized'
      ) {
        return NextResponse.json(
          { error: 'Story not found or unauthorized' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  private async handleCreateStory(data: StoryCreationRequest, userId: string) {
    try {
      const result = await storyService.createStory(data, userId);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Create story error:', error);
      if (
        error instanceof Error &&
        error.message === 'Initial prompt is required'
      ) {
        return NextResponse.json(
          { error: 'Initial prompt is required' },
          { status: 400 }
        );
      }
      throw error;
    }
  }

  private async handleContinueStory(
    data: StoryContinuationRequest,
    userId: string
  ) {
    try {
      const result = await storyService.continueStory(data, userId);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Continue story error:', error);
      if (error instanceof Error) {
        if (error.message === 'Story ID and user choice are required') {
          return NextResponse.json(
            { error: 'Story ID and user choice are required' },
            { status: 400 }
          );
        }
        if (error.message === 'Story not found') {
          return NextResponse.json(
            { error: 'Story not found' },
            { status: 404 }
          );
        }
      }
      throw error;
    }
  }

  private async handleCreateStoryStream(data: StoryCreationRequest) {
    try {
      return await streamingService.createStoryStream(data);
    } catch (error) {
      console.error('Error creating story stream:', error);
      if (
        error instanceof Error &&
        error.message === 'Initial prompt is required'
      ) {
        return NextResponse.json(
          { error: 'Initial prompt is required' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to generate story' },
        { status: 500 }
      );
    }
  }

  private async handleContinueStoryStream(
    data: StoryContinuationRequest,
    userId: string
  ) {
    try {
      return await streamingService.continueStoryStream(data, userId);
    } catch (error) {
      console.error('Error continuing story stream:', error);
      if (error instanceof Error) {
        if (error.message === 'Story ID and user choice are required') {
          return NextResponse.json(
            { error: 'Story ID and user choice are required' },
            { status: 400 }
          );
        }
        if (error.message === 'Story not found') {
          return NextResponse.json(
            { error: 'Story not found' },
            { status: 404 }
          );
        }
      }
      return NextResponse.json(
        { error: 'Failed to continue story' },
        { status: 500 }
      );
    }
  }
}
