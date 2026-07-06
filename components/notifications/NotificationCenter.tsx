/**
 * @file components/notifications/NotificationCenter.tsx
 * @description Notification Center UI for viewing and managing notifications
 * 
 * Features:
 * - View notification history
 * - Mark notifications as read
 * - Clear all notifications
 * - Real-time updates from API
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, Trash2, Loader2 } from 'lucide-react';
import { deviceService } from '@/services/deviceService';
import { useToastStore } from '@/store/useToastStore';
import type { Notification as NotificationType } from '@/types';

export interface NotificationCenterProps {
  /**
   * Whether to show a badge with unread count
   */
  showBadge?: boolean;

  /**
   * Polling interval in milliseconds (0 = no polling)
   */
  pollIntervalMs?: number;
}

/**
 * NotificationCenter Component
 * 
 * Usage:
 * ```tsx
 * <NotificationCenter showBadge pollIntervalMs={30000} />
 * ```
 */
export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  showBadge = true,
  pollIntervalMs = 60000, // Poll every 60s by default
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const data = await deviceService.fetchNotifications();
      setNotifications(data);
      console.log('[NotificationCenter] Fetched', data.length, 'notifications');
    } catch (error: any) {
      console.error('[NotificationCenter] Failed to fetch notifications:', error);
      addToast('Erreur lors du chargement des notifications', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Setup polling
  useEffect(() => {
    if (pollIntervalMs <= 0) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [pollIntervalMs]);

  // Mark notification as read
  const handleMarkAsRead = async (id: string | number) => {
    try {
      await deviceService.markNotificationAsRead(id);
      
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      
      addToast('Notification marquée comme lue', 'success');
    } catch (error) {
      console.warn('[NotificationCenter] Failed to mark notification as read:', error);
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer toutes les notifications ?')) {
      return;
    }

    try {
      await deviceService.clearAllNotifications();
      setNotifications([]);
      addToast('Toutes les notifications ont été supprimées', 'success');
    } catch (error) {
      console.warn('[NotificationCenter] Failed to clear notifications:', error);
      addToast('Erreur lors de la suppression des notifications', 'error');
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-foreground/5 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-foreground" />

        {/* Unread Badge */}
        {showBadge && unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-96 bg-background border border-foreground/10 rounded-lg shadow-sm flex flex-col z-50">
          {/* Header */}
          <div className="p-4 border-b border-foreground/10 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <div className="flex gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="p-1 hover:bg-foreground/10 rounded transition-colors"
                  title="Supprimer tout"
                >
                  <Trash2 className="w-4 h-4 text-foreground/50" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-foreground/10 rounded transition-colors"
              >
                <X className="w-4 h-4 text-foreground/50" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-5 h-5 animate-spin text-gold" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex items-center justify-center p-8 text-foreground/50">
                <p>Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-foreground/10">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-foreground/5 transition-colors cursor-pointer ${
                      notification.is_read ? '' : 'bg-gold/5'
                    }`}
                    onClick={() => {
                      if (!notification.is_read) {
                        handleMarkAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground text-sm truncate">
                          {notification.title || 'Notification'}
                        </h4>
                        <p className="text-xs text-foreground/70 mt-1 line-clamp-2">
                          {notification.body || notification.message}
                        </p>
                        <p className="text-xs text-foreground/50 mt-2">
                          {new Date(notification.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>

                      {/* Unread Indicator */}
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-gold rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-foreground/10 bg-foreground/2.5">
              <button
                onClick={fetchNotifications}
                disabled={isLoading}
                className="w-full text-sm text-gold hover:text-gold/80 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Chargement...' : 'Actualiser'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
