/**
 * @file components/notifications/NotificationProvider.tsx
 * @description FCM Notification Provider for displaying foreground notifications
 * 
 * This component:
 * 1. Sets up FCM foreground message listener
 * 2. Manages a queue of notifications to display
 * 3. Renders NotificationToast components for each notification
 * 4. Handles cleanup on unmount
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useFCM, type UseFCMOptions } from '@/hooks/useFCM';
import { NotificationToast } from './NotificationToast';
import { handleNotificationClick, type FCMPayload } from '@/services/fcmService';

export interface NotificationProviderProps {
  /**
   * Options to pass to the useFCM hook
   */
  fcmOptions?: UseFCMOptions;

  /**
   * Custom handler for notification display
   * If provided, overrides the default toast display
   */
  onNotificationReceived?: (payload: FCMPayload) => void;

  /**
   * Maximum number of notifications to display simultaneously
   */
  maxNotifications?: number;

  /**
   * Auto-dismiss delay in milliseconds (0 = no auto-dismiss)
   */
  autoDismissMs?: number;
}

interface DisplayedNotification {
  id: string;
  payload: FCMPayload;
  timestamp: number;
}

/**
 * NotificationProvider Component
 * 
 * Wraps your app to provide global FCM notification display
 * 
 * Usage:
 * ```tsx
 * export default function RootLayout() {
 *   return (
 *     <NotificationProvider>
 *       <YourApp />
 *     </NotificationProvider>
 *   );
 * }
 * ```
 */
export const NotificationProvider: React.FC<{
  children: React.ReactNode;
  fcmOptions?: UseFCMOptions;
  maxNotifications?: number;
  autoDismissMs?: number;
  onNotificationReceived?: (payload: FCMPayload) => void;
}> = ({
  children,
  fcmOptions = {},
  maxNotifications = 3,
  autoDismissMs = 6000,
  onNotificationReceived,
}) => {
  const [notifications, setNotifications] = useState<DisplayedNotification[]>([]);
  const notificationIdRef = useRef(0);

  const handleMessage = useCallback(
    (payload: FCMPayload) => {
      console.log('[NotificationProvider] Received message:', payload);

      // Call custom handler if provided
      if (onNotificationReceived) {
        onNotificationReceived(payload);
        return;
      }

      // Generate unique ID for this notification
      const id = `notification-${++notificationIdRef.current}`;

      // Add to display queue
      setNotifications((prev) => {
        const updated = [
          ...prev,
          {
            id,
            payload,
            timestamp: Date.now(),
          },
        ];

        // Keep only max notifications (remove oldest if exceeded)
        if (updated.length > maxNotifications) {
          return updated.slice(updated.length - maxNotifications);
        }

        return updated;
      });
    },
    [onNotificationReceived, maxNotifications]
  );

  // Setup FCM with custom message handler
  useFCM({
    ...fcmOptions,
    enableToasts: false, // We're handling display ourselves
    onMessage: handleMessage,
  });

  const handleNotificationClose = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleNotificationClick = useCallback((payload: FCMPayload) => {
    handleNotificationClick(payload);
  }, []);

  return (
    <>
      {children}

      {/* Notification display container */}
      <div className="fixed inset-0 pointer-events-none z-40">
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 pointer-events-auto max-w-sm">
          {notifications.map((notification) => (
            <NotificationToast
              key={notification.id}
              payload={notification.payload}
              autoDismissMs={autoDismissMs}
              onClose={() => handleNotificationClose(notification.id)}
              onClick={() => handleNotificationClick(notification.payload)}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default NotificationProvider;
