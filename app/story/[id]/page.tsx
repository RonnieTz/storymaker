'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Story } from '@/types';

export default function StoryPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const storyId = params.id as string;

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [continuing, setContinuing] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [error, setError] = useState('');
  const [maxWords, setMaxWords] = useState(150);

  const fetchStory = useCallback(async () => {
    try {
      const response = await fetch(`/api/stories?id=${storyId}`);
      if (response.ok) {
        const data = await response.json();
        setStory(data);
      } else {
        setError('Story not found');
      }
    } catch {
      setError('Failed to load story');
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && storyId) {
      fetchStory();
    }
  }, [status, storyId, router, fetchStory]);

  const continueStory = async (userChoice: string, isCustomInput: boolean) => {
    setContinuing(true);
    setError('');

    try {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'continue',
          storyId,
          userChoice,
          isCustomInput,
          maxWords,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh the story to get the updated content
        await fetchStory();
        setCustomInput('');
        setShowCustomInput(false);
      } else {
        setError(data.error || 'Failed to continue story');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setContinuing(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    continueStory(suggestion, false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      continueStory(customInput.trim(), true);
    }
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
          <div className="bg-white shadow rounded-lg p-8 mb-8">
            <div className="prose max-w-none">
              {story.segments.map((segment, index) => (
                <div key={index} className="mb-6">
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {segment.content}
                  </div>
                  {index < story.segments.length - 1 && (
                    <hr className="my-6 border-gray-200" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Continue Story Section */}
          {story.currentSuggestions && story.currentSuggestions.length > 0 && (
            <div className="bg-white shadow rounded-lg p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                How should the story continue?
              </h2>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md mb-4">
                  {error}
                </div>
              )}

              {/* Word Count Control */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum words for next segment: {maxWords}
                </label>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">50</span>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="25"
                    value={maxWords}
                    onChange={(e) => setMaxWords(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    disabled={continuing}
                  />
                  <span className="text-sm text-gray-500">500</span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Adjust the length of the AI-generated continuation
                </div>
              </div>

              {/* AI Suggestions */}
              <div className="space-y-3 mb-6">
                {story.currentSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={continuing}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-gray-700">{suggestion}</span>
                  </button>
                ))}
              </div>

              {/* Custom Input Option */}
              {!showCustomInput ? (
                <button
                  onClick={() => setShowCustomInput(true)}
                  disabled={continuing}
                  className="text-indigo-600 hover:text-indigo-500 font-medium disabled:opacity-50"
                >
                  Or write your own direction →
                </button>
              ) : (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Your custom direction:
                  </h3>
                  <form onSubmit={handleCustomSubmit}>
                    <textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Describe how you want the story to continue..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-4"
                      required
                    />
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={continuing || !customInput.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50"
                      >
                        {continuing ? 'Continuing...' : 'Continue Story'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomInput(false);
                          setCustomInput('');
                        }}
                        disabled={continuing}
                        className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md font-medium hover:bg-gray-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {continuing && (
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center px-4 py-2 bg-indigo-50 rounded-lg">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-3"></div>
                    <span className="text-indigo-700">
                      AI is writing the next part of your story...
                    </span>
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
