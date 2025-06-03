interface SuggestionButtonsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  continuing: boolean;
  isGeneratingSuggestions?: boolean;
  streamingSuggestions?: string[];
}

export function SuggestionButtons({
  suggestions,
  onSuggestionClick,
  continuing,
  isGeneratingSuggestions = false,
  streamingSuggestions = [],
}: SuggestionButtonsProps) {
  // Use streaming suggestions when they're being generated, otherwise use final suggestions
  const displaySuggestions = isGeneratingSuggestions
    ? streamingSuggestions
    : suggestions;

  return (
    <div className="space-y-3 mb-6">
      {displaySuggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => suggestion && onSuggestionClick(suggestion)}
          disabled={continuing || !suggestion}
          className={`w-full text-left p-4 border rounded-lg transition-all duration-300 disabled:cursor-not-allowed ${
            suggestion
              ? 'border-gray-200 hover:bg-gray-50 hover:border-indigo-300 opacity-100'
              : 'border-gray-100 bg-gray-50 opacity-60 animate-pulse'
          }`}
        >
          <span className="text-gray-700">
            {suggestion ||
              (isGeneratingSuggestions ? 'Generating suggestion...' : '')}
          </span>
        </button>
      ))}

      {/* Show placeholder buttons for expected suggestions while streaming */}
      {isGeneratingSuggestions &&
        displaySuggestions.length < 5 &&
        Array.from({ length: 5 - displaySuggestions.length }).map(
          (_, index) => (
            <button
              key={`placeholder-${index}`}
              disabled
              className="w-full text-left p-4 border border-gray-100 bg-gray-50 rounded-lg opacity-60 animate-pulse cursor-not-allowed"
            >
              <span className="text-gray-500">Generating suggestion...</span>
            </button>
          )
        )}
    </div>
  );
}
