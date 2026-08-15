'use client';

import React, { useState, useEffect, useRef } from 'react';
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
        <p className="text-sm text-foreground/60">Batch-processing Google Analytics 4 reports...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4 bg-red-500/5 border border-red-500/10 rounded-2xl p-8 text-center">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <h3 className="font-semibold text-foreground">GA4 Synchronization Failed</h3>
        <p className="text-xs text-foreground/60 max-w-md">{error || 'Unknown error'}</p>
        <div className="text-[11px] text-foreground/30 mt-2">
          Check your environment variables{' '}
          <code className="bg-white/5 px-1 py-0.5 rounded">GOOGLE_CLIENT_EMAIL</code>,{' '}
          <code className="bg-white/5 px-1 py-0.5 rounded">GOOGLE_PRIVATE_KEY</code>, and{' '}
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
            Google Analytics 4 Statistics (Last 30 days)
          </h2>
          <p className="text-xs text-foreground/40 mt-0.5">Advanced analytics batch-processed with batchRunReports</p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-1 rounded bg-gold/10 text-gold border border-gold/20 uppercase tracking-wider">
          Batch API Client
        </span>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Revenue',           value: `${revenueTotal.toLocaleString()} FCFA`, icon: <DollarSign size={10} className="text-gold" />,        sub: 'Total revenue' },
          { label: 'Number of Sales',   value: salesCount.toLocaleString(),              icon: <ShoppingBag size={10} className="text-purple-400" />, sub: 'Successful transactions' },
          { label: 'Overall Conversion',value: `${conversionRate.toFixed(2)}%`,          icon: <Percent size={10} className="text-emerald-400" />,    sub: 'Purchased sessions' },
          { label: 'Unique Visitors',   value: globalTraffic.toLocaleString(),           icon: <Users size={10} className="text-blue-400" />,         sub: 'Global funnel reach' },
          { label: 'AOV',               value: `${Math.round(aov).toLocaleString()} FCFA`, icon: <TrendingUp size={10} className="text-gold" />,      sub: 'Avg revenue / purchase', wide: true },
        ].map(k => (
          <div key={k.label} className={`bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm${k.wide ? ' col-span-2 lg:col-span-1' : ''}`}>
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
          <h3 className="font-semibold text-foreground text-sm mb-4">E-Commerce Conversion Funnel</h3>
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
                        <p className="text-foreground/80">Events: <span className="font-semibold text-foreground">{d.value.toLocaleString()}</span></p>
                        <p className="text-foreground/80">Unique Users: <span className="font-semibold text-foreground">{d.users.toLocaleString()}</span></p>
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
            Device &amp; Browser
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
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35 mb-2">By Browser</p>
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
              <button
                onClick={() => setModalOpen('devices')}
                className="mt-3 flex items-center gap-1 text-[11px] text-foreground/40 hover:text-gold transition-colors cursor-pointer"
              >
                <ExternalLink size={11} />
                View all {browserRows.length} browsers
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Funnel detail table ── */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm overflow-x-auto">
        <h3 className="font-semibold text-foreground text-sm mb-4">Funnel Step Details</h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-[10px] text-foreground/40 uppercase tracking-wider">
              <th className="pb-2">Step</th>
              <th className="pb-2 text-right">Events</th>
              <th className="pb-2 text-right">Users</th>
              <th className="pb-2 text-right">Sales</th>
              <th className="pb-2 text-right">Revenue</th>
              <th className="pb-2 text-right">Conv. Rate</th>
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
            <h3 className="font-semibold text-foreground text-sm">Acquisition Channels</h3>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-foreground/40 uppercase tracking-wider">
                  <th className="pb-2">Source / Medium</th>
                  <th className="pb-2 text-right">Users</th>
                  <th className="pb-2 text-right">Sessions</th>
                  <th className="pb-2 text-right">Revenue</th>
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
                  <tr><td colSpan={4} className="py-4 text-center text-foreground/30">No channels available</td></tr>
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
              View all {data.acquisition.length} channels
            </button>
          )}
        </div>

        {/* Most Viewed Pages */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4 flex-shrink-0">
            <FileText className="text-gold h-4 w-4" />
            <h3 className="font-semibold text-foreground text-sm">Most Viewed Pages</h3>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-foreground/40 uppercase tracking-wider">
                  <th className="pb-2">Page</th>
                  <th className="pb-2 text-right">Views</th>
                  <th className="pb-2 text-right">Users</th>
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
                  <tr><td colSpan={3} className="py-4 text-center text-foreground/30">No pages available</td></tr>
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
              View all {data.pages.length} pages
            </button>
          )}
        </div>

        {/* Active Cities & Regions */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4 flex-shrink-0">
            <Globe className="text-gold h-4 w-4" />
            <h3 className="font-semibold text-foreground text-sm">Active Cities &amp; Regions</h3>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-foreground/40 uppercase tracking-wider">
                  <th className="pb-2">Country</th>
                  <th className="pb-2">City</th>
                  <th className="pb-2 text-right">Users</th>
                  <th className="pb-2 text-right">New</th>
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
                  <tr><td colSpan={4} className="py-4 text-center text-foreground/30">No locations available</td></tr>
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
              View all {data.geo.length} locations
            </button>
          )}
        </div>
      </div>

      {/* ── Most Shared Products ── */}
      {data.shares && data.shares.length > 0 && (
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Share2 className="text-gold h-4 w-4" />
            <h3 className="font-semibold text-foreground text-sm">Most Shared Products <span className="ml-1 text-[10px] text-foreground/35 font-normal uppercase tracking-wider">(Last 30 days)</span></h3>
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
                      <span className="text-xs font-bold text-gold ml-2 flex-shrink-0">{item.shares.toLocaleString()} shares</span>
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

      {/* Device & Browser modal */}
      <Modal open={modalOpen === 'devices'} onClose={() => setModalOpen(null)} title="Device & Browser Breakdown">
        <div className="space-y-6">
          {/* Device summary */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35 mb-3">By Device</p>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-foreground/40 uppercase tracking-wider">
                  <th className="pb-2">Device</th>
                  <th className="pb-2 text-right">Users</th>
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
          {/* Browser full list */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35 mb-3">By Browser</p>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-foreground/40 uppercase tracking-wider">
                  <th className="pb-2">Browser</th>
                  <th className="pb-2 text-right">Users</th>
                  <th className="pb-2 text-right">Sessions</th>
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
          {/* Per-device per-browser breakdown */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35 mb-3">Full Breakdown (Device × Browser)</p>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-foreground/40 uppercase tracking-wider">
                  <th className="pb-2">Device</th>
                  <th className="pb-2">Browser</th>
                  <th className="pb-2 text-right">Users</th>
                  <th className="pb-2 text-right">Sessions</th>
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

      {/* Acquisition Channels modal */}
      <Modal open={modalOpen === 'acquisition'} onClose={() => setModalOpen(null)} title="All Acquisition Channels">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-[10px] text-foreground/40 uppercase tracking-wider">
              <th className="pb-2">Source / Medium</th>
              <th className="pb-2 text-right">Users</th>
              <th className="pb-2 text-right">Sessions</th>
              <th className="pb-2 text-right">Revenue</th>
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

      {/* Pages modal */}
      <Modal open={modalOpen === 'pages'} onClose={() => setModalOpen(null)} title="All Pages">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-[10px] text-foreground/40 uppercase tracking-wider">
              <th className="pb-2">Page</th>
              <th className="pb-2 text-right">Views</th>
              <th className="pb-2 text-right">Users</th>
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

      {/* Geo modal */}
      <Modal open={modalOpen === 'geo'} onClose={() => setModalOpen(null)} title="All Locations">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-[10px] text-foreground/40 uppercase tracking-wider">
              <th className="pb-2">Country</th>
              <th className="pb-2">City</th>
              <th className="pb-2 text-right">Users</th>
              <th className="pb-2 text-right">New Users</th>
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
