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
  unreadNotificationCount: number;
  pendingOrderCount: number;
  undeliveredOrderCount: number;
  totalUnreadCount: number;
  recentItems: UnifiedNotificationItem[];
  isLoading: boolean;
  
  // Actions
  fetchCounts: () => Promise<void>;
  clearPushNotifications: () => Promise<void>;
  onForegroundPushReceived: (payload: { title?: string; body?: string; url?: string }) => void;
  markAsRead: (id: string | number, type: 'order' | 'system' | 'push') => Promise<void>;
  syncAppBadge: (count: number) => void;
}

export const useNotificationCountStore = create<NotificationCountState>((set, get) => ({
  unreadNotificationCount: 0,
  pendingOrderCount: 0,
  undeliveredOrderCount: 0,
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
      const user = useAuthStore.getState().user;
      const roles = (user?.roles || []).map((r: string) => String(r).toLowerCase());
      
      const isAdminOrServeuse = roles.some((r) => r === 'admin' || r === 'serveuse' || r === 'superadmin');
      const isLivreur = roles.some((r) => r === 'livreur' || r === 'delivery');

      const [notifsResult, deviceNotifsResult, ordersResult] = await Promise.allSettled([
        notificationService.getUnreadNotifications(),
        deviceService.fetchNotifications(),
        isAdminOrServeuse
          ? orderService.getOrders({ statut: 'EN_ATTENTE_DE_PAIEMENT' })
          : isLivreur
          ? orderService.getOrders({ statut_livraison: 'assignée' })
          : Promise.resolve(null),
      ]);

      // Stock threshold / shop notifications (Admin / Serveuse)
      let shopUnread: UnifiedNotificationItem[] = [];
      if (isAdminOrServeuse && notifsResult.status === 'fulfilled' && notifsResult.value) {
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

      // Push notifications (All users)
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

      // Pending / Undelivered Orders
      let pendingOrders: UnifiedNotificationItem[] = [];
      let pendingCount = 0;
      let undeliveredCount = 0;

      if (ordersResult.status === 'fulfilled' && ordersResult.value) {
        const rawOrders = ordersResult.value.results || ordersResult.value.resultats || (Array.isArray(ordersResult.value) ? ordersResult.value : []);
        const totalNum = ordersResult.value.count ?? rawOrders.length;
        
        if (isAdminOrServeuse) {
          pendingCount = totalNum;
          pendingOrders = rawOrders.slice(0, 5).map((o: any) => ({
            id: `cmd-${o.id}`,
            title: `Nouvelle Commande #${o.numero_commande}`,
            message: `${o.livraison_nom_complet || 'Client'} — ${Number(o.total_ttc || 0).toLocaleString()} FCFA`,
            created_at: o.date_creation || o.created_at || new Date().toISOString(),
            is_read: false,
            type: 'order' as const,
            url: roles.includes('serveuse') ? '/dashboard/serveuse/order' : '/dashboard/admin/order',
          }));
        } else if (isLivreur) {
          undeliveredCount = totalNum;
          pendingOrders = rawOrders.slice(0, 5).map((o: any) => ({
            id: `cmd-${o.id}`,
            title: `Livraison à faire #${o.numero_commande}`,
            message: `${o.livraison_nom_complet || 'Client'} — ${o.livraison_ville || ''}`,
            created_at: o.date_creation || o.created_at || new Date().toISOString(),
            is_read: false,
            type: 'order' as const,
            url: '/dashboard/delivery',
          }));
        }
      }

      // Calculate totals per role
      const unreadNotifCount = shopUnread.length + deviceNotifs.length;
      let totalCount = 0;

      if (isAdminOrServeuse) {
        totalCount = pendingCount + shopUnread.length + deviceNotifs.length;
      } else if (isLivreur) {
        totalCount = undeliveredCount + deviceNotifs.length;
      } else {
        // Client
        totalCount = deviceNotifs.length;
      }

      const recentItems = [...pendingOrders, ...shopUnread, ...deviceNotifs].slice(0, 8);

      set({
        unreadNotificationCount: unreadNotifCount,
        pendingOrderCount: pendingCount,
        undeliveredOrderCount: undeliveredCount,
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

  clearPushNotifications: async () => {
    const state = get();
    const pushItems = state.recentItems.filter((i) => i.type === 'push');

    // Mark push items as read on backend
    await Promise.allSettled(
      pushItems.map(async (item) => {
        if (typeof item.id === 'string' && item.id.startsWith('dev-')) {
          const numericId = item.id.replace('dev-', '');
          try {
            await deviceService.markNotificationAsRead(numericId);
          } catch (e) {
            console.warn('[NotificationCountStore] Failed to mark push notification as read:', e);
          }
        }
      })
    );

    // Remove push items from state and update total
    const remainingItems = state.recentItems.filter((i) => i.type !== 'push');
    const user = useAuthStore.getState().user;
    const roles = (user?.roles || []).map((r: string) => String(r).toLowerCase());
    const isAdminOrServeuse = roles.some((r) => r === 'admin' || r === 'serveuse' || r === 'superadmin');
    const isLivreur = roles.some((r) => r === 'livreur' || r === 'delivery');

    let newTotal = 0;
    const systemCount = remainingItems.filter((i) => i.type === 'system').length;

    if (isAdminOrServeuse) {
      newTotal = state.pendingOrderCount + systemCount;
    } else if (isLivreur) {
      newTotal = state.undeliveredOrderCount;
    } else {
      // Client
      newTotal = 0;
    }

    set({
      recentItems: remainingItems,
      unreadNotificationCount: systemCount,
      totalUnreadCount: newTotal,
    });

    get().syncAppBadge(newTotal);
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

