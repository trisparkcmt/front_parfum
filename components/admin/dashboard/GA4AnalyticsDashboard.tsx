'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Percent, 
  Loader2, 
  AlertCircle,
  BarChart3,
  Globe,
  Layers,
  FileText,
  Monitor,
  X,
  ExternalLink,
  Share2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

/* ─── Inline translations ─────────────────────────────────────────────────── */
const TG = {
  fr: {
    title: 'Statistiques Google Analytics 4 (30 derniers jours)',
    subtitle: 'Analytics avancées traitées en batch avec batchRunReports',
    badge: 'Batch API Client',
    loading: 'Traitement batch des rapports Google Analytics 4…',
    error_title: 'Synchronisation GA4 échouée',
    error_env: 'Vérifiez vos variables d\'environnement',
    kpi_revenue: 'Chiffre d\'affaires',
    kpi_revenue_sub: 'Total des ventes',
    kpi_sales: 'Nombre de ventes',
    kpi_sales_sub: 'Transactions réussies',
    kpi_conv: 'Conversion globale',
    kpi_conv_sub: 'Sessions ayant acheté',
    kpi_visitors: 'Visiteurs uniques',
    kpi_visitors_sub: 'Portée globale du funnel',
    kpi_aov: 'Panier moyen',
    kpi_aov_sub: 'CA moy. / achat',
    funnel_title: 'Entonnoir de conversion e-commerce',
    device_title: 'Appareils & Navigateurs',
    device_legend: 'Par appareil',
    browser_legend: 'Par navigateur',
    view_all_browsers: 'Voir les {n} navigateurs',
    funnel_detail_title: 'Détail des étapes du funnel',
    col_step: 'Étape',
    col_events: 'Événements',
    col_users: 'Utilisateurs',
    col_sales: 'Ventes',
    col_revenue: 'CA',
    col_conv: 'Conv.',
    acquisition_title: 'Canaux d\'acquisition',
    col_source: 'Source / Medium',
    col_sessions: 'Sessions',
    view_all_channels: 'Voir les {n} canaux',
    pages_title: 'Pages les plus consultées',
    col_page: 'Page',
    col_views: 'Vues',
    view_all_pages: 'Voir les {n} pages',
    geo_title: 'Villes & Régions actives',
    col_country: 'Pays',
    col_city: 'Ville',
    col_new: 'Nouveaux',
    view_all_locations: 'Voir les {n} localisations',
    shares_title: 'Produits les plus partagés',
    shares_sub: '(30 derniers jours)',
    shares_label: 'partages',
    no_channels: 'Aucun canal disponible',
    no_pages: 'Aucune page disponible',
    no_locations: 'Aucune localisation disponible',
    modal_device: 'Répartition appareils & navigateurs',
    modal_device_legend: 'Par appareil',
    modal_browser_legend: 'Par navigateur',
    modal_full_breakdown: 'Détail complet (Appareil × Navigateur)',
    sessions_abbr: 'sess.',
    users_abbr: 'util.',
    modal_acquisition: 'Tous les canaux d\'acquisition',
    modal_pages: 'Toutes les pages',
    modal_geo: 'Toutes les localisations',
    new_users_abbr: 'Nouv.',
    funnel_events: 'Événements',
    funnel_uniq_users: 'Utilisateurs uniques',
  },
  en: {
    title: 'Google Analytics 4 Statistics (Last 30 days)',
    subtitle: 'Advanced analytics batch-processed with batchRunReports',
    badge: 'Batch API Client',
    loading: 'Batch-processing Google Analytics 4 reports...',
    error_title: 'GA4 Synchronization Failed',
    error_env: 'Check your environment variables',
    kpi_revenue: 'Revenue',
    kpi_revenue_sub: 'Total revenue',
    kpi_sales: 'Number of Sales',
    kpi_sales_sub: 'Successful transactions',
    kpi_conv: 'Overall Conversion',
    kpi_conv_sub: 'Purchased sessions',
    kpi_visitors: 'Unique Visitors',
    kpi_visitors_sub: 'Global funnel reach',
    kpi_aov: 'AOV',
    kpi_aov_sub: 'Avg revenue / purchase',
    funnel_title: 'E-Commerce Conversion Funnel',
    device_title: 'Device & Browser',
    device_legend: 'By Device',
    browser_legend: 'By Browser',
    view_all_browsers: 'View all {n} browsers',
    funnel_detail_title: 'Funnel Step Details',
    col_step: 'Step',
    col_events: 'Events',
    col_users: 'Users',
    col_sales: 'Sales',
    col_revenue: 'Revenue',
    col_conv: 'Conv. Rate',
    acquisition_title: 'Acquisition Channels',
    col_source: 'Source / Medium',
    col_sessions: 'Sessions',
    view_all_channels: 'View all {n} channels',
    pages_title: 'Most Viewed Pages',
    col_page: 'Page',
    col_views: 'Views',
    view_all_pages: 'View all {n} pages',
    geo_title: 'Active Cities & Regions',
    col_country: 'Country',
    col_city: 'City',
    col_new: 'New',
    view_all_locations: 'View all {n} locations',
    shares_title: 'Most Shared Products',
    shares_sub: '(Last 30 days)',
    shares_label: 'shares',
    no_channels: 'No channels available',
    no_pages: 'No pages available',
    no_locations: 'No locations available',
    modal_device: 'Device & Browser Breakdown',
    modal_device_legend: 'By Device',
    modal_browser_legend: 'By Browser',
    modal_full_breakdown: 'Full Breakdown (Device × Browser)',
    sessions_abbr: 'sess.',
    users_abbr: 'usr',
    modal_acquisition: 'All Acquisition Channels',
    modal_pages: 'All Pages',
    modal_geo: 'All Locations',
    new_users_abbr: 'New',
    funnel_events: 'Events',
    funnel_uniq_users: 'Unique Users',
  },
} as const;
type TGKey = keyof typeof TG.fr;

