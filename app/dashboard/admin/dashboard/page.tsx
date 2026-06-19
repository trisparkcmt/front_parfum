'use client';

import { useState, useEffect } from 'react';
import { BackButton } from '@/components/ui/BackButton';
import { adminService, orderService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { Users, Truck, Store, ShoppingBag, Loader2, ArrowUpRight } from 'lucide-react';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalProviders: 0,
    totalDeliveryDrivers: 0,
    totalOrders: 0,
    revenus_totaux: 0,
    nombre_ventes: 0
  });
  const { addToast } = useToastStore();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [usersRes, providersRes, driversRes, ordersRes, statsRes] = await Promise.all([
          adminService.getUsers({ page: 1 }),
          adminService.getProviders(),
          adminService.getDeliveryDrivers(),
          orderService.getOrders({ page: 1 }),
          adminService.getGlobalStats().catch(() => ({})),
        ]);

        const ordersList = ordersRes.results || ordersRes.resultats || (Array.isArray(ordersRes) ? ordersRes : []);

        setDashboardData({
          totalUsers: usersRes.count || usersRes.length || 0,
          totalProviders: providersRes.count || providersRes.length || 0,
          totalDeliveryDrivers: driversRes.count || driversRes.length || 0,
          totalOrders: ordersRes.count || ordersList.length || 0,
          revenus_totaux: statsRes?.revenus_totaux || 0,
          nombre_ventes: statsRes?.nombre_ventes || 0,
        });
      } catch (error: any) {
        console.error('Failed to load dashboard data:', error);
        addToast('Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [addToast]);

  return (
    <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/10 animate-pulse" />
                  ))
                ) : (
                  <>
                    {[
                      { label: 'Utilisateurs', value: dashboardData.totalUsers, icon: <Users size={20} />, color: 'text-blue-400 bg-blue-500/10' },
                      { label: 'Prestataires', value: dashboardData.totalProviders, icon: <Store size={20} />, color: 'text-gold bg-gold/10' },
                      { label: 'Livreurs', value: dashboardData.totalDeliveryDrivers, icon: <Truck size={20} />, color: 'text-emerald-400 bg-emerald-500/10' },
                      { label: 'Commandes', value: dashboardData.totalOrders, icon: <ShoppingBag size={20} />, color: 'text-purple-400 bg-purple-500/10' },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-2xl group hover:border-gold/30 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                            {stat.icon}
                          </div>
                          <ArrowUpRight size={14} className="text-foreground/20 group-hover:text-gold transition-colors" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        <p className="text-xs text-foreground/40 mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>
    </div>
  );
}
