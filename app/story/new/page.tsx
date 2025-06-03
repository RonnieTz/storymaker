'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTypewriter } from '@/lib/hooks/useTypewriter';

export default function NewStory() {
  const { status } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [initialPrompt, setInitialPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const { displayedText } = useTypewriter({
    text: streamingContent,
    speed: 20, // Adjust speed as needed (lower = faster)
    isActive: isStreaming,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const saveStoryToDB = async (
    content: string,
    suggestions: string[],
    wordCount: number
  ) => {
    try {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          title: title || 'Untitled Story',
          initialPrompt,
          content,
          suggestions,
          wordCount,
          skipGeneration: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save story');
      }

      const data = await response.json();
      return data.storyId;
    } catch (error) {
      console.error('Error saving story:', error);
      throw error;
    }
  };

  const handleStreamingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIsStreaming(true);
    setStreamingContent('');
    setIsGeneratingSuggestions(false);
    setError('');
    setShowPreview(true);

    try {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          title: title || undefined,
          initialPrompt,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate story');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.error || data.type === 'error') {
                  throw new Error(data.error || 'Streaming error occurred');
                }

                // Handle streaming content updates
                if (data.type === 'content' && data.content) {
                  setStreamingContent(data.content);
                } else if (data.type === 'generating_suggestions') {
                  setIsGeneratingSuggestions(true);
                }

                // Handle final complete response
                if (
                  data.type === 'complete' ||
                  (data.content && data.suggestions && data.wordCount)
                ) {
                  // Save to database
                  const storyId = await saveStoryToDB(
                    data.content,
                    data.suggestions,
                    data.wordCount
                  );

                  // Navigate to the story page
                  router.push(`/story/${storyId}`);
                  return;
                }

                // Legacy support for old format
                if (data.content && !data.type) {
                  setStreamingContent(data.content);

                  // If we have the complete response with suggestions
                  if (data.suggestions && data.wordCount) {
                    // Save to database
                    const storyId = await saveStoryToDB(
                      data.content,
                      data.suggestions,
                      data.wordCount
                    );

                    // Navigate to the story page
                    router.push(`/story/${storyId}`);
                    return;
                  }
                }
              } catch (parseError) {
                console.warn('Failed to parse streaming data:', parseError);
              }
            }
          }
        }
      }

      throw new Error('Incomplete response received');
    } catch (error) {
      console.error('Story creation error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
      setIsStreaming(false);
      setStreamingContent('');
      setIsGeneratingSuggestions(false);
      setShowPreview(false);
    }
  };

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
              Create a New Story
            </h1>
            <p className="text-gray-600">
              Provide a title and initial prompt to get your story started. AI
              will generate the first 200-300 words and give you options to
              continue.
            </p>
          </div>

          {!showPreview ? (
            <form onSubmit={handleStreamingSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Story Title (Optional)
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  placeholder="Enter a title for your story..."
                />
              </div>

              <div>
                <label
                  htmlFor="prompt"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Initial Story Prompt *
                </label>
                <textarea
                  id="prompt"
                  required
                  value={initialPrompt}
                  onChange={(e) => setInitialPrompt(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  placeholder="Describe the setting, characters, or situation you want your story to begin with. For example: 'A detective finds a mysterious letter under their door at midnight' or 'In a world where magic is forbidden, a young girl discovers she has powerful abilities'"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Be as detailed or as brief as you like. The AI will use this
                  to create the opening of your story.
                </p>
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading || !initialPrompt.trim()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Story...' : 'Create Story'}
                </button>
                <Link
                  href="/dashboard"
                  className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium text-center"
                >
                  Cancel
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {title || 'Your Story'}
                </h2>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {displayedText}
                  </div>
                </div>
                {(isStreaming || isGeneratingSuggestions) && (
                  <div className="mt-4 text-sm text-gray-500">
                    ✨{' '}
                    {isGeneratingSuggestions
                      ? 'Generating story suggestions...'
                      : 'Generating your story...'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
