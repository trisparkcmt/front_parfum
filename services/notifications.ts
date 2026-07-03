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
      console.warn('[FCM] Permission refusée par l\'utilisateur');
      return;
    }

    // Ensure service worker is registered
    console.log('[FCM] Registering service worker...');
    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('[FCM] Service worker registered:', swReg);

    const messaging = getMessaging(firebaseApp);
    console.log('[FCM] Getting token with VAPID key:', VAPID_KEY);
    const fcmToken = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg });
    if (!fcmToken) {
      console.warn('[FCM] Aucun token obtenu');
      return;
    }
    
    console.log('[FCM] Token obtained:', fcmToken);

    // Send token to backend using the authenticated API client
    console.log('[FCM] Sending token to backend...');
    const registerResponse = await api.post(
      'utilisateur/devices/register/',
      {
        registration_token: fcmToken,
        platform: 'web',
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    
    console.log('[FCM] Register response status:', registerResponse.status);
    console.log('[FCM] Register response body:', registerResponse.data);

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

    await api.post(
      'utilisateur/devices/unregister/',
      {
        registration_token: fcmToken,
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

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
