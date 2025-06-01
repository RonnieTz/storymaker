import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { generateInitialStory, continueStory } from '@/lib/openai';
import { authOptions } from '@/lib/auth';
import {
  Story,
  StorySegment,
  StoryCreationRequest,
  StoryContinuationRequest,
} from '@/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'create') {
      return await createNewStory(body, session.user.id);
    } else if (action === 'continue') {
      return await continueExistingStory(body, session.user.id);
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

async function createNewStory(data: StoryCreationRequest, userId: string) {
  const { initialPrompt, title } = data;

  if (!initialPrompt) {
    return NextResponse.json(
      { error: 'Initial prompt is required' },
      { status: 400 }
    );
  }

  const db = await getDatabase();

  // Generate the initial story using OpenAI
  const result = await generateInitialStory(initialPrompt);

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

  return NextResponse.json({
    storyId: insertResult.insertedId,
    content: result.content,
    suggestions: result.suggestions,
    wordCount: result.wordCount,
  });
}

async function continueExistingStory(
  data: StoryContinuationRequest,
  userId: string
) {
  const { storyId, userChoice, isCustomInput, maxWords } = data;

  if (!storyId || !userChoice) {
    return NextResponse.json(
      { error: 'Story ID and user choice are required' },
      { status: 400 }
    );
  }

  const db = await getDatabase();

  // Get the existing story
  const story = await db.collection<Story>('stories').findOne({
    _id: new ObjectId(storyId),
    userId: new ObjectId(userId),
  });

  if (!story) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }

  // Get the full story content so far
  const previousContent = story.segments
    .map((segment) => segment.content)
    .join('\n\n');

  // Generate the continuation using OpenAI with the specified word limit
  const result = await continueStory(
    previousContent,
    userChoice,
    isCustomInput,
    maxWords || 150 // Default to 150 words if not specified
  );

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

  return NextResponse.json({
    content: result.content,
    suggestions: result.suggestions,
    wordCount: result.wordCount,
    totalWordCount: story.totalWordCount + result.wordCount,
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('id');

    const db = await getDatabase();

    if (storyId) {
      // Get specific story
      const story = await db.collection<Story>('stories').findOne({
        _id: new ObjectId(storyId),
        userId: new ObjectId(session.user.id),
      });

      if (!story) {
        return NextResponse.json({ error: 'Story not found' }, { status: 404 });
      }

      return NextResponse.json(story);
    } else {
      // Get all user stories
      const stories = await db
        .collection<Story>('stories')
        .find({ userId: new ObjectId(session.user.id) })
        .sort({ updatedAt: -1 })
        .toArray();

      return NextResponse.json(stories);
    }
  } catch (error) {
    console.error('Get stories error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const db = await getDatabase();

    // Delete the story, ensuring it belongs to the authenticated user
    const deleteResult = await db.collection<Story>('stories').deleteOne({
      _id: new ObjectId(storyId),
      userId: new ObjectId(session.user.id),
    });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Story not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Delete story error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
