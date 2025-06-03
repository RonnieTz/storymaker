import Link from 'next/link';

export function EmptyStoryList() {
  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-medium text-gray-900 mb-2">No stories yet</h3>
      <p className="text-gray-500 mb-4">
        Start your creative journey by creating your first story!
      </p>
      <Link
        href="/story/new"
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium"
      >
        Create Your First Story
      </Link>
    </div>
  );
}
