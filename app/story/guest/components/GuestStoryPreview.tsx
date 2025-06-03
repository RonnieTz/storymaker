import { useTypewriter } from '@/lib/hooks/useTypewriter';

interface GuestStoryPreviewProps {
  title: string;
  streamingContent: string;
  isStreaming: boolean;
  isGeneratingSuggestions: boolean;
}

export function GuestStoryPreview({
  title,
  streamingContent,
  isStreaming,
  isGeneratingSuggestions,
}: GuestStoryPreviewProps) {
  const { displayedText } = useTypewriter({
    text: streamingContent,
    speed: 20,
    isActive: isStreaming,
  });

  return (
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
  );
}
