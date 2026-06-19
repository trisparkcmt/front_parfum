'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Loader2,
  ArrowLeft,
  Calendar,
  Target,
  ShieldCheck,
  History,
  Save,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Eye,
  User,
  CreditCard,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Coins,
  Award,
  Send,
  Percent,
  CheckCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

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
    <div className="bg-[#171717] border border-white/10 text-foreground px-4 py-3 rounded-xl shadow-2xl text-xs">
      <p className="font-semibold mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-2 mt-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.stroke }} />
          {p.name}: <span className="font-bold text-foreground">{(p.value / 1000000).toFixed(1)}M FCFA</span>
        </p>
      ))}
    </div>
  );
}

export default function RevenuePage() {
  const [isMounted, setIsMounted] = useState(false);

  // Force le rendu uniquement côté client pour éviter les erreurs d'hydratation de Recharts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Revenus</h1>
        <p className="text-sm text-foreground/40 mt-0.5">Analyse financière globale</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Revenu Total', value: '31.9M', sub: 'FCFA', change: '+12.4%', pos: true },
          { label: 'Parfums', value: '20.9M', sub: 'FCFA', change: '+8.1%', pos: true },
          { label: 'Accessoires', value: '11M', sub: 'FCFA', change: '+18.2%', pos: true },
          { label: 'Commissions', value: '3.5M', sub: 'FCFA', change: '-2.1%', pos: false },
        ].map(k => (
          <div key={k.label} className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-2xl hover:shadow-gold/5 transition-all">
            <p className="text-xs text-foreground/40 mb-2">{k.label}</p>
            <p className="text-2xl font-bold text-foreground">
              {k.value} <span className="text-sm font-medium text-foreground/40">{k.sub}</span>
            </p>
            <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${k.pos ? 'text-emerald-400' : 'text-red-400'}`}>
              {k.pos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {k.change} ce mois
            </p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white/5 rounded-2xl border border-white/10 p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-foreground">Revenus par catégorie</h3>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-foreground/60"><span className="w-2.5 h-2.5 rounded-sm bg-gold" /> Parfums</span>
              <span className="flex items-center gap-1.5 text-foreground/60"><span className="w-2.5 h-2.5 rounded-sm bg-purple-500" /> Accessoires</span>
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
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="parfums" name="Parfums" stroke="#C5A059" strokeWidth={2} fill="url(#gParfums)" />
                  <Area type="monotone" dataKey="accessoires" name="Accessoires" stroke="#A855F7" strokeWidth={2} fill="url(#gAccessoires)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-2xl">
          <h3 className="font-semibold text-foreground mb-5">Répartition des ventes</h3>
          <div className="h-[200px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, '']} contentStyle={{ background: '#171717', border: 'rgba(255,255,255,0.1) 1px solid', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="space-y-2 mt-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
                  <span className="text-foreground/40">{d.name}</span>
                </div>
                <span className="font-semibold text-foreground">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}