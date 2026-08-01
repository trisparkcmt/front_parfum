'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import GA4AnalyticsDashboard from '@/components/admin/dashboard/GA4AnalyticsDashboard';
import ProfitAnalyticsDashboard from '@/components/admin/dashboard/ProfitAnalyticsDashboard';

// Helper utilities
function cx(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

const monthly = [
  { month: 'Jan', parfums: 3200000, accessoires: 1800000, total: 5000000 },
  { month: 'Fév', parfums: 4100000, accessoires: 2200000, total: 6300000 },
  { month: 'Mar', parfums: 3800000, accessoires: 1900000, total: 5700000 },
  { month: 'Avr', parfums: 5200000, accessoires: 2700000, total: 7900000 },
  { month: 'Mai', parfums: 4600000, accessoires: 2400000, total: 7000000 },
];

const pieData = [
  { name: 'Grande Marque', value: 38, color: '#C5A059' },
  { name: 'Dupe Numba', value: 24, color: '#6366F1' },
  { name: 'Atelier Numba', value: 20, color: '#A855F7' },
  { name: 'Sur Mesure', value: 10, color: '#10B981' },
  { name: 'Accessoires', value: 8, color: '#EC4899' },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="bg-background border border-white/10 text-foreground px-3 py-2 rounded-lg text-xs">
      <p className="font-semibold mb-1 text-foreground/80">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-2 mt-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.stroke }} />
          <span className="text-foreground/60">{p.name}:</span>
          <span className="font-semibold text-foreground tabular-nums">
            {(p.value / 1000000).toFixed(1)}M FCFA
          </span>
        </p>
      ))}
    </div>
  );
}

export default function RevenuePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'benefices' | 'internal' | 'ga4'>('benefices');

  // Force client-only render to avoid Recharts hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl font-semibold text-foreground">Revenus & Analyses</h1>
        <p className="text-sm text-foreground/40 mt-0.5">
          Suivi financier, coûts d'achat, bénéfices et entonnoir e-commerce
        </p>
      </div>

      {/* Quiet Underline Navigation Tabs */}
      <div className="flex border-b border-white/10 gap-6">
        {[
          { id: 'benefices', label: 'Analyse des Bénéfices' },
          { id: 'ga4', label: 'Google Analytics 4 (Funnel)' },
          { id: 'internal', label: 'Bilan Interne (Base de données)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cx(
              "pb-3 text-xs font-medium transition-colors border-b-2 -mb-px cursor-pointer",
              activeTab === tab.id
                ? "border-gold text-gold font-semibold"
                : "border-transparent text-foreground/45 hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'benefices' ? (
        <ProfitAnalyticsDashboard />
      ) : activeTab === 'ga4' ? (
        <GA4AnalyticsDashboard />
      ) : (
        <div className="space-y-6">
          {/* KPI Stat Strip */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-white/8 gap-y-4 lg:gap-y-0">
              {[
                { label: 'Revenu Total', value: '31.9M', sub: 'FCFA', change: '+12.4%', pos: true },
                { label: 'Parfums', value: '20.9M', sub: 'FCFA', change: '+8.1%', pos: true },
                { label: 'Accessoires', value: '11M', sub: 'FCFA', change: '+18.2%', pos: true },
                { label: 'Commissions', value: '3.5M', sub: 'FCFA', change: '-2.1%', pos: false },
              ].map((k, index) => (
                <div key={k.label} className={cx("px-4", index === 0 && "pl-0 lg:pl-0", index > 0 && "pt-4 lg:pt-0")}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                    {k.label}
                  </p>
                  <p className="text-xl font-semibold tabular-nums text-foreground mt-1">
                    {k.value} <span className="text-xs text-foreground/40 font-normal">{k.sub}</span>
                  </p>
                  <p className={cx("text-[11px] font-medium mt-1 flex items-center gap-1", k.pos ? "text-emerald-400" : "text-red-400")}>
                    {k.pos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {k.change} ce mois
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Area Chart */}
            <div className="xl:col-span-2 rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                  Revenus par catégorie
                </h3>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-foreground/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" /> Parfums
                  </span>
                  <span className="flex items-center gap-1.5 text-foreground/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Accessoires
                  </span>
                </div>
              </div>
              <div className="h-[250px] w-full">
                {isMounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthly} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gParfums" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C5A059" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#C5A059" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gAccessoires" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#A855F7" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000000).toFixed(0)}M`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="parfums" name="Parfums" stroke="#C5A059" strokeWidth={2} fill="url(#gParfums)" />
                      <Area type="monotone" dataKey="accessoires" name="Accessoires" stroke="#A855F7" strokeWidth={2} fill="url(#gAccessoires)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Pie Chart */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35 mb-4">
                  Répartition des ventes
                </h3>
                <div className="h-[180px] w-full">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => `${value}%`}
                          contentStyle={{
                            backgroundColor: 'var(--background)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-foreground/60">{d.name}</span>
                    </div>
                    <span className="font-semibold text-foreground tabular-nums">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}