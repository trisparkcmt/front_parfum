'use client';

import { create } from 'zustand';
import { orderService } from '@/services/apiService';
import { useToastStore } from './useToastStore';

interface OrderNotificationState {
  pendingCount: number;
  pendingOrders: any[];
  hasInitialized: boolean;
  notificationsEnabled: boolean;
  toggleNotifications: () => void;
  fetchPendingOrders: () => Promise<void>;
  requestNotificationPermission: () => Promise<void>;
}

export const useOrderNotificationStore = create<OrderNotificationState>((set, get) => {
  // Safe local storage retrieval
  let initialNotificationsEnabled = true;
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('order_notifications_enabled');
      if (saved !== null) {
        initialNotificationsEnabled = JSON.parse(saved);
      }
    } catch (_) {}
  }

  return {
    pendingCount: 0,
    pendingOrders: [],
    hasInitialized: false,
    notificationsEnabled: initialNotificationsEnabled,

    toggleNotifications: () => {
      const next = !get().notificationsEnabled;
      set({ notificationsEnabled: next });
      if (typeof window !== 'undefined') {
        localStorage.setItem('order_notifications_enabled', JSON.stringify(next));
      }
    },

    requestNotificationPermission: async () => {
      if (!get().notificationsEnabled) return;
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      }
    },

    fetchPendingOrders: async () => {
      try {
        const data = await orderService.getOrders({ statut: 'en_attente', page: 1 });
        const list = data.results ?? data.resultats ?? (Array.isArray(data) ? data : []);
        const newCount = list.length;
        
        const { pendingCount, hasInitialized, notificationsEnabled } = get();

        // Trigger alerts if there is a new order and it is not the first load
        if (hasInitialized && newCount > pendingCount && notificationsEnabled) {
          // 1. Trigger Toast
          const countDiff = newCount - pendingCount;
          const msg = countDiff === 1 
            ? 'Une nouvelle commande est en attente de traitement !'
            : `${countDiff} nouvelles commandes sont en attente de traitement !`;
          useToastStore.getState().addToast(msg, 'success');

          // 2. Play subtle notification sound
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
            
            setTimeout(() => {
              const osc2 = audioCtx.createOscillator();
              const gain2 = audioCtx.createGain();
              osc2.connect(gain2);
              gain2.connect(audioCtx.destination);
              osc2.type = 'sine';
              osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
              gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
              osc2.start();
              osc2.stop(audioCtx.currentTime + 0.25);
            }, 180);
          } catch (e) {
            // Audio playback failed or blocked by browser autoplay policy
          }

          // 3. Trigger Native Desktop/Browser Notification
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Nouvelle Commande Placé !', {
              body: msg,
              icon: '/icons/icon-192x192.jpeg',
              tag: 'new-order-alert',
            });
          }
        }

        // Update state
        set({
          pendingCount: newCount,
          pendingOrders: list,
          hasInitialized: true,
        });

        // Update Document Title
        if (typeof document !== 'undefined') {
          const baseTitle = document.title.replace(/^\(\d+\)\s*/, '');
          if (newCount > 0) {
            document.title = `(${newCount}) ${baseTitle}`;
          } else {
            document.title = baseTitle;
          }
        }
      } catch (error) {
        console.error('Failed to poll pending orders:', error);
      }
    },
  };
});
