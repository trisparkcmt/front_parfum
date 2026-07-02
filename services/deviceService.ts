/**
 * @file services/deviceService.ts
 * @description Device Management Service for Firebase Cloud Messaging (FCM).
 * Handles registration and unregistration of devices with the Django backend API.
 * 
 * API Endpoints:
 * - POST /utilisateur/devices/register/ (Payload: { registration_token, platform })
 * - POST /utilisateur/devices/unregister/ (Payload: { registration_token })
 * - GET /utilisateur/notifications/ (Fetch notification history)
 */

import { api } from './api';
import type { Notification as NotificationType } from '@/types';

/**
 * Device platform types supported
 */
export type DevicePlatform = 'web' | 'ios' | 'android';

/**
 * Request payload for device registration
 */
interface DeviceRegistrationPayload {
  registration_token: string;
  platform: DevicePlatform;
}

/**
 * Request payload for device unregistration
 */
interface DeviceUnregistrationPayload {
  registration_token: string;
}

/**
 * Response from device registration
 */
interface DeviceRegistrationResponse {
  id?: string | number;
  registration_token: string;
  platform: DevicePlatform;
  created_at?: string;
  updated_at?: string;
}

/**
 * Device Service - manages FCM token registration with Django backend
 */
export const deviceService = {
  /**
   * Register a device with FCM token on the backend.
   * Called after successfully obtaining an FCM token from Firebase.
   * 
   * @param registrationToken - FCM token from Firebase
   * @returns Device registration response from backend
   * @throws Error if registration fails
   */
  registerDevice: async (
    registrationToken: string
  ): Promise<DeviceRegistrationResponse> => {
    if (!registrationToken || typeof registrationToken !== 'string') {
      throw new Error('Invalid registration token provided');
    }

    const payload: DeviceRegistrationPayload = {
      registration_token: registrationToken,
      platform: 'web',
    };

    try {
      const response = await api.post<DeviceRegistrationResponse>(
        'utilisateur/devices/register/',
        payload
      );
      console.log('[Device Service] Device registered successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[Device Service] Failed to register device:', error);
      throw error;
    }
  },

  /**
   * Unregister a device from the backend.
   * Called when user logs out to invalidate the FCM token on the backend.
   * 
   * @param registrationToken - FCM token to unregister
   * @throws Error if unregistration fails
   */
  unregisterDevice: async (registrationToken: string): Promise<void> => {
    if (!registrationToken || typeof registrationToken !== 'string') {
      console.warn('[Device Service] No valid registration token to unregister');
      return;
    }

    const payload: DeviceUnregistrationPayload = {
      registration_token: registrationToken,
    };

    try {
      await api.post('utilisateur/devices/unregister/', payload);
      console.log('[Device Service] Device unregistered successfully');
    } catch (error: any) {
      // Log but don't throw - unregistration should not block logout
      console.warn('[Device Service] Failed to unregister device:', error);
    }
  },

  /**
   * Fetch notification history from backend.
   * Retrieves past notifications for display in notification center/history UI.
   * 
   * @returns Array of notifications from backend
   * @throws Error if fetch fails
   */
  fetchNotifications: async (): Promise<NotificationType[]> => {
    try {
      const response = await api.get<NotificationType[]>(
        'utilisateur/notifications/'
      );
      console.log('[Device Service] Fetched notifications:', response.data);
      return response.data || [];
    } catch (error: any) {
      console.error('[Device Service] Failed to fetch notifications:', error);
      throw error;
    }
  },

  /**
   * Mark a notification as read in the backend.
   * Optional endpoint if backend supports it.
   * 
   * @param notificationId - ID of the notification to mark as read
   * @throws Error if marking fails
   */
  markNotificationAsRead: async (notificationId: string | number): Promise<void> => {
    try {
      await api.patch(`utilisateur/notifications/${notificationId}/`, {
        is_read: true,
      });
      console.log('[Device Service] Notification marked as read');
    } catch (error: any) {
      console.warn('[Device Service] Failed to mark notification as read:', error);
    }
  },

  /**
   * Clear all notifications for the current user.
   * Optional endpoint if backend supports it.
   * 
   * @throws Error if clearing fails
   */
  clearAllNotifications: async (): Promise<void> => {
    try {
      await api.post('utilisateur/notifications/clear/', {});
      console.log('[Device Service] All notifications cleared');
    } catch (error: any) {
      console.warn('[Device Service] Failed to clear notifications:', error);
    }
  },
};

export type {
  DeviceRegistrationPayload,
  DeviceUnregistrationPayload,
  DeviceRegistrationResponse,
};