/* ─── Types ───────────────────────────────────────────────────────────────── */
interface FunnelStep {
  step: string;
  eventCount: number;
  revenue: number;
  sales: number;
  conversionRate: number;
  totalUsers: number;
}
interface AcquisitionChannel {
  sourceMedium: string;
  users: number;
  revenue: number;
  sessions: number;
}
interface PageMetric {
  path: string;
  views: number;
  users: number;
}
interface TechMetric {
  device: string;
  browser: string;
  users: number;
  sessions: number;
}
interface GeoMetric {
  country: string;
  city: string;
  users: number;
  newUsers: number;
}
interface ShareMetric {
  name: string;
  shares: number;
}
interface GA4BatchResponse {
  funnel: FunnelStep[];
  acquisition: AcquisitionChannel[];
  pages: PageMetric[];
  tech: TechMetric[];
  geo: GeoMetric[];
  shares: ShareMetric[];
}

/* ─── Constants ───────────────────────────────────────────────────────────── */
const STEP_LABELS: Record<string, string> = {
  view_item_list: '1. Catalog Views',
  view_item: '2. Product Views',
  add_to_cart: '3. Cart Additions',
  remove_from_cart: '4. Cart Abandonments',
  begin_checkout: '5. Checkout Initiated',
  purchase: '6. Purchases',
};
const STEP_COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ef4444', '#ec4899', '#c5a059'];

