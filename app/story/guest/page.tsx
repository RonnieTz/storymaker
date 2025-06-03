'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGuestStory } from './hooks/useGuestStory';
import { GuestStoryForm } from './components/GuestStoryForm';
import { GuestStoryPreview } from './components/GuestStoryPreview';
import { GuestStoryContent } from './components/GuestStoryContent';
import { GuestStoryContinuationControls } from './components/GuestStoryContinuationControls';

export default function GuestStory() {
  const [title, setTitle] = useState('');
  const [initialPrompt, setInitialPrompt] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const {
    story,
    suggestions,
    streamingSuggestions,
    loading,
    error,
    isStreaming,
    isGeneratingSuggestions,
    streamingContent,
    continuingStory,
    createStory,
    continueStory,
    resetStory,
  } = useGuestStory();

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowPreview(true);
    await createStory(title, initialPrompt);
  };

  const handleContinueStory = async (
    userChoice: string,
    isCustomInput: boolean
  ) => {
    await continueStory(userChoice, isCustomInput);
  };

  const startNewStory = () => {
    resetStory();
    setTitle('');
    setInitialPrompt('');
    setShowPreview(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                StoryMaker
              </Link>
              <span className="ml-3 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                Guest Mode
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {!story ? (
            <>
              {!showPreview ? (
                <GuestStoryForm
                  title={title}
                  setTitle={setTitle}
                  initialPrompt={initialPrompt}
                  setInitialPrompt={setInitialPrompt}
                  onSubmit={handleFormSubmit}
                  loading={loading}
                  error={error}
                />
              ) : (
                <GuestStoryPreview
                  title={title}
                  streamingContent={streamingContent}
                  isStreaming={isStreaming}
                  isGeneratingSuggestions={isGeneratingSuggestions}
                />
              )}
            </>
          ) : (
            // Story view with continuation options
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {story.title}
                  </h1>
                  <p className="text-gray-600">
                    {story.totalWordCount} words • {story.segments.length}{' '}
                    segments
                  </p>
                </div>
                <button
                  onClick={startNewStory}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium"
                >
                  Start New Story
                </button>
              </div>

              {/* Story Content */}
              <GuestStoryContent
                story={story}
                streamingContent={streamingContent}
                isStreaming={isStreaming}
              />

              {/* Continue Story Section */}
              {((!continuingStory && suggestions.length > 0) ||
                streamingSuggestions.length > 0 ||
                isGeneratingSuggestions) &&
                !isStreaming && (
                  <GuestStoryContinuationControls
                    suggestions={
                      isGeneratingSuggestions || continuingStory
                        ? streamingSuggestions
                        : suggestions
                    }
                    onContinueStory={handleContinueStory}
                    continuing={continuingStory}
                    error={error}
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
          )}
        </div>
      </main>
    </div>
  );
}
