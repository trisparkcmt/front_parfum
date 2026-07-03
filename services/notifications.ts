import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firebaseApp } from '@/lib/firebase';
import { useToastStore } from '@/store/useToastStore';

const VAPID_KEY = 'F0KwqkUGUbWZxo-vWoyYJzB073iJlXFZrdfCEs4UeQk';
const REGISTER_URL = 'https://accessoires-exclusifs-api.onrender.com/api/v1/utilisateur/devices/register/';
const UNREGISTER_URL = 'https://accessoires-exclusifs-api.onrender.com/api/v1/utilisateur/devices/unregister/';
const STORAGE_KEY = 'fcm_token';

function isBrowser() {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined';
}

export async function registerPushNotifications(authToken: string): Promise<void> {
  if (!isBrowser()) return;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Permission refusée par l\'utilisateur');
      return;
    }

    // Ensure service worker is registered
    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    const messaging = getMessaging(firebaseApp);
    const fcmToken = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg });
    if (!fcmToken) {
      console.warn('[FCM] Aucun token obtenu');
      return;
    }

    // Send token to backend using the Token auth header as requested
    await fetch(REGISTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${authToken}`,
      },
      body: JSON.stringify({ registration_token: fcmToken, platform: 'web' }),
    });

    localStorage.setItem(STORAGE_KEY, fcmToken);
    console.log('[FCM] Token enregistré avec succès');
  } catch (error) {
    console.error('[FCM] Erreur d\'enregistrement :', error);
  }
}

export async function unregisterPushNotifications(authToken: string): Promise<void> {
  if (!isBrowser()) return;
  try {
    const fcmToken = localStorage.getItem(STORAGE_KEY);
    if (!fcmToken) return;

    await fetch(UNREGISTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${authToken}`,
      },
      body: JSON.stringify({ registration_token: fcmToken }),
    });

    localStorage.removeItem(STORAGE_KEY);
    console.log('[FCM] Token désenregistré avec succès');
  } catch (error) {
    console.error('[FCM] Erreur de désenregistrement :', error);
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