/* ─── Reusable Modal ──────────────────────────────────────────────────────── */
function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div className="relative w-full max-w-2xl max-h-[80vh] flex flex-col bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-foreground/50 hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function GA4AnalyticsDashboard() {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en') ?? false;
  const tg = (k: TGKey, vars?: Record<string, number>) => {
    let s: string = String(isEn ? TG.en[k] : TG.fr[k]);
    if (vars) for (const [key, val] of Object.entries(vars)) s = s.replace(`{${key}}`, String(val));
    return s;
  };

  const [data, setData] = useState<GA4BatchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal open state
  const [modalOpen, setModalOpen] = useState<
    'devices' | 'acquisition' | 'pages' | 'geo' | null
  >(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics');
        if (!response.ok) throw new Error(`Error: ${response.status} ${response.statusText}`);
        const result = await response.json();
        if (result.error) throw new Error(result.error);
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Unable to load Google Analytics 4 data');
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4 bg-white/5 border border-white/10 rounded-2xl p-8">
        <Loader2 className="h-8 w-8 text-gold animate-spin" />
        <p className="text-sm text-foreground/60">{tg('loading')}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4 bg-red-500/5 border border-red-500/10 rounded-2xl p-8 text-center">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <h3 className="font-semibold text-foreground">{tg('error_title')}</h3>
        <p className="text-xs text-foreground/60 max-w-md">{error || 'Unknown error'}</p>
        <div className="text-[11px] text-foreground/30 mt-2">
          {tg('error_env')}{' '}
          <code className="bg-white/5 px-1 py-0.5 rounded">GOOGLE_CLIENT_EMAIL</code>,{' '}
          <code className="bg-white/5 px-1 py-0.5 rounded">GOOGLE_PRIVATE_KEY</code>,{' '}
          <code className="bg-white/5 px-1 py-0.5 rounded">GA_PROPERTY_ID</code>.
        </div>
      </div>
    );
  }

  /* ── Derived data ── */
  const purchaseStep = data.funnel.find(d => d.step === 'purchase');
  const revenueTotal = purchaseStep?.revenue ?? 0;
  const salesCount   = purchaseStep?.sales ?? 0;
  const conversionRate = purchaseStep?.conversionRate ?? 0;
  const globalTraffic  = Math.max(...data.funnel.map(d => d.totalUsers), 0);
  const aov = salesCount > 0 ? revenueTotal / salesCount : 0;

  const chartData = data.funnel.map((d, i) => ({
    name:  STEP_LABELS[d.step] || d.step,
    value: d.eventCount,
    users: d.totalUsers,
    color: STEP_COLORS[i] ?? '#ffffff',
  }));

  const deviceColors: Record<string, string> = { mobile: '#3b82f6', desktop: '#c5a059', tablet: '#8b5cf6' };
  const deviceTotals: Record<string, number> = {};
  data.tech.forEach(t => { deviceTotals[t.device] = (deviceTotals[t.device] ?? 0) + t.users; });
  const techChartData = Object.entries(deviceTotals).map(([name, value]) => ({
    name, value, color: deviceColors[name.toLowerCase()] ?? '#94a3b8',
  }));

  const browserTotals: Record<string, { users: number; sessions: number }> = {};
  data.tech.forEach(t => {
    if (!browserTotals[t.browser]) browserTotals[t.browser] = { users: 0, sessions: 0 };
    browserTotals[t.browser].users    += t.users;
    browserTotals[t.browser].sessions += t.sessions;
  });
  const browserRows = Object.entries(browserTotals).sort((a, b) => b[1].users - a[1].users);
  // How many browser rows fit in the fixed card (show top 4, rest in modal)
  const BROWSER_PREVIEW = 4;


  /* ── Row preview counts for bottom tables ── */
  const TABLE_PREVIEW = 5;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="text-gold h-5 w-5" />
            {tg('title')}
          </h2>
          <p className="text-xs text-foreground/40 mt-0.5">{tg('subtitle')}</p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-1 rounded bg-gold/10 text-gold border border-gold/20 uppercase tracking-wider">
          {tg('badge')}
        </span>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: tg('kpi_revenue'),   value: `${revenueTotal.toLocaleString()} FCFA`, icon: <DollarSign size={10} className="text-gold" />,        sub: tg('kpi_revenue_sub') },
          { label: tg('kpi_sales'),     value: salesCount.toLocaleString(),              icon: <ShoppingBag size={10} className="text-purple-400" />, sub: tg('kpi_sales_sub') },
          { label: tg('kpi_conv'),      value: `${conversionRate.toFixed(2)}%`,          icon: <Percent size={10} className="text-emerald-400" />,    sub: tg('kpi_conv_sub') },
          { label: tg('kpi_visitors'), value: globalTraffic.toLocaleString(),            icon: <Users size={10} className="text-blue-400" />,         sub: tg('kpi_visitors_sub') },
          { label: tg('kpi_aov'),       value: `${Math.round(aov).toLocaleString()} FCFA`, icon: <TrendingUp size={10} className="text-gold" />,    sub: tg('kpi_aov_sub'), wide: true },
        ].map(k => (
          <div key={k.label} className={`bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm${(k as any).wide ? ' col-span-2 lg:col-span-1' : ''}`}>
            <p className="text-xs text-foreground/40 mb-2">{k.label}</p>
            <p className="text-xl font-bold text-foreground">{k.value}</p>
            <div className="text-[10px] text-foreground/30 mt-2 flex items-center gap-1">{k.icon} {k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Funnel chart + Device & Browser (fixed-height row) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Funnel bar chart */}
        <div className="lg:col-span-2 bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm">
          <h3 className="font-semibold text-foreground text-sm mb-4">{tg('funnel_title')}</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.8)', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-[#0b0b0b] border border-white/10 text-foreground px-4 py-3 rounded-xl shadow-sm text-xs space-y-1">
                        <p className="font-bold text-gold">{d.name}</p>
                        <p className="text-foreground/80">{tg('funnel_events')}: <span className="font-semibold text-foreground">{d.value.toLocaleString()}</span></p>
                        <p className="text-foreground/80">{tg('funnel_uniq_users')}: <span className="font-semibold text-foreground">{d.users.toLocaleString()}</span></p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device & Browser — fixed height, no layout shift */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm h-full flex flex-col" style={{ minHeight: 0 }}>
          <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2 flex-shrink-0">
            <Monitor className="text-gold h-4 w-4" />
            {tg('device_title')}
          </h3>

          {/* Pie chart – fixed height */}
          <div className="h-[140px] w-full flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={techChartData} cx="50%" cy="50%" innerRadius={38} outerRadius={55} dataKey="value" paddingAngle={4}>
                  {techChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v} users`} contentStyle={{ background: '#0b0b0b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Device legend */}
          <div className="space-y-1.5 mt-2 flex-shrink-0">
            {techChartData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-foreground/50 capitalize">{d.name}</span>
                </div>
                <span className="font-semibold text-foreground">{d.value.toLocaleString()} users</span>
              </div>
            ))}
          </div>

          {/* Browser preview (top N rows, fixed) */}
          <div className="mt-4 pt-4 border-t border-white/10 flex-shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35 mb-2">{tg('browser_legend')}</p>
            <div className="space-y-1.5">
              {browserRows.slice(0, BROWSER_PREVIEW).map(([browser, stats]) => (
                <div key={browser} className="flex items-center justify-between text-xs">
                  <span className="text-foreground/60 truncate max-w-[110px]">{browser}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-foreground/40">{stats.sessions.toLocaleString()} sess.</span>
                    <span className="font-semibold text-foreground w-10 text-right">{stats.users.toLocaleString()} usr</span>
                  </div>
                </div>
              ))}
            </div>
            {browserRows.length > BROWSER_PREVIEW && (
              <button onClick={() => setModalOpen('devices')} className="mt-3 flex items-center gap-1 text-[11px] text-foreground/40 hover:text-gold transition-colors cursor-pointer">
                <ExternalLink size={11} />
                {tg('view_all_browsers', { n: browserRows.length })}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm overflow-x-auto">
        <h3 className="font-semibold text-foreground text-sm mb-4">{tg('funnel_detail_title')}</h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-[10px] text-foreground/40 uppercase tracking-wider">
              <th className="pb-2">{tg('col_step')}</th>
              <th className="pb-2 text-right">{tg('col_events')}</th>
              <th className="pb-2 text-right">{tg('col_users')}</th>
              <th className="pb-2 text-right">{tg('col_sales')}</th>
              <th className="pb-2 text-right">{tg('col_revenue')}</th>
              <th className="pb-2 text-right">{tg('col_conv')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {data.funnel.map((step, i) => (
              <tr key={step.step} className={step.step === 'remove_from_cart' ? 'text-red-400/80' : 'text-foreground/80'}>
                <td className="py-2.5 font-medium">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: STEP_COLORS[i] }} />
                    {STEP_LABELS[step.step] || step.step}
                  </span>
                </td>
                <td className="py-2.5 text-right">{step.eventCount.toLocaleString()}</td>
                <td className="py-2.5 text-right">{step.totalUsers.toLocaleString()}</td>
                <td className="py-2.5 text-right">{step.sales.toLocaleString()}</td>
                <td className="py-2.5 text-right text-gold">{step.revenue.toLocaleString()} FCFA</td>
                <td className="py-2.5 text-right">{step.conversionRate.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {/* ── Bottom 3 tables — fixed height, modal on "view more" ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Acquisition Channels */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4 flex-shrink-0">
            <Layers className="text-gold h-4 w-4" />
          <h3 className="font-semibold text-foreground text-sm">{tg('acquisition_title')}</h3>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-foreground/40 uppercase tracking-wider">
                  <th className="pb-2">{tg('col_source')}</th>
                  <th className="pb-2 text-right">{tg('col_users')}</th>
                  <th className="pb-2 text-right">{tg('col_sessions')}</th>
                  <th className="pb-2 text-right">{tg('col_revenue')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-foreground/80">
                {data.acquisition.slice(0, TABLE_PREVIEW).map((acq, i) => (
                  <tr key={i}>
                    <td className="py-2.5 font-medium truncate max-w-[120px]">{acq.sourceMedium}</td>
                    <td className="py-2.5 text-right">{acq.users.toLocaleString()}</td>
                    <td className="py-2.5 text-right">{acq.sessions.toLocaleString()}</td>
                    <td className="py-2.5 text-right text-gold">{acq.revenue.toLocaleString()} FCFA</td>
                  </tr>
                ))}
                {data.acquisition.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-foreground/30">{tg('no_channels')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {data.acquisition.length > TABLE_PREVIEW && (
            <button
              onClick={() => setModalOpen('acquisition')}
              className="mt-3 flex items-center gap-1 text-[11px] text-foreground/40 hover:text-gold transition-colors cursor-pointer flex-shrink-0"
            >
              <ExternalLink size={11} />
              {tg('view_all_channels', { n: data.acquisition.length })}
            </button>
          )}
        </div>

        {/* Most Viewed Pages */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4 flex-shrink-0">
            <FileText className="text-gold h-4 w-4" />
          <h3 className="font-semibold text-foreground text-sm">{tg('pages_title')}</h3>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-foreground/40 uppercase tracking-wider">
                  <th className="pb-2">{tg('col_page')}</th>
                  <th className="pb-2 text-right">{tg('col_views')}</th>
                  <th className="pb-2 text-right">{tg('col_users')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-foreground/80">
                {data.pages.slice(0, TABLE_PREVIEW).map((page, i) => (
                  <tr key={i}>
                    <td className="py-2.5 font-medium truncate max-w-[150px]" title={page.path}>{page.path}</td>
                    <td className="py-2.5 text-right">{page.views.toLocaleString()}</td>
                    <td className="py-2.5 text-right">{page.users.toLocaleString()}</td>
                  </tr>
                ))}
                {data.pages.length === 0 && (
                  <tr><td colSpan={3} className="py-4 text-center text-foreground/30">{tg('no_pages')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {data.pages.length > TABLE_PREVIEW && (
            <button
              onClick={() => setModalOpen('pages')}
              className="mt-3 flex items-center gap-1 text-[11px] text-foreground/40 hover:text-gold transition-colors cursor-pointer flex-shrink-0"
            >
              <ExternalLink size={11} />
              {tg('view_all_pages', { n: data.pages.length })}
            </button>
          )}
        </div>

        {/* Active Cities & Regions */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4 flex-shrink-0">
            <Globe className="text-gold h-4 w-4" />
          <h3 className="font-semibold text-foreground text-sm">{tg('geo_title')}</h3>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-foreground/40 uppercase tracking-wider">
                  <th className="pb-2">{tg('col_country')}</th>
                  <th className="pb-2">{tg('col_city')}</th>
                  <th className="pb-2 text-right">{tg('col_users')}</th>
                  <th className="pb-2 text-right">{tg('col_new')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-foreground/80">
                {data.geo.slice(0, TABLE_PREVIEW).map((g, i) => (
                  <tr key={i}>
                    <td className="py-2.5 font-medium truncate max-w-[90px]">{g.country}</td>
                    <td className="py-2.5 truncate max-w-[90px] text-foreground/60">{g.city}</td>
                    <td className="py-2.5 text-right">{g.users.toLocaleString()}</td>
                    <td className="py-2.5 text-right text-emerald-400">{g.newUsers.toLocaleString()}</td>
                  </tr>
                ))}
                {data.geo.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-foreground/30">{tg('no_locations')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {data.geo.length > TABLE_PREVIEW && (
            <button
              onClick={() => setModalOpen('geo')}
              className="mt-3 flex items-center gap-1 text-[11px] text-foreground/40 hover:text-gold transition-colors cursor-pointer flex-shrink-0"
            >
              <ExternalLink size={11} />
              {tg('view_all_locations', { n: data.geo.length })}
            </button>
          )}
        </div>
      </div>

      {/* ── Most Shared Products ── */}
      {data.shares && data.shares.length > 0 && (
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Share2 className="text-gold h-4 w-4" />
            <h3 className="font-semibold text-foreground text-sm">
              {tg('shares_title')} <span className="ml-1 text-[10px] text-foreground/35 font-normal uppercase tracking-wider">{tg('shares_sub')}</span>
            </h3>
          </div>
          <div className="space-y-2">
            {data.shares.map((item, i) => {
              const maxShares = data.shares[0]?.shares || 1;
              const pct = Math.round((item.shares / maxShares) * 100);
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 text-center text-sm flex-shrink-0">{medals[i] ?? <span className="text-[11px] text-foreground/30 font-mono">{i + 1}</span>}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground/80 truncate max-w-[200px]">{item.name}</span>
                      <span className="text-xs font-bold text-gold ml-2 flex-shrink-0">{item.shares.toLocaleString()} {tg('shares_label')}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold"
                        style={{ width: `${pct}%`, transition: 'width 0.6s ease' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* ════════════════════════════════════════════════════
          MODALS
      ════════════════════════════════════════════════════ */}

      <Modal open={modalOpen === 'devices'} onClose={() => setModalOpen(null)} title={tg('modal_device')}>
        <div className="space-y-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35 mb-3">{tg('modal_device_legend')}</p>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-foreground/40 uppercase tracking-wider">
                  <th className="pb-2">{isEn ? 'Device' : 'Appareil'}</th>
                  <th className="pb-2 text-right">{tg('col_users')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-foreground/80">
                {techChartData.map(d => (
                  <tr key={d.name}>
                    <td className="py-2.5 flex items-center gap-2 capitalize">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
                      {d.name}
                    </td>
                    <td className="py-2.5 text-right font-semibold">{d.value.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35 mb-3">{tg('modal_browser_legend')}</p>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-foreground/40 uppercase tracking-wider">
                  <th className="pb-2">{isEn ? 'Browser' : 'Navigateur'}</th>
                  <th className="pb-2 text-right">{tg('col_users')}</th>
                  <th className="pb-2 text-right">{tg('col_sessions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-foreground/80">
                {browserRows.map(([browser, stats]) => (
                  <tr key={browser}>
                    <td className="py-2.5 font-medium">{browser}</td>
                    <td className="py-2.5 text-right">{stats.users.toLocaleString()}</td>
                    <td className="py-2.5 text-right text-foreground/50">{stats.sessions.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35 mb-3">{tg('modal_full_breakdown')}</p>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-foreground/40 uppercase tracking-wider">
                  <th className="pb-2">{isEn ? 'Device' : 'Appareil'}</th>
                  <th className="pb-2">{isEn ? 'Browser' : 'Navigateur'}</th>
                  <th className="pb-2 text-right">{tg('col_users')}</th>
                  <th className="pb-2 text-right">{tg('col_sessions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-foreground/80">
                {data.tech.map((t, i) => (
                  <tr key={i}>
                    <td className="py-2.5 capitalize text-foreground/60">{t.device}</td>
                    <td className="py-2.5 font-medium">{t.browser}</td>
                    <td className="py-2.5 text-right">{t.users.toLocaleString()}</td>
                    <td className="py-2.5 text-right text-foreground/50">{t.sessions.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      <Modal open={modalOpen === 'acquisition'} onClose={() => setModalOpen(null)} title={tg('modal_acquisition')}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-[10px] text-foreground/40 uppercase tracking-wider">
              <th className="pb-2">{tg('col_source')}</th>
              <th className="pb-2 text-right">{tg('col_users')}</th>
              <th className="pb-2 text-right">{tg('col_sessions')}</th>
              <th className="pb-2 text-right">{tg('col_revenue')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs text-foreground/80">
            {data.acquisition.map((acq, i) => (
              <tr key={i}>
                <td className="py-2.5 font-medium">{acq.sourceMedium}</td>
                <td className="py-2.5 text-right">{acq.users.toLocaleString()}</td>
                <td className="py-2.5 text-right">{acq.sessions.toLocaleString()}</td>
                <td className="py-2.5 text-right text-gold">{acq.revenue.toLocaleString()} FCFA</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>

      <Modal open={modalOpen === 'pages'} onClose={() => setModalOpen(null)} title={tg('modal_pages')}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-[10px] text-foreground/40 uppercase tracking-wider">
              <th className="pb-2">{tg('col_page')}</th>
              <th className="pb-2 text-right">{tg('col_views')}</th>
              <th className="pb-2 text-right">{tg('col_users')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs text-foreground/80">
            {data.pages.map((page, i) => (
              <tr key={i}>
                <td className="py-2.5 font-medium text-foreground/90">{page.path}</td>
                <td className="py-2.5 text-right">{page.views.toLocaleString()}</td>
                <td className="py-2.5 text-right">{page.users.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>

      <Modal open={modalOpen === 'geo'} onClose={() => setModalOpen(null)} title={tg('modal_geo')}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-[10px] text-foreground/40 uppercase tracking-wider">
              <th className="pb-2">{tg('col_country')}</th>
              <th className="pb-2">{tg('col_city')}</th>
              <th className="pb-2 text-right">{tg('col_users')}</th>
              <th className="pb-2 text-right">{tg('col_new')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs text-foreground/80">
            {data.geo.map((g, i) => (
              <tr key={i}>
                <td className="py-2.5 font-medium">{g.country}</td>
                <td className="py-2.5 text-foreground/60">{g.city}</td>
                <td className="py-2.5 text-right">{g.users.toLocaleString()}</td>
                <td className="py-2.5 text-right text-emerald-400">{g.newUsers.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>

    </div>
  );
}
