'use client';

import { useState, useEffect } from 'react';
import { Bell, Search, X, Trash2, Loader2, CheckSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BackButton } from '@/components/ui/BackButton';
import { deviceService } from '@/services/deviceService';
import { useToastStore } from '@/store/useToastStore';
import type { Notification as NotificationType } from '@/types';

export default function NotificationsPage() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await deviceService.fetchNotifications();
      // Only keep the auto-kept notifications and any unread/read they have
      setNotifications(data);
    } catch (error: any) {
      console.error('[NotificationsPage] Failed to fetch notifications:', error);
      addToast(t('error_loading_notifications', 'Erreur lors du chargement des notifications'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string | number) => {
    try {
      await deviceService.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.warn('Failed to mark notification as read:', error);
    }
  };

  const handleClearAll = async () => {
    if (!confirm(t('confirm_clear_all_notifications', 'Êtes-vous sûr de vouloir supprimer toutes les notifications ?'))) {
      return;
    }
    try {
      await deviceService.clearAllNotifications();
      setNotifications([]);
      addToast(t('all_notifications_cleared', 'Toutes les notifications ont été supprimées'), 'success');
    } catch (error) {
      addToast(t('error_clearing_notifications', 'Erreur lors de la suppression des notifications'), 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      setIsSelectionMode(false);
      return;
    }
    if (!confirm(t('confirm_bulk_delete_notifications', `Supprimer ${selectedIds.size} notification(s) ?`))) return;

    try {
      await deviceService.deleteMultipleNotifications(Array.from(selectedIds));
      setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.id)));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      addToast(t('notifications_deleted', 'Notifications supprimées'), 'success');
    } catch (error) {
      addToast(t('error_deleting_notifications', 'Erreur lors de la suppression'), 'error');
    }
  };

  const handleDeleteNotification = async (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deviceService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      addToast(t('notification_deleted', 'Notification supprimée'), 'success');
    } catch (error) {
      addToast(t('error_deleting_notification', 'Erreur lors de la suppression de la notification'), 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 pb-12">
      <BackButton />

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-gold/15 bg-gradient-to-br from-white/[0.04] to-transparent px-6 py-8">
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/[0.06] blur-3xl"
          aria-hidden
        />
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold/80">
          {t('your_messages', 'Vos Messages')}
        </p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <h1 className="font-serif text-3xl italic tracking-tight text-foreground">
            {t('my_notifications', 'Centre de Notifications')}
          </h1>
          <span className="mb-1 text-sm text-foreground/50">
            {notifications.length.toString().padStart(2, '0')}{' '}
            {notifications.length > 1 ? t('messages_plural', 'messages') : t('messages_singular', 'message')}
          </span>
        </div>
        <div className="mt-4 h-px w-full bg-gradient-to-r from-gold/40 via-gold/10 to-transparent" />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">
          {isSelectionMode ? `${selectedIds.size} ${t('selected', 'sélectionnée(s)')}` : ''}
        </h3>
        <div className="flex gap-2">
          {notifications.length > 0 && (
            <>
              {isSelectionMode ? (
                <button
                  onClick={handleBulkDelete}
                  className="text-sm px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors font-medium"
                >
                  {t('delete_selection', 'Supprimer la sélection')}
                </button>
              ) : (
                <button
                  onClick={() => setIsSelectionMode(true)}
                  className="text-sm px-4 py-2 bg-foreground/5 text-foreground hover:bg-foreground/10 rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <CheckSquare size={16} />
                  {t('select', 'Sélectionner')}
                </button>
              )}
              <button
                onClick={handleClearAll}
                className="text-sm px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors font-medium flex items-center gap-2"
                title={t('delete_all', 'Tout supprimer')}
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">{t('delete_all', 'Tout supprimer')}</span>
              </button>
            </>
          )}
          {isSelectionMode && (
            <button
              onClick={() => {
                setIsSelectionMode(false);
                setSelectedIds(new Set());
              }}
              className="text-sm px-4 py-2 bg-foreground/5 text-foreground hover:bg-foreground/10 rounded-lg transition-colors font-medium"
            >
              {t('cancel', 'Annuler')}
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-white/5 bg-white/[0.02]">
            <Bell size={32} className="mx-auto mb-4 text-foreground/30" />
            <p className="text-foreground/50">{t('no_notifications', 'Aucune notification pour le moment')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`relative overflow-hidden rounded-2xl border p-5 transition-all cursor-pointer flex gap-4 items-start ${
                  notification.is_read
                    ? 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
                    : 'border-gold/30 bg-gold/[0.08] shadow-lg shadow-gold/5'
                }`}
                onClick={() => {
                  if (isSelectionMode) {
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(notification.id)) next.delete(notification.id);
                      else next.add(notification.id);
                      return next;
                    });
                    return;
                  }
                  if (!notification.is_read) {
                    handleMarkAsRead(notification.id);
                  }
                }}
              >
                {isSelectionMode && (
                  <div className="pt-1 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(notification.id)}
                      readOnly
                      className="w-5 h-5 rounded border-foreground/30 text-gold focus:ring-gold bg-transparent"
                    />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-foreground text-lg">
                      {notification.title || 'Notification'}
                    </h4>
                    <span className="text-xs text-foreground/50 whitespace-nowrap ml-4">
                      {new Date(notification.created_at).toLocaleString('fr-FR', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    {notification.body || notification.message}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-3 self-stretch flex-shrink-0">
                  {!notification.is_read ? (
                    <div className="w-2.5 h-2.5 bg-gold rounded-full" />
                  ) : (
                    <div className="w-2.5 h-2.5" />
                  )}
                  <button
                    onClick={(e) => handleDeleteNotification(notification.id, e)}
                    className="p-2 mt-auto hover:bg-red-500/10 rounded-xl transition-colors text-foreground/40 hover:text-red-500"
                    title={t('delete', 'Supprimer')}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
