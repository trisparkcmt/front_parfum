import { useCallback, useState } from 'react';
import type { BackendOrder } from '@/types';

type SetOrders = React.Dispatch<React.SetStateAction<BackendOrder[]>>;
type Toast = (msg: string, type: 'success' | 'error') => void;

interface OptimisticUpdateOptions<T> {
  /** Primary key of the order being mutated (BackendOrder.id) */
  orderId: number | string;
  /** Partial fields to apply to local state immediately (before the API call resolves) */
  patch: Partial<BackendOrder>;
  /** The actual network request. Runs in the background — no global spinner. */
  apiCall: () => Promise<T>;
  /** Optional toast text on success (skip to stay silent) */
  successMessage?: string;
  /** Fallback toast text on failure (server error detail is preferred when available) */
  errorMessage?: string;
  /** Optional extra logic once the request resolves successfully */
  onSuccess?: (result: T) => void;
}

/**
 * Gives you optimistic-update semantics (à la React Query's onMutate/onError)
 * on top of plain useState-managed lists.
 *
 * - Applies `patch` to the matching order synchronously, so the row moves
 *   between derived lists (e.g. "en cours" <-> "complétées") instantly.
 * - Fires `apiCall` in the background. No loading flag is touched, so no
 *   global spinner appears.
 * - On failure, restores the exact pre-mutation snapshot of that order and
 *   surfaces a toast.
 * - Exposes `pendingIds` so you can show a subtle per-row "syncing" indicator
 *   if you want one (optional — table stays fully interactive either way).
 */
export function useOptimisticOrders(setOrders: SetOrders, addToast: Toast) {
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const runOptimisticUpdate = useCallback(
    async <T,>({
      orderId,
      patch,
      apiCall,
      successMessage,
      errorMessage,
      onSuccess,
    }: OptimisticUpdateOptions<T>): Promise<T | undefined> => {
      let snapshot: BackendOrder | undefined;
      const key = String(orderId);

      // 1. Apply the change immediately.
      // Matched with String() on both sides — some APIs return numeric ids
      // as strings (or vice versa), and a strict `===` there silently
      // matches nothing, which looks exactly like "nothing happened".
      setOrders(prev =>
        prev.map(o => {
          if (String(o.id) === key) {
            snapshot = o;
            return { ...o, ...patch };
          }
          return o;
        })
      );

      if (!snapshot && typeof window !== 'undefined') {
        // Dev aid: if this fires, the id you passed doesn't match any order
        // in local state — check that BackendOrder.id and the value you're
        // passing as orderId are really the same field.
        console.warn(`[useOptimisticOrders] no order found with id "${orderId}" — update was a no-op.`);
      }

      setPendingIds(prev => new Set(prev).add(key));

      try {
        // 2. Fire the request in the background.
        const result = await apiCall();
        if (successMessage) addToast(successMessage, 'success');
        onSuccess?.(result);
        return result;
      } catch (err: any) {
        // 3. Roll back to the exact pre-mutation state.
        if (snapshot) {
          const restored = snapshot;
          setOrders(prev => prev.map(o => (String(o.id) === key ? restored : o)));
        }
        const msg = err?.response?.data?.detail ?? errorMessage ?? 'Une erreur est survenue';
        addToast(msg, 'error');
        return undefined;
      } finally {
        setPendingIds(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [setOrders, addToast]
  );

  return { runOptimisticUpdate, pendingIds };
}