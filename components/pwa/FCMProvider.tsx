'use client';

import { useEffect, useRef } from 'react';
import { initializeFCM, cleanupFCM } from '@/services/fcmService';
import { useToastStore } from '@/store/useToastStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationCountStore } from '@/store/useNotificationCountStore';

/**
 * FCMProvider — mounts once in layout.
 * - Registers the PWA service worker (sw.js)
 * - Initializes Firebase Cloud Messaging for authenticated users
 * - Sets up foreground FCM message listener for in-app toast notifications
 */
export function FCMProvider() {
  const { addToast } = useToastStore();
  const { isAuthenticated, _hasHydrated, user } = useAuthStore();
  const prevAuthRef = useRef<boolean | null>(null);

  // Register main PWA service worker once on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('[SW] Registered:', reg.scope))
      .catch((err) => console.error('[SW] Registration failed:', err));
  }, []);

  // Run iOS diagnostics on page mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userAgent = window.navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);

    if (isIOS) {
      const standalone = Boolean(
        window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone
      );

      if (!standalone) {
        addToast(
          "⚠️ Action requise: Pour recevoir des notifications sur iPhone, vous devez installer l'application sur l'écran d'accueil (Partager > Sur l'écran d'accueil) et l'ouvrir depuis l'icône installée.",
          'warning' as any
        );
      }
    }
  }, [addToast]);

  // Watch auth state — initialize FCM after login and cleanup on logout
  useEffect(() => {
    if (!_hasHydrated) return;

    const wasAuthenticated = prevAuthRef.current;
    prevAuthRef.current = isAuthenticated;

    if (isAuthenticated && user) {
      // Small delay to ensure auth_token is fully written to localStorage
      // before FCM tries to register the device with the backend
      const timer = setTimeout(() => {
        initializeFCM(user).catch((error) => {
          console.error('[FCMProvider] FCM initialization failed:', error);
        });
      }, 500);
      return () => clearTimeout(timer);
    } else if (!isAuthenticated && wasAuthenticated === true) {
      cleanupFCM();
    }
  }, [isAuthenticated, _hasHydrated, user]);


  // Connect to useNotificationCountStore to fetch & poll counts
  useEffect(() => {
    if (!isAuthenticated) return;
    const { fetchCounts } = useNotificationCountStore.getState();
    fetchCounts();

    const interval = setInterval(() => {
      fetchCounts();
    }, 30000);

    // Refresh counts when window comes into focus or when notification is clicked
    const handleFocus = () => {
      const currentUser = useAuthStore.getState().user;
      const roles = (currentUser?.roles || []).map((r: string) => String(r).toLowerCase());
      const isClient = !roles.some((r) => r === 'admin' || r === 'serveuse' || r === 'superadmin' || r === 'livreur' || r === 'delivery');

      if (isClient) {
        // For client: clear all notifications from phone notification tray, mark push read & clear badge
        useNotificationCountStore.getState().markAllNotificationsAsRead();
      } else {
        fetchCounts();
      }
    };

    // Listen for Service Worker notification click postMessage
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'FCM_NOTIFICATION_CLICKED') {
        const currentUser = useAuthStore.getState().user;
        const roles = (currentUser?.roles || []).map((r: string) => String(r).toLowerCase());
        const isClient = !roles.some((r) => r === 'admin' || r === 'serveuse' || r === 'superadmin' || r === 'livreur' || r === 'delivery');

        if (isClient) {
          useNotificationCountStore.getState().markAllNotificationsAsRead();
        } else {
          fetchCounts();
        }
      }
    };


    window.addEventListener('focus', handleFocus);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, [isAuthenticated]);

  return null;
}





