import { useState, useEffect } from 'react';
import { Story } from '@/types';

export function useStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = async () => {
    try {
      const response = await fetch('/api/stories');
      if (response.ok) {
        const data = await response.json();
        setStories(data);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteStory = async (storyId: string) => {
    const response = await fetch(`/api/stories?id=${storyId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      setStories(stories.filter((story) => story._id?.toString() !== storyId));
      return true;
    } else {
      throw new Error('Failed to delete story');
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  return {
    stories,
    loading,
    fetchStories,
    deleteStory,
  };
}
