import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firebaseApp } from '@/lib/firebase';
import { api } from '@/services/api';
import { useToastStore } from '@/store/useToastStore';

// Use VAPID key in original URL-safe base64 format as provided by Firebase
const VAPID_KEY = 'BIH086VT_ZEmPMDKIoJUfyaPmRQXF9sXGhGQpdQFHTK467Y4rKTm6TJHVNKZV1TPCLe8BCqNIRWVOXHqXLNd2r8';

const STORAGE_KEY = 'fcm_token';

function isBrowser() {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined';
}

export async function registerPushNotifications(authToken: string): Promise<void> {
  if (!isBrowser()) return;
  try {
    console.log('[FCM] Starting registration...');

    const permission = await Notification.requestPermission();
    console.log('[FCM] Notification permission:', permission);
    if (permission !== 'granted') {
      console.warn('[FCM] Permission refused by user');
      return;
    }

    console.log('[FCM] Registering service worker...');
    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('[FCM] Service worker registered:', swReg);

    const messaging = getMessaging(firebaseApp);
    console.log('[FCM] Getting token with VAPID key:', VAPID_KEY);
    const fcmToken = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg });
    if (!fcmToken) {
      console.warn('[FCM] No FCM token obtained');
      return;
    }

    console.log('[FCM] Token obtained:', fcmToken);

    console.log('[FCM] Sending registration to backend using cookie-based session...');
    const registerResponse = await api.post('utilisateur/devices/register/', {
      registration_token: fcmToken,
      platform: 'web',
    });
    console.log('[FCM] Register response status:', registerResponse.status);
    console.log('[FCM] Register response body:', registerResponse.data);

    localStorage.setItem(STORAGE_KEY, fcmToken);
    console.log('[FCM] Token stored locally');
  } catch (error) {
    console.error('[FCM] Registration error:', error);
  }
}

export async function unregisterPushNotifications(authToken: string): Promise<void> {
  if (!isBrowser()) return;
  try {
    const fcmToken = localStorage.getItem(STORAGE_KEY);
    if (!fcmToken) return;

    const resp = await api.post('utilisateur/devices/unregister/', {
      registration_token: fcmToken,
    });
    console.log('[FCM] Unregister response status:', resp.status);

    localStorage.removeItem(STORAGE_KEY);
    console.log('[FCM] Token unregistered and removed locally');
  } catch (error) {
    console.error('[FCM] Unregister error:', error);
  }
}

export function listenForegroundNotifications(): void {
  if (!isBrowser()) return;
  try {
    const messaging = getMessaging(firebaseApp);
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title || 'Notification';
      const body = payload.notification?.body || '';
      const addToast = useToastStore.getState().addToast;
      addToast(`${title}: ${body}`, 'info');
    });
    console.log('[FCM] Listening for foreground notifications');
  } catch (error) {
    console.error('[FCM] Error setting up foreground listener:', error);
  }
}

export async function triggerTestNotification(
  title = 'Test de notification',
  body = 'Cette notification confirme que la réception est bien configurée.'
): Promise<boolean> {
  if (!isBrowser()) return false;

  try {
    if (typeof Notification === 'undefined') {
      console.warn('[FCM] Notification API not available in this browser');
      return false;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('[FCM] Test notification permission not granted');
        return false;
      }
    }

    if (Notification.permission !== 'granted') {
      console.warn('[FCM] Test notification permission not granted');
      return false;
    }

    const notificationOptions = {
      body,
      icon: '/icons/icon-192x192.jpeg',
      badge: '/icons/badge-72x72.png',
      tag: 'accessories-test-notification',
      data: { url: '/' },
    };

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(title, notificationOptions);
    } else {
      new Notification(title, notificationOptions);
    }

    useToastStore.getState().addToast(`${title} — ${body}`, 'info');
    return true;
  } catch (error) {
    console.error('[FCM] Test notification error:', error);
    return false;
  }
}