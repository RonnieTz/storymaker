import { useState } from 'react';

interface GuestStoryContinuationControlsProps {
  suggestions: string[];
  onContinueStory: (userChoice: string, isCustomInput: boolean) => void;
  continuing: boolean;
  isStreaming: boolean;
  error: string;
}

export function GuestStoryContinuationControls({
  suggestions,
  onContinueStory,
  continuing,
  isStreaming,
  error,
}: GuestStoryContinuationControlsProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const handleSuggestionClick = (suggestion: string) => {
    onContinueStory(suggestion, false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      onContinueStory(customInput.trim(), true);
      setCustomInput('');
      setShowCustomInput(false);
    }
  };

  const handleCancel = () => {
    setShowCustomInput(false);
    setCustomInput('');
  };

  if (suggestions.length === 0 || isStreaming) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        How should the story continue?
      </h3>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="space-y-3 mb-6">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            disabled={continuing}
            className="w-full text-left p-4 border border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-gray-900">{suggestion}</span>
          </button>
        ))}
      </div>

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
          <h4 className="text-lg font-medium text-gray-900 mb-3">
            Your custom direction:
          </h4>
          <form onSubmit={handleCustomSubmit}>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Describe how you want the story to continue..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-4 text-gray-900"
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
                onClick={handleCancel}
                disabled={continuing}
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
