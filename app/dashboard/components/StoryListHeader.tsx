import Link from 'next/link';

export function StoryListHeader() {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Your Stories</h2>
      <Link
        href="/story/new"
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium"
      >
        Create New Story
      </Link>
    </div>
  );
}
