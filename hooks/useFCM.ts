/**
 * @file hooks/useFCM.ts
 * @description Custom React Hook for Firebase Cloud Messaging (FCM) integration
 * 
 * This hook provides a clean interface to:
 * - Initialize FCM and request notification permissions
 * - Setup foreground message handlers
 * - Cleanup on unmount or logout
 * 
 * Usage in a component:
 * ```tsx
 * export default function Home() {
 *   useFCM(); // Automatically initialize FCM when component mounts
 * 
 *   return <div>Your app content</div>;
 * }
 * ```
 */

'use client';

import { useEffect, useCallback, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import {
  initializeFCM,
  setupForegroundMessageListener,
  cleanupFCM,
  formatNotificationPayload,
  handleNotificationClick,
  type FCMPayload,
} from '@/services/fcmService';

interface UseFCMOptions {
  /**
   * Enable automatic toast notifications for foreground messages
   */
  enableToasts?: boolean;

  /**
   * Custom handler for foreground messages
   */
  onMessage?: (payload: FCMPayload) => void;
}

/**
 * useFCM Hook
 * 
 * Initializes Firebase Cloud Messaging when:
 * 1. User is authenticated (has user in auth store)
 * 2. Component is mounted
 * 
 * Automatically cleans up when:
 * 1. Component is unmounted
 * 2. User logs out
 */
export function useFCM(options: UseFCMOptions = {}) {
  const {
    enableToasts = true,
    onMessage,
  } = options;

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const addToast = useToastStore((state) => state.addToast);

  // Initialize FCM when user authenticates
  useEffect(() => {
    if (!isAuthenticated || !user) {
      console.log('[useFCM] Skipping initialization - user not authenticated');
      return;
    }

    console.log('[useFCM] Initializing FCM for user:', user.id);

    let isMounted = true;

    (async () => {
      try {
        const token = await initializeFCM(user);

        if (isMounted && token) {
          console.log('[useFCM] FCM initialized successfully');

          if (enableToasts) {
            addToast('Notifications activées', 'success');
          }

          // Setup foreground message listener after FCM is initialized
          setupForegroundMessageListener((payload) => {
            console.log('[useFCM] Foreground message received:', payload);

            // Call custom handler if provided
            if (onMessage) {
              onMessage(payload);
              return;
            }

            // Default: Show toast notification
            if (enableToasts) {
              const formatted = formatNotificationPayload(payload);
              addToast(formatted.body || formatted.title, 'info');
            }
          });
        }
      } catch (error) {
        console.error('[useFCM] Error during FCM setup:', error);
        if (isMounted && enableToasts) {
          addToast('Erreur lors de l\'initialisation des notifications', 'error');
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [user, isAuthenticated, enableToasts, onMessage, addToast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[useFCM] Cleaning up FCM resources on unmount');
      cleanupFCM();
    };
  }, []);
}

/**
 * Alternative hook for detailed FCM status tracking
 */
export function useFCMWithStatus(options: UseFCMOptions = {}) {
  const { enableToasts = true, onMessage } = options;

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const addToast = useToastStore((state) => state.addToast);

  // State would be added here if needed for tracking FCM status
    const [fcmStatus, setFcmStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    setFcmStatus('loading');

    let isMounted = true;

    (async () => {
      try {
        const token = await initializeFCM(user);

        if (isMounted) {
          if (token) {
            setFcmStatus('ready');
            if (enableToasts) {
              addToast('Notifications activées', 'success');
            }

            setupForegroundMessageListener((payload) => {
              if (onMessage) {
                onMessage(payload);
                return;
              }

              if (enableToasts) {
                const formatted = formatNotificationPayload(payload);
                addToast(formatted.body || formatted.title, 'info');
              }
            });
          } else {
            setFcmStatus('idle');
          }
        }
      } catch (error) {
        console.error('[useFCMWithStatus] Error:', error);
        if (isMounted) {
          setFcmStatus('error');
          if (enableToasts) {
            addToast('Erreur lors de l\'initialisation des notifications', 'error');
          }
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [user, isAuthenticated, enableToasts, onMessage, addToast]);

  useEffect(() => {
    return () => {
      cleanupFCM();
    };
  }, []);

  return { fcmStatus };
}

export type { UseFCMOptions };
