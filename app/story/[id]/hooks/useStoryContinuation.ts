import { useState } from 'react';

interface UseStoryContinuationProps {
  storyId: string;
  maxWords: number;
  showCustomInput: boolean;
  fetchStory: () => Promise<void>;
  setError: (error: string) => void;
}

export function useStoryContinuation({
  storyId,
  maxWords,
  showCustomInput,
  fetchStory,
  setError,
}: UseStoryContinuationProps) {
  const [continuing, setContinuing] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  const saveStorySegment = async (
    content: string,
    suggestions: string[],
    userChoice: string
  ) => {
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
          content,
          suggestions,
          isCustomInput: showCustomInput,
          maxWords,
          skipGeneration: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save story segment');
      }
    } catch (error) {
      console.error('Error saving story segment:', error);
    }
  };

  const continueStoryWithStreaming = async (
    userChoice: string,
    isCustomInput: boolean
  ) => {
    setContinuing(true);
    setIsStreaming(true);
    setStreamingContent('');
    setIsGeneratingSuggestions(false);
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
          stream: true,
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

                if (data.type === 'error') {
                  throw new Error(data.error);
                }

                if (data.type === 'content') {
                  setStreamingContent(data.content);
                } else if (data.type === 'generating_suggestions') {
                  setIsGeneratingSuggestions(true);
                } else if (data.type === 'complete') {
                  await saveStorySegment(
                    data.content,
                    data.suggestions,
                    userChoice
                  );
                  // Keep streaming states active while fetching story data
                  await fetchStory();
                  // Only reset states after story data is successfully fetched
                  setContinuing(false);
                  setIsStreaming(false);
                  setStreamingContent('');
                  setIsGeneratingSuggestions(false);
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
      console.error('Streaming error:', error);
      setError('An error occurred. Please try again.');
      // Only reset states on error
      setContinuing(false);
      setIsStreaming(false);
      setStreamingContent('');
      setIsGeneratingSuggestions(false);
    }
    // Remove the finally block since we're now handling state reset in the success and error cases
  };

  return {
    continuing,
    streamingContent,
    isStreaming,
    isGeneratingSuggestions,
    continueStoryWithStreaming,
  };
}
