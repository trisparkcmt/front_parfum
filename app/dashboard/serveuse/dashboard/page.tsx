'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { shopService, orderService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Gem, Loader2, ArrowUpRight, ShoppingCart, Droplets } from 'lucide-react';
import { PerfumeIcon } from '@/components/icons/CustomIcons';
import { DashboardKpiStrip, DashboardPageHeader } from '@/components/admin/dashboard/shared';

export default function ServeuseDashboardPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    ordersCount: 0,
    accessoriesCount: 0,
    bottlesCount: 0,
    perfumesCount: 0
  });
  const { addToast } = useToastStore();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [ordersRes, accessoriesRes, bottlesRes, perfumesRes] = await Promise.all([
          orderService.getOrders({ page: 1 }),
          shopService.getAccessories({ page: 1 }),
          shopService.getBottles(),
          shopService.getPerfumes({ page: 1 }),
        ]);

        const ordersList = ordersRes.results || ordersRes.resultats || (Array.isArray(ordersRes) ? ordersRes : []);
        const accList = accessoriesRes.results || accessoriesRes.resultats || (Array.isArray(accessoriesRes) ? accessoriesRes : []);
        const botList = bottlesRes.results || bottlesRes.resultats || (Array.isArray(bottlesRes) ? bottlesRes : []);
        const perfList = perfumesRes.results || perfumesRes.resultats || (Array.isArray(perfumesRes) ? perfumesRes : []);

        setStats({
          ordersCount: ordersRes.count || ordersList.length || 0,
          accessoriesCount: accessoriesRes.count || accList.length || 0,
          bottlesCount: bottlesRes.count || botList.length || 0,
          perfumesCount: perfumesRes.count || perfList.length || 0,
        });
      } catch (error: any) {
        console.error('Failed to load serveuse dashboard data:', error);
        addToast(t('dashboard_load_error', { defaultValue: 'Erreur de chargement du tableau de bord' }), 'error');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [addToast]);

  const kpis = [
    { label: t('orders', { defaultValue: 'Commandes' }), value: loading ? '—' : stats.ordersCount, icon: <ShoppingBag size={15} />, color: 'text-purple-400' },
    { label: t('perfumes', { defaultValue: 'Parfums' }), value: loading ? '—' : stats.perfumesCount, icon: <PerfumeIcon size={15} />, color: 'text-gold' },
    { label: t('accessories', { defaultValue: 'Accessoires' }), value: loading ? '—' : stats.accessoriesCount, icon: <Gem size={15} />, color: 'text-emerald-400' },
    { label: t('bottles', { defaultValue: 'Flacons' }), value: loading ? '—' : stats.bottlesCount, icon: <Droplets size={15} />, color: 'text-blue-400' },
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t('serveuse_space', { defaultValue: 'Espace Serveuse' })}
        description={t('serveuse_overview', { defaultValue: "Vue d'ensemble des activités de la boutique" })}
        actions={(
          <Link
            href="/dashboard/pos"
            className="inline-flex items-center gap-2 self-start rounded-xl bg-gold px-4 py-2.5 font-semibold text-slate-900 transition-all hover:bg-gold/90"
          >
            <ShoppingCart size={18} />
            <span>{t('point_of_sale', { defaultValue: 'Point de Vente' })}</span>
          </Link>
        )}
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          ))}
        </div>
      ) : (
        <DashboardKpiStrip items={kpis} />
      )}
    </div>
  );
}
