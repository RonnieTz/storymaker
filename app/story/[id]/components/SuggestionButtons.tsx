interface SuggestionButtonsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  continuing: boolean;
}

export function SuggestionButtons({
  suggestions,
  onSuggestionClick,
  continuing,
}: SuggestionButtonsProps) {
  return (
    <div className="space-y-3 mb-6">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSuggestionClick(suggestion)}
          disabled={continuing}
          className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-gray-700">{suggestion}</span>
        </button>
      ))}
    </div>
  );
}
