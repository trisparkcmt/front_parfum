'use client';

import { useState, useEffect } from 'react';
import { adminService as adminApi, orderService } from '@/services/apiService';
import { adminService as adminHelpers, type BestClient, type BestProvider } from '@/services/adminService';
import { useToastStore } from '@/store/useToastStore';
import {
  Users, Truck, Store, ShoppingBag, Loader2, ArrowUpRight,
  Crown, Star, ShoppingCart, BarChart3, Globe
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

function cx(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

function StatusChip({ label, color = 'gold' }: { label: string; color?: 'emerald' | 'blue' | 'amber' | 'red' | 'purple' | 'gold' }) {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20',
    blue: 'text-blue-400 bg-blue-500/10 ring-blue-500/20',
    amber: 'text-amber-400 bg-amber-500/10 ring-amber-500/20',
    red: 'text-red-400 bg-red-500/10 ring-red-500/20',
    purple: 'text-purple-400 bg-purple-500/10 ring-purple-500/20',
    gold: 'text-gold bg-gold/10 ring-gold/20',
  };

  const dotColorMap = {
    emerald: 'bg-emerald-400',
    blue: 'bg-blue-400',
    amber: 'bg-amber-400',
    red: 'bg-red-400',
    purple: 'bg-purple-400',
    gold: 'bg-gold',
  };

  return (
    <span className={cx(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset',
      colorMap[color]
    )}>
      <span className={cx('h-1.5 w-1.5 rounded-full', dotColorMap[color])} />
      {label}
    </span>
  );
}

function IconButton({ href, icon, hoverColor = 'gold' }: { href: string; icon: React.ReactNode; hoverColor?: 'gold' | 'emerald' | 'blue' | 'red' }) {
  const hoverMap = {
    gold: 'hover:text-gold hover:bg-gold/10',
    emerald: 'hover:text-emerald-400 hover:bg-emerald-500/10',
    blue: 'hover:text-blue-400 hover:bg-blue-500/10',
    red: 'hover:text-red-400 hover:bg-red-500/10',
  };

  return (
    <Link
      href={href}
      className={cx(
        'rounded-md p-1.5 text-foreground/45 transition-colors inline-flex items-center justify-center',
        hoverMap[hoverColor]
      )}
    >
      {icon}
    </Link>
  );
}

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
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl font-semibold text-foreground">Vue d'ensemble</h1>
        <p className="text-sm text-foreground/40 mt-0.5">
          Suivi des indicateurs clés, classements et données d'audience
        </p>
      </div>

      {/* ── KPI Stat Strip ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-gold">
            <Loader2 className="animate-spin" size={20} />
            <span className="text-xs text-foreground/40 ml-2">Chargement des indicateurs...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-white/8 gap-y-4 lg:gap-y-0">
            {[
              { label: 'Utilisateurs', value: dashboardData.totalUsers, href: '/dashboard/admin/clients' },
              { label: 'Prestataires', value: dashboardData.totalProviders, href: '/dashboard/admin/providers' },
              { label: 'Livreurs', value: dashboardData.totalDeliveryDrivers, href: '/dashboard/admin/delivery' },
              { label: 'Commandes', value: dashboardData.totalOrders, href: '/dashboard/admin/order' },
            ].map((stat, index) => (
              <div key={stat.label} className={cx('px-4', index === 0 && 'pl-0 lg:pl-0', index > 0 && 'pt-4 lg:pt-0')}>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{stat.label}</p>
                  <IconButton href={stat.href} icon={<ArrowUpRight size={14} />} hoverColor="gold" />
                </div>
                <p className="text-xl font-semibold tabular-nums text-foreground mt-1">{stat.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Top 5 Clients + Top 5 Prestataires ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top 5 Clients Table Container */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                Top 5 Clients
              </span>
              <IconButton href="/dashboard/admin/clients" icon={<ArrowUpRight size={14} />} hoverColor="gold" />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12 text-gold">
                <Loader2 className="animate-spin" size={20} />
                <span className="text-xs text-foreground/40 ml-2">Chargement...</span>
              </div>
            ) : topClients.length === 0 ? (
              <div className="py-12 text-center text-sm italic text-foreground/30">
                Aucune donnée disponible
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {topClients.map((client, i) => (
                  <div key={client.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <RankBadge rank={i + 1} />
                    </div>
                    <div className="w-7 h-7 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold text-xs font-semibold shrink-0">
                      {(client.user_details?.first_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {client.user_details?.first_name} {client.user_details?.last_name}
                      </p>
                      <p className="text-[10px] text-foreground/40 truncate">{client.user_details?.email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold tabular-nums text-gold">{(client.points_fidelite ?? 0).toLocaleString()}</p>
                      <p className="text-[10px] text-foreground/35 uppercase tracking-wider">pts</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top 5 Prestataires Table Container */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                Top 5 Prestataires
              </span>
              <IconButton href="/dashboard/admin/providers" icon={<ArrowUpRight size={14} />} hoverColor="emerald" />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12 text-gold">
                <Loader2 className="animate-spin" size={20} />
                <span className="text-xs text-foreground/40 ml-2">Chargement...</span>
              </div>
            ) : topProviders.length === 0 ? (
              <div className="py-12 text-center text-sm italic text-foreground/30">
                Aucune donnée disponible
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {topProviders.map((provider, i) => (
                  <div key={provider.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      <RankBadge rank={i + 1} />
                    </div>
                    <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-semibold shrink-0">
                      {(provider.user_details?.first_name || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {provider.user_details?.first_name} {provider.user_details?.last_name}
                      </p>
                      <p className="text-[10px] font-mono text-foreground/40">{provider.code_promo}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold tabular-nums text-emerald-400">
                        {Number(provider.solde_commission).toLocaleString('fr-FR')}
                      </p>
                      <p className="text-[10px] text-foreground/35 uppercase tracking-wider">FCFA</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Google Analytics 4 Section ─────────────────────────────────── */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        {/* Header & Quiet Underline Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 pt-4 border-b border-white/10 gap-3">
          <div className="flex items-center gap-2 pb-3 sm:pb-4">
            <BarChart3 size={16} className="text-gold" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Analyses d'Audience (GA4)
            </h2>
            {isMockAnalytics && (
              <StatusChip label="Mode Démo" color="gold" />
            )}
          </div>

          <div className="flex gap-6 border-b border-white/10 sm:border-b-0 -mb-px sm:mb-0">
            <button
              onClick={() => setActiveAnalyticsTab('custom')}
              className={cx(
                "pb-3 text-xs font-medium transition-colors border-b-2 -mb-px cursor-pointer",
                activeAnalyticsTab === 'custom'
                  ? "border-gold text-gold font-semibold"
                  : "border-transparent text-foreground/45 hover:text-foreground"
              )}
            >
              Graphique personnalisé
            </button>
            <button
              onClick={() => setActiveAnalyticsTab('looker')}
              className={cx(
                "pb-3 text-xs font-medium transition-colors border-b-2 -mb-px cursor-pointer",
                activeAnalyticsTab === 'looker'
                  ? "border-gold text-gold font-semibold"
                  : "border-transparent text-foreground/45 hover:text-foreground"
              )}
            >
              Looker Studio Embed
            </button>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gold">
              <Loader2 className="animate-spin" size={20} />
              <span className="text-xs text-foreground/40 ml-2">Chargement de l'analyse...</span>
            </div>
          ) : activeAnalyticsTab === 'custom' ? (
            <div>
              {analyticsData.length === 0 ? (
                <div className="py-16 text-center text-sm italic text-foreground/30">
                  Aucune donnée d'analyse disponible
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Stats Sub-strip */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 max-w-sm">
                    <div className="grid grid-cols-2 divide-x divide-white/8">
                      <div className="pr-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                          Utilisateurs (7j)
                        </p>
                        <p className="text-xl font-semibold tabular-nums text-foreground mt-0.5">
                          {analyticsData.reduce((acc, cur) => acc + cur.users, 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="pl-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                          Vues de Page (7j)
                        </p>
                        <p className="text-xl font-semibold tabular-nums text-gold mt-0.5">
                          {analyticsData.reduce((acc, cur) => acc + cur.views, 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-[280px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={analyticsData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#C5A059" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDateLabel}
                          stroke="rgba(255,255,255,0.4)"
                          fontSize={11}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--background)',
                            border: '1px solid rgba(255,255,255,0.1)',
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
            <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-background aspect-[16/10] lg:aspect-[16/9]">
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