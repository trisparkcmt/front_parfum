'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  Loader2,
  Calendar,
  Filter,
  RefreshCw,
  Award,
  PieChart as PieChartIcon,
  Building2,
  Store,
  Sparkles,
  ShoppingBag,
  FlaskConical,
  Wind,
  Info,
  ChevronDown,
  ChevronRight,
  CreditCard,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { useTranslation } from 'react-i18next';
import { getLocalizedToast } from '@/lib/toastMessages';
import type { StatistiquesBeneficesResponse } from '@/types';

const TP = {
  fr: {
    title: 'Tableau de Bord Analytique des Bénéfices',
    subtitle: 'Analyse détaillée des revenus, coûts d\'achat, marges nettes et commissions',
    refresh: 'Actualiser',
    all: 'tout',
    start_date: 'Date de début',
    end_date: 'Date de fin',
    order_status: 'Statut de la commande',
    payment_status: 'Statut du paiement',
    status_all: 'Tous les statuts (sauf annulées)',
    status_validated: 'Validées',
    status_pending: 'En attente',
    status_delivered: 'Livrées uniquement',
    payment_paid: 'Payées (Défaut)',
    payment_all: 'Tous les paiements',
    payment_pending: 'En attente',
    payment_refunded: 'Remboursées',
    tip_payment: 'Note : Par défaut, seules les commandes payées sont incluses. Si vous constatez des montants à 0.00, sélectionnez "Tous les paiements".',
    btn_show_all_payments: 'Afficher tous les paiements',
    loading: 'Calcul et analyse des données de bénéfices…',
    auth_title: 'Accès non autorisé (401)',
    auth_desc: 'Votre session a expiré ou votre compte ne dispose pas des droits Administrateur requis pour accéder aux analyses financières.',
    auth_signin: 'Se reconnecter',

    // Global KPIs
    kpi_revenue: 'Chiffre d\'affaires global',
    kpi_revenue_sub: 'Total des ventes générées (Maison + Boutiques)',
    kpi_cost: 'Coût d\'achat total',
    kpi_cost_sub: 'Coût des produits maison & boutiques vendus',
    kpi_profit: 'Bénéfice net plateforme',
    kpi_profit_sub: 'Bénéfice maison + commissions perçues :',
    kpi_orders: 'Nombre de commandes',
    kpi_orders_sub: 'Commandes comptabilisées',

    // Platform Split
    section_platform_split: 'Ventilation Plateforme : Maison Mère vs Boutiques Partenaires',
    maison_title: 'Boutique Globale Maison',
    maison_sub: 'Chiffre d\'affaires et bénéfices générés exclusivement par les produits propres de la maison.',
    boutiques_title: 'Boutiques Partenaires (Dépôts)',
    boutiques_sub: 'Ventes réalisées par les boutiques partenaires, commissions gagnées par l\'admin et montants reversés.',
    kpi_ca_brut: 'CA Brut Partenaires',
    kpi_commission: 'Commissions Encaissées (Admin)',
    kpi_net_reverser: 'Net à Reverser aux Boutiques',
    part_maison: 'Maison',
    part_boutiques: 'Boutiques',

    // Categories
    section_breakdown: 'Bilan financier par catégorie de produit',
    cat_parfums: 'Parfums',
    cat_accessoires: 'Accessoires',
    cat_laboratoire: 'Laboratoire / Sur-mesure',
    cat_diffuseurs: 'Diffuseurs',
    cat_essences: 'Essences Catalogue',
    subcat_parfums_perso: 'Parfums personnalisés',
    subcat_produits_finis: 'Produits finis essence',
    subcat_essences_perso: 'Essences personnalisées',
    col_revenue: 'Chiffre d\'affaires',
    col_cost: 'Coût d\'achat',
    col_profit: 'Bénéfice net',
    col_sales_count: 'Ventes',
    sales_units: 'ventes',
    lines: 'lignes',

    // Legacy tables
    section_products: 'Détail des bénéfices par produit',
    products_sub: 'produits avec données de bénéfices',
    col_product: 'Produit',
    col_type: 'Type',
    col_sale_price: 'Prix de vente',
    col_purchase_cost: 'Coût d\'achat',
    col_unit_profit: 'Bénéfice / Unité',
    col_margin: 'Marge',
    section_lots: 'Revenus des lots d\'essences',
    lots_sub: 'lots d\'essences consommés',
    col_lot: 'Lot #',
    col_essence: 'Essence',
    col_ca_generated: 'CA généré',
    col_lot_profit: 'Bénéfice lot',
    section_essences: 'Détail ventes & lots par essence',
    essences_sub: 'Essences et lots associés',
    col_ess_name: 'Essence',
    col_ess_cat: 'Catégorie',
    col_cumulative_ca: 'CA cumulatif',
    col_cumulative_cost: 'Coût cumulatif',
    col_total_profit: 'Bénéfice total',
    col_lots: 'Lots',
    type_parfum: 'Parfums',
    type_accessoire: 'Accessoires',
    type_produit_fini: 'Essences finies',
    type_essence: 'Essences',
    type_parfum_perso: 'Parfums personnalisés',
    articles: 'articles',
  },
  en: {
    title: 'Profit Analytics Dashboard',
    subtitle: 'Detailed analysis of revenue, purchase costs, net margin and commissions',
    refresh: 'Refresh',
    all: 'all',
    start_date: 'Start Date',
    end_date: 'End Date',
    order_status: 'Order Status',
    payment_status: 'Payment Status',
    status_all: 'All statuses (except canceled)',
    status_validated: 'Validated',
    status_pending: 'Pending',
    status_delivered: 'Delivered only',
    payment_paid: 'Paid (Default)',
    payment_all: 'All payments',
    payment_pending: 'Pending',
    payment_refunded: 'Refunded',
    tip_payment: 'Note: By default, only paid orders are included. If you see 0.00 everywhere, select "All payments".',
    btn_show_all_payments: 'Show all payments',
    loading: 'Calculating and analyzing profit data…',
    auth_title: 'Unauthorized Access (401)',
    auth_desc: 'Your session has expired or your account lacks the required Admin privileges to access financial analytics.',
    auth_signin: 'Sign In Again',

    // Global KPIs
    kpi_revenue: 'Overall Revenue',
    kpi_revenue_sub: 'Total sales generated (House + Boutiques)',
    kpi_cost: 'Total Purchase Cost',
    kpi_cost_sub: 'Cost of house & boutique products sold',
    kpi_profit: 'Platform Net Profit',
    kpi_profit_sub: 'House profit + admin commissions earned:',
    kpi_orders: 'Number of Orders',
    kpi_orders_sub: 'Completed orders counted',

    // Platform Split
    section_platform_split: 'Platform Breakdown: House vs Partner Boutiques',
    maison_title: 'House Global Store',
    maison_sub: 'Revenue and profit generated exclusively by in-house products.',
    boutiques_title: 'Partner Boutiques (Consignment)',
    boutiques_sub: 'Sales by partner boutiques, admin commissions earned and payouts to boutiques.',
    kpi_ca_brut: 'Partner Gross Sales',
    kpi_commission: 'Commissions Earned (Admin)',
    kpi_net_reverser: 'Net Payout to Boutiques',
    part_maison: 'House',
    part_boutiques: 'Boutiques',

    // Categories
    section_breakdown: 'Financial Breakdown by Product Category',
    cat_parfums: 'Perfumes',
    cat_accessoires: 'Accessories',
    cat_laboratoire: 'Laboratory / Tailor-Made',
    cat_diffuseurs: 'Diffusers',
    cat_essences: 'Catalog Essences',
    subcat_parfums_perso: 'Custom perfumes',
    subcat_produits_finis: 'Finished essences',
    subcat_essences_perso: 'Custom essences',
    col_revenue: 'Revenue',
    col_cost: 'Purchase Cost',
    col_profit: 'Net Profit',
    col_sales_count: 'Sales',
    sales_units: 'sales',
    lines: 'lines',

    // Legacy tables
    section_products: 'Product-Level Profit Detail',
    products_sub: 'products with profit data',
    col_product: 'Product',
    col_type: 'Type',
    col_sale_price: 'Sale Price',
    col_purchase_cost: 'Purchase Cost',
    col_unit_profit: 'Profit / Unit',
    col_margin: 'Margin',
    section_lots: 'Essence Lots Revenue',
    lots_sub: 'consumed essence lots',
    col_lot: 'Lot #',
    col_essence: 'Essence',
    col_ca_generated: 'Revenue Generated',
    col_lot_profit: 'Lot Profit',
    section_essences: 'Sales & Lots Detail by Essence',
    essences_sub: 'Essences and associated lots',
    col_ess_name: 'Essence',
    col_ess_cat: 'Category',
    col_cumulative_ca: 'Cumulative Revenue',
    col_cumulative_cost: 'Cumulative Cost',
    col_total_profit: 'Total Profit',
    col_lots: 'Lots',
    type_parfum: 'Perfumes',
    type_accessoire: 'Accessories',
    type_produit_fini: 'Finished essences',
    type_essence: 'Essences',
    type_parfum_perso: 'Custom perfumes',
    articles: 'articles',
  },
} as const;

