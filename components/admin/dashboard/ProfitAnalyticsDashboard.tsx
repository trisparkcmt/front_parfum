'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  ChevronDown,
  ChevronUp,
  Loader2,
  Calendar,
  Filter,
  RefreshCw,
  Award,
  Sparkles,
  PieChart as PieChartIcon
} from 'lucide-react';
import { adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { useTranslation } from 'react-i18next';

const TP = {
  fr: {
    title: 'Tableau de Bord Analytique des Bénéfices',
    subtitle: 'Analyse détaillée des revenus, coûts d\'achat et marges nettes',
    refresh: 'Actualiser',
    all: 'tout',
    start_date: 'Date de début',
    end_date: 'Date de fin',
    order_status: 'Statut des commandes',
    status_validated: 'Validées (Recommandé)',
    status_delivered: 'Livrées uniquement',
    status_paid: 'Payées uniquement',
    status_all: 'Tous les statuts',
    loading: 'Calcul et analyse des données de bénéfices…',
    auth_title: 'Accès non autorisé (401)',
    auth_desc: 'Votre session a expiré ou votre compte ne dispose pas des droits Administrateur requis pour accéder aux analyses financières. Veuillez vous connecter avec un compte administrateur.',
    auth_signin: 'Se reconnecter',
    kpi_revenue: 'Chiffre d\'affaires global',
    kpi_revenue_sub: 'Total des ventes générées',
    kpi_cost: 'Coût d\'achat total',
    kpi_cost_sub: 'Coût cumulatif des produits & lots',
    kpi_profit: 'Bénéfice net global',
    kpi_profit_sub: 'Marge nette globale :',
    kpi_orders: 'Nombre de commandes',
    kpi_orders_sub: 'Commandes comptabilisées',
    section_breakdown: 'Bilan financier par catégorie de produit',
    col_revenue: 'Chiffre d\'affaires',
    col_cost: 'Coût d\'achat',
    col_profit: 'Bénéfice net',
    section_products: 'Détail des bénéfices par produit',
    products_sub: 'produits avec données de bénéfices',
    col_product: 'Produit',
    col_type: 'Type',
    col_sale_price: 'Prix de vente',
    col_purchase_cost: 'Coût d\'achat',
    col_unit_profit: 'Bénéfice / Unité',
    col_margin: 'Marge',
    section_lots: 'Revenus des lots d\'essences',
    lots_sub: 'lots d\'essences',
    col_lot: 'Lot #',
    col_essence: 'Essence',
    col_ca_generated: 'CA généré',
    col_lot_profit: 'Bénéfice lot',
    section_essences: 'Détail ventes & lots par essence',
    essences_sub: 'Cliquez sur une ligne pour dérouler les lots associés',
    col_ess_name: 'Essence',
    col_ess_cat: 'Catégorie',
    col_cumulative_ca: 'CA cumulatif',
    col_cumulative_cost: 'Coût cumulatif',
    col_total_profit: 'Bénéfice total',
    col_lots: 'Lots',
    lots_detail: 'Lots & rentabilité des essences consommées',
    lot_ref: 'Réf. lot',
    lot_stock: 'Stock restant',
    lot_profit: 'Bénéfice lot',
    no_lot_detail: 'Aucun détail de lot disponible.',
    type_parfum: 'Parfums',
    type_accessoire: 'Accessoires',
    type_produit_fini: 'Essences finies',
    type_essence: 'Essences',
    type_parfum_perso: 'Parfums personnalisés',
    cat_essences: 'Essences catalogue',
    cat_parfums: 'Parfums standards',
    cat_accessoires: 'Accessoires',
    cat_parfums_perso: 'Parfums personnalisés',
    cat_essences_sur_mesure: 'Essences sur mesure',
    articles: 'articles',
  },
  en: {
    title: 'Profit Analytics Dashboard',
    subtitle: 'Detailed analysis of revenue, purchase costs, and net margin',
    refresh: 'Refresh',
    all: 'all',
    start_date: 'Start Date',
    end_date: 'End Date',
    order_status: 'Order Status',
    status_validated: 'Validated (Recommended)',
    status_delivered: 'Delivered only',
    status_paid: 'Paid only',
    status_all: 'All statuses',
    loading: 'Calculating and analyzing profit data…',
    auth_title: 'Unauthorized Access (401)',
    auth_desc: 'Your session has expired or your account lacks the required Admin privileges to access financial analytics. Please sign in with an administrator account.',
    auth_signin: 'Sign In Again',
    kpi_revenue: 'Overall Revenue',
    kpi_revenue_sub: 'Total sales generated',
    kpi_cost: 'Total Purchase Cost',
    kpi_cost_sub: 'Cumulative cost of products & lots',
    kpi_profit: 'Overall Net Profit',
    kpi_profit_sub: 'Overall net margin:',
    kpi_orders: 'Number of Orders',
    kpi_orders_sub: 'Completed orders counted',
    section_breakdown: 'Financial Breakdown by Product Category',
    col_revenue: 'Revenue',
    col_cost: 'Purchase Cost',
    col_profit: 'Net Profit',
    section_products: 'Product-Level Profit Detail',
    products_sub: 'products with profit data',
    col_product: 'Product',
    col_type: 'Type',
    col_sale_price: 'Sale Price',
    col_purchase_cost: 'Purchase Cost',
    col_unit_profit: 'Profit / Unit',
    col_margin: 'Margin',
    section_lots: 'Essence Lots Revenue',
    lots_sub: 'essence lots',
    col_lot: 'Lot #',
    col_essence: 'Essence',
    col_ca_generated: 'Revenue Generated',
    col_lot_profit: 'Lot Profit',
    section_essences: 'Sales & Lots Detail by Essence',
    essences_sub: 'Click a row to expand associated lots breakdown',
    col_ess_name: 'Essence',
    col_ess_cat: 'Category',
    col_cumulative_ca: 'Cumulative Revenue',
    col_cumulative_cost: 'Cumulative Cost',
    col_total_profit: 'Total Profit',
    col_lots: 'Lots',
    lots_detail: 'Consumed essence lots & profitability',
    lot_ref: 'Lot ref.',
    lot_stock: 'Remaining stock',
    lot_profit: 'Lot profit',
    no_lot_detail: 'No lot details available.',
    type_parfum: 'Perfumes',
    type_accessoire: 'Accessories',
    type_produit_fini: 'Finished essences',
    type_essence: 'Essences',
    type_parfum_perso: 'Custom perfumes',
    cat_essences: 'Catalog Essences',
    cat_parfums: 'Standard Perfumes',
    cat_accessoires: 'Accessories',
    cat_parfums_perso: 'Custom Perfumes',
    cat_essences_sur_mesure: 'Tailor-Made Essences',
    articles: 'articles',
  },
} as const;
type TPKey = keyof typeof TP.fr;

interface LotDetail {
  lot_id?: number;
  id?: number;
  reference?: string;
  reference_fournisseur?: string;
  numero_lot?: string;
  stock_restant?: string | number;
  quantite_ml?: string | number;
  benefice_lot?: string | number;
}

interface EssenceDetail {
  essence_id: number;
  essence_nom: string;
  essence_categorie?: string;
  ca_total: string | number;
  cout_total: string | number;
  benefice_total: string | number;
  lots?: LotDetail[];
}

export default function ProfitAnalyticsDashboard() {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en') ?? false;
  const tp = (k: TPKey) => isEn ? TP.en[k] : TP.fr[k];

  const [loading, setLoading] = useState(true);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [statut, setStatut] = useState('all');
  const [profitData, setProfitData] = useState<any | null>(null);
  const [labData, setLabData] = useState<any | null>(null);
  const [expandedEssences, setExpandedEssences] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToastStore();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (dateDebut) params.date_debut = dateDebut;
      if (dateFin) params.date_fin = dateFin;
      if (statut && statut !== 'all') params.statut = statut;

      const labParams: Record<string, string> = {};
      if (dateDebut) labParams.start_date = dateDebut;
      if (dateFin) labParams.end_date = dateFin;

      const [profitRes, labRes] = await Promise.allSettled([
        adminService.getProfitStats(params),
        adminService.getLabBenefices(labParams)
      ]);

      if (profitRes.status === 'fulfilled') {
        setProfitData(profitRes.value);
      } else {
        const status = (profitRes.reason as any)?.response?.status;
        if (status === 401) {
          setError('auth');
        } else {
          setProfitData(null);
        }
      }

      if (labRes.status === 'fulfilled') {
        setLabData(labRes.value);
      } else {
        const status = (labRes.reason as any)?.response?.status;
        if (status === 500) {
          addToast('Server error on endpoint lab/benefices/ (500). Please check backend configuration.', 'error');
        }
        setLabData(null);
      }
    } catch {
      addToast('Unexpected error during loading', 'error');
    } finally {
      setLoading(false);
    }
  }, [dateDebut, dateFin, statut, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleExpandEssence = (id: number) => {
    setExpandedEssences(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ─── Normalize API response ──────────────────────────────────────────────────
  // Support both the flat shape { benefice_total, chiffre_affaires_total, … }
  // and the older nested shape { totaux: { benefice_net, chiffre_affaires, … }, par_categorie: { … } }
  const beneficeNet = parseFloat(
    String(profitData?.benefice_total ?? profitData?.totaux?.benefice_net ?? labData?.benefice_total ?? 0)
  );
  const caGlobal = parseFloat(
    String(profitData?.chiffre_affaires_total ?? profitData?.totaux?.chiffre_affaires ?? labData?.chiffre_affaires_total ?? 0)
  );
  const coutTotal = parseFloat(
    String(profitData?.cout_total ?? profitData?.totaux?.cout_total ?? (caGlobal - beneficeNet))
  );
  const nbCommandes = profitData?.nb_commandes ?? '—';
  const margeGlobale = profitData?.marge_globale != null
    ? Number(profitData.marge_globale).toFixed(1)
    : (caGlobal > 0 ? ((beneficeNet / caGlobal) * 100).toFixed(1) : (labData?.marge_globale ?? '0'));

  // Category breakdown — prefer flat benefices_par_type array, fall back to par_categorie map
  const beneficesParType: { type: string; nombre_articles: number; chiffre_affaires: string; cout_achat: string; benefice: string; marge_percent: number }[] =
    profitData?.benefices_par_type ?? labData?.benefices_par_type ?? [];

  const parCategorie = profitData?.par_categorie || {};
  
  // Build fallback category data from benefices_par_type if par_categorie is missing
  const fallbackCategoryData = beneficesParType.length > 0
    ? {
        essences: beneficesParType.find(b => b.type === 'produit_fini_essence') || 
                  beneficesParType.find(b => b.type === 'essence') || {},
        parfums: beneficesParType.find(b => b.type === 'parfum') || {},
        accessoires: beneficesParType.find(b => b.type === 'accessoire') || {},
        parfums_personnalises: beneficesParType.find(b => b.type === 'parfum_personnalise') || {},
        essences_sur_mesure: {},
      }
    : parCategorie;
  
  const essencesCat = fallbackCategoryData.essences || {};
  const parfumsCat = fallbackCategoryData.parfums || {};
  const accessoiresCat = fallbackCategoryData.accessoires || {};
  const parfumsPersoCat = fallbackCategoryData.parfums_personnalises || {};
  const essencesSurMesureCat = fallbackCategoryData.essences_sur_mesure || {};

  // Individual products from flat produits[] array
  const produits: { type: string; id: number; nom: string; prix_vente: string; prix_achat: string; benefice: string; marge_percent: number }[] =
    profitData?.produits ?? [];

  // Essence lots from flat lots[] array
  const lotsApi: { type: string; id: number; essence: string; chiffre_affaires_genere: string; benefice: string }[] =
    profitData?.lots ?? [];

  const detailEssences: EssenceDetail[] = essencesCat.detail_par_essence || profitData?.benefices_par_essence || labData?.benefices_par_essence?.map((e: any) => ({
    essence_id: e.essence_id || e.id,
    essence_nom: e.essence || e.nom,
    essence_categorie: e.categorie || 'Essence',
    ca_total: e.chiffre_affaires || 0,
    cout_total: e.cout_achat || 0,
    benefice_total: e.benefice || 0,
    lots: e.lots || []
  })) || [];

  const TYPE_LABELS: Record<string, string> = {
    parfum: tp('type_parfum'),
    accessoire: tp('type_accessoire'),
    produit_fini_essence: tp('type_produit_fini'),
    essence: tp('type_essence'),
    parfum_personnalise: tp('type_parfum_perso'),
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header & Filters */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gold/10 text-gold border border-gold/20">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{tp('title')}</h2>
              <p className="text-xs text-foreground/40">{tp('subtitle')}</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-foreground/70 hover:text-foreground transition-all self-start sm:self-auto flex items-center gap-2 text-xs font-semibold"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-gold' : ''} />
            {tp('refresh')}
          </button>
        </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/5">
          <div>
            <label className="block text-[10px] font-bold text-foreground/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar size={12} /> {tp('start_date')}
            </label>
            <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-foreground/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar size={12} /> {tp('end_date')}
            </label>
            <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-foreground/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Filter size={12} /> {tp('order_status')}
            </label>
            <select value={statut} onChange={e => setStatut(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-gold">
              <option value="validated" className="bg-neutral-900 text-white">{tp('status_validated')}</option>
              <option value="delivered" className="bg-neutral-900 text-white">{tp('status_delivered')}</option>
              <option value="paid" className="bg-neutral-900 text-white">{tp('status_paid')}</option>
              <option value="all" className="bg-neutral-900 text-white">{tp('status_all')}</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
          <Loader2 className="animate-spin" size={32} />
          <p className="text-sm font-medium">{tp('loading')}</p>
        </div>
      ) : error === 'auth' ? (
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <Award size={24} className="text-red-400" />
          </div>
          <h3 className="font-bold text-foreground text-base">{tp('auth_title')}</h3>
          <p className="text-sm text-foreground/50 max-w-sm mx-auto">{tp('auth_desc')}</p>
          <a href="/login" className="inline-block mt-2 px-5 py-2 rounded-xl bg-gold text-black text-xs font-bold hover:bg-gold/80 transition-colors">{tp('auth_signin')}</a>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground/40">{tp('kpi_revenue')}</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400"><DollarSign size={18} /></div>
              </div>
              <p className="text-2xl font-extrabold text-foreground">{caGlobal.toLocaleString('fr-FR')} <span className="text-xs font-normal text-foreground/40">FCFA</span></p>
              <p className="text-[11px] text-foreground/40 mt-1">{tp('kpi_revenue_sub')}</p>
            </div>
            <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground/40">{tp('kpi_cost')}</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400"><Layers size={18} /></div>
              </div>
              <p className="text-2xl font-extrabold text-foreground">{coutTotal.toLocaleString('fr-FR')} <span className="text-xs font-normal text-foreground/40">FCFA</span></p>
              <p className="text-[11px] text-foreground/40 mt-1">{tp('kpi_cost_sub')}</p>
            </div>
            <div className="bg-white/5 rounded-2xl border border-gold/20 p-5 shadow-sm bg-gradient-to-br from-gold/5 to-transparent">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gold">{tp('kpi_profit')}</span>
                <div className="p-2 rounded-xl bg-gold/10 text-gold"><Award size={18} /></div>
              </div>
              <p className="text-2xl font-extrabold text-gold">{beneficeNet.toLocaleString('fr-FR')} <span className="text-xs font-normal text-gold/60">FCFA</span></p>
              <p className="text-[11px] text-gold/60 mt-1">{tp('kpi_profit_sub')} <span className="font-bold">{margeGlobale}%</span></p>
            </div>
            <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground/40">{tp('kpi_orders')}</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400"><Package size={18} /></div>
              </div>
              <p className="text-2xl font-extrabold text-foreground">{nbCommandes}</p>
              <p className="text-[11px] text-foreground/40 mt-1">{tp('kpi_orders_sub')}</p>
            </div>
          </div>

          {/* Section 2: Category Breakdown */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <PieChartIcon size={16} className="text-gold" />
                {tp('section_breakdown')}
              </h3>
            </div>

            {/* First try to show benefices_par_type data if available */}
            {beneficesParType && beneficesParType.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {beneficesParType.map(cat => {
                  const ca = parseFloat(String(cat.chiffre_affaires || 0));
                  const cout = parseFloat(String(cat.cout_achat || 0));
                  const ben = parseFloat(String(cat.benefice || (ca - cout)));
                  const colorMap: Record<string, string> = {
                    parfum: 'text-purple-400',
                    accessoire: 'text-sky-400',
                    produit_fini_essence: 'text-amber-400',
                    essence: 'text-amber-400',
                    parfum_personnalise: 'text-emerald-400',
                  };
                  return (
                    <div key={cat.type} className="bg-white/5 rounded-xl border border-white/5 p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs font-bold ${colorMap[cat.type] ?? 'text-foreground/60'}`}>
                        {TYPE_LABELS[cat.type] ?? cat.type}
                        </p>
                        <span className="text-[10px] text-foreground/40">{cat.nombre_articles} {tp('articles')}</span>
                      </div>
                      <div>
                        <p className="text-[10px] text-foreground/40 uppercase">{tp('col_revenue')}</p>
                        <p className="text-sm font-bold text-foreground">{ca.toLocaleString('fr-FR')} FCFA</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-foreground/40 uppercase">{tp('col_cost')}</p>
                        <p className="text-sm font-bold text-foreground/60">{cout.toLocaleString('fr-FR')} FCFA</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-foreground/40 uppercase">{tp('col_profit')}</p>
                        <p className={`text-sm font-extrabold ${ben >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {ben >= 0 ? '+' : ''}{ben.toLocaleString('fr-FR')} FCFA
                          <span className="ml-1 text-[10px] font-normal text-foreground/40">({cat.marge_percent.toFixed(1)}%)</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  { title: tp('cat_essences'), data: essencesCat, color: 'text-amber-400' },
                  { title: tp('cat_parfums'), data: parfumsCat, color: 'text-purple-400' },
                  { title: tp('cat_accessoires'), data: accessoiresCat, color: 'text-sky-400' },
                  { title: tp('cat_parfums_perso'), data: parfumsPersoCat, color: 'text-emerald-400' },
                  { title: tp('cat_essences_sur_mesure'), data: essencesSurMesureCat, color: 'text-pink-400' },
                ].map(cat => {
                  // Handle both old format (chiffre_affaires, cout_total, benefice_net) and new format (chiffre_affaires, cout_achat, benefice)
                  const ca = parseFloat(String(cat.data?.chiffre_affaires || 0));
                  const cout = parseFloat(String(cat.data?.cout_total ?? cat.data?.cout_achat ?? 0));
                  const ben = parseFloat(String(cat.data?.benefice_net ?? cat.data?.benefice ?? (ca - cout)));
                  return (
                   <div key={cat.title} className="bg-white/5 rounded-xl border border-white/5 p-4 space-y-2">
                     <p className={`text-xs font-bold ${cat.color}`}>{cat.title}</p>
                     <div>
                       <p className="text-[10px] text-foreground/40 uppercase">{tp('col_revenue')}</p>
                       <p className="text-sm font-bold text-foreground">{ca.toLocaleString('fr-FR')} FCFA</p>
                     </div>
                      <div>
                        <p className="text-[10px] text-foreground/40 uppercase">{tp('col_profit')}</p>
                        <p className={`text-sm font-extrabold ${ben >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {ben >= 0 ? '+' : ''}{ben.toLocaleString('fr-FR')} FCFA
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Individual Products Table */}
          {produits.length > 0 && (
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-white/10">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <Package size={16} className="text-gold" />
                  {tp('section_products')}
                </h3>
                <p className="text-xs text-foreground/40 mt-0.5">{produits.length} {tp('products_sub')}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">{tp('col_product')}</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">{tp('col_type')}</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">{tp('col_sale_price')}</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">{tp('col_purchase_cost')}</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">{tp('col_unit_profit')}</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider text-right">{tp('col_margin')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {produits.map(p => {
                      const ben = parseFloat(String(p.benefice || 0));
                      return (
                        <tr key={`${p.type}-${p.id}`} className="hover:bg-white/5 transition-colors">
                          <td className="px-5 py-3.5 font-semibold text-foreground text-sm">{p.nom}</td>
                          <td className="px-5 py-3.5 text-xs text-foreground/50">{TYPE_LABELS[p.type] ?? p.type}</td>
                          <td className="px-5 py-3.5 text-xs font-mono text-foreground">{parseFloat(String(p.prix_vente)).toLocaleString()} FCFA</td>
                          <td className="px-5 py-3.5 text-xs font-mono text-foreground/60">{parseFloat(String(p.prix_achat)).toLocaleString()} FCFA</td>
                          <td className="px-5 py-3.5 text-xs font-mono font-bold">
                            <span className={ben >= 0 ? 'text-emerald-400' : 'text-red-400'}>{ben >= 0 ? '+' : ''}{ben.toLocaleString()} FCFA</span>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-right">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${p.marge_percent >= 50 ? 'bg-emerald-500/10 text-emerald-400' : p.marge_percent >= 20 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                              {p.marge_percent.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 4: Essence Lots Table */}
          {lotsApi.length > 0 && (
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-white/10">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <Layers size={16} className="text-gold" />
                  {tp('section_lots')}
                </h3>
                <p className="text-xs text-foreground/40 mt-0.5">{lotsApi.length} {tp('lots_sub')}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">{tp('col_lot')}</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">{tp('col_essence')}</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">{tp('col_ca_generated')}</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider text-right">{tp('col_lot_profit')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {lotsApi.map(lot => {
                      const ben = parseFloat(String(lot.benefice || 0));
                      const ca = parseFloat(String(lot.chiffre_affaires_genere || 0));
                      return (
                        <tr key={lot.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-5 py-3.5 text-xs font-mono text-foreground/60">#{lot.id}</td>
                          <td className="px-5 py-3.5 font-semibold text-foreground text-sm">{lot.essence}</td>
                          <td className="px-5 py-3.5 text-xs font-mono text-foreground">{ca.toLocaleString()} FCFA</td>
                          <td className="px-5 py-3.5 text-xs font-mono font-bold text-right">
                            <span className={ben >= 0 ? 'text-emerald-400' : 'text-red-400'}>{ben >= 0 ? '+' : ''}{ben.toLocaleString()} FCFA</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 5: Detailed Essence Sales Table */}
          {detailEssences.length > 0 && (
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <Sparkles size={16} className="text-gold" />
                    {tp('section_essences')}
                  </h3>
                  <p className="text-xs text-foreground/40 mt-0.5">{tp('essences_sub')}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">{tp('col_ess_name')}</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">{tp('col_ess_cat')}</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">{tp('col_cumulative_ca')}</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">{tp('col_cumulative_cost')}</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">{tp('col_total_profit')}</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider text-right">{tp('col_lots')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {detailEssences.map((ess) => {
                      const essId = ess.essence_id;
                      const isExpanded = expandedEssences.has(essId);
                      const ca = parseFloat(String(ess.ca_total || 0));
                      const cout = parseFloat(String(ess.cout_total || 0));
                      const ben = parseFloat(String(ess.benefice_total || (ca - cout)));
                      const lotsList = ess.lots || [];
                      return (
                        <React.Fragment key={essId}>
                          <tr onClick={() => toggleExpandEssence(essId)} className="hover:bg-white/5 transition-colors cursor-pointer group">
                            <td className="px-5 py-4 font-bold text-foreground text-sm flex items-center gap-2">
                              {lotsList.length > 0 ? (isExpanded ? <ChevronUp size={14} className="text-gold" /> : <ChevronDown size={14} className="text-foreground/40 group-hover:text-gold" />) : null}
                              {ess.essence_nom}
                            </td>
                            <td className="px-5 py-4 text-xs text-foreground/60">{ess.essence_categorie || 'Standard'}</td>
                            <td className="px-5 py-4 text-xs font-mono font-semibold text-foreground">{ca.toLocaleString()} FCFA</td>
                            <td className="px-5 py-4 text-xs font-mono text-foreground/60">{cout.toLocaleString()} FCFA</td>
                            <td className="px-5 py-4 text-xs font-mono font-bold">
                              <span className={ben >= 0 ? 'text-emerald-400' : 'text-red-400'}>{ben >= 0 ? '+' : ''}{ben.toLocaleString()} FCFA</span>
                            </td>
                            <td className="px-5 py-4 text-xs text-right">
                              <span className="px-2 py-1 rounded bg-white/5 text-foreground/60 text-[10px] font-bold">{lotsList.length} lot(s)</span>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={6} className="bg-black/30 px-6 py-4 border-t border-b border-white/5">
                                <div className="space-y-3">
                                  <p className="text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-1.5">
                                    <Layers size={13} />
                                    {tp('lots_detail')}
                                  </p>
                                  {lotsList.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {lotsList.map((lot, idx) => {
                                        const ref = lot.reference || lot.reference_fournisseur || lot.numero_lot || `Lot #${lot.lot_id || lot.id || idx + 1}`;
                                        const stockRestant = lot.stock_restant ?? lot.quantite_ml ?? '—';
                                        const bLot = parseFloat(String(lot.benefice_lot || 0));
                                        return (
                                          <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1 text-xs">
                                            <div className="flex items-center justify-between">
                                              <span className="font-mono font-bold text-foreground">{ref}</span>
                                              <span className={`font-bold ${bLot >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {bLot >= 0 ? '+' : ''}{bLot.toLocaleString()} FCFA
                                              </span>
                                            </div>
                                            <p className="text-[10px] text-foreground/40">
                                              {tp('lot_stock')}: <span className="text-foreground/70 font-semibold">{stockRestant} ml</span>
                                            </p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-foreground/40 italic">{tp('no_lot_detail')}</p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    {detailEssences.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-16 text-foreground/40 italic text-sm">
                          No essence sales recorded for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}