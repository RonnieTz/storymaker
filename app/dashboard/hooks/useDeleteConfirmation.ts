import { useState } from 'react';

interface DeleteConfirmState {
  isOpen: boolean;
  storyId: string;
  storyTitle: string;
}

export function useDeleteConfirmation() {
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    isOpen: false,
    storyId: '',
    storyTitle: '',
  });
  const [deleting, setDeleting] = useState(false);

  const openDeleteConfirm = (storyId: string, storyTitle: string) => {
    setDeleteConfirm({
      isOpen: true,
      storyId,
      storyTitle,
    });
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirm({ isOpen: false, storyId: '', storyTitle: '' });
  };

  return {
    deleteConfirm,
    deleting,
    setDeleting,
    openDeleteConfirm,
    closeDeleteConfirm,
  };
}
