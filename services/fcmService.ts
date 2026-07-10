/**
 * @file services/fcmService.ts
 * @description Complete Firebase Cloud Messaging (FCM) Service for Next.js Frontend.
 * 
 * This module handles:
 * 1. FCM token initialization and request for notification permissions
 * 2. Automatic registration of FCM token with Django backend
 * 3. Foreground message handling (when user is on the site)
 * 4. Background message handling (via Service Worker in public/firebase-messaging-sw.js)
 * 5. Token refresh lifecycle management
 * 
 * Architecture:
 * - Browser-side only (checks typeof window)
 * - Uses existing `api` instance from services/api.ts for authentication
 * - Integrates with deviceService for backend registration
 * - Provides hooks and utilities for components to use notifications
 */

import {
  getMessaging,
  getToken,
  onMessage,
  Messaging,
  MessagePayload,
} from 'firebase/messaging';
import { firebaseApp } from '@/lib/firebase';
import { deviceService } from './deviceService';
import { useToastStore } from '@/store/useToastStore';
import type { User } from '@/types';

/**
 * FCM payload structure from Firebase
 */
export interface FCMPayload extends MessagePayload {
  notification?: {
    title?: string;
    body?: string;
    icon?: string;
    badge?: string;
    click_action?: string;
    tag?: string;
  };
  data?: Record<string, string>;
}

/**
 * Token cache to avoid re-registration
 */
let cachedFCMToken: string | null = null;
let foregroundUnsubscribe: (() => void) | null = null;

/**
 * VAPID Key for Firebase Cloud Messaging (public key)
 * This is the same key defined in lib/firebase.ts
 */
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ||
  'BIH086VT_ZEmPMDKIoJUfyaPmRQXF9sXGhGQpdQFHTK467Y4rKTm6TJHVNKZV1TPCLe8BCqNIRWVOXHqXLNd2r8';

/**
 * Local storage keys for FCM token management
 */
const FCM_TOKEN_STORAGE_KEY = 'fcm_token';
const FCM_TOKEN_TIMESTAMP_KEY = 'fcm_token_timestamp';

/**
 * Token refresh interval (7 days in milliseconds)
 * Firebase automatically refreshes tokens, but we re-register periodically
 */
const FCM_TOKEN_REFRESH_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Get the FCM messaging instance
 * Returns null if running server-side or if messaging is unavailable
 */
function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null;

  try {
    return getMessaging(firebaseApp);
  } catch (error) {
    console.error('[FCM Service] Failed to get messaging instance:', error);
    return null;
  }
}

/**
 * Check and restore cached FCM token from localStorage
 * Validates token age and refreshes if necessary
 */
function getCachedFCMToken(): string | null {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
  const timestamp = localStorage.getItem(FCM_TOKEN_TIMESTAMP_KEY);

  if (!token || !timestamp) return null;

  const tokenAge = Date.now() - parseInt(timestamp, 10);
  if (tokenAge > FCM_TOKEN_REFRESH_INTERVAL) {
    console.log('[FCM Service] Cached token is too old, will refresh');
    localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
    localStorage.removeItem(FCM_TOKEN_TIMESTAMP_KEY);
    return null;
  }

  console.log('[FCM Service] Using cached FCM token');
  return token;
}

/**
 * Store FCM token in localStorage with timestamp
 */
function cacheFCMToken(token: string): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
  localStorage.setItem(FCM_TOKEN_TIMESTAMP_KEY, String(Date.now()));
  console.log('[FCM Service] FCM token cached');
}

/**
 * Clear cached FCM token from localStorage
 */
function clearCachedFCMToken(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
  localStorage.removeItem(FCM_TOKEN_TIMESTAMP_KEY);
  cachedFCMToken = null;
  console.log('[FCM Service] Cached FCM token cleared');
}

/**
 * Request notification permission from the browser
 * Returns 'granted' if user allows, 'denied' if user blocks
 */
