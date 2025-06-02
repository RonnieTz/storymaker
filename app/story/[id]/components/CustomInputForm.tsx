interface CustomInputFormProps {
  customInput: string;
  setCustomInput: (input: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  continuing: boolean;
}

export function CustomInputForm({
  customInput,
  setCustomInput,
  onSubmit,
  onCancel,
  continuing,
}: CustomInputFormProps) {
  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-medium text-gray-900 mb-3">
        Your custom direction:
      </h3>
      <form onSubmit={onSubmit}>
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
            onClick={onCancel}
            disabled={continuing}
            className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
