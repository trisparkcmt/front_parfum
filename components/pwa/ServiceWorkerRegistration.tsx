'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker on mount.
 * This is a client component that should be rendered once in the layout.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration.scope);
          
          // Request notification permission if default
          if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then((permission) => {
              console.log('Notification permission status:', permission);
            });
          }
        })
        .catch((error) => {
          console.error('SW registration failed:', error);
        });
    }
  }, []);

  return null;
}