async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined') return 'denied';
  if (!('Notification' in window)) {
    console.warn('[FCM Service] Browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    console.log('[FCM Service] Notification permission already granted');
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    console.warn('[FCM Service] Notification permission is denied');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('[FCM Service] Notification permission result:', permission);
    return permission;
  } catch (error) {
    console.error('[FCM Service] Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Register the Firebase Service Worker
 * Required for receiving background notifications
 */
async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('[FCM Service] Service Worker not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js',
      {
        scope: '/',
      }
    );
    console.log('[FCM Service] Service Worker registered successfully');
    return registration;
  } catch (error) {
    console.error('[FCM Service] Failed to register Service Worker:', error);
    return null;
  }
}

/**
 * Initialize and retrieve FCM token
 * Steps:
 * 1. Request notification permission
 * 2. Register Service Worker
 * 3. Get FCM token from Firebase
 * 4. Register device with backend via deviceService
 */
export async function initializeFCM(user: User | null): Promise<string | null> {
  if (typeof window === 'undefined') {
    console.log('[FCM Service] Running server-side, skipping FCM initialization');
    return null;
  }

  // Prevent initialization if user is not authenticated
  if (!user) {
    console.log('[FCM Service] User not authenticated, skipping FCM initialization');
    return null;
  }

  // Check for cached token first
  const cachedToken = getCachedFCMToken();
  if (cachedToken) {
    return cachedToken;
  }

  try {
    // 1. Request notification permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('[FCM Service] Notification permission not granted');
      useToastStore.getState().addToast("Autorisation de notification refusée. Veuillez activer les notifications dans les paramètres de votre navigateur.", 'info');
      return null;
    }

    // 2. Register Service Worker for background notifications
    const swRegistration = await registerServiceWorker();
    if (!swRegistration) {
      console.warn('[FCM Service] Failed to register Service Worker');
      useToastStore.getState().addToast("Échec de l'activation des notifications push (erreur Service Worker).", 'error');
      return null;
    }

    // 3. Get the messaging instance
    const messaging = getFirebaseMessaging();
    if (!messaging) {
      console.error('[FCM Service] Failed to get Firebase messaging instance');
      useToastStore.getState().addToast("Échec de l'activation des notifications (Firebase non disponible).", 'error');
      return null;
    }

    // 4. Get the FCM token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (!token) {
      console.warn('[FCM Service] Failed to retrieve FCM token');
      useToastStore.getState().addToast("Aucun identifiant de notification reçu de Firebase.", 'error');
      return null;
    }

    console.log('[FCM Service] FCM token obtained successfully');
    cachedFCMToken = token;
    cacheFCMToken(token);

    // 5. Register device with backend
    try {
      await deviceService.registerDevice(token);
      useToastStore.getState().addToast("Notifications push configurées avec succès sur cet appareil !", 'success');
    } catch (error) {
      console.warn('[FCM Service] Failed to register device with backend:', error);
      useToastStore.getState().addToast("Notifications obtenues localement mais échec de la synchronisation avec le serveur.", 'info');
    }

    return token;
  } catch (error: any) {
    console.error('[FCM Service] Error during FCM initialization:', error);
    useToastStore.getState().addToast(`Erreur d'initialisation des notifications: ${error.message || error}`, 'error');
    return null;
  }
}

/**
 * Setup foreground message listener
 * Called when user is actively viewing the site
 * Allows custom toast notifications or UI updates
 * 
 * @param callback - Function to call when a foreground message is received
 * @returns Unsubscribe function to remove listener
 */
export function setupForegroundMessageListener(
  callback: (payload: FCMPayload) => void
): (() => void) | null {
  if (typeof window === 'undefined') return null;

  const messaging = getFirebaseMessaging();
  if (!messaging) {
    console.warn('[FCM Service] Cannot setup foreground listener - messaging not available');
    return null;
  }

  try {
    // Clear previous listener if exists
    if (foregroundUnsubscribe) {
      foregroundUnsubscribe();
    }

    foregroundUnsubscribe = onMessage(messaging, (payload) => {
      console.log('[FCM Service] Foreground message received:', payload);
      callback(payload);
    });

    console.log('[FCM Service] Foreground message listener setup');
    return foregroundUnsubscribe;
  } catch (error) {
    console.error('[FCM Service] Error setting up foreground listener:', error);
    return null;
  }
}

/**
 * Cleanup FCM resources
 * Called during logout or app cleanup
 */
export function cleanupFCM(): void {
  if (typeof window === 'undefined') return;

  if (foregroundUnsubscribe) {
    foregroundUnsubscribe();
    foregroundUnsubscribe = null;
    console.log('[FCM Service] Foreground listener removed');
  }

  clearCachedFCMToken();
}

/**
 * Get the current cached FCM token
 * Useful for manual device management if needed
 */
export function getCachedToken(): string | null {
  return cachedFCMToken || getCachedFCMToken();
}

/**
 * Format FCM notification payload for display
 * Extracts title, body, and icon from payload
 */
export function formatNotificationPayload(payload: FCMPayload) {
  return {
    title: payload.notification?.title || 'Nouvelle notification',
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/icons/icon-192x192.jpeg',
    tag: payload.notification?.tag || 'default',
    data: payload.data || {},
  };
}

/**
 * Handle notification click action
 * Navigates to specified URL or performs action based on data
 */
export function handleNotificationClick(payload: FCMPayload): void {
  const clickAction = payload.notification?.click_action;
  if (clickAction) {
    window.location.href = clickAction;
  } else if (payload.data?.url) {
    window.location.href = payload.data.url;
  } else {
    window.focus();
  }
}
