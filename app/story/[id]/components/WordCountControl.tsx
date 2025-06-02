interface WordCountControlProps {
  maxWords: number;
  setMaxWords: (words: number) => void;
  continuing: boolean;
}

export function WordCountControl({
  maxWords,
  setMaxWords,
  continuing,
}: WordCountControlProps) {
  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Maximum words for next segment: {maxWords}
      </label>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-500">50</span>
        <input
          type="range"
          min="50"
          max="500"
          step="25"
          value={maxWords}
          onChange={(e) => setMaxWords(Number(e.target.value))}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          disabled={continuing}
        />
        <span className="text-sm text-gray-500">500</span>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        Adjust the length of the AI-generated continuation
      </div>
    </div>
  );
}
