'use client';

import { useEffect, useState } from 'react';
import { useToastStore } from '@/store/useToastStore';
import { api } from '@/services/api';
import { Order } from '@/types';

export const useClientDashboard = () => {
  const { addToast } = useToastStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        // Note: Order endpoints are currently disabled in the backend
        // This placeholder will work once they're re-enabled
        try {
          const response = await api.get('shop/commandes/');
          setOrders(response.data.results || response.data.resultats || response.data || []);
        } catch (err: any) {
          // Order endpoints not available yet
          console.log('Order endpoints not available yet:', err.response?.status);
          setOrders([]);
        }
      } catch (err: any) {
        console.error('Failed to load orders:', err);
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [addToast]);

  return { orders, loading, error };
};
