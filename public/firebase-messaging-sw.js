/**
 * @file public/firebase-messaging-sw.js
 * @description Firebase Cloud Messaging Service Worker (v10.0.0 compat)
 */

importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCFczwPMeGoRoXz5nmZ_eZN22V4sTfpmWU",
  authDomain: "access-exclu.firebaseapp.com",
  projectId: "access-exclu",
  storageBucket: "access-exclu.firebasestorage.app",
  messagingSenderId: "206783805033",
  appId: "1:206783805033:web:855b8533e130dd570c54f8",
  measurementId: "G-J5XT62JBBS"
};

// Initialize Firebase in Service Worker context
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[Service Worker] Received background message:', payload);

  if (payload.notification) return;

  const data = payload.data || {};
  
  // SECURE FALLBACK: Extract title & body from payload.notification OR payload.data
  // This ensures that data-only payloads trigger the notification display.
  const title = payload.notification?.title || data.title || 'Accessoire Exclusif';
  const body = payload.notification?.body || data.message || data.body || '';

  const notificationOptions = {
    body: body,
    icon: payload.notification?.icon || data.icon || '/logo.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data, // Keep reference to data for click action handling
  };

  try {
    self.registration.showNotification(title, notificationOptions);
    console.log('[Service Worker] Notification shown successfully:', title);
  } catch (error) {
    console.error('[Service Worker] Failed to display notification:', error);
  }
});

// Handle notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received:', event.notification);
  event.notification.close();

  const data = event.notification.data || {};
  const url = data.url || data.click_action || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    })
    .then((clientList) => {
      // Find open tab/window for this site
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          if (client.focus) client.focus();
          if (client.navigate) client.navigate(url);
          client.postMessage({ type: 'FCM_NOTIFICATION_CLICKED', data });
          return client;
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});


// Immediate Activation & Claim
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
