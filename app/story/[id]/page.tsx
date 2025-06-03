'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useStory } from './hooks/useStory';
import { useStoryContinuation } from './hooks/useStoryContinuation';
import { StoryContent } from './components/StoryContent';
import { StoryContinuationControls } from './components/StoryContinuationControls';

export default function StoryPage() {
  const { id } = useParams();
  const storyId = id as string;

  const {
    story,
    loading,
    error: storyError,
    fetchStory,
    status,
  } = useStory(storyId);
  const [error, setError] = useState('');
  const [maxWords, setMaxWords] = useState(150);

  const {
    continuing,
    streamingContent,
    isStreaming,
    isGeneratingSuggestions,
    streamingSuggestions,
    continueStoryWithStreaming,
  } = useStoryContinuation({
    storyId,
    maxWords,
    showCustomInput: false,
    fetchStory,
    setError,
  });

  useEffect(() => {
    if (storyError) {
      setError(storyError);
    }
  }, [storyError]);

  const handleContinueStory = (userChoice: string, isCustomInput: boolean) => {
    continueStoryWithStreaming(userChoice, isCustomInput);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your story...</p>
        </div>
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

  if (!story) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Story Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The story you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have access to it.
          </p>
          <Link
            href="/dashboard"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {story.title}
            </h1>
            <p className="text-gray-600">
              {story.totalWordCount} words • Created{' '}
              {new Date(story.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Story Content */}
          <StoryContent
            story={story}
            streamingContent={streamingContent}
            isStreaming={isStreaming}
          />

          {/* Continue Story Section */}
          {((!continuing && (story.currentSuggestions?.length ?? 0) > 0) ||
            streamingSuggestions.length > 0 ||
            isGeneratingSuggestions) && (
            <StoryContinuationControls
              suggestions={
                isGeneratingSuggestions || continuing
                  ? streamingSuggestions
                  : story.currentSuggestions || []
              }
              onContinueStory={handleContinueStory}
              continuing={continuing}
              isStreaming={isStreaming}
              error={error}
              maxWords={maxWords}
              setMaxWords={setMaxWords}
              isGeneratingSuggestions={isGeneratingSuggestions}
              streamingSuggestions={streamingSuggestions}
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
                      ? `Generating story suggestions... (${
                          streamingSuggestions.filter((s) => s).length
                        } ready)`
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
