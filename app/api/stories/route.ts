import { NextRequest } from 'next/server';
import { StoryRequestHandlers } from '@/lib/handlers/story-request-handlers';

const requestHandlers = new StoryRequestHandlers();

export async function POST(request: NextRequest) {
  return await requestHandlers.handlePost(request);
}

export async function GET(request: NextRequest) {
  return await requestHandlers.handleGet(request);
}

export async function DELETE(request: NextRequest) {
  return await requestHandlers.handleDelete(request);
}

// Set the runtime to edge for better performance and longer timeouts
export const runtime = 'nodejs';
export const maxDuration = 60;
