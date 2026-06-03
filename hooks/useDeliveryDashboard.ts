'use client';

import { useEffect, useState } from 'react';
import { deliveryService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';

export interface DeliveryTask {
  id: number;
  orderId: string;
  clientName: string;
  clientPhone: string;
  items: any[];
  total: number;
  status: 'delivering' | 'delivered' | 'failed';
  assignedAt: string;
  deliveryAddress?: string;
}

export const useDeliveryDashboard = () => {
  const { addToast } = useToastStore();
  const [tasks, setTasks] = useState<DeliveryTask[]>([]);
  const [stats, setStats] = useState({
    totalAssigned: 0,
    totalDelivered: 0,
    totalFailed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDeliveryData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [dashboardRes, deliveriesRes] = await Promise.all([
          deliveryService.getDeliveryDashboard(),
          deliveryService.getDeliveries(),
        ]);

        const allDeliveries = deliveriesRes.results || deliveriesRes || [];
        setTasks(allDeliveries);

        const delivered = allDeliveries.filter((d: any) => d.status === 'delivered').length;
        const failed = allDeliveries.filter((d: any) => d.status === 'failed').length;

        setStats({
          totalAssigned: allDeliveries.length,
          totalDelivered: delivered,
          totalFailed: failed,
        });
      } catch (err: any) {
        console.error('Failed to load delivery dashboard:', err);
        const errorMsg = err.response?.data?.detail || 'Failed to load delivery data';
        setError(errorMsg);
        addToast(errorMsg, 'error');
      } finally {
        setLoading(false);
      }
    };

    loadDeliveryData();
  }, [addToast]);

  return { tasks, stats, loading, error };
};
