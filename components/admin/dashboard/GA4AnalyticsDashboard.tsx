'use client';

import React, { useState, useEffect } from 'react';
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
  Smartphone,
  Layers,
  FileText,
  Navigation
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

interface GA4BatchResponse {
  funnel: FunnelStep[];
  acquisition: AcquisitionChannel[];
  pages: PageMetric[];
  tech: TechMetric[];
  geo: GeoMetric[];
}

const STEP_LABELS: Record<string, string> = {
  'view_item_list': '1. Vues Catalogues',
  'view_item': '2. Vues Produit',
  'add_to_cart': '3. Ajouts Panier',
  'remove_from_cart': '4. Abandons',
  'begin_checkout': '5. Paiement Initié',
  'purchase': '6. Achats',
};

const STEP_COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ef4444', '#ec4899', '#c5a059'];

export default function GA4AnalyticsDashboard() {
  const [data, setData] = useState<GA4BatchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics');
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        if (result.error) {
          throw new Error(result.error);
        }
        setData(result);
      } catch (err: any) {
        console.error('Failed to load GA4 metrics:', err);
        setError(err.message || 'Impossible de charger les données Google Analytics 4');
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
        <h3 className="font-semibold text-foreground">Échec de la synchronisation GA4</h3>
        <p className="text-xs text-foreground/60 max-w-md">{error || 'Erreur inconnue'}</p>
        <div className="text-[11px] text-foreground/30 mt-2">
          Vérifiez vos variables d'environnement <code className="bg-white/5 px-1 py-0.5 rounded">GOOGLE_CLIENT_EMAIL</code>, <code className="bg-white/5 px-1 py-0.5 rounded">GOOGLE_PRIVATE_KEY</code>, et <code className="bg-white/5 px-1 py-0.5 rounded">GA_PROPERTY_ID</code>.
        </div>
      </div>
    );
  }

  // Scorecards Calculations
  const purchaseStep = data.funnel.find(d => d.step === 'purchase');
  const revenueTotal = purchaseStep?.revenue || 0;
  const salesCount = purchaseStep?.sales || 0;
  const conversionRate = purchaseStep?.conversionRate || 0;
  
  // Overall traffic is the max unique users reaching the top of the funnel (usually view_item_list or view_item)
  const globalTraffic = Math.max(...data.funnel.map(d => d.totalUsers), 0);
  
  // Average Order Value (AOV = Revenue / Purchases)
  const aov = salesCount > 0 ? revenueTotal / salesCount : 0;

  // Funnel chart mapping
  const chartData = data.funnel.map((d, index) => ({
    name: STEP_LABELS[d.step] || d.step,
    value: d.eventCount,
    users: d.totalUsers,
    color: STEP_COLORS[index] || '#ffffff',
  }));

  // Tech Distribution mapping (Grouped by device category)
  const deviceTotals: Record<string, number> = {};
  data.tech.forEach(t => {
    deviceTotals[t.device] = (deviceTotals[t.device] || 0) + t.users;
  });
  const deviceColors: Record<string, string> = {
    mobile: '#3b82f6',
    desktop: '#c5a059',
    tablet: '#8b5cf6',
  };
  const techChartData = Object.entries(deviceTotals).map(([name, value]) => ({
    name,
    value,
    color: deviceColors[name.toLowerCase()] || '#94a3b8',
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="text-gold h-5 w-5" />
            Statistiques Google Analytics 4 (30 derniers jours)
          </h2>
          <p className="text-xs text-foreground/40 mt-0.5">Analyses avancées traitées par lots avec batchRunReports</p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-1 rounded bg-gold/10 text-gold border border-gold/20 uppercase tracking-wider">
          Batch API Client
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Chiffre d'Affaires */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm">
          <p className="text-xs text-foreground/40 mb-2">Chiffre d'Affaires</p>
          <p className="text-xl font-bold text-foreground">
            {revenueTotal.toLocaleString()} <span className="text-[10px] font-medium text-foreground/40">FCFA</span>
          </p>
          <div className="text-[10px] text-foreground/30 mt-2 flex items-center gap-1">
            <DollarSign size={10} className="text-gold" /> Total revenus
          </div>
        </div>

        {/* Nombre de Ventes */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm">
          <p className="text-xs text-foreground/40 mb-2">Nombre de Ventes</p>
          <p className="text-xl font-bold text-foreground">
            {salesCount.toLocaleString()}
          </p>
          <div className="text-[10px] text-foreground/30 mt-2 flex items-center gap-1">
            <ShoppingBag size={10} className="text-purple-400" /> Transactions réussies
          </div>
        </div>

        {/* conversionRate */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm">
          <p className="text-xs text-foreground/40 mb-2">Conversion Global</p>
          <p className="text-xl font-bold text-foreground">
            {conversionRate.toFixed(2)}%
          </p>
          <div className="text-[10px] text-foreground/30 mt-2 flex items-center gap-1">
            <Percent size={10} className="text-emerald-400" /> Sessions avec achat
          </div>
        </div>

        {/* Trafic */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm">
          <p className="text-xs text-foreground/40 mb-2">Visiteurs Uniques</p>
          <p className="text-xl font-bold text-foreground">
            {globalTraffic.toLocaleString()}
          </p>
          <div className="text-[10px] text-foreground/30 mt-2 flex items-center gap-1">
            <Users size={10} className="text-blue-400" /> Reach global du tunnel
          </div>
        </div>

        {/* AOV */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm col-span-2 lg:col-span-1">
          <p className="text-xs text-foreground/40 mb-2">Panier Moyen (AOV)</p>
          <p className="text-xl font-bold text-foreground">
            {Math.round(aov).toLocaleString()} <span className="text-[10px] font-medium text-foreground/40">FCFA</span>
          </p>
          <div className="text-[10px] text-foreground/30 mt-2 flex items-center gap-1">
            <TrendingUp size={10} className="text-gold" /> Revenu moyen / achat
          </div>
        </div>
      </div>

      {/* Main Analysis Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entonnoir de conversion */}
        <div className="lg:col-span-2 bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm">
          <h3 className="font-semibold text-foreground text-sm mb-4">Entonnoir d'Achat Électronique</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.8)', fontWeight: 'bold' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const dataObj = payload[0].payload;
                      return (
                        <div className="bg-[#0b0b0b] border border-white/10 text-foreground px-4 py-3 rounded-xl shadow-sm text-xs space-y-1">
                          <p className="font-bold text-gold">{dataObj.name}</p>
                          <p className="text-foreground/80">Événements: <span className="font-semibold text-foreground">{dataObj.value.toLocaleString()}</span></p>
                          <p className="text-foreground/80">Utilisateurs uniques: <span className="font-semibold text-foreground">{dataObj.users.toLocaleString()}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Devices distribution */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-foreground text-sm mb-4">Répartition par Appareil</h3>
            <div className="h-[180px] w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={techChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" paddingAngle={4}>
                    {techChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} utilisateurs`} contentStyle={{ background: '#0b0b0b', border: 'rgba(255,255,255,0.1) 1px solid', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            {techChartData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
                  <span className="text-foreground/50 capitalize">{d.name}</span>
                </div>
                <span className="font-semibold text-foreground">{d.value.toLocaleString()} users</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-Charts & Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Acquisition Channels */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="text-gold h-4 w-4" />
            <h3 className="font-semibold text-foreground text-sm">Canaux d'Acquisition</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-foreground/40 uppercase tracking-wider">
                  <th className="pb-2">Source / Support</th>
                  <th className="pb-2 text-right">Users</th>
                  <th className="pb-2 text-right">Sessions</th>
                  <th className="pb-2 text-right">Revenus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-foreground/80">
                {data.acquisition.slice(0, 5).map((acq, index) => (
                  <tr key={index}>
                    <td className="py-2.5 font-medium truncate max-w-[120px]">{acq.sourceMedium}</td>
                    <td className="py-2.5 text-right">{acq.users.toLocaleString()}</td>
                    <td className="py-2.5 text-right">{acq.sessions.toLocaleString()}</td>
                    <td className="py-2.5 text-right text-gold">{acq.revenue.toLocaleString()} FCFA</td>
                  </tr>
                ))}
                {data.acquisition.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-foreground/30">Aucun canal disponible</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Pages */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="text-gold h-4 w-4" />
            <h3 className="font-semibold text-foreground text-sm">Pages les plus consultées</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-foreground/40 uppercase tracking-wider">
                  <th className="pb-2">Page</th>
                  <th className="pb-2 text-right">Vues (PV)</th>
                  <th className="pb-2 text-right">Utilisateurs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-foreground/80">
                {data.pages.slice(0, 5).map((page, index) => (
                  <tr key={index}>
                    <td className="py-2.5 font-medium truncate max-w-[150px]" title={page.path}>
                      {page.path}
                    </td>
                    <td className="py-2.5 text-right">{page.views.toLocaleString()}</td>
                    <td className="py-2.5 text-right">{page.users.toLocaleString()}</td>
                  </tr>
                ))}
                {data.pages.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-foreground/30">Aucune page disponible</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Geo Distribution */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="text-gold h-4 w-4" />
            <h3 className="font-semibold text-foreground text-sm">Villes & Régions actives</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-foreground/40 uppercase tracking-wider">
                  <th className="pb-2">Pays</th>
                  <th className="pb-2">Ville</th>
                  <th className="pb-2 text-right">Users Actifs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-foreground/80">
                {data.geo.slice(0, 5).map((geoObj, index) => (
                  <tr key={index}>
                    <td className="py-2.5 font-medium truncate max-w-[100px]">{geoObj.country}</td>
                    <td className="py-2.5 truncate max-w-[100px]">{geoObj.city}</td>
                    <td className="py-2.5 text-right">{geoObj.users.toLocaleString()}</td>
                  </tr>
                ))}
                {data.geo.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-foreground/30">Aucune localisation disponible</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
