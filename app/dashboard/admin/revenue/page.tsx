'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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

const T = {
  fr: {
    page_title: 'Revenus & Analyses',
    page_subtitle: "Suivi financier, coûts d'achat, bénéfices et entonnoir e-commerce",
    tab_benefices: 'Analyse des Bénéfices',
    tab_ga4: 'Google Analytics 4 (Funnel)',
    tab_internal: 'Bilan Interne (Base de données)',
    kpi_total_revenue: 'Revenu Total',
    kpi_parfums: 'Parfums',
    kpi_accessoires: 'Accessoires',
    kpi_commissions: 'Commissions',
    fcfa: 'FCFA',
    this_month: 'ce mois',
    chart_revenue_by_category: 'Revenus par catégorie',
    chart_sales_distribution: 'Répartition des ventes',
  },
  en: {
    page_title: 'Revenue & Analytics',
    page_subtitle: 'Financial tracking, purchase costs, profits and e-commerce funnel',
    tab_benefices: 'Profit Analysis',
    tab_ga4: 'Google Analytics 4 (Funnel)',
    tab_internal: 'Internal Report (Database)',
    kpi_total_revenue: 'Total Revenue',
    kpi_parfums: 'Perfumes',
    kpi_accessoires: 'Accessories',
    kpi_commissions: 'Commissions',
    fcfa: 'FCFA',
    this_month: 'this month',
    chart_revenue_by_category: 'Revenue by category',
    chart_sales_distribution: 'Sales distribution',
  },
} as const;
type TKey = keyof typeof T.fr;

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
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en') ?? false;
  const t = (k: TKey) => isEn ? T.en[k] : T.fr[k];

  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'benefices' | 'ga4'>('benefices');

  // Force client-only render to avoid Recharts hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl font-semibold text-foreground">{t('page_title')}</h1>
        <p className="text-sm text-foreground/40 mt-0.5">
          {t('page_subtitle')}
        </p>
      </div>

      {/* Quiet Underline Navigation Tabs */}
      <div className="flex border-b border-white/10 gap-6">
        {[
          { id: 'benefices', label: t('tab_benefices') },
          { id: 'ga4', label: t('tab_ga4') },
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
      ) : (
        <GA4AnalyticsDashboard />
      )}
    </div>
  );
}