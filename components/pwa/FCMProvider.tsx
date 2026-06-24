'use client';

import { useEffect, useRef } from 'react';
import { getFCMToken, onForegroundMessage } from '@/lib/firebase';
import { api } from '@/services/api';
import { useToastStore } from '@/store/useToastStore';

const FCM_TOKEN_KEY = 'fcm_token';

/**
 * Registers the FCM token with the backend after login.
 */
export async function registerFCMDevice(): Promise<void> {
  try {
    const token = await getFCMToken();
    if (!token) return;

    // Store token locally for unregistration on logout
    if (typeof window !== 'undefined') {
      localStorage.setItem(FCM_TOKEN_KEY, token);
    }

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
 * - Sets up foreground FCM message listener
 */
export function FCMProvider() {
  const { addToast } = useToastStore();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Register the main PWA service worker
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('[SW] Registered:', reg.scope))
      .catch((err) => console.error('[SW] Registration failed:', err));

    // Set up foreground message handler
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
