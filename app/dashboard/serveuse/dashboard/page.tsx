'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { shopService, orderService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { ShoppingBag, Gem, Droplets, Sparkles, Loader2, ArrowUpRight, ShoppingCart } from 'lucide-react';

export default function ServeuseDashboardPage() {
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
        addToast('Erreur de chargement du tableau de bord', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [addToast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Espace Serveuse</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Vue d'ensemble des activités de la boutique</p>
        </div>
        <Link
          href="/dashboard/pos"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold hover:bg-gold-light text-slate-900 font-semibold transition-all"
        >
          <ShoppingCart size={18} />
          <span>Point de Vente</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/10 animate-pulse" />
          ))
        ) : (
          <>
            {[
              { label: 'Commandes', value: stats.ordersCount, icon: <ShoppingBag size={20} />, color: 'text-purple-400 bg-purple-500/10' },
              { label: 'Parfums', value: stats.perfumesCount, icon: <Sparkles size={20} />, color: 'text-gold bg-gold/10' },
              { label: 'Accessoires', value: stats.accessoriesCount, icon: <Gem size={20} />, color: 'text-emerald-400 bg-emerald-500/10' },
              { label: 'Flacons', value: stats.bottlesCount, icon: <Droplets size={20} />, color: 'text-blue-400 bg-blue-500/10' },
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
