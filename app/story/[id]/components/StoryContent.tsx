import { Story } from '@/types';

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
              {streamingContent}
              <span className="inline-block w-2 h-5 bg-indigo-600 animate-pulse ml-1"></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
