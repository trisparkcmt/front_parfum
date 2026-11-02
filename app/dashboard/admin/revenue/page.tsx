'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import GA4AnalyticsDashboard from '@/components/admin/dashboard/GA4AnalyticsDashboard';
import ProfitAnalyticsDashboard from '@/components/admin/dashboard/ProfitAnalyticsDashboard';
import StockValueAnalyticsDashboard from '@/components/admin/dashboard/StockValueAnalyticsDashboard';
import { adminService } from '@/services/apiService';
import type { StatistiquesBeneficesResponse } from '@/types';

const T = {
  fr: {
    page_title: 'Revenus & Analyses',
    page_subtitle: "Suivi financier, coûts d'achat, bénéfices, valeur marchande du stock et entonnoir e-commerce",
    tab_benefices: 'Analyse des Bénéfices',
    tab_stock_marchand: 'Valeur Stock Marchand',
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
    page_subtitle: 'Financial tracking, purchase costs, profits, commercial stock value and e-commerce funnel',
    tab_benefices: 'Profit Analysis',
    tab_stock_marchand: 'Commercial Stock Value',
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

export default function RevenuePage() {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en') ?? false;
  const t = (k: TKey) => isEn ? T.en[k] : T.fr[k];

  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'benefices' | 'stock_marchand' | 'ga4'>('benefices');

  // Shared endpoint data (/api/v1/orders/commandes/statistiques-benefices/)
  const [statsData, setStatsData] = useState<StatistiquesBeneficesResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchStats = useCallback(async (params?: {
    date_debut?: string;
    date_fin?: string;
    statut?: string;
    statut_paiement?: string;
  }) => {
    try {
      setStatsLoading(true);
      const res = await adminService.getProfitStats(params);
      setStatsData(res);
    } catch (err) {
      console.error('Failed to load shared financial stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    setIsMounted(true);
    fetchStats();
  }, [fetchStats]);

  if (!isMounted) return null;

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
          { id: 'stock_marchand', label: t('tab_stock_marchand') },
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

      {/* Tab Panels with stats grouped based on which tab they belong to */}
      {activeTab === 'benefices' ? (
        <ProfitAnalyticsDashboard
          initialData={statsData}
          isLoading={statsLoading}
          onFetchWithFilters={fetchStats}
        />
      ) : activeTab === 'stock_marchand' ? (
        <StockValueAnalyticsDashboard
          rawStats={statsData}
          initialData={statsData?.valeur_stock_marchand}
          isLoading={statsLoading}
          onRefresh={() => fetchStats()}
        />
      ) : (
        <GA4AnalyticsDashboard />
      )}
    </div>
  );
}
