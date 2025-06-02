import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Story } from '@/types';

export function useStory(storyId: string) {
  const { status } = useSession();
  const router = useRouter();

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStory = useCallback(async () => {
    try {
      const response = await fetch(`/api/stories?id=${storyId}`);
      if (response.ok) {
        const data = await response.json();
        setStory(data);
      } else {
        setError('Story not found');
      }
    } catch {
      setError('Failed to load story');
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && storyId) {
      fetchStory();
    }
  }, [status, storyId, router, fetchStory]);

  return {
    story,
    loading,
    error,
    setError,
    fetchStory,
    status,
  };
}
