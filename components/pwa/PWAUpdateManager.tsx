'use client';

import { useEffect, useRef } from 'react';

const CHUNK_RELOAD_KEY = 'ae_pwa_chunk_reload_ts';
const CHUNK_RELOAD_COOLDOWN_MS = 15000; // 15 seconds cooldown to avoid reload loops

/**
 * PWAUpdateManager
 * 1. Checks for Service Worker updates when the app mounts and when returning to foreground.
 * 2. Seamlessly reloads when a new Service Worker takes control (controllerchange).
 * 3. Catches ChunkLoadError and dynamic import failures after new deployments and auto-reloads.
 */
export function PWAUpdateManager() {
  const refreshingRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // --- 1. Global ChunkLoadError & Dynamic Import Self-Healing Handler ---
    const isChunkError = (err: unknown): boolean => {
      if (!err) return false;
      const message =
        typeof err === 'string'
          ? err
          : (err as any)?.message || (err as any)?.reason?.message || '';
      return (
        /Loading chunk [\w-]+ failed/i.test(message) ||
        /Failed to fetch dynamically imported module/i.test(message) ||
        /ChunkLoadError/i.test(message) ||
        /Unexpected token '<'/i.test(message) // Caught when an HTML page was returned instead of JS chunk
      );
    };

    const handleChunkError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const errorObj = (event as any).error || (event as any).reason;
      if (isChunkError(errorObj)) {
        const now = Date.now();
        const lastReload = parseInt(sessionStorage.getItem(CHUNK_RELOAD_KEY) || '0', 10);

        if (now - lastReload > CHUNK_RELOAD_COOLDOWN_MS) {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
          console.warn('[PWA] Stale chunk or deploy mismatch detected. Auto-reloading app...');
          window.location.reload();
        }
      }
    };

    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleChunkError);

    // --- 2. Service Worker Registration & Update Lifecycle ---
    if ('serviceWorker' in navigator) {
      let swRegistration: ServiceWorkerRegistration | null = null;

      // Handle controller change (when a new SW activates)
      const handleControllerChange = () => {
        if (refreshingRef.current) return;
        refreshingRef.current = true;
        console.log('[PWA] Controller changed. Refreshing to load new version...');
        window.location.reload();
      };

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          swRegistration = registration;
          console.log('[PWA] Service Worker registered (scope:', registration.scope, ')');

          // Check if there is already a waiting worker
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }

          // Listen for new updates found
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New version installed and waiting, activating now...');
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          });
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });

      // Check for updates when coming back to foreground
      const checkForUpdates = () => {
        if (document.visibilityState === 'visible' && swRegistration) {
          swRegistration.update().catch((err) => {
            console.warn('[PWA] Failed to check for SW update:', err);
          });
        }
      };

      document.addEventListener('visibilitychange', checkForUpdates);
      window.addEventListener('focus', checkForUpdates);

      return () => {
        window.removeEventListener('error', handleChunkError);
        window.removeEventListener('unhandledrejection', handleChunkError);
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        document.removeEventListener('visibilitychange', checkForUpdates);
        window.removeEventListener('focus', checkForUpdates);
      };
    }

    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleChunkError);
    };
  }, []);

  return null;
}
