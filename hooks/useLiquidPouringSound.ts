'use client';

/**
 * @file hooks/useLiquidPouringSound.ts
 * @description Sound manager hook for liquid pouring audio in Numba Atelier.
 *
 * Features:
 * - Uses Web Audio API (AudioContext) so playing sound DOES NOT interrupt background music
 *   from other mobile apps (Spotify, Apple Music, TikTok, etc.).
 * - `playPouringForMl(amountInMl)`: Plays liquid pouring sound for 0.178s per ML poured.
 * - `startDragPouring()` & `stopDragPouring()`: Plays continuously while dragging the gauge/slider
 *   and stops immediately when gauge level reaches target / drag ends.
 * - Smooth 60ms gain fade-out to prevent clicks or popping sounds when stopping.
 */

import { useCallback, useEffect, useRef } from 'react';

// Exact rate requested: 0.178 seconds per ML poured
const SECONDS_PER_ML = 0.178;
const SOUND_PATH = '/sounds/liquid-pouring.mp3';

let globalAudioCtx: AudioContext | null = null;
let globalBuffer: AudioBuffer | null = null;
let isFetchingBuffer = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!globalAudioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      globalAudioCtx = new AudioCtxClass();
    }
  }
  if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx;
}

async function preloadSoundBuffer() {
  if (globalBuffer || isFetchingBuffer || typeof window === 'undefined') return;

  try {
    isFetchingBuffer = true;
    const response = await fetch(SOUND_PATH);
    if (!response.ok) return;
    const arrayBuffer = await response.arrayBuffer();
    const ctx = getAudioContext();
    if (ctx) {
      globalBuffer = await ctx.decodeAudioData(arrayBuffer);
    }
  } catch (e) {
    console.warn('Failed to pre-decode liquid pouring sound buffer:', e);
  } finally {
    isFetchingBuffer = false;
  }
}

export function useLiquidPouringSound() {
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const stopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  useEffect(() => {
    preloadSoundBuffer();
  }, []);

  const resumeContext = useCallback(() => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }, []);

  const startPlaying = useCallback(() => {
    resumeContext();

    // Check user preference for sound
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem('app-sounds-enabled') === 'false') {
        return;
      }
    } catch {}

    const ctx = getAudioContext();
    const buffer = globalBuffer;

    if (ctx && buffer) {
      // If already playing via Web Audio API, keep current source running
      if (currentSourceRef.current) return;

      try {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true; // Loop if pouring for a long duration or dragging gauge

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.7, ctx.currentTime);

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        source.start(0);
        currentSourceRef.current = source;
        gainNodeRef.current = gainNode;
      } catch (err) {
        console.warn('WebAudio playback error:', err);
      }
    } else {
      // Fallback HTML5 audio element if Web Audio API is unavailable
      if (!fallbackAudioRef.current && typeof window !== 'undefined') {
        fallbackAudioRef.current = new Audio(SOUND_PATH);
        fallbackAudioRef.current.loop = true;
        fallbackAudioRef.current.volume = 0.7;
      }
      if (fallbackAudioRef.current) {
        fallbackAudioRef.current.play().catch(() => {});
      }
    }
  }, [resumeContext]);

  const stopPlaying = useCallback(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }

    const ctx = getAudioContext();
    const gainNode = gainNodeRef.current;
    const source = currentSourceRef.current;

    if (ctx && gainNode && source) {
      try {
        const now = ctx.currentTime;
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.06); // Smooth 60ms fade-out

        setTimeout(() => {
          try {
            source.stop();
            source.disconnect();
          } catch {}
          if (currentSourceRef.current === source) {
            currentSourceRef.current = null;
            gainNodeRef.current = null;
          }
        }, 70);
      } catch {
        try { source.stop(); } catch {}
        currentSourceRef.current = null;
        gainNodeRef.current = null;
      }
    } else if (fallbackAudioRef.current) {
      fallbackAudioRef.current.pause();
      fallbackAudioRef.current.currentTime = 0;
    }
  }, []);

  /**
   * Play pouring sound synchronously based on amount in ML poured.
   * Playback duration = amountInMl * 0.178 seconds.
   */
  const playPouringForMl = useCallback((amountInMl: number) => {
    if (amountInMl <= 0) return;

    const durationMs = amountInMl * SECONDS_PER_ML * 1000;

    startPlaying();

    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
    }

    stopTimerRef.current = setTimeout(() => {
      if (!isDraggingRef.current) {
        stopPlaying();
      }
    }, durationMs);
  }, [startPlaying, stopPlaying]);

  /**
   * Call when user starts dragging the gauge / slider.
   * Sound plays continuously as long as gauge SVG level is moving.
   */
  const startDragPouring = useCallback(() => {
    isDraggingRef.current = true;
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    startPlaying();
  }, [startPlaying]);

  /**
   * Call when user stops dragging the gauge / slider or SVG level stops.
   */
  const stopDragPouring = useCallback(() => {
    isDraggingRef.current = false;
    stopPlaying();
  }, [stopPlaying]);

  return {
    playPouringForMl,
    startDragPouring,
    stopDragPouring,
    resumeContext,
  };
}
