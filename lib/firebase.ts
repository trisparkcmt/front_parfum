/**
 * @file lib/firebase.ts
 * @description Firebase initialization and FCM token retrieval.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBKzplWfKfPTdAHVJu6i-wYsOQNhfvzP8g",
  authDomain: "push-accessoire-exclusif.firebaseapp.com",
  projectId: "push-accessoire-exclusif",
  storageBucket: "push-accessoire-exclusif.firebasestorage.app",
  messagingSenderId: "712882537616",
  appId: "1:712882537616:web:ff2b3fb7f68d598e188415",
};

const VAPID_KEY = "F0KwqkUGUbWZxo-vWoyYJzB073iJlXFZrdfCEs4UeQk";

export type DevicePlatform = 'web' | 'ios' | 'android';

export function getDevicePlatform(): DevicePlatform {
  if (typeof window === 'undefined') return 'web';

  const userAgent = window.navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(userAgent)) return 'ios';
  if (/Android/i.test(userAgent)) return 'android';
  return 'web';
}

export function isIOSStandaloneApp(): boolean {
  if (typeof window === 'undefined') return false;

  const standaloneNavigator = window.navigator as Navigator & { standalone?: boolean };
  return Boolean(
    window.matchMedia('(display-mode: standalone)').matches || standaloneNavigator.standalone
  );
}

// Initialize Firebase App (singleton)
const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

/**
 * Returns the FCM messaging instance. Only works in the browser.
 */
export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null;
  try {
    return getMessaging(firebaseApp);
  } catch (e) {
    console.error('[Firebase] Failed to get messaging instance:', e);
    return null;
  }
}

/**
 * Requests notification permission and retrieves the FCM registration token.
 * Returns null if permission is denied or an error occurs.
 */
export async function getFCMToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const platform = getDevicePlatform();

  if (platform === 'ios' && !isIOSStandaloneApp()) {
    console.warn('[FCM] iPhone notifications require the app to be installed to the Home Screen and opened from there.');
    return null;
  }

  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    console.warn('[FCM] Notifications are not supported in this environment.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission denied.');
      return null;
    }

    const messaging = getFirebaseMessaging();
    if (!messaging) return null;

    // Ensure the Firebase SW is registered first
    const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (token) {
      console.log('[FCM] Token obtained:', token);
      return token;
    } else {
      console.warn('[FCM] No registration token available.');
      return null;
    }
  } catch (error) {
    console.error('[FCM] Error getting FCM token:', error);
    return null;
  }
}

/**
 * Sets up a foreground message listener.
 * Call this once after the user is authenticated.
 */
export function onForegroundMessage(callback: (payload: any) => void): (() => void) | null {
  const messaging = getFirebaseMessaging();
  if (!messaging) return null;

  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('[FCM] Foreground message received:', payload);
    callback(payload);
  });

  return unsubscribe;
}

export { firebaseApp };
