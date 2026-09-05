'use client';

import { create } from 'zustand';
import { notificationService, orderService } from '@/services/apiService';
import { deviceService } from '@/services/deviceService';

export interface UnifiedNotificationItem {
  id: string | number;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  type: 'order' | 'system' | 'push';
  url?: string;
}

interface NotificationCountState {
  unreadNotificationCount: number;
  pendingOrderCount: number;
  totalUnreadCount: number;
  recentItems: UnifiedNotificationItem[];
  isLoading: boolean;
  
  // Actions
  fetchCounts: () => Promise<void>;
  onForegroundPushReceived: (payload: { title?: string; body?: string; url?: string }) => void;
  markAsRead: (id: string | number, type: 'order' | 'system' | 'push') => Promise<void>;
  syncAppBadge: (count: number) => void;
}

export const useNotificationCountStore = create<NotificationCountState>((set, get) => ({
  unreadNotificationCount: 0,
  pendingOrderCount: 0,
  totalUnreadCount: 0,
  recentItems: [],
  isLoading: false,

  syncAppBadge: (count: number) => {
    if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
      try {
        if (count > 0) {
          (navigator as any).setAppBadge(count).catch(() => {});
        } else {
          (navigator as any).clearAppBadge().catch(() => {});
        }
      } catch (e) {
        // App badge API not supported or disabled
      }
    }
  },

  fetchCounts: async () => {
    set({ isLoading: true });
    try {
      // Fetch unread notifications from shop, device FCM notifications, and pending orders
      const [notifsResult, deviceNotifsResult, ordersResult] = await Promise.allSettled([
        notificationService.getUnreadNotifications(),
        deviceService.fetchNotifications(),
        orderService.getOrders({ statut: 'EN_ATTENTE_DE_PAIEMENT' }),
      ]);

      let shopUnread: UnifiedNotificationItem[] = [];
      if (notifsResult.status === 'fulfilled' && notifsResult.value) {
        const raw = notifsResult.value.results || notifsResult.value.resultats || (Array.isArray(notifsResult.value) ? notifsResult.value : []);
        shopUnread = raw.map((n: any) => ({
          id: n.id,
          title: n.titre || n.title || 'Notification',
          message: n.message || n.body || '',
          created_at: n.cree_le || n.date_creation || new Date().toISOString(),
          is_read: Boolean(n.est_lu),
          type: 'system' as const,
        }));
      }

      let deviceNotifs: UnifiedNotificationItem[] = [];
      if (deviceNotifsResult.status === 'fulfilled' && deviceNotifsResult.value) {
        const raw = Array.isArray(deviceNotifsResult.value) ? deviceNotifsResult.value : [];
        deviceNotifs = raw
          .filter((n: any) => !n.is_read)
          .map((n: any) => ({
            id: `dev-${n.id}`,
            title: n.title || 'Notification Push',
            message: n.message || n.body || '',
            created_at: n.created_at || new Date().toISOString(),
            is_read: false,
            type: 'push' as const,
          }));
      }

      let pendingOrders: UnifiedNotificationItem[] = [];
      let pendingCount = 0;
      if (ordersResult.status === 'fulfilled' && ordersResult.value) {
        const rawOrders = ordersResult.value.results || ordersResult.value.resultats || (Array.isArray(ordersResult.value) ? ordersResult.value : []);
        pendingCount = ordersResult.value.count ?? rawOrders.length;
        pendingOrders = rawOrders.slice(0, 5).map((o: any) => ({
          id: `cmd-${o.id}`,
          title: `Nouvelle Commande #${o.numero_commande}`,
          message: `${o.livraison_nom_complet || 'Client'} — ${Number(o.total_ttc || 0).toLocaleString()} FCFA`,
          created_at: o.date_creation || o.created_at || new Date().toISOString(),
          is_read: false,
          type: 'order' as const,
          url: '/dashboard/admin/order',
        }));
      }

      // Combine items and calculate unread counts
      const combinedNotifs = [...shopUnread, ...deviceNotifs];
      const unreadNotifCount = combinedNotifs.length;
      const totalCount = unreadNotifCount + pendingCount;

      const recentItems = [...pendingOrders, ...combinedNotifs].slice(0, 8);

      set({
        unreadNotificationCount: unreadNotifCount,
        pendingOrderCount: pendingCount,
        totalUnreadCount: totalCount,
        recentItems,
        isLoading: false,
      });

      get().syncAppBadge(totalCount);
    } catch (error) {
      console.warn('[NotificationCountStore] Error fetching counts:', error);
      set({ isLoading: false });
    }
  },

  onForegroundPushReceived: (payload) => {
    const newItem: UnifiedNotificationItem = {
      id: `push-${Date.now()}`,
      title: payload.title || 'Nouvelle notification',
      message: payload.body || '',
      created_at: new Date().toISOString(),
      is_read: false,
      type: 'push',
      url: payload.url,
    };

    set((state) => {
      const newUnreadNotifCount = state.unreadNotificationCount + 1;
      const newTotal = state.totalUnreadCount + 1;
      const updatedItems = [newItem, ...state.recentItems].slice(0, 8);

      get().syncAppBadge(newTotal);

      return {
        unreadNotificationCount: newUnreadNotifCount,
        totalUnreadCount: newTotal,
        recentItems: updatedItems,
      };
    });
  },

  markAsRead: async (id, type) => {
    if (type === 'system' && typeof id === 'number') {
      try {
        await notificationService.markAsRead(id, true);
      } catch (e) {
        console.warn('Failed to mark notification as read:', e);
      }
    } else if (type === 'push' && typeof id === 'string' && id.startsWith('dev-')) {
      const numericId = id.replace('dev-', '');
      try {
        await deviceService.markNotificationAsRead(numericId);
      } catch (e) {
        console.warn('Failed to mark push notification as read:', e);
      }
    }

    set((state) => {
      const filtered = state.recentItems.filter((item) => item.id !== id);
      const newUnreadNotifCount = Math.max(0, state.unreadNotificationCount - 1);
      const newTotal = Math.max(0, state.totalUnreadCount - 1);

      get().syncAppBadge(newTotal);

      return {
        recentItems: filtered,
        unreadNotificationCount: newUnreadNotifCount,
        totalUnreadCount: newTotal,
      };
    });
  },
}));
