import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
}

export interface StorySegment {
  content: string;
  wordCount: number;
  createdAt: Date;
  userPrompt?: string;
}

export interface Story {
  _id?: ObjectId;
  title: string;
  userId: ObjectId;
  segments: StorySegment[];
  currentSuggestions?: string[];
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
  totalWordCount: number;
}

export interface StoryCreationRequest {
  initialPrompt: string;
  title?: string;
  stream?: boolean;
}

export interface StoryContinuationRequest {
  storyId: string;
  userChoice: string;
  isCustomInput: boolean;
  maxWords?: number;
  stream?: boolean;
  content?: string;
  suggestions?: string[];
  skipGeneration?: boolean;
}
