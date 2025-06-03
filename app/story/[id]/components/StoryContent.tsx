import { Story } from '@/types';
import { useTypewriter } from '@/lib/hooks/useTypewriter';

interface StoryContentProps {
  story: Story;
  streamingContent: string;
  isStreaming: boolean;
}

export function StoryContent({
  story,
  streamingContent,
  isStreaming,
}: StoryContentProps) {
  const { displayedText, isTyping } = useTypewriter({
    text: streamingContent,
    speed: 20, // Adjust speed as needed (lower = faster)
    isActive: isStreaming,
  });

  return (
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

        {/* Streaming Content */}
        {isStreaming && streamingContent && (
          <div className="mb-6">
            <hr className="my-6 border-gray-200" />
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap relative">
              {displayedText}
              {(isStreaming || isTyping) && (
                <span className="inline-block w-1 h-4 bg-gray-400 opacity-60 animate-pulse ml-1"></span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
