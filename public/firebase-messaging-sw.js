/**
 * @file public/firebase-messaging-sw.js
 * @description Firebase Cloud Messaging Service Worker
 * 
 * This service worker is required by Firebase to:
 * 1. Intercept push messages from Firebase Cloud Messaging backend
 * 2. Display notifications even when the browser tab is closed or in background
 * 3. Handle notification clicks and actions
 * 4. Manage notification lifecycle
 * 
 * How it works:
 * - When a push message arrives from Firebase backend, this SW intercepts it
 * - It displays a notification to the user using the browser's Notification API
 * - If user clicks the notification, it can navigate to a specified URL or perform an action
 * - All this happens independently of whether the main Next.js app is running
 * 
 * Important: This file must be:
 * - Served from the root path (/)
 * - Named exactly "firebase-messaging-sw.js"
 * - In the public folder for Next.js
 * - Not cached aggressively (Cache-Control headers should allow updates)
 */

// Import Firebase SDK libraries in the service worker
// The importScripts function loads external scripts into the worker
importScripts(
  'https://www.gstatic.com/firebasejs/10.5.0/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/10.5.0/firebase-messaging-compat.js'
);

/**
 * Firebase configuration
 * Must match the configuration in lib/firebase.ts on the frontend
 */
const firebaseConfig = {
  apiKey: "AIzaSyBKzplWfKfPTdAHVJu6i-wYsOQNhfvzP8g",
  authDomain: "push-accessoire-exclusif.firebaseapp.com",
  projectId: "push-accessoire-exclusif",
  storageBucket: "push-accessoire-exclusif.firebasestorage.app",
  messagingSenderId: "712882537616",
  appId: "1:712882537616:web:ff2b3fb7f68d598e188415",
};

/**
 * Initialize Firebase in the service worker context
 * This must be called before using Firebase services
 */
firebase.initializeApp(firebaseConfig);

/**
 * Get the messaging instance for this service worker
 * In a service worker context, this receives background messages
 */
const messaging = firebase.messaging();

/**
 * Handle messages received in background (when tab is closed or app not in focus)
 * This event fires when a message arrives from Firebase Cloud Messaging backend
 */
messaging.onBackgroundMessage((payload) => {
  console.log('[Service Worker] Received background message:', payload);

  // Extract notification data from payload
  const notificationTitle = payload.notification?.title || 'Nouvelle notification';
  const notificationOptions = {
    body: payload.notification?.body || 'Vous avez une nouvelle notification',
    icon: payload.notification?.icon || '/icons/icon-192x192.jpeg',
    badge: payload.notification?.badge || '/icons/badge-72x72.png',
    tag: payload.notification?.tag || 'default',
    requireInteraction: false, // Allow notification to auto-close
    vibrate: [200, 100, 200], // Vibration pattern (mobile devices)
    
    // Custom data attached to notification for click handling
    data: payload.data || {},
    
    // Click action URL - can be customized by backend
    click_action: payload.notification?.click_action,
  };

  /**
   * Display the notification
   * self.registration.showNotification() is the Notification API
   * called from service worker to display system notifications
   */
  self.registration.showNotification(notificationTitle, notificationOptions);
});

/**
 * Handle notification click events
 * User clicked on the notification - navigate or perform action
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.notification);

  const notification = event.notification;
  const clickAction = notification.data?.click_action || 
                     notification.data?.url || 
                     '/'; // Default to home if no URL specified

  notification.close(); // Close the notification

  // Find or open the client window
  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Try to find an existing window/tab for this app
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === '/' || client.url.includes(self.location.origin)) {
            // Window already open - focus and navigate if needed
            client.focus();
            client.navigate(clickAction);
            return client;
          }
        }
        // No existing window - open a new one
        return clients.openWindow(clickAction);
      })
  );
});

/**
 * Handle notification close/dismiss events
 * Optional: Track when users dismiss notifications
 */
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification dismissed:', event.notification);
  // Could send analytics here if needed
});

/**
 * Keep the service worker alive for reliable background message delivery
 * This periodically sends a message to stay active
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting(); // Activate immediately, don't wait for other clients
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(clients.claim()); // Take control of all pages
});

/**
 * Handle periodic sync for notification cleanup (optional)
 * Can be used to sync missed notifications when connection is restored
 */
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Sync event:', event);
  if (event.tag === 'sync-notifications') {
    event.waitUntil(
      // Could fetch notification history here if needed
      Promise.resolve()
    );
  }
});
