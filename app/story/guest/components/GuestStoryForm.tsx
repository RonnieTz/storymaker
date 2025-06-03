import Link from 'next/link';

interface GuestStoryFormProps {
  title: string;
  setTitle: (title: string) => void;
  initialPrompt: string;
  setInitialPrompt: (prompt: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string;
}

export function GuestStoryForm({
  title,
  setTitle,
  initialPrompt,
  setInitialPrompt,
  onSubmit,
  loading,
  error,
}: GuestStoryFormProps) {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create a Story as Guest
        </h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Guest Mode:</strong> Your story will not be saved. To
                save stories and access them later,
                <Link
                  href="/auth/signup"
                  className="underline hover:text-yellow-800 ml-1"
                >
                  create an account
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
        <p className="text-gray-600">
          Provide a title and initial prompt to get your story started. AI will
          generate the first 200-300 words and give you options to continue.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Story Title (Optional)
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            placeholder="Enter a title for your story..."
          />
        </div>

        <div>
          <label
            htmlFor="prompt"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Initial Story Prompt *
          </label>
          <textarea
            id="prompt"
            required
            value={initialPrompt}
            onChange={(e) => setInitialPrompt(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            placeholder="Describe the setting, characters, or situation you want your story to begin with..."
          />
          <p className="mt-2 text-sm text-gray-500">
            Be as detailed or as brief as you like. The AI will use this to
            create the opening of your story.
          </p>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || !initialPrompt.trim()}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Story...' : 'Create Story'}
          </button>
          <Link
            href="/"
            className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
