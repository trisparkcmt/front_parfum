importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBKzplWfKfPTdAHVJu6i-wYsOQNhfvzP8g",
  authDomain: "push-accessoire-exclusif.firebaseapp.com",
  projectId: "push-accessoire-exclusif",
  storageBucket: "push-accessoire-exclusif.firebasestorage.app",
  messagingSenderId: "712882537616",
  appId: "1:712882537616:web:ff2b3fb7f68d598e188415"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Background message received:', payload);
  const notificationTitle = payload.notification?.title || 'Accessoires Exclusifs';
  const notificationBody = payload.notification?.body || 'Vous avez une nouvelle notification.';

  const notificationOptions = {
    body: notificationBody,
    icon: '/logo.jpg',
    badge: '/icons/icon-192x192.jpeg',
    vibrate: [100, 50, 100],
    data: payload.data || {},
    requireInteraction: true,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => {
            if ('navigate' in client) return client.navigate(url);
          });
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
