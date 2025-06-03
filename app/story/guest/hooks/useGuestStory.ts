import { useState } from 'react';

export interface GuestStory {
  _id: string;
  title: string;
  segments: Array<{
    content: string;
    wordCount: number;
    createdAt: Date;
    userPrompt: string;
  }>;
  currentSuggestions: string[];
  totalWordCount: number;
  createdAt: Date;
  updatedAt: Date;
  isGuest: boolean;
}

export function useGuestStory() {
  const [story, setStory] = useState<GuestStory | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [continuingStory, setContinuingStory] = useState(false);
  const [streamingSuggestions, setStreamingSuggestions] = useState<string[]>(
    []
  );

  const createStory = async (title: string, initialPrompt: string) => {
    setLoading(true);
    setIsStreaming(true);
    setStreamingContent('');
    setIsGeneratingSuggestions(false);
    setStreamingSuggestions([]);
    setError('');

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
          guestMode: true,
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
                } else if (data.type === 'suggestion' && data.suggestion) {
                  // Handle individual suggestion streaming
                  setStreamingSuggestions((prev) => {
                    const newSuggestions = [...prev];
                    newSuggestions[data.suggestionIndex] = data.suggestion;
                    return newSuggestions;
                  });
                }

                if (
                  data.type === 'complete' ||
                  (data.content && data.suggestions && data.wordCount)
                ) {
                  // Create guest story object
                  const guestStory: GuestStory = {
                    _id: 'guest-' + Date.now(),
                    title: title || 'Guest Story',
                    segments: [
                      {
                        content: data.content,
                        wordCount: data.wordCount,
                        createdAt: new Date(),
                        userPrompt: initialPrompt,
                      },
                    ],
                    currentSuggestions: data.suggestions,
                    totalWordCount: data.wordCount,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isGuest: true,
                  };

                  setStory(guestStory);
                  setSuggestions(data.suggestions);
                  setIsStreaming(false);
                  setIsGeneratingSuggestions(false);
                  setStreamingSuggestions([]);
                  return;
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
      setStreamingSuggestions([]);
    }
  };

  const continueStory = async (userChoice: string, isCustomInput: boolean) => {
    if (!story) return;

    setContinuingStory(true);
    setIsStreaming(true);
    setStreamingContent('');
    setIsGeneratingSuggestions(false);
    setStreamingSuggestions([]);
    setError('');

    try {
      const previousContent = story.segments
        .map((segment) => segment.content)
        .join('\n\n');

      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'continue',
          userChoice,
          isCustomInput,
          previousContent,
          stream: true,
          guestMode: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to continue story');
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
                } else if (data.type === 'suggestion' && data.suggestion) {
                  // Handle individual suggestion streaming
                  setStreamingSuggestions((prev) => {
                    const newSuggestions = [...prev];
                    newSuggestions[data.suggestionIndex] = data.suggestion;
                    return newSuggestions;
                  });
                }

                if (data.type === 'complete') {
                  // Add new segment to guest story
                  const newSegment = {
                    content: data.content,
                    wordCount: data.wordCount,
                    createdAt: new Date(),
                    userPrompt: userChoice,
                  };

                  const updatedStory: GuestStory = {
                    ...story,
                    segments: [...story.segments, newSegment],
                    currentSuggestions: data.suggestions,
                    totalWordCount: story.totalWordCount + data.wordCount,
                    updatedAt: new Date(),
                  };

                  setStory(updatedStory);
                  setSuggestions(data.suggestions);
                  setIsStreaming(false);
                  setIsGeneratingSuggestions(false);
                  setStreamingContent('');
                  setStreamingSuggestions([]);
                  return;
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
      console.error('Story continuation error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setContinuingStory(false);
      setIsStreaming(false);
      setStreamingContent('');
      setIsGeneratingSuggestions(false);
      setStreamingSuggestions([]);
    }
  };

  const resetStory = () => {
    setStory(null);
    setSuggestions([]);
    setStreamingContent('');
    setIsStreaming(false);
    setIsGeneratingSuggestions(false);
    setStreamingSuggestions([]);
    setError('');
  };

  return {
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
  };
}
