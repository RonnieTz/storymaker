import Link from 'next/link';
import { Story } from '@/types';

interface StoryCardProps {
  story: Story;
  onDeleteClick: (storyId: string, storyTitle: string) => void;
}

export function StoryCard({ story, onDeleteClick }: StoryCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-medium text-gray-900 flex-1">
            {story.title}
          </h3>
          <button
            onClick={() =>
              onDeleteClick(story._id?.toString() || '', story.title)
            }
            className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete story"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {story.totalWordCount} words • {story.segments.length} segments
        </p>
        <p className="text-gray-600 text-sm mb-4">
          {story.segments[0]?.content.substring(0, 150)}...
        </p>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">
            {new Date(story.updatedAt).toLocaleDateString()}
          </span>
          <Link
            href={`/story/${story._id}`}
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Continue →
          </Link>
        </div>
      </div>
    </div>
  );
}
