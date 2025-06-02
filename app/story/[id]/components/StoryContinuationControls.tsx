import { useState } from 'react';
import { WordCountControl } from './WordCountControl';
import { SuggestionButtons } from './SuggestionButtons';
import { CustomInputForm } from './CustomInputForm';

interface StoryContinuationControlsProps {
  suggestions: string[];
  onContinueStory: (userChoice: string, isCustomInput: boolean) => void;
  continuing: boolean;
  isStreaming: boolean;
  error: string;
  maxWords: number;
  setMaxWords: (words: number) => void;
}

export function StoryContinuationControls({
  suggestions,
  onContinueStory,
  continuing,
  isStreaming,
  error,
  maxWords,
  setMaxWords,
}: StoryContinuationControlsProps) {
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

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
    <div className="bg-white shadow rounded-lg p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        How should the story continue?
      </h2>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <WordCountControl
        maxWords={maxWords}
        setMaxWords={setMaxWords}
        continuing={continuing}
      />

      <SuggestionButtons
        suggestions={suggestions}
        onSuggestionClick={handleSuggestionClick}
        continuing={continuing}
      />

      {!showCustomInput ? (
        <button
          onClick={() => setShowCustomInput(true)}
          disabled={continuing}
          className="text-indigo-600 hover:text-indigo-500 font-medium disabled:opacity-50"
        >
          Or write your own direction →
        </button>
      ) : (
        <CustomInputForm
          customInput={customInput}
          setCustomInput={setCustomInput}
          onSubmit={handleCustomSubmit}
          onCancel={handleCancel}
          continuing={continuing}
        />
      )}

      {continuing && !isStreaming && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-indigo-50 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-3"></div>
            <span className="text-indigo-700">
              AI is writing the next part of your story...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
