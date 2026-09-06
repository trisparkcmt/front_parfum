import { create } from 'zustand';
import { notificationService, orderService } from '@/services/apiService';
import { deviceService } from '@/services/deviceService';
import { useAuthStore } from '@/store/useAuthStore';

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
  unreadNotificationCount: number; // For Header Bell Icon (Push & System Alerts)
  pendingActionCount: number;      // For Sidebar Badges (Pending Orders for Admin/Serveuse, Deliveries for Livreur)
  recentItems: UnifiedNotificationItem[];
  isLoading: boolean;

  // Actions
  fetchCounts: () => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  onForegroundPushReceived: (payload: { title?: string; body?: string; url?: string }) => void;
  markAsRead: (id: string | number, type: 'order' | 'system' | 'push') => Promise<void>;
  syncAppBadge: (count: number) => void;
}

export const useNotificationCountStore = create<NotificationCountState>((set, get) => ({
  unreadNotificationCount: 0,
  pendingActionCount: 0,
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
        // App badge API not supported
      }
    }
  },

  fetchCounts: async () => {
    set({ isLoading: true });
    try {
      const user = useAuthStore.getState().user;
      const roles = (user?.roles || []).map((r: string) => String(r).toLowerCase());

      const isAdminOrServeuse = roles.some((r) => r === 'admin' || r === 'serveuse' || r === 'superadmin');
      const isLivreur = roles.some((r) => r === 'livreur' || r === 'delivery');

      const [notifsResult, deviceNotifsResult, ordersResult] = await Promise.allSettled([
        isAdminOrServeuse ? notificationService.getUnreadNotifications() : Promise.resolve(null),
        deviceService.fetchNotifications(),
        isAdminOrServeuse
          ? orderService.getOrders({ statut: 'EN_ATTENTE_DE_PAIEMENT' })
          : isLivreur
          ? orderService.getOrders({ statut_livraison: 'assignée' })
          : Promise.resolve(null),
      ]);

      // 1. System / Stock Alerts (Admin / Serveuse)
      let shopUnread: UnifiedNotificationItem[] = [];
      if (isAdminOrServeuse && notifsResult.status === 'fulfilled' && notifsResult.value) {
        const raw = notifsResult.value.results || notifsResult.value.resultats || (Array.isArray(notifsResult.value) ? notifsResult.value : []);
        shopUnread = raw.map((n: any) => ({
          id: n.id,
          title: n.titre || n.title || 'Alerte Système',
          message: n.message || n.body || '',
          created_at: n.cree_le || n.date_creation || new Date().toISOString(),
          is_read: Boolean(n.est_lu),
          type: 'system' as const,
        }));
      }

      // 2. Push Notifications (All Users)
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

      // 3. Operational Action Counts for Sidebar (Pending Orders / Deliveries)
      let actionCount = 0;
      if (ordersResult.status === 'fulfilled' && ordersResult.value) {
        const rawOrders = ordersResult.value.results || ordersResult.value.resultats || (Array.isArray(ordersResult.value) ? ordersResult.value : []);
        actionCount = ordersResult.value.count ?? rawOrders.length;
      }

      // Header Bell Badge ONLY counts unread messaging notifications (Push + System alerts)
      const totalUnreadMessages = shopUnread.length + deviceNotifs.length;
      const recentItems = [...shopUnread, ...deviceNotifs].slice(0, 8);

      set({
        unreadNotificationCount: totalUnreadMessages,
        pendingActionCount: actionCount,
        recentItems,
        isLoading: false,
      });

      get().syncAppBadge(totalUnreadMessages);
    } catch (error) {
      console.warn('[NotificationCountStore] Error fetching counts:', error);
      set({ isLoading: false });
    }
  },

  markAllNotificationsAsRead: async () => {
    const state = get();
    
    // Mark system & push notifications as read
    await Promise.allSettled([
      notificationService.markAllAsRead().catch(() => {}),
      ...state.recentItems
        .filter((i) => i.type === 'push' && typeof i.id === 'string' && i.id.startsWith('dev-'))
        .map((i) => deviceService.markNotificationAsRead((i.id as string).replace('dev-', '')).catch(() => {})),
    ]);

    set({
      recentItems: [],
      unreadNotificationCount: 0,
    });

    get().syncAppBadge(0);
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
      const updatedItems = [newItem, ...state.recentItems].slice(0, 8);

      get().syncAppBadge(newUnreadNotifCount);

      return {
        unreadNotificationCount: newUnreadNotifCount,
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

      get().syncAppBadge(newUnreadNotifCount);

      return {
        recentItems: filtered,
        unreadNotificationCount: newUnreadNotifCount,
      };
    });
  },
}));


