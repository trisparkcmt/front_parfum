'use client';

import { useState, useEffect } from 'react';
import { adminService as adminApi, orderService } from '@/services/apiService';
import { adminService as adminHelpers, type BestClient, type BestProvider } from '@/services/adminService';
import { useToastStore } from '@/store/useToastStore';
import {
  Users, Truck, Store, ShoppingBag, Loader2, ArrowUpRight,
  Crown, Trophy, TrendingUp, Star, ShoppingCart, BarChart3, Globe
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown size={14} className="text-gold" />;
  if (rank === 2) return <Star size={14} className="text-slate-400" />;
  if (rank === 3) return <Star size={14} className="text-amber-700" />;
  return <span className="text-[11px] font-bold text-foreground/30">#{rank}</span>;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalProviders: 0,
    totalDeliveryDrivers: 0,
    totalOrders: 0,
    revenus_totaux: 0,
    nombre_ventes: 0,
  });
  const [topClients, setTopClients] = useState<BestClient[]>([]);
  const [topProviders, setTopProviders] = useState<BestProvider[]>([]);
  const [analyticsData, setAnalyticsData] = useState<{ date: string; users: number; views: number; }[]>([]);
  const [isMockAnalytics, setIsMockAnalytics] = useState(false);
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<'custom' | 'looker'>('custom');
  const { addToast } = useToastStore();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [usersRes, providersRes, driversRes, ordersRes, statsRes, topClientsRes, topProvidersRes, analyticsRes] = await Promise.all([
          adminApi.getUsers({ page: 1 }),
          adminApi.getProviders(),
          adminApi.getDeliveryDrivers(),
          orderService.getOrders({ page: 1 }),
          adminApi.getGlobalStats().catch(() => ({})),
          adminHelpers.getBestClients('spent', 5).catch(() => []),
          adminHelpers.getBestProviders('gains', 5).catch(() => []),
          fetch('/api/analytics').then(res => res.json()).catch(() => ({ data: [], isMock: true })),
        ]);

        const ordersList = ordersRes.results || ordersRes.resultats || (Array.isArray(ordersRes) ? ordersRes : []);

        setDashboardData({
          totalUsers: usersRes.count || usersRes.length || 0,
          totalProviders: providersRes.count || providersRes.length || 0,
          totalDeliveryDrivers: driversRes.count || driversRes.length || 0,
          totalOrders: ordersRes.count || ordersList.length || 0,
          revenus_totaux: (statsRes as any)?.revenus_totaux || 0,
          nombre_ventes: (statsRes as any)?.nombre_ventes || 0,
        });

        // Top clients — may be array or paginated
        const clients = Array.isArray(topClientsRes)
          ? topClientsRes
          : (topClientsRes as any).results || [];
        setTopClients(clients.slice(0, 5));

        // Top providers — may be array or paginated
        const providers = Array.isArray(topProvidersRes)
          ? topProvidersRes
          : (topProvidersRes as any).results || [];
        setTopProviders(providers.slice(0, 5));

        setAnalyticsData(analyticsRes.data || []);
        setIsMockAnalytics(!!analyticsRes.isMock);
      } catch (error: any) {
        console.error('Failed to load dashboard data:', error);
        addToast('Erreur lors du chargement du tableau de bord', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [addToast]);

  const formatDateLabel = (dateStr: string) => {
    if (dateStr.length !== 8) return dateStr;
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    return `${day}/${month}`;
  };

  return (
    <div className="space-y-6">
      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/10 animate-pulse" />
            ))
          : [
              { label: 'Utilisateurs',  value: dashboardData.totalUsers,           icon: <Users size={20} />,       color: 'text-blue-400 bg-blue-500/10',    href: '/dashboard/admin/clients' },
              { label: 'Prestataires',  value: dashboardData.totalProviders,        icon: <Store size={20} />,       color: 'text-gold bg-gold/10',            href: '/dashboard/admin/providers' },
              { label: 'Livreurs',      value: dashboardData.totalDeliveryDrivers,  icon: <Truck size={20} />,       color: 'text-emerald-400 bg-emerald-500/10', href: '/dashboard/admin/delivery' },
              { label: 'Commandes',     value: dashboardData.totalOrders,           icon: <ShoppingBag size={20} />, color: 'text-purple-400 bg-purple-500/10', href: '/dashboard/admin/order' },
            ].map((stat) => (
              <Link
                key={stat.label}
                href={stat.href}
                className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm group hover:border-gold/30 transition-all block"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <ArrowUpRight size={14} className="text-foreground/20 group-hover:text-gold transition-colors" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-foreground/40 mt-0.5">{stat.label}</p>
              </Link>
            ))
        }
      </div>

      {/* ── Top 5 Clients + Top 5 Prestataires ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top 5 Clients */}
        <div className="bg-white/5 rounded-2xl border border-white/10 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-gold" />
              <h2 className="text-sm font-bold text-foreground">Top 5 Clients</h2>
            </div>
            <Link
              href="/dashboard/admin/clients"
              className="flex items-center gap-1 text-xs text-foreground/40 hover:text-gold transition-colors"
            >
              Voir tout <ArrowUpRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-gold">
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : topClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-foreground/20 gap-2">
              <Users size={32} />
              <p className="text-xs italic">Aucune donnée disponible</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {topClients.map((client, i) => (
                <div key={client.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.03] transition-colors">
                  <div className="w-6 flex items-center justify-center shrink-0">
                    <RankBadge rank={i + 1} />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold/30 to-gold-dark/30 flex items-center justify-center text-gold text-xs font-bold shrink-0">
                    {(client.user_details?.first_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {client.user_details?.first_name} {client.user_details?.last_name}
                    </p>
                    <p className="text-[10px] text-foreground/40 truncate">{client.user_details?.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gold">{(client.points_fidelite ?? 0).toLocaleString()}</p>
                    <p className="text-[10px] text-foreground/40">pts</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top 5 Prestataires */}
        <div className="bg-white/5 rounded-2xl border border-white/10 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-400" />
              <h2 className="text-sm font-bold text-foreground">Top 5 Prestataires</h2>
            </div>
            <Link
              href="/dashboard/admin/providers"
              className="flex items-center gap-1 text-xs text-foreground/40 hover:text-emerald-400 transition-colors"
            >
              Voir tout <ArrowUpRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-gold">
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : topProviders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-foreground/20 gap-2">
              <Store size={32} />
              <p className="text-xs italic">Aucune donnée disponible</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {topProviders.map((provider, i) => (
                <div key={provider.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.03] transition-colors">
                  <div className="w-6 flex items-center justify-center shrink-0">
                    <RankBadge rank={i + 1} />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-700/30 flex items-center justify-center text-emerald-400 text-xs font-bold shrink-0">
                    {(provider.user_details?.first_name || 'P').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {provider.user_details?.first_name} {provider.user_details?.last_name}
                    </p>
                    <p className="text-[10px] font-mono text-foreground/40">{provider.code_promo}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-emerald-400">
                      {Number(provider.solde_commission).toLocaleString('fr-FR')}
                    </p>
                    <p className="text-[10px] text-foreground/40">FCFA</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Google Analytics 4 Section ─────────────────────────────────── */}
      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-white/10 gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-gold" />
            <h2 className="text-sm font-bold text-foreground">Analyses d'Audience (Google Analytics 4)</h2>
            {isMockAnalytics && (
              <span className="text-[10px] bg-gold/10 border border-gold/30 text-gold px-2 py-0.5 rounded-full font-medium">
                Mode Démo
              </span>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setActiveAnalyticsTab('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                activeAnalyticsTab === 'custom'
                  ? 'bg-gold/10 border-gold/40 text-gold'
                  : 'bg-white/5 border-white/10 text-foreground/70 hover:text-foreground'
              }`}
            >
              Graphique personnalisé
            </button>
            <button
              onClick={() => setActiveAnalyticsTab('looker')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                activeAnalyticsTab === 'looker'
                  ? 'bg-gold/10 border-gold/40 text-gold'
                  : 'bg-white/5 border-white/10 text-foreground/70 hover:text-foreground'
              }`}
            >
              Looker Studio Embed
            </button>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-24 text-gold">
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : activeAnalyticsTab === 'custom' ? (
            <div>
              {analyticsData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-foreground/20 gap-2">
                  <BarChart3 size={32} />
                  <p className="text-xs italic">Aucune donnée d'analyse disponible</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 max-w-sm mb-2">
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                      <p className="text-[10px] text-foreground/40 uppercase tracking-wider font-semibold">Total Utilisateurs (7j)</p>
                      <p className="text-xl font-bold text-foreground">
                        {analyticsData.reduce((acc, cur) => acc + cur.users, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                      <p className="text-[10px] text-foreground/40 uppercase tracking-wider font-semibold">Total Vues de Page (7j)</p>
                      <p className="text-xl font-bold text-gold">
                        {analyticsData.reduce((acc, cur) => acc + cur.views, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={analyticsData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#C5A059" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDateLabel}
                          stroke="#666"
                          fontSize={11}
                          tickLine={false}
                        />
                        <YAxis stroke="#666" fontSize={11} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#111',
                            borderColor: '#333',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '12px'
                          }}
                          labelFormatter={(label) => `Date: ${formatDateLabel(label as string)}`}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Area
                          type="monotone"
                          name="Utilisateurs actifs"
                          dataKey="users"
                          stroke="#C5A059"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorUsers)"
                        />
                        <Area
                          type="monotone"
                          name="Vues d'écran"
                          dataKey="views"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorViews)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative w-full overflow-hidden rounded-xl border border-white/5 bg-[#111] aspect-[16/10] lg:aspect-[16/9]">
              <iframe
                width="100%"
                height="100%"
                src="https://datastudio.google.com/embed/reporting/eae29829-7867-4850-8ec9-6f0e8903c6ca/page/cEN3F"
                frameBorder="0"
                style={{ border: 0 }}
                allowFullScreen
                sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
