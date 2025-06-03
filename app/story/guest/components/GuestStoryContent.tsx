import { useTypewriter } from '@/lib/hooks/useTypewriter';
import { GuestStory } from '../hooks/useGuestStory';

interface GuestStoryContentProps {
  story: GuestStory;
  streamingContent: string;
  isStreaming: boolean;
}

export function GuestStoryContent({
  story,
  streamingContent,
  isStreaming,
}: GuestStoryContentProps) {
  const { displayedText } = useTypewriter({
    text: streamingContent,
    speed: 20,
    isActive: isStreaming,
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="prose max-w-none">
        {story.segments.map((segment, index: number) => (
          <div key={index} className="mb-6">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {segment.content}
            </div>
            {index < story.segments.length - 1 && (
              <hr className="my-6 border-gray-200" />
            )}
          </div>
        ))}

        {/* Streaming content */}
        {isStreaming && (
          <div className="mb-6">
            <hr className="my-6 border-gray-200" />
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {displayedText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
