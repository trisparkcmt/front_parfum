import { api } from './api';

export interface Notification {
  id: number;
  recipient: number;
  type: 'order_update' | 'general' | 'delivery' | 'payment' | string;
  message: string;
  is_global_admin: boolean;
  created_at: string;
  read?: boolean;
}

export const notificationService = {
  // Get all notifications for the authenticated user
  async getNotifications(): Promise<Notification[]> {
    try {
      const response = await api.get('/utilisateur/notifications/');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Mark a notification as read (optional endpoint)
  async markAsRead(notificationId: number): Promise<void> {
    try {
      await api.patch(`/utilisateur/notifications/${notificationId}/`, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Mark all notifications as read (optional endpoint)
  async markAllAsRead(): Promise<void> {
    try {
      await api.post('/utilisateur/notifications/mark-all-read/');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Delete a notification
  async deleteNotification(notificationId: number): Promise<void> {
    try {
      await api.delete(`/utilisateur/notifications/${notificationId}/`);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },
};
