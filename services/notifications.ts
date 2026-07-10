import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firebaseApp } from '@/lib/firebase';
import { useToastStore } from '@/store/useToastStore';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "BIH086VT_ZEmPMDKIoJUfyaPmRQXF9sXGhGQpdQFHTK467Y4rKTm6TJHVNKZV1TPCLe8BCqNIRWVOXHqXLNd2r";
const STORAGE_KEY = 'fcm_token';

function isBrowser() {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined';
}

export function isSupportedBrowser() {
  return (
    isBrowser() &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

export async function registerPushNotifications(authToken: string): Promise<void> {
  if (!isSupportedBrowser()) {
    console.warn('[FCM] Push notifications are not supported in this browser/environment.');
    return;
  }

  try {
    console.log('[FCM] Requesting notification permission...');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission denied by user.');
      return;
    }

    console.log('[FCM] Registering Service Worker...');
    // Register the SW
    const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('[FCM] Service Worker registered. Waiting for it to be ready...');

    // Wait until the Service Worker is fully active to avoid intermittent getToken failures
    await navigator.serviceWorker.ready;
    console.log('[FCM] Service Worker is ready.');

    const messaging = getMessaging(firebaseApp);
    console.log('[FCM] Fetching FCM token...');
    const fcmToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (!fcmToken) {
      console.warn('[FCM] Failed to obtain registration token.');
      return;
    }

    console.log('[FCM] FCM Token obtained:', fcmToken);

    // Skip backend registration call if token hasn't changed
    const cachedToken = localStorage.getItem(STORAGE_KEY);
    if (cachedToken === fcmToken) {
      console.log('[FCM] Token is unchanged. Skipping backend registration.');
      return;
    }

    console.log('[FCM] Registering token with backend...');
    // Use raw fetch to ensure Authorization header is formatted correctly and handle timeout/re-wake ups
    const response = await fetch('https://accessoires-exclusifs-api.onrender.com/api/v1/utilisateur/devices/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${authToken}`,
      },
      body: JSON.stringify({
        registration_token: fcmToken,
        platform: 'web',
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend registration failed with status: ${response.status}`);
    }

    console.log('[FCM] Successfully registered device with backend.');
    localStorage.setItem(STORAGE_KEY, fcmToken);
  } catch (error) {
    console.error('[FCM] Error registering push notifications:', error);
  }
}

export async function unregisterPushNotifications(authToken: string): Promise<void> {
  if (!isBrowser()) return;
  const fcmToken = localStorage.getItem(STORAGE_KEY);
  if (!fcmToken) {
    console.log('[FCM] No token found in localStorage to unregister.');
    return;
  }

  try {
    console.log('[FCM] Unregistering token from backend...');
    const response = await fetch('https://accessoires-exclusifs-api.onrender.com/api/v1/utilisateur/devices/unregister/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${authToken}`,
      },
      body: JSON.stringify({
        registration_token: fcmToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend unregistration failed with status: ${response.status}`);
    }

    localStorage.removeItem(STORAGE_KEY);
    console.log('[FCM] Successfully unregistered device from backend and cleared local storage.');
  } catch (error) {
    console.error('[FCM] Error unregistering push notifications:', error);
  }
}

export function listenForegroundNotifications(): void {
  if (!isSupportedBrowser()) return;
  try {
    const messaging = getMessaging(firebaseApp);
    onMessage(messaging, (payload) => {
      console.log('[FCM] Foreground notification received:', payload);
      
      const title = payload.notification?.title || payload.data?.title || 'Notification';
      const body = payload.notification?.body || payload.data?.body || '';

      // HOOK TOAST / UI ALERTS HERE
      const addToast = useToastStore.getState().addToast;
      addToast(`${title}: ${body}`, 'info');
    });
    console.log('[FCM] Listening for foreground notifications.');
  } catch (error) {
    console.error('[FCM] Error listening for foreground notifications:', error);
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