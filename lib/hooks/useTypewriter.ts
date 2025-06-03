import { useState, useEffect, useRef } from 'react';

interface UseTypewriterProps {
  text: string;
  speed?: number;
  isActive?: boolean;
}

export function useTypewriter({
  text,
  speed = 50, // Changed back to reasonable word-based speed
  isActive = true,
}: UseTypewriterProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentWordIndexRef = useRef(0);
  const previousTextRef = useRef('');

  useEffect(() => {
    if (!isActive || !text) {
      setDisplayedText(text);
      setIsTyping(false);
      return;
    }

    // Split text into words
    const words = text.split(' ');
    const previousWords = previousTextRef.current.split(' ');

    // If text is shorter than previous (unlikely in streaming but just in case)
    if (words.length < previousWords.length) {
      setDisplayedText(text);
      currentWordIndexRef.current = words.length;
      previousTextRef.current = text;
      setIsTyping(false);
      return;
    }

    // If text hasn't changed, don't restart animation
    if (text === previousTextRef.current) {
      return;
    }

    // If this is the first time or text got longer, animate from where we left off
    const startWordIndex = Math.min(
      currentWordIndexRef.current,
      previousWords.length
    );
    previousTextRef.current = text;

    if (startWordIndex >= words.length) {
      setDisplayedText(text);
      setIsTyping(false);
      return;
    }

    setIsTyping(true);

    const typeWords = () => {
      if (currentWordIndexRef.current < words.length) {
        const wordsToShow = words.slice(0, currentWordIndexRef.current + 1);
        setDisplayedText(wordsToShow.join(' '));
        currentWordIndexRef.current++;

        timeoutRef.current = setTimeout(typeWords, speed);
      } else {
        setIsTyping(false);
      }
    };

    // Start typing from current word position
    if (currentWordIndexRef.current < words.length) {
      timeoutRef.current = setTimeout(typeWords, speed);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { displayedText, isTyping };
}
