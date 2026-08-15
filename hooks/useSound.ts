'use client';

import { useCallback, useRef } from 'react';

export type SoundType = 'tap' | 'success' | 'error' | 'pour';

const SOUND_PATHS: Record<SoundType, string> = {
  tap: '/sounds/tap.mp3',
  success: '/sounds/success.mp3',
  error: '/sounds/error.mp3',
  pour: '/sounds/liquid-pouring.mp3',
};

export function useSound() {
  const audioCache = useRef<Record<string, HTMLAudioElement>>({});

  const playSound = useCallback((type: SoundType, volume = 0.5) => {
    if (typeof window === 'undefined') return;

    try {
      const path = SOUND_PATHS[type];

      // Cache audio objects to avoid re-creating them on every call
      if (!audioCache.current[path]) {
        audioCache.current[path] = new Audio(path);
      }

      const audio = audioCache.current[path];

      // Reset playhead so rapid calls always start from the beginning
      audio.currentTime = 0;
      audio.volume = volume;

      audio.play().catch((err) => {
        console.warn('Audio playback was blocked or failed:', err);
      });
    } catch (e) {
      console.error('Failed to play sound:', e);
    }
  }, []);

  const stopSound = useCallback((type: SoundType) => {
    if (typeof window === 'undefined') return;

    try {
      const path = SOUND_PATHS[type];
      const audio = audioCache.current[path];
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    } catch (e) {
      console.error('Failed to stop sound:', e);
    }
  }, []);

  return { playSound, stopSound };
}
