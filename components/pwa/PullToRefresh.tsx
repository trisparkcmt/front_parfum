'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

export function PullToRefresh({
  enabled = true,
  onRefresh,
  threshold = 120,
}: {
  enabled?: boolean;
  onRefresh?: () => void | Promise<void>;
  threshold?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const startYRef = useRef<number | null>(null);
  const pullDistanceRef = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const container = document.body;
    if (!container) return;

    const resetPull = () => {
      startYRef.current = null;
      pullDistanceRef.current = 0;
      setPullDistance(0);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (window.scrollY > 0 || isRefreshing) return;
      const touch = event.touches[0];
      startYRef.current = touch.clientY;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (startYRef.current === null || window.scrollY > 0 || isRefreshing) return;

      const touch = event.touches[0];
      const delta = touch.clientY - startYRef.current;

      if (delta > 0) {
        const next = Math.min(delta * 0.65, threshold * 1.5);
        pullDistanceRef.current = next;
        setPullDistance(next);
      }
    };

    const onTouchEnd = async () => {
      if (isRefreshing) {
        resetPull();
        return;
      }

      if (pullDistanceRef.current >= threshold) {
        setIsRefreshing(true);
        try {
          if (onRefresh) await onRefresh();
        } finally {
          setIsRefreshing(false);
          resetPull();
        }
        return;
      }

      resetPull();
    };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('touchcancel', resetPull, { passive: true });

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', resetPull);
    };
  }, [enabled, threshold, isRefreshing, onRefresh]);

  if (!enabled) return null;

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      ref={containerRef}
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[220] flex justify-center"
      style={{ transform: `translateY(${Math.max(0, pullDistance - 24)}px)`, opacity: pullDistance > 0 ? 1 : 0, transition: 'transform 120ms ease-out, opacity 120ms ease-out' }}
    >
      <div className="mt-3 flex items-center gap-2 rounded-full border border-gold/30 bg-[#111111]/90 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-gold shadow-lg backdrop-blur-sm">
        <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} style={{ transform: `rotate(${progress * 180}deg)` }} />
        <span>{isRefreshing ? 'Refreshing...' : pullDistance >= threshold ? 'Release to refresh' : 'Pull to refresh'}</span>
      </div>
    </div>
  );
}
