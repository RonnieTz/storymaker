'use client';

import { useAuthGuard } from '@/lib/hooks/useAuthGuard';
import { useStories } from './hooks/useStories';
import { useDeleteConfirmation } from './hooks/useDeleteConfirmation';
import { DashboardHeader } from './components/DashboardHeader';
import { StoryListHeader } from './components/StoryListHeader';
import { EmptyStoryList } from './components/EmptyStoryList';
import { StoryCard } from './components/StoryCard';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useAuthGuard();
  const { stories, loading: storiesLoading, deleteStory } = useStories();
  const {
    deleteConfirm,
    deleting,
    setDeleting,
    openDeleteConfirm,
    closeDeleteConfirm,
  } = useDeleteConfirmation();

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.storyId) return;

    setDeleting(true);
    try {
      await deleteStory(deleteConfirm.storyId);
      closeDeleteConfirm();
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('An error occurred while deleting the story.');
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading || storiesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <StoryListHeader />

          {stories.length === 0 ? (
            <EmptyStoryList />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {stories.map((story) => (
                <StoryCard
                  key={story._id?.toString()}
                  story={story}
                  onDeleteClick={openDeleteConfirm}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <DeleteConfirmationModal
        isOpen={deleteConfirm.isOpen}
        storyTitle={deleteConfirm.storyTitle}
        deleting={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={closeDeleteConfirm}
      />
    </div>
  );
}