type TPKey = keyof typeof TP.fr;

function formatFCFA(val: string | number | undefined | null): string {
  const num = typeof val === 'string' ? parseFloat(val) : (val ?? 0);
  if (isNaN(num)) return '0 FCFA';
  return `${Math.round(num).toLocaleString('fr-FR')} FCFA`;
}

interface ProfitAnalyticsDashboardProps {
  initialData?: StatistiquesBeneficesResponse | any | null;
  isLoading?: boolean;
  onFetchWithFilters?: (params: { date_debut?: string; date_fin?: string; statut?: string; statut_paiement?: string }) => void;
}

export default function ProfitAnalyticsDashboard({
  initialData,
  isLoading: externalLoading,
  onFetchWithFilters,
}: ProfitAnalyticsDashboardProps) {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en') ?? false;
  const tp = (k: TPKey) => (isEn ? TP.en[k] : TP.fr[k]);

  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [statut, setStatut] = useState('tous');
  const [statutPaiement, setStatutPaiement] = useState('payé');
  const [profitData, setProfitData] = useState<any | null>(initialData || null);
  const [internalLoading, setInternalLoading] = useState(!initialData);
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToastStore();

  // Expanded state for essences / categories
  const [expandedEssenceId, setExpandedEssenceId] = useState<number | null>(null);

  // Sync with initialData prop if provided
  useEffect(() => {
    if (initialData) {
      setProfitData(initialData);
      setInternalLoading(false);
    }
  }, [initialData]);

  const fetchData = useCallback(async () => {
    const params: Record<string, string> = {};
    if (dateDebut) params.date_debut = dateDebut;
    if (dateFin) params.date_fin = dateFin;
    if (statut && statut !== 'tous' && statut !== 'all') params.statut = statut;
    if (statutPaiement) params.statut_paiement = statutPaiement;

    if (onFetchWithFilters) {
      onFetchWithFilters(params);
      return;
    }

    try {
      setInternalLoading(true);
      setError(null);
      const res = await adminService.getProfitStats(params);
      setProfitData(res);
    } catch (requestError: any) {
      const status = requestError?.response?.status;
      if (status === 401) {
        setError('auth');
      } else {
        console.error('Failed to load profit data:', requestError);
        addToast(getLocalizedToast('Failed to load profit stats', 'Échec du chargement des statistiques de bénéfices'), 'error');
      }
    } finally {
      setInternalLoading(false);
    }
  }, [dateDebut, dateFin, statut, statutPaiement, onFetchWithFilters, addToast]);

  useEffect(() => {
    if (!initialData) {
      fetchData();
    }
  }, [fetchData, initialData]);

  // Extract totals based on the official documentation:
  // totaux: { chiffre_affaires, cout_total, benefice_net, boutique_globale_maison, boutiques_partenaires }
  const totaux = profitData?.totaux;
  const caGlobal = parseFloat(String(totaux?.chiffre_affaires ?? profitData?.chiffre_affaires_total ?? 0));
  const coutTotal = parseFloat(String(totaux?.cout_total ?? profitData?.cout_total ?? 0));
  const beneficeNet = parseFloat(String(totaux?.benefice_net ?? profitData?.benefice_total ?? 0));
  const nbCommandes = profitData?.nb_commandes ?? '—';
  const margeGlobale = caGlobal > 0 ? ((beneficeNet / caGlobal) * 100).toFixed(2) : '0.00';

  // Maison vs Boutiques Partenaires breakdown
  const maisonTotaux = totaux?.boutique_globale_maison;
  const boutiquesTotaux = totaux?.boutiques_partenaires;

  // Categories breakdown from par_categorie
  const parCategorie = profitData?.par_categorie || {};
  const catParfums = parCategorie.parfums;
  const catAccessoires = parCategorie.accessoires;
  const catLabo = parCategorie.laboratoire;
  const catDiffuseurs = parCategorie.diffuseurs;
  const catEssences = parCategorie.essences;

  // Legacy arrays if present
  const produits = Array.isArray(profitData?.produits) ? profitData.produits : [];
  const lotsApi = Array.isArray(profitData?.lots) ? profitData.lots : [];
  const essenceDetailList: any[] = Array.isArray(catEssences?.detail_par_essence) ? catEssences.detail_par_essence : [];

  const TYPE_LABELS: Record<string, string> = {
    parfum: tp('type_parfum'),
    accessoire: tp('type_accessoire'),
    produit_fini_essence: tp('type_produit_fini'),
    essence: tp('type_essence'),
    parfum_personnalise: tp('type_parfum_perso'),
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ── Filters & Controls Bar ── */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gold/10 text-gold border border-gold/20 shadow-inner">
              <TrendingUp size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{tp('title')}</h2>
              <p className="text-xs text-foreground/45 mt-0.5">{tp('subtitle')}</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-foreground/75 hover:text-foreground transition-all self-start sm:self-auto flex items-center gap-2 text-xs font-semibold cursor-pointer active:scale-95"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-gold' : ''} />
            {tp('refresh')}
          </button>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-white/5">
          {/* 1. Statut Paiement (Important parameter from doc) */}
          <div>
            <label className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <CreditCard size={12} className="text-gold" /> {tp('payment_status')}
            </label>
            <select
              value={statutPaiement}
              onChange={(e) => setStatutPaiement(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-gold cursor-pointer"
            >
              <option value="payé" className="bg-neutral-900 text-white">{tp('payment_paid')}</option>
              <option value="tous" className="bg-neutral-900 text-white">{tp('payment_all')}</option>
              <option value="en_attente" className="bg-neutral-900 text-white">{tp('payment_pending')}</option>
              <option value="remboursé" className="bg-neutral-900 text-white">{tp('payment_refunded')}</option>
            </select>
          </div>

          {/* 2. Statut Commande */}
          <div>
            <label className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Filter size={12} /> {tp('order_status')}
            </label>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-gold cursor-pointer"
            >
              <option value="tous" className="bg-neutral-900 text-white">{tp('status_all')}</option>
              <option value="validé" className="bg-neutral-900 text-white">{tp('status_validated')}</option>
              <option value="en_attente" className="bg-neutral-900 text-white">{tp('status_pending')}</option>
              <option value="livrée" className="bg-neutral-900 text-white">{tp('status_delivered')}</option>
            </select>
          </div>

          {/* 3. Date Début */}
          <div>
            <label className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar size={12} /> {tp('start_date')}
            </label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-gold"
            />
          </div>

          {/* 4. Date Fin */}
          <div>
            <label className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar size={12} /> {tp('end_date')}
            </label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-gold"
            />
          </div>
        </div>

        {/* Tip Alert if statutPaiement is payé and values are 0 */}
        {statutPaiement === 'payé' && caGlobal === 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <Info size={16} className="shrink-0 text-amber-400" />
              <span>{tp('tip_payment')}</span>
            </div>
            <button
              onClick={() => setStatutPaiement('tous')}
              className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-bold self-start sm:self-auto cursor-pointer transition-colors"
            >
              {tp('btn_show_all_payments')}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-gold gap-3 bg-white/[0.02] border border-white/10 rounded-2xl">
          <Loader2 className="animate-spin" size={32} />
          <p className="text-sm font-medium text-foreground/70">{tp('loading')}</p>
        </div>
      ) : error === 'auth' ? (
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <Award size={24} className="text-red-400" />
          </div>
          <h3 className="font-bold text-foreground text-base">{tp('auth_title')}</h3>
          <p className="text-sm text-foreground/50 max-w-sm mx-auto">{tp('auth_desc')}</p>
          <a
            href="/login"
            className="inline-block mt-2 px-5 py-2 rounded-xl bg-gold text-black text-xs font-bold hover:bg-gold/80 transition-colors"
          >
            {tp('auth_signin')}
          </a>
        </div>
      ) : (
        <>
          {/* ── Section 1: Hero KPIs ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Chiffre d'Affaires Global */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-foreground/50">{tp('kpi_revenue')}</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <DollarSign size={18} />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-foreground">
                  {caGlobal.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  <span className="text-xs font-normal text-foreground/40 ml-1.5">FCFA</span>
                </p>
                <p className="text-[11px] text-foreground/40 mt-1">{tp('kpi_revenue_sub')}</p>
              </div>
            </div>

            {/* 2. Coût d'Achat Total */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-foreground/50">{tp('kpi_cost')}</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <Layers size={18} />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-foreground">
                  {coutTotal.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  <span className="text-xs font-normal text-foreground/40 ml-1.5">FCFA</span>
                </p>
                <p className="text-[11px] text-foreground/40 mt-1">{tp('kpi_cost_sub')}</p>
              </div>
            </div>

            {/* 3. Bénéfice Net Plateforme */}
            <div className="bg-gradient-to-br from-gold/15 via-gold/5 to-white/[0.02] rounded-2xl border border-gold/30 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gold uppercase tracking-wider">{tp('kpi_profit')}</span>
                  <div className="p-2 rounded-xl bg-gold/20 text-gold border border-gold/30">
                    <Award size={18} />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-gold">
                  {beneficeNet.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  <span className="text-xs font-normal text-gold/70 ml-1.5">FCFA</span>
                </p>
                <p className="text-[11px] text-gold/70 mt-1">
                  {tp('kpi_profit_sub')} <strong className="font-extrabold">{margeGlobale}%</strong>
                </p>
              </div>
            </div>

            {/* 4. Nombre de Commandes */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-foreground/50">{tp('kpi_orders')}</span>
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <Package size={18} />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-foreground">{nbCommandes}</p>
                <p className="text-[11px] text-foreground/40 mt-1">{tp('kpi_orders_sub')}</p>
              </div>
            </div>
          </div>

          {/* ── Section 2: Platform Split (Maison Mère vs Boutiques Partenaires) ── */}
          {(maisonTotaux || boutiquesTotaux) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <Building2 size={16} className="text-gold" />
                  {tp('section_platform_split')}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Maison Mère Card */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">{tp('maison_title')}</h4>
                      <p className="text-[11px] text-foreground/45 mt-0.5">{maisonTotaux?.description || tp('maison_sub')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/5">
                    <div>
                      <span className="text-[10px] text-foreground/40 uppercase font-semibold block">{tp('col_revenue')}</span>
                      <span className="text-sm font-bold text-foreground">
                        {parseFloat(String(maisonTotaux?.chiffre_affaires || 0)).toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-foreground/40 uppercase font-semibold block">{tp('col_cost')}</span>
                      <span className="text-sm font-bold text-foreground/60">
                        {parseFloat(String(maisonTotaux?.cout_total || 0)).toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-foreground/40 uppercase font-semibold block">{tp('col_profit')}</span>
                      <span className="text-sm font-extrabold text-emerald-400">
                        +{parseFloat(String(maisonTotaux?.benefice_net || 0)).toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                  </div>
                </div>

                {/* Boutiques Partenaires Card */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Store size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">{tp('boutiques_title')}</h4>
                      <p className="text-[11px] text-foreground/45 mt-0.5">{boutiquesTotaux?.description || tp('boutiques_sub')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/5">
                    <div>
                      <span className="text-[10px] text-foreground/40 uppercase font-semibold block">{tp('kpi_ca_brut')}</span>
                      <span className="text-sm font-bold text-foreground">
                        {parseFloat(String(boutiquesTotaux?.chiffre_affaires_brut || 0)).toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-foreground/40 uppercase font-semibold block">{tp('kpi_commission')}</span>
                      <span className="text-sm font-extrabold text-gold">
                        +{parseFloat(String(boutiquesTotaux?.commission_admin_gagne || 0)).toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-foreground/40 uppercase font-semibold block">{tp('kpi_net_reverser')}</span>
                      <span className="text-sm font-bold text-purple-300">
                        {parseFloat(String(boutiquesTotaux?.net_a_reverser || 0)).toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Section 3: Financial Breakdown by Category ── */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <PieChartIcon size={16} className="text-gold" />
                  {tp('section_breakdown')}
                </h3>
                <p className="text-[11px] text-foreground/40 mt-0.5">Ventilation des ventes, coûts et marges par type de produit</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Parfums */}
              <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gold/10 text-gold">
                      <Sparkles size={16} />
                    </div>
                    <span className="text-xs font-bold text-foreground">{tp('cat_parfums')}</span>
                  </div>
                  {catParfums?.nb_ventes !== undefined && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-foreground/60 border border-white/10">
                      {catParfums.nb_ventes} {tp('sales_units')}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground/50">{tp('col_revenue')}:</span>
                    <span className="font-semibold text-foreground">{formatFCFA(catParfums?.chiffre_affaires)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground/50">{tp('col_cost')}:</span>
                    <span className="font-semibold text-foreground/60">{formatFCFA(catParfums?.cout_total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/5">
                    <span className="text-foreground/50">{tp('col_profit')}:</span>
                    <span className="font-extrabold text-emerald-400">
                      +{formatFCFA(catParfums?.benefice)}
                    </span>
                  </div>
                </div>

                {/* Sub-breakdown Maison vs Boutiques if provided */}
                {(catParfums?.maison || catParfums?.boutiques) && (
                  <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-[10px] text-foreground/50">
                    <div>
                      <span className="font-semibold text-blue-400 block">{tp('part_maison')}</span>
                      <span>{formatFCFA(catParfums?.maison?.benefice)}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-purple-400 block">{tp('part_boutiques')}</span>
                      <span>{formatFCFA(catParfums?.boutiques?.benefice)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Accessoires */}
              <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400">
                      <ShoppingBag size={16} />
                    </div>
                    <span className="text-xs font-bold text-foreground">{tp('cat_accessoires')}</span>
                  </div>
                  {catAccessoires?.nb_ventes !== undefined && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-foreground/60 border border-white/10">
                      {catAccessoires.nb_ventes} {tp('sales_units')}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground/50">{tp('col_revenue')}:</span>
                    <span className="font-semibold text-foreground">{formatFCFA(catAccessoires?.chiffre_affaires)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground/50">{tp('col_cost')}:</span>
                    <span className="font-semibold text-foreground/60">{formatFCFA(catAccessoires?.cout_total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/5">
                    <span className="text-foreground/50">{tp('col_profit')}:</span>
                    <span className="font-extrabold text-emerald-400">
                      +{formatFCFA(catAccessoires?.benefice)}
                    </span>
                  </div>
                </div>

                {/* Sub-breakdown Maison vs Boutiques if provided */}
                {(catAccessoires?.maison || catAccessoires?.boutiques) && (
                  <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-[10px] text-foreground/50">
                    <div>
                      <span className="font-semibold text-blue-400 block">{tp('part_maison')}</span>
                      <span>{formatFCFA(catAccessoires?.maison?.benefice)}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-purple-400 block">{tp('part_boutiques')}</span>
                      <span>{formatFCFA(catAccessoires?.boutiques?.benefice)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Laboratoire / Sur-Mesure */}
              <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <FlaskConical size={16} />
                    </div>
                    <span className="text-xs font-bold text-foreground">{tp('cat_laboratoire')}</span>
                  </div>
                  {catLabo?.nb_ventes !== undefined && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-foreground/60 border border-white/10">
                      {catLabo.nb_ventes} {tp('sales_units')}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground/50">{tp('col_revenue')}:</span>
                    <span className="font-semibold text-foreground">{formatFCFA(catLabo?.chiffre_affaires)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground/50">{tp('col_cost')}:</span>
                    <span className="font-semibold text-foreground/60">{formatFCFA(catLabo?.cout_total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/5">
                    <span className="text-foreground/50">{tp('col_profit')}:</span>
                    <span className="font-extrabold text-emerald-400">
                      +{formatFCFA(catLabo?.benefice)}
                    </span>
                  </div>
                </div>

                {/* Sub-breakdown: Parfums perso / Produits finis / Essences perso */}
                {(catLabo?.parfums_personnalises || catLabo?.produits_finis_essence || catLabo?.essences_personnalisees) && (
                  <div className="pt-2 border-t border-white/5 space-y-1 text-[10px]">
                    {catLabo.parfums_personnalises && (
                      <div className="flex items-center justify-between text-foreground/60">
                        <span>{tp('subcat_parfums_perso')}</span>
                        <span className="font-semibold text-foreground">
                          {formatFCFA(catLabo.parfums_personnalises.benefice)}
                        </span>
                      </div>
                    )}
                    {catLabo.produits_finis_essence && (
                      <div className="flex items-center justify-between text-foreground/60">
                        <span>{tp('subcat_produits_finis')}</span>
                        <span className="font-semibold text-foreground">
                          {formatFCFA(catLabo.produits_finis_essence.benefice)}
                        </span>
                      </div>
                    )}
                    {catLabo.essences_personnalisees && (
                      <div className="flex items-center justify-between text-foreground/60">
                        <span>{tp('subcat_essences_perso')}</span>
                        <span className="font-semibold text-foreground">
                          {formatFCFA(catLabo.essences_personnalisees.benefice)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 4. Diffuseurs */}
              <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                      <Wind size={16} />
                    </div>
                    <span className="text-xs font-bold text-foreground">{tp('cat_diffuseurs')}</span>
                  </div>
                  {catDiffuseurs?.nb_ventes !== undefined && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-foreground/60 border border-white/10">
                      {catDiffuseurs.nb_ventes} {tp('sales_units')}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground/50">{tp('col_revenue')}:</span>
                    <span className="font-semibold text-foreground">{formatFCFA(catDiffuseurs?.chiffre_affaires)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground/50">{tp('col_cost')}:</span>
                    <span className="font-semibold text-foreground/60">{formatFCFA(catDiffuseurs?.cout_total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/5">
                    <span className="text-foreground/50">{tp('col_profit')}:</span>
                    <span className="font-extrabold text-emerald-400">
                      +{formatFCFA(catDiffuseurs?.benefice)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 text-[10px] text-foreground/40 italic">
                  Ventes exclusives Maison Mère
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 4: Essence Lots Detail (if essences detail present) ── */}
          {essenceDetailList.length > 0 && (
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <FlaskConical size={16} className="text-indigo-400" />
                    {tp('section_essences')}
                  </h3>
                  <p className="text-xs text-foreground/40 mt-0.5">{essenceDetailList.length} {tp('essences_sub')}</p>
                </div>
              </div>
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-neutral-900 border-b border-white/10 text-foreground/60 text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="px-5 py-3.5">{tp('col_ess_name')}</th>
                      <th className="px-5 py-3.5">{tp('col_ess_cat')}</th>
                      <th className="px-5 py-3.5 text-right">{tp('col_cumulative_ca')}</th>
                      <th className="px-5 py-3.5 text-right">{tp('col_cumulative_cost')}</th>
                      <th className="px-5 py-3.5 text-right">{tp('col_total_profit')}</th>
                      <th className="px-5 py-3.5 text-center">{tp('col_lots')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {essenceDetailList.map((ess) => {
                      const isExpanded = expandedEssenceId === ess.essence_id;
                      const lotsCount = Array.isArray(ess.lots) ? ess.lots.length : 0;
                      const ca = parseFloat(String(ess.ca_total || 0));
                      const cout = parseFloat(String(ess.cout_total || 0));
                      const ben = parseFloat(String(ess.benefice_total || (ca - cout)));

                      return (
                        <React.Fragment key={ess.essence_id}>
                          <tr
                            onClick={() => setExpandedEssenceId(isExpanded ? null : ess.essence_id)}
                            className="hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <td className="px-5 py-3.5 font-semibold text-foreground flex items-center gap-2">
                              {lotsCount > 0 && (
                                isExpanded ? <ChevronDown size={14} className="text-gold" /> : <ChevronRight size={14} className="text-foreground/40" />
                              )}
                              <span>{ess.essence_nom}</span>
                            </td>
                            <td className="px-5 py-3.5 text-foreground/60 capitalize">{ess.essence_categorie}</td>
                            <td className="px-5 py-3.5 text-right font-mono text-foreground">{formatFCFA(ca)}</td>
                            <td className="px-5 py-3.5 text-right font-mono text-foreground/60">{formatFCFA(cout)}</td>
                            <td className="px-5 py-3.5 text-right font-mono font-bold">
                              <span className={ben >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                {ben >= 0 ? '+' : ''}{formatFCFA(ben)}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 text-foreground/60 border border-white/10">
                                {lotsCount} lots
                              </span>
                            </td>
                          </tr>

                          {/* Expanded Lots Sub-Table */}
                          {isExpanded && Array.isArray(ess.lots) && ess.lots.length > 0 && (
                            <tr className="bg-white/[0.02]">
                              <td colSpan={6} className="px-8 py-3">
                                <div className="rounded-xl border border-white/5 p-3 space-y-2 bg-black/20">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-gold">Détail des lots</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {ess.lots.map((lot: any) => (
                                      <div key={lot.lot_id} className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-[11px] space-y-1">
                                        <div className="flex items-center justify-between font-semibold text-foreground">
                                          <span>{lot.reference || `Lot #${lot.lot_id}`}</span>
                                          <span className="text-[10px] text-foreground/40">{lot.date_reception}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-foreground/60 text-[10px]">
                                          <span>Stock restant: <strong>{lot.stock_restant} ml</strong></span>
                                          <span>Prix achat: <strong>{lot.prix_achat_par_ml ? `${lot.prix_achat_par_ml} F/ml` : '—'}</strong></span>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-white/5">
                                          <span>Bénéfice:</span>
                                          <span className="font-bold text-emerald-400">+{formatFCFA(lot.benefice_lot)}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Section 5: Legacy Products Table (if present) ── */}
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
                    <tr className="border-b border-white/10 bg-white/5 text-[10px] uppercase font-semibold text-foreground/40">
                      <th className="px-5 py-3.5">{tp('col_product')}</th>
                      <th className="px-5 py-3.5">{tp('col_type')}</th>
                      <th className="px-5 py-3.5">{tp('col_sale_price')}</th>
                      <th className="px-5 py-3.5">{tp('col_purchase_cost')}</th>
                      <th className="px-5 py-3.5">{tp('col_unit_profit')}</th>
                      <th className="px-5 py-3.5 text-right">{tp('col_margin')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {produits.map((p: any) => {
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
                              {p.marge_percent?.toFixed(1) ?? '0.0'}%
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

          {/* ── Section 6: Legacy Lots Table (if present) ── */}
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
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-[10px] uppercase font-semibold text-foreground/40">
                      <th className="px-5 py-3.5">{tp('col_lot')}</th>
                      <th className="px-5 py-3.5">{tp('col_essence')}</th>
                      <th className="px-5 py-3.5">{tp('col_ca_generated')}</th>
                      <th className="px-5 py-3.5 text-right">{tp('col_lot_profit')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {lotsApi.map((lot: any) => {
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
        </>
      )}
    </div>
  );
}
