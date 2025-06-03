'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useStory } from './hooks/useStory';
import { useStoryContinuation } from './hooks/useStoryContinuation';
import { StoryContent } from './components/StoryContent';
import { StoryContinuationControls } from './components/StoryContinuationControls';

export default function StoryPage() {
  const params = useParams();
  const storyId = params.id as string;
  const [maxWords, setMaxWords] = useState(150);

  const { story, loading, error, setError, fetchStory, status } =
    useStory(storyId);

  const {
    continuing,
    streamingContent,
    isStreaming,
    isGeneratingSuggestions,
    continueStoryWithStreaming,
  } = useStoryContinuation({
    storyId,
    maxWords,
    showCustomInput: false, // This is now managed internally in StoryContinuationControls
    fetchStory,
    setError,
  });

  const handleContinueStory = (userChoice: string, isCustomInput: boolean) => {
    continueStoryWithStreaming(userChoice, isCustomInput);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  if (error && !story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/dashboard"
            className="text-indigo-600 hover:text-indigo-500"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!story) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="text-xl font-bold text-gray-900"
              >
                StoryMaker
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Story Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {story.title}
            </h1>
            <p className="text-gray-600">
              {story.totalWordCount} words • {story.segments.length} segments •
              Last updated: {new Date(story.updatedAt).toLocaleDateString()}
            </p>
          </div>

          {/* Story Content */}
          <StoryContent
            story={story}
            streamingContent={streamingContent}
            isStreaming={isStreaming}
          />

          {/* Continue Story Section */}
          {story.currentSuggestions && (
            <StoryContinuationControls
              suggestions={story.currentSuggestions}
              onContinueStory={handleContinueStory}
              continuing={continuing}
              isStreaming={isStreaming}
              error={error}
              maxWords={maxWords}
              setMaxWords={setMaxWords}
            />
          )}

          {/* Streaming Status */}
          {(isStreaming || isGeneratingSuggestions) && (
            <div className="bg-white shadow rounded-lg p-8">
              <div className="text-center">
                <div className="inline-flex items-center px-4 py-2 bg-indigo-50 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-3"></div>
                  <span className="text-indigo-700">
                    {isGeneratingSuggestions
                      ? 'Generating story suggestions...'
                      : 'AI is writing your story in real-time...'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
