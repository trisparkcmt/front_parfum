import { useEffect, useRef, useCallback } from 'react';
import { orderService } from '@/services/apiService';
import { BackendOrder } from '@/types';

interface UseOrderStatusPollingOptions {
  enabled?: boolean;
  interval?: number; // milliseconds
  onStatusChange?: (order: BackendOrder, previousStatus: string) => void;
  onError?: (error: Error) => void;
}

export const useOrderStatusPolling = (
  numeroCommande: string | null,
  options: UseOrderStatusPollingOptions = {}
) => {
  const {
    enabled = true,
    interval = 5000,
    onStatusChange,
    onError,
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousStatusRef = useRef<string | null>(null);

  const pollOrder = useCallback(async () => {
    if (!numeroCommande) return;

    try {
      const order = await orderService.pollOrderStatus(numeroCommande);

      // Check if status changed
      if (previousStatusRef.current && previousStatusRef.current !== order.statut) {
        onStatusChange?.(order, previousStatusRef.current);
      }

      previousStatusRef.current = order.statut;
      return order;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to poll order status');
      onError?.(err);
      console.error('Order polling error:', err);
    }
  }, [numeroCommande, onStatusChange, onError]);

  useEffect(() => {
    if (!enabled || !numeroCommande) return;

    // Immediate poll
    pollOrder();

    // Set up interval
    intervalRef.current = setInterval(pollOrder, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [numeroCommande, enabled, interval, pollOrder]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return; // Already polling
    if (!numeroCommande) return;

    pollOrder();
    intervalRef.current = setInterval(pollOrder, interval);
  }, [numeroCommande, interval, pollOrder]);

  return { stopPolling, startPolling, pollOrder };
};
