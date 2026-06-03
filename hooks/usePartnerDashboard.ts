'use client';

import { useEffect, useState } from 'react';
import { partnerService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';

export interface PartnerDashboardData {
  totalSales: number;
  totalEarnings: number;
  totalOrders: number;
  commissionRate: number;
  payoutHistory: any[];
}

export const usePartnerDashboard = () => {
  const { addToast } = useToastStore();
  const [data, setData] = useState<PartnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPartnerData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [dashboardRes, historyRes] = await Promise.all([
          partnerService.getPartnerDashboard(),
          partnerService.getPartnerHistory(),
        ]);

        setData({
          totalSales: dashboardRes.total_sales || 0,
          totalEarnings: dashboardRes.total_earnings || 0,
          totalOrders: dashboardRes.total_orders || 0,
          commissionRate: dashboardRes.commission_rate || 0,
          payoutHistory: historyRes.results || historyRes || [],
        });
      } catch (err: any) {
        console.error('Failed to load partner dashboard:', err);
        const errorMsg = err.response?.data?.detail || 'Failed to load partner dashboard';
        setError(errorMsg);
        addToast(errorMsg, 'error');
      } finally {
        setLoading(false);
      }
    };

    loadPartnerData();
  }, [addToast]);

  return { data, loading, error };
};
