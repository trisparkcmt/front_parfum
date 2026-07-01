'use client';

import { useEffect, useRef } from 'react';
import { getFCMToken, onForegroundMessage } from '@/lib/firebase';
import { api } from '@/services/api';
import { useToastStore } from '@/store/useToastStore';
import { useAuthStore } from '@/store/useAuthStore';

const FCM_TOKEN_KEY = 'fcm_token';

/**
 * Registers the FCM token with the backend after login.
 * Safe to call multiple times — skips if the same token is already stored.
 */
export async function registerFCMDevice(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const token = await getFCMToken();
    if (!token) return;

    const stored = localStorage.getItem(FCM_TOKEN_KEY);
    if (stored === token) {
      // Token unchanged — no need to re-register
      return;
    }

    // Store token locally for unregistration on logout
    localStorage.setItem(FCM_TOKEN_KEY, token);

    await api.post('utilisateur/devices/register/', {
      registration_token: token,
      platform: 'web',
    });

    console.log('[FCM] Device registered successfully.');
  } catch (error) {
    // Non-blocking: don't crash the login flow on FCM errors
    console.error('[FCM] Failed to register device:', error);
  }
}

/**
 * Unregisters the FCM token with the backend on logout.
 */
export async function unregisterFCMDevice(): Promise<void> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem(FCM_TOKEN_KEY) : null;
    if (!token) return;

    await api.post('utilisateur/devices/unregister/', {
      registration_token: token,
    });

    if (typeof window !== 'undefined') {
      localStorage.removeItem(FCM_TOKEN_KEY);
    }

    console.log('[FCM] Device unregistered successfully.');
  } catch (error) {
    console.error('[FCM] Failed to unregister device:', error);
  }
}

/**
 * FCMProvider — mounts once in layout.
 * - Registers the PWA service worker (sw.js)
 * - Watches auth state and registers/unregisters the FCM device token automatically
 * - Sets up foreground FCM message listener for in-app toast notifications
 */
export function FCMProvider() {
  const { addToast } = useToastStore();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
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

  // Watch auth state — register token on login, unregister on logout
  useEffect(() => {
    if (!_hasHydrated) return;

    const wasAuthenticated = prevAuthRef.current;
    prevAuthRef.current = isAuthenticated;

    if (isAuthenticated && wasAuthenticated !== true) {
      // User just logged in (or page loaded while authenticated)
      registerFCMDevice().catch(console.error);
    } else if (!isAuthenticated && wasAuthenticated === true) {
      // User just logged out
      unregisterFCMDevice().catch(console.error);
    }
  }, [isAuthenticated, _hasHydrated]);

  // Set up foreground message handler
  useEffect(() => {
    if (typeof window === 'undefined') return;

    unsubscribeRef.current = onForegroundMessage((payload) => {
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
