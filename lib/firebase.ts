/**
 * @file lib/firebase.ts
 * @description Firebase initialization and FCM token retrieval.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyCFczwPMeGoRoXz5nmZ_eZN22V4sTfpmWU",
  authDomain: "access-exclu.firebaseapp.com",
  projectId: "access-exclu",
  storageBucket: "access-exclu.firebasestorage.app",
  messagingSenderId: "206783805033",
  appId: "1:206783805033:web:855b8533e130dd570c54f8",
  measurementId: "G-J5XT62JBBS",
};

const RAW_VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'BMcSlBW2WMwTPNeJp8ixr6iafmob8SSDenxyGDALqBLjybbMtAFpd_9nMqgdwnaEM6bzJBnj-XUyyPTgszy5FK0';
const VAPID_KEY = RAW_VAPID_KEY.replace(/^"|"$/g, '');

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

export interface FCMTokenResult {
  token: string | null;
  reason?: string;
}

export async function getFCMToken(): Promise<FCMTokenResult> {
  if (typeof window === 'undefined') return { token: null, reason: 'SSR Environment' };

  const platform = getDevicePlatform();

  if (platform === 'ios' && !isIOSStandaloneApp()) {
    return { 
      token: null, 
      reason: "L'application n'est pas ouverte en mode PWA autonome (Ajoutez-la à l'écran d'accueil d'abord)." 
    };
  }

  if (typeof Notification === 'undefined') {
    return { token: null, reason: 'Notification API non-supportée par le navigateur.' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { token: null, reason: `Permission de notification refusée (${permission}).` };
    }

    const messaging = getFirebaseMessaging();
    if (!messaging) {
      return { token: null, reason: 'Impossible de charger Firebase Messaging (messaging instance null).' };
    }

    // Ensure the Firebase SW is registered first
    const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/firebase-cloud-messaging-push-scope',
    });

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (token) {
      console.log('[FCM] Token obtained:', token);
      return { token };
    } else {
      return { token: null, reason: 'Aucun token reçu de Firebase (token vide).' };
    }
  } catch (error: any) {
    console.error('[FCM] Error getting FCM token:', error);
    return { token: null, reason: `Erreur Firebase: ${error.message || error}` };
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
