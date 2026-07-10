'use client';

import { useEffect, useRef } from 'react';
import { initializeFCM, setupForegroundMessageListener, cleanupFCM } from '@/services/fcmService';
import { useToastStore } from '@/store/useToastStore';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * FCMProvider — mounts once in layout.
 * - Registers the PWA service worker (sw.js)
 * - Initializes Firebase Cloud Messaging for authenticated users
 * - Sets up foreground FCM message listener for in-app toast notifications
 */
export function FCMProvider() {
  const { addToast } = useToastStore();
  const { isAuthenticated, _hasHydrated, user } = useAuthStore();
  const unsubscribeRef = useRef<(() => void) | null>(null);
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

      const hasNotificationAPI = typeof Notification !== 'undefined';
      const permission = hasNotificationAPI ? Notification.permission : 'non-supporté';
      const hasSW = 'serviceWorker' in navigator;

      addToast(
        `Diagnostic iOS: Standalone=${standalone}, Permission=${permission}, SW=${hasSW}`,
        'info' as any
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

    if (isAuthenticated && wasAuthenticated !== true && user) {
      initializeFCM(user).catch((error) => {
        console.error('[FCMProvider] FCM initialization failed:', error);
        addToast('Erreur lors de l\'initialisation des notifications push.', 'error');
      });
    } else if (!isAuthenticated && wasAuthenticated === true) {
      cleanupFCM();
    }
  }, [isAuthenticated, _hasHydrated, user, addToast]);

  // Set up foreground message handler through the shared FCM service
  useEffect(() => {
    if (typeof window === 'undefined') return;

    unsubscribeRef.current = setupForegroundMessageListener((payload) => {
      const title = payload.notification?.title || 'Nouvelle notification';
      const body = payload.notification?.body || '';
      addToast(`🔔 ${title}${body ? ` — ${body}` : ''}`, 'info' as any);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [addToast]);

  return null;
}

