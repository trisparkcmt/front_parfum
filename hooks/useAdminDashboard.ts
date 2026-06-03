'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';

export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalDeliveries: number;
}

export const useAdminDashboard = () => {
  const { addToast } = useToastStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch users count
        const usersResponse = await adminService.getUsers({ page: 1 });
        const totalUsers = usersResponse.count || 0;

        // Fetch providers count (for revenue/partner management)
        const providersResponse = await adminService.getProviders();
        const totalProviders = providersResponse.count || 0;

        // Fetch delivery drivers count
        const driversResponse = await adminService.getDeliveryDrivers();
        const totalDrivers = driversResponse.count || 0;

        setStats({
          totalUsers,
          totalOrders: 0, // Will be updated when order endpoints are enabled
          totalRevenue: 0, // Will be updated when order endpoints are enabled
          totalDeliveries: totalDrivers,
        });
      } catch (err: any) {
        console.error('Failed to load dashboard stats:', err);
        const errorMsg = err.response?.data?.detail || 'Failed to load dashboard stats';
        setError(errorMsg);
        addToast(errorMsg, 'error');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [addToast]);

  return { stats, loading, error };
};
