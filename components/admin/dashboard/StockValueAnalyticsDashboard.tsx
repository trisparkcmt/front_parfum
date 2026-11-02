'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Coins,
  TrendingUp,
  Package,
  Layers,
  Loader2,
  RefreshCw,
  Award,
  Store,
  Sparkles,
  ShoppingBag,
  FlaskConical,
  Boxes,
  Wind,
  Search,
  Building2,
  PieChart as PieChartIcon,
  BarChart3,
  CheckCircle2,
  Info,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import { adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { useTranslation } from 'react-i18next';
import { getLocalizedToast } from '@/lib/toastMessages';
import type { ValeurStockMarchand, StatistiquesBeneficesResponse } from '@/types';

const TS = {
  fr: {
    title: 'Valeur Marchande du Stock',
    subtitle: 'Évaluation marchande du stock basée exclusivement sur les prix de vente actuels (articles actifs & positifs)',
    refresh: 'Actualiser',
    loading: 'Calcul de la valeur marchande du stock…',
    auth_title: 'Accès non autorisé (401)',
    auth_desc: 'Votre session a expiré ou votre compte ne dispose pas des droits Administrateur requis.',
    auth_signin: 'Se reconnecter',
    no_data_title: 'Aucune donnée de valeur marchande',
    no_data_desc: 'La section valeur_stock_marchand n\'a renvoyé aucune donnée pour le moment.',
    
    // KPIs
    kpi_valeur_globale: 'Valeur Totale Globale',
    kpi_valeur_globale_sub: 'Valeur marchande cumulée (prix de vente)',
    kpi_stock_maison: 'Stock Maison (Interne)',
    kpi_stock_maison_sub: 'Siège, laboratoire et entrepôt',
    kpi_stock_boutiques: 'Stock en Boutiques',
    kpi_stock_boutiques_sub: 'Dépôts et boutiques partenaires',
    kpi_parfums_total: 'Volume Parfums',
    kpi_parfums_sub: 'Flacons en stock actif',
    kpi_essences_total: 'Volume Essences Labo',
    kpi_essences_sub: 'Essences disponibles',

    // Sections
    section_overview: 'Répartition Globale & Comparatif',
    section_distribution: 'Répartition de la valeur marchande',
    section_comparison: 'Comparatif Stock Maison vs Boutiques',
    section_categories: 'Détail par catégorie de produit',
    section_boutiques: 'Stock marchand en dépôts boutiques',
    section_boutiques_sub: 'Détail par boutique partenaire active',
    section_summary_table: 'Tableau récapitulatif détaillé',

    // Categories
    cat_parfums: 'Parfums',
    cat_accessoires: 'Accessoires',
    cat_essences: 'Essences Labo',
    cat_flacons: 'Flacons',
    cat_diffuseurs: 'Diffuseurs',
    cat_autres: 'Autres composants',

    // Boutiques table
    search_boutique: 'Rechercher une boutique…',
    col_boutique: 'Boutique',
    col_status: 'Statut',
    col_total_value: 'Valeur Marchande',
    col_total_qty: 'Quantité Totale',
    col_parfums: 'Parfums',
    col_accessoires: 'Accessoires',
    no_boutiques: 'Aucune boutique trouvée',
    status_active: 'Actif',
    status_inactive: 'Inactif',

    // Summary table
    col_category: 'Catégorie',
    col_stock_maison: 'Stock Maison',
    col_stock_boutiques: 'Stock Boutiques',
    col_total_stock: 'Total Cumulé',
    col_pct_global: '% du Total',
    units: 'unités',
    bottles: 'flacons',
    pieces: 'pièces',

    // Descriptions
    fcfa: 'FCFA',
    ml: 'ml',
    liters: 'L',
    view_all: 'Tout afficher',
    info_note: 'Note de calcul : Calcul basé sur le prix de vente unitaire actuel des articles avec un stock strictement supérieur à 0 et au statut actif.',
  },
  en: {
    title: 'Commercial Stock Valuation',
    subtitle: 'Market valuation of current inventory based exclusively on active selling prices (positive stock)',
    refresh: 'Refresh',
    loading: 'Calculating stock market valuation…',
    auth_title: 'Unauthorized Access (401)',
    auth_desc: 'Your session has expired or your account lacks the required Admin privileges.',
    auth_signin: 'Sign In Again',
    no_data_title: 'No Valuation Data Available',
    no_data_desc: 'The valeur_stock_marchand section returned no data at this time.',

    // KPIs
    kpi_valeur_globale: 'Global Market Value',
    kpi_valeur_globale_sub: 'Cumulative retail value (selling prices)',
    kpi_stock_maison: 'House Stock (Internal)',
    kpi_stock_maison_sub: 'HQ, laboratory and warehouse',
    kpi_stock_boutiques: 'Boutique Stock',
    kpi_stock_boutiques_sub: 'Consignment & partner boutiques',
    kpi_parfums_total: 'Perfumes Volume',
    kpi_parfums_sub: 'Active stock bottles',
    kpi_essences_total: 'Lab Essences Volume',
    kpi_essences_sub: 'Available essences in stock',

    // Sections
    section_overview: 'Global Breakdown & Comparison',
    section_distribution: 'Market Value Distribution',
    section_comparison: 'House vs Boutique Stock Comparison',
    section_categories: 'Breakdown by Product Category',
    section_boutiques: 'Consignment Stock in Boutiques',
    section_boutiques_sub: 'Breakdown by active partner boutique',
    section_summary_table: 'Detailed Summary Table',

    // Categories
    cat_parfums: 'Perfumes',
    cat_accessoires: 'Accessories',
    cat_essences: 'Lab Essences',
    cat_flacons: 'Bottles',
    cat_diffuseurs: 'Diffusers',
    cat_autres: 'Other Components',

    // Boutiques table
    search_boutique: 'Search a boutique…',
    col_boutique: 'Boutique',
    col_status: 'Status',
    col_total_value: 'Market Value',
    col_total_qty: 'Total Quantity',
    col_parfums: 'Perfumes',
    col_accessoires: 'Accessories',
    no_boutiques: 'No boutique found',
    status_active: 'Active',
    status_inactive: 'Inactive',

    // Summary table
    col_category: 'Category',
    col_stock_maison: 'House Stock',
    col_stock_boutiques: 'Boutique Stock',
    col_total_stock: 'Cumulative Total',
    col_pct_global: '% of Total',
    units: 'units',
    bottles: 'bottles',
    pieces: 'pieces',

    // Descriptions
    fcfa: 'FCFA',
    ml: 'ml',
    liters: 'L',
    view_all: 'View all',
    info_note: 'Valuation note: Calculated based on the current unit selling price of articles with stock > 0 and active status.',
  },
} as const;

type TSKey = keyof typeof TS.fr;

function cx(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// Format numbers to FCFA
function formatFCFA(val: string | number | undefined | null): string {
  const num = typeof val === 'string' ? parseFloat(val) : (val ?? 0);
  if (isNaN(num)) return '0 FCFA';
  return `${Math.round(num).toLocaleString('fr-FR')} FCFA`;
}

// Format numbers with millions/billions shorthand for small badges
function formatShortFCFA(val: string | number | undefined | null): string {
  const num = typeof val === 'string' ? parseFloat(val) : (val ?? 0);
  if (isNaN(num) || num === 0) return '0 FCFA';
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)} Mrd FCFA`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)} M FCFA`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)} k FCFA`;
  }
  return `${Math.round(num).toLocaleString('fr-FR')} FCFA`;
}

// Format volume in ml / liters
function formatVolumeML(val: string | number | undefined | null): string {
  const num = typeof val === 'string' ? parseFloat(val) : (val ?? 0);
  if (isNaN(num) || num === 0) return '0 ml';
  if (num >= 1000) {
    const liters = (num / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
    return `${num.toLocaleString('fr-FR')} ml (${liters} L)`;
  }
  return `${num.toLocaleString('fr-FR')} ml`;
}

// Donut palette matching Accessories Exclusif branding
const CHART_COLORS = [
  '#C5A059', // Gold (Parfums)
  '#6366F1', // Indigo (Essences Labo)
  '#EC4899', // Pink (Accessoires)
  '#10B981', // Emerald (Flacons)
  '#F59E0B', // Amber (Diffuseurs)
];

function resolveStockData(raw: any, fallback?: ValeurStockMarchand | null): ValeurStockMarchand | null {
  if (fallback && parseFloat(String(fallback.valeur_totale_globale || '0')) > 0) {
    return fallback;
  }
  if (!raw) return fallback || null;
  if (raw.valeur_stock_marchand) {
    const vsm = raw.valeur_stock_marchand;
    if (vsm.valeur_totale_globale || vsm.par_categorie_global || vsm.par_type_produit_global || vsm.produits_maison) {
      return vsm;
    }
  }
  if (raw.valeur_totale_globale !== undefined && (raw.par_categorie_global || raw.par_type_produit_global || raw.produits_maison)) {
    return raw as ValeurStockMarchand;
  }
  // Smart fallback: If raw has par_categorie.essences.detail_par_essence
  const essencesList = raw?.par_categorie?.essences?.detail_par_essence;
  if (Array.isArray(essencesList) && essencesList.length > 0) {
    let totalMl = 0;
    let totalVal = 0;
    essencesList.forEach((ess: any) => {
      if (Array.isArray(ess.lots)) {
        ess.lots.forEach((lot: any) => {
          const qty = parseFloat(lot.stock_restant || '0') || 0;
          const price = parseFloat(lot.prix_achat_par_ml || '0') || 0;
          totalMl += qty;
          totalVal += qty * price;
        });
      }
    });

    return {
      description: "Valeur marchande basée sur les lots d'essences disponibles au laboratoire.",
      valeur_totale_globale: totalVal.toFixed(2),
      par_categorie_global: {
        essences_labo: {
          valeur_totale: totalVal.toFixed(2),
          stock_ml_total: totalMl.toFixed(2),
        },
      },
      produits_maison: {
        valeur_totale: totalVal.toFixed(2),
        essences_labo: {
          valeur_totale: totalVal.toFixed(2),
          stock_ml_total: totalMl.toFixed(2),
        },
      },
    };
  }
  return raw.valeur_stock_marchand || fallback || null;
}

interface StockValueAnalyticsDashboardProps {
  initialData?: ValeurStockMarchand | null;
  rawStats?: StatistiquesBeneficesResponse | any | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export default function StockValueAnalyticsDashboard({
  initialData,
  rawStats,
  isLoading: externalLoading,
  onRefresh,
}: StockValueAnalyticsDashboardProps) {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en') ?? false;
  const ts = (k: TSKey) => (isEn ? TS.en[k] : TS.fr[k]);

  const initialResolved = resolveStockData(rawStats, initialData);
  const [internalLoading, setInternalLoading] = useState(!initialResolved && !rawStats);
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;
  const [data, setData] = useState<ValeurStockMarchand | null>(initialResolved);
  const [error, setError] = useState<string | null>(null);
  const [searchBoutique, setSearchBoutique] = useState('');
  const { addToast } = useToastStore();

  useEffect(() => {
    const resolved = resolveStockData(rawStats, initialData);
    if (resolved) {
      setData(resolved);
      setInternalLoading(false);
    }
  }, [rawStats, initialData]);

  const fetchData = useCallback(async () => {
    if (onRefresh) {
      onRefresh();
      return;
    }
    try {
      setInternalLoading(true);
      setError(null);
      const res = await adminService.getProfitStats({ statut_paiement: 'tous' });
      const resolved = resolveStockData(res);
      setData(resolved);
    } catch (requestError: any) {
      const status = requestError?.response?.status;
      if (status === 401) {
        setError('auth');
      } else {
        console.error('Failed to load stock value statistics:', requestError);
        addToast(getLocalizedToast('Failed to load stock valuation', 'Échec du chargement de la valeur marchande'), 'error');
      }
    } finally {
      setInternalLoading(false);
    }
  }, [onRefresh, addToast]);

  useEffect(() => {
    if (!initialData && !rawStats) {
      fetchData();
    }
  }, [fetchData, initialData, rawStats]);

  // Extract variables with safe defaults (handling both par_categorie_global and par_type_produit_global)
  const valeurTotaleGlobale = parseFloat(String(data?.valeur_totale_globale ?? 0));
  const parType = data?.par_categorie_global || data?.par_type_produit_global;
  const maison = data?.produits_maison;
  const boutiques = data?.produits_boutiques;

  const totalMaisonVal = parseFloat(String(maison?.valeur_totale ?? 0));
  const totalBoutiquesVal = parseFloat(String(boutiques?.valeur_totale ?? 0));

  const parfumsGlobalVal = parseFloat(String(parType?.parfums?.valeur_totale ?? maison?.parfums?.valeur_totale ?? 0));
  const parfumsGlobalQty = parType?.parfums?.quantite_totale ?? maison?.parfums?.quantite_totale ?? 0;

  const accessoiresGlobalVal = parseFloat(String(parType?.accessoires?.valeur_totale ?? maison?.accessoires?.valeur_totale ?? 0));
  const accessoiresGlobalQty = parType?.accessoires?.quantite_totale ?? maison?.accessoires?.quantite_totale ?? 0;

  const essencesLaboVal = parseFloat(String(parType?.essences_labo?.valeur_totale ?? parType?.autres?.detail?.essences_labo?.valeur_totale ?? maison?.essences_labo?.valeur_totale ?? 0));
  const essencesLaboMl = parseFloat(String(parType?.essences_labo?.stock_ml_total ?? parType?.autres?.detail?.essences_labo?.stock_ml_total ?? maison?.essences_labo?.stock_ml_total ?? 0));

  const flaconsVal = parseFloat(String(parType?.flacons?.valeur_totale ?? parType?.autres?.detail?.flacons?.valeur_totale ?? maison?.flacons?.valeur_totale ?? 0));
  const flaconsQty = parType?.flacons?.quantite_totale ?? parType?.autres?.detail?.flacons?.quantite_totale ?? maison?.flacons?.quantite_totale ?? 0;

  const diffuseursVal = parseFloat(String(parType?.diffuseurs?.valeur_totale ?? parType?.autres?.detail?.diffuseurs?.valeur_totale ?? maison?.diffuseurs?.valeur_totale ?? 0));
  const diffuseursQty = parType?.diffuseurs?.quantite_totale ?? parType?.autres?.detail?.diffuseurs?.quantite_totale ?? maison?.diffuseurs?.quantite_totale ?? 0;

  // Donut chart distribution data
  const pieChartData = useMemo(() => {
    const items = [
      { name: ts('cat_parfums'), value: parfumsGlobalVal, color: CHART_COLORS[0] },
      { name: ts('cat_essences'), value: essencesLaboVal, color: CHART_COLORS[1] },
      { name: ts('cat_accessoires'), value: accessoiresGlobalVal, color: CHART_COLORS[2] },
      { name: ts('cat_flacons'), value: flaconsVal, color: CHART_COLORS[3] },
      { name: ts('cat_diffuseurs'), value: diffuseursVal, color: CHART_COLORS[4] },
    ].filter(item => item.value > 0);

    return items;
  }, [parfumsGlobalVal, essencesLaboVal, accessoiresGlobalVal, flaconsVal, diffuseursVal, isEn]);

  // Comparison Bar Chart (Maison vs Boutiques)
  const comparisonChartData = useMemo(() => {
    return [
      {
        category: ts('cat_parfums'),
        Maison: parseFloat(String(maison?.parfums?.valeur_totale ?? 0)),
        Boutiques: parseFloat(String(boutiques?.parfums?.valeur_totale ?? 0)),
      },
      {
        category: ts('cat_accessoires'),
        Maison: parseFloat(String(maison?.accessoires?.valeur_totale ?? 0)),
        Boutiques: parseFloat(String(boutiques?.accessoires?.valeur_totale ?? 0)),
      },
      {
        category: ts('cat_essences'),
        Maison: essencesLaboVal,
        Boutiques: 0,
      },
      {
        category: ts('cat_flacons'),
        Maison: flaconsVal,
        Boutiques: 0,
      },
    ];
  }, [maison, boutiques, essencesLaboVal, flaconsVal, isEn]);

  // Filter boutiques list
  const filteredBoutiques = useMemo(() => {
    const list = boutiques?.detail_par_boutique ?? [];
    if (!searchBoutique.trim()) return list;
    const query = searchBoutique.toLowerCase();
    return list.filter(b => b.boutique_nom.toLowerCase().includes(query));
  }, [boutiques, searchBoutique]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ── Top Header & Actions ── */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gold/10 text-gold border border-gold/20 shadow-inner">
              <Coins size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">{ts('title')}</h2>
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-gold/15 text-gold border border-gold/30">
                  <Sparkles size={10} /> Prix de vente
                </span>
              </div>
              <p className="text-xs text-foreground/50 mt-0.5">
                {data?.description || ts('subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-foreground/75 hover:text-foreground transition-all self-start sm:self-auto flex items-center gap-2 text-xs font-semibold cursor-pointer active:scale-95"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-gold' : ''} />
            {ts('refresh')}
          </button>
        </div>

        {/* Informative Note Badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/5 border border-amber-500/15 text-[11px] text-amber-300/80">
          <Info size={14} className="shrink-0 text-amber-400" />
          <span>{ts('info_note')}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-gold gap-3 bg-white/[0.02] border border-white/10 rounded-2xl">
          <Loader2 className="animate-spin" size={32} />
          <p className="text-sm font-medium text-foreground/70">{ts('loading')}</p>
        </div>
      ) : error === 'auth' ? (
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <Award size={24} className="text-red-400" />
          </div>
          <h3 className="font-bold text-foreground text-base">{ts('auth_title')}</h3>
          <p className="text-sm text-foreground/50 max-w-sm mx-auto">{ts('auth_desc')}</p>
          <a
            href="/login"
            className="inline-block mt-2 px-5 py-2 rounded-xl bg-gold text-black text-xs font-bold hover:bg-gold/80 transition-colors"
          >
            {ts('auth_signin')}
          </a>
        </div>
      ) : !data ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center space-y-3">
          <Package size={36} className="mx-auto text-foreground/30" />
          <h3 className="font-bold text-foreground text-base">{ts('no_data_title')}</h3>
          <p className="text-sm text-foreground/40 max-w-md mx-auto">{ts('no_data_desc')}</p>
          <button
            onClick={fetchData}
            className="mt-3 px-4 py-2 rounded-xl bg-gold text-black text-xs font-bold hover:bg-gold/80 transition-colors"
          >
            {ts('refresh')}
          </button>
        </div>
      ) : (
        <>
          {/* ── Hero KPI Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Primary Card: Valeur Totale Globale */}
            <div className="md:col-span-1 bg-gradient-to-br from-gold/15 via-gold/5 to-white/[0.02] rounded-2xl border border-gold/30 p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-10 pointer-events-none text-gold">
                <Coins size={120} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gold">
                    {ts('kpi_valeur_globale')}
                  </span>
                  <div className="p-2 rounded-xl bg-gold/20 text-gold border border-gold/30">
                    <TrendingUp size={18} />
                  </div>
                </div>
                <p className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
                  {valeurTotaleGlobale.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  <span className="text-sm font-normal text-gold ml-2">FCFA</span>
                </p>
                <p className="text-[11px] text-foreground/50 mt-1">
                  {ts('kpi_valeur_globale_sub')}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gold/20 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-foreground/45 block">Maison</span>
                  <span className="font-bold text-foreground">{formatShortFCFA(totalMaisonVal)}</span>
                </div>
                <div>
                  <span className="text-foreground/45 block">Boutiques</span>
                  <span className="font-bold text-foreground">{formatShortFCFA(totalBoutiquesVal)}</span>
                </div>
              </div>
            </div>

            {/* Stock Maison */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-foreground/40">{ts('kpi_stock_maison')}</span>
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <Building2 size={18} />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-foreground">
                  {totalMaisonVal.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  <span className="text-xs font-normal text-foreground/40 ml-1.5">FCFA</span>
                </p>
                <p className="text-[11px] text-foreground/40 mt-1">{ts('kpi_stock_maison_sub')}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-foreground/60">
                <span>Parfums: <strong className="text-foreground font-semibold">{maison?.parfums?.quantite_totale?.toLocaleString() ?? 0}</strong></span>
                <span>Accessoires: <strong className="text-foreground font-semibold">{maison?.accessoires?.quantite_totale?.toLocaleString() ?? 0}</strong></span>
              </div>
            </div>

            {/* Stock Boutiques */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-foreground/40">{ts('kpi_stock_boutiques')}</span>
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <Store size={18} />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-foreground">
                  {totalBoutiquesVal.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  <span className="text-xs font-normal text-foreground/40 ml-1.5">FCFA</span>
                </p>
                <p className="text-[11px] text-foreground/40 mt-1">
                  {boutiques?.quantite_totale ?? 0} {ts('units')} • {boutiques?.detail_par_boutique?.length ?? 0} boutiques
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-foreground/60">
                <span>Parfums: <strong className="text-foreground font-semibold">{boutiques?.parfums?.quantite_totale?.toLocaleString() ?? 0}</strong></span>
                <span>Accessoires: <strong className="text-foreground font-semibold">{boutiques?.accessoires?.quantite_totale?.toLocaleString() ?? 0}</strong></span>
              </div>
            </div>
          </div>

          {/* ── Category Stat Cards (Grid of 5 items) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* 1. Parfums */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-4 shadow-sm hover:border-gold/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider">{ts('cat_parfums')}</span>
                <div className="p-1.5 rounded-lg bg-gold/10 text-gold"><Sparkles size={14} /></div>
              </div>
              <p className="text-lg font-bold text-foreground">{formatShortFCFA(parfumsGlobalVal)}</p>
              <div className="mt-2 text-[11px] text-foreground/45 flex items-center justify-between">
                <span>{parfumsGlobalQty.toLocaleString()} {ts('bottles')}</span>
                <span className="text-gold font-medium">
                  {valeurTotaleGlobale > 0 ? ((parfumsGlobalVal / valeurTotaleGlobale) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>

            {/* 2. Essences Labo */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-4 shadow-sm hover:border-indigo-500/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider">{ts('cat_essences')}</span>
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400"><FlaskConical size={14} /></div>
              </div>
              <p className="text-lg font-bold text-foreground">{formatShortFCFA(essencesLaboVal)}</p>
              <div className="mt-2 text-[11px] text-foreground/45 flex items-center justify-between">
                <span title={`${essencesLaboMl.toLocaleString()} ml`}>{formatVolumeML(essencesLaboMl)}</span>
                <span className="text-indigo-400 font-medium">
                  {valeurTotaleGlobale > 0 ? ((essencesLaboVal / valeurTotaleGlobale) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>

            {/* 3. Accessoires */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-4 shadow-sm hover:border-pink-500/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider">{ts('cat_accessoires')}</span>
                <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400"><ShoppingBag size={14} /></div>
              </div>
              <p className="text-lg font-bold text-foreground">{formatShortFCFA(accessoiresGlobalVal)}</p>
              <div className="mt-2 text-[11px] text-foreground/45 flex items-center justify-between">
                <span>{accessoiresGlobalQty.toLocaleString()} {ts('pieces')}</span>
                <span className="text-pink-400 font-medium">
                  {valeurTotaleGlobale > 0 ? ((accessoiresGlobalVal / valeurTotaleGlobale) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>

            {/* 4. Flacons */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-4 shadow-sm hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider">{ts('cat_flacons')}</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400"><Boxes size={14} /></div>
              </div>
              <p className="text-lg font-bold text-foreground">{formatShortFCFA(flaconsVal)}</p>
              <div className="mt-2 text-[11px] text-foreground/45 flex items-center justify-between">
                <span>{flaconsQty.toLocaleString()} {ts('pieces')}</span>
                <span className="text-emerald-400 font-medium">
                  {valeurTotaleGlobale > 0 ? ((flaconsVal / valeurTotaleGlobale) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>

            {/* 5. Diffuseurs */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-4 shadow-sm hover:border-amber-500/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider">{ts('cat_diffuseurs')}</span>
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400"><Wind size={14} /></div>
              </div>
              <p className="text-lg font-bold text-foreground">{formatShortFCFA(diffuseursVal)}</p>
              <div className="mt-2 text-[11px] text-foreground/45 flex items-center justify-between">
                <span>{diffuseursQty.toLocaleString()} {ts('pieces')}</span>
                <span className="text-amber-400 font-medium">
                  {valeurTotaleGlobale > 0 ? ((diffuseursVal / valeurTotaleGlobale) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* ── Charts: Pie Distribution & Comparison Bar Chart ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Donut Chart: Répartition de la valeur marchande */}
            <div className="lg:col-span-5 bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                    <PieChartIcon size={16} className="text-gold" />
                    {ts('section_distribution')}
                  </h3>
                  <p className="text-[11px] text-foreground/40 mt-0.5">Par type de produit (Global)</p>
                </div>
              </div>

              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [
                        `${Number(val).toLocaleString('fr-FR')} FCFA (${valeurTotaleGlobale > 0 ? ((Number(val) / valeurTotaleGlobale) * 100).toFixed(1) : 0}%)`,
                        'Valeur'
                      ]}
                      contentStyle={{
                        backgroundColor: '#121212',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#fff',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend with values */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                {pieChartData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[11px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-foreground/60 truncate">{item.name}:</span>
                    <span className="font-semibold text-foreground ml-auto">
                      {valeurTotaleGlobale > 0 ? ((item.value / valeurTotaleGlobale) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar Chart: Maison vs Boutiques */}
            <div className="lg:col-span-7 bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                    <BarChart3 size={16} className="text-blue-400" />
                    {ts('section_comparison')}
                  </h3>
                  <p className="text-[11px] text-foreground/40 mt-0.5">Valeur marchande en FCFA par canal de stockage</p>
                </div>
              </div>

              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="category"
                      stroke="rgba(255,255,255,0.4)"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.4)"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => {
                        if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
                        if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}M`;
                        if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
                        return val;
                      }}
                    />
                    <Tooltip
                      formatter={(val: any) => [`${Number(val).toLocaleString('fr-FR')} FCFA`, '']}
                      contentStyle={{
                        backgroundColor: '#121212',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#fff',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="Maison" fill="#C5A059" radius={[4, 4, 0, 0]} name="Stock Maison" />
                    <Bar dataKey="Boutiques" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Stock Boutiques" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-foreground/50">
                <span>Stock Maison total: <strong className="text-gold font-bold">{formatShortFCFA(totalMaisonVal)}</strong></span>
                <span>Stock Boutiques total: <strong className="text-purple-400 font-bold">{formatShortFCFA(totalBoutiquesVal)}</strong></span>
              </div>
            </div>
          </div>

          {/* ── Boutiques Consignment Stock Breakdown ── */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <Store size={16} className="text-purple-400" />
                  {ts('section_boutiques')}
                </h3>
                <p className="text-[11px] text-foreground/40 mt-0.5">
                  {ts('section_boutiques_sub')} ({boutiques?.detail_par_boutique?.length ?? 0} boutiques)
                </p>
              </div>

              {/* Search input for boutiques */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                <input
                  type="text"
                  placeholder={ts('search_boutique')}
                  value={searchBoutique}
                  onChange={(e) => setSearchBoutique(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-foreground/30 outline-none focus:border-gold transition-colors"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.04] text-foreground/60 uppercase tracking-wider text-[10px] font-semibold border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">{ts('col_boutique')}</th>
                    <th className="py-3 px-4">{ts('col_status')}</th>
                    <th className="py-3 px-4 text-right">{ts('col_parfums')}</th>
                    <th className="py-3 px-4 text-right">{ts('col_accessoires')}</th>
                    <th className="py-3 px-4 text-right">{ts('col_total_qty')}</th>
                    <th className="py-3 px-4 text-right">{ts('col_total_value')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredBoutiques.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-foreground/40">
                        {ts('no_boutiques')}
                      </td>
                    </tr>
                  ) : (
                    filteredBoutiques.map((boutique) => {
                      const bVal = parseFloat(String(boutique.valeur_totale || 0));
                      const bParfVal = parseFloat(String(boutique.parfums?.valeur_totale || 0));
                      const bParfQty = boutique.parfums?.quantite_totale ?? 0;
                      const bAccVal = parseFloat(String(boutique.accessoires?.valeur_totale || 0));
                      const bAccQty = boutique.accessoires?.quantite_totale ?? 0;

                      return (
                        <tr key={boutique.boutique_id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4 font-medium text-foreground flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                              <Store size={14} />
                            </div>
                            <div>
                              <span className="font-semibold block">{boutique.boutique_nom}</span>
                              <span className="text-[10px] text-foreground/40">
                                {boutique.ville ? `${boutique.ville} • ` : ''}ID #{boutique.boutique_id}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={cx(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium',
                              boutique.statut === 'actif'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-white/5 text-foreground/50 border border-white/10'
                            )}>
                              <span className={cx('w-1.5 h-1.5 rounded-full', boutique.statut === 'actif' ? 'bg-emerald-400' : 'bg-foreground/40')} />
                              {boutique.statut === 'actif' ? ts('status_active') : boutique.statut}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="font-semibold text-foreground block">{formatShortFCFA(bParfVal)}</span>
                            <span className="text-[10px] text-foreground/40">{bParfQty} {ts('units')}</span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="font-semibold text-foreground block">{formatShortFCFA(bAccVal)}</span>
                            <span className="text-[10px] text-foreground/40">{bAccQty} {ts('units')}</span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 text-foreground font-semibold">
                              {boutique.quantite_totale} {ts('units')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="font-bold text-gold text-sm block">
                              {bVal.toLocaleString('fr-FR')} <span className="text-[10px] font-normal text-gold/70">FCFA</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {/* Total row if items present */}
                {filteredBoutiques.length > 0 && (
                  <tfoot className="bg-white/[0.03] border-t border-white/10 font-bold text-foreground">
                    <tr>
                      <td colSpan={2} className="py-3 px-4 uppercase text-[10px] tracking-wider text-foreground/60">
                        Total Dépôt Boutiques
                      </td>
                      <td className="py-3 px-4 text-right text-xs">
                        {formatShortFCFA(boutiques?.parfums?.valeur_totale)}
                      </td>
                      <td className="py-3 px-4 text-right text-xs">
                        {formatShortFCFA(boutiques?.accessoires?.valeur_totale)}
                      </td>
                      <td className="py-3 px-4 text-right text-xs">
                        {boutiques?.quantite_totale ?? 0} {ts('units')}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gold">
                        {totalBoutiquesVal.toLocaleString('fr-FR')} FCFA
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* ── Summary Matrix Table (Maison vs Boutiques vs Total) ── */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <Layers size={16} className="text-gold" />
                  {ts('section_summary_table')}
                </h3>
                <p className="text-[11px] text-foreground/40 mt-0.5">
                  Synthèse complète des flux et valeurs par catégorie
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.04] text-foreground/60 uppercase tracking-wider text-[10px] font-semibold border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">{ts('col_category')}</th>
                    <th className="py-3 px-4 text-right">{ts('col_stock_maison')}</th>
                    <th className="py-3 px-4 text-right">{ts('col_stock_boutiques')}</th>
                    <th className="py-3 px-4 text-right">{ts('col_total_stock')}</th>
                    <th className="py-3 px-4 text-right">{ts('col_pct_global')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {/* Parfums */}
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-foreground flex items-center gap-2">
                      <Sparkles size={14} className="text-gold" />
                      {ts('cat_parfums')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-semibold block text-foreground">
                        {formatShortFCFA(maison?.parfums?.valeur_totale)}
                      </span>
                      <span className="text-[10px] text-foreground/40">
                        {maison?.parfums?.quantite_totale?.toLocaleString() ?? 0} {ts('bottles')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-semibold block text-foreground">
                        {formatShortFCFA(boutiques?.parfums?.valeur_totale)}
                      </span>
                      <span className="text-[10px] text-foreground/40">
                        {boutiques?.parfums?.quantite_totale?.toLocaleString() ?? 0} {ts('bottles')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold block text-foreground">
                        {formatFCFA(parfumsGlobalVal)}
                      </span>
                      <span className="text-[10px] text-foreground/40">
                        {parfumsGlobalQty.toLocaleString()} {ts('bottles')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-gold">
                        {valeurTotaleGlobale > 0 ? ((parfumsGlobalVal / valeurTotaleGlobale) * 100).toFixed(2) : 0}%
                      </span>
                    </td>
                  </tr>

                  {/* Accessoires */}
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-foreground flex items-center gap-2">
                      <ShoppingBag size={14} className="text-pink-400" />
                      {ts('cat_accessoires')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-semibold block text-foreground">
                        {formatShortFCFA(maison?.accessoires?.valeur_totale)}
                      </span>
                      <span className="text-[10px] text-foreground/40">
                        {maison?.accessoires?.quantite_totale?.toLocaleString() ?? 0} {ts('units')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-semibold block text-foreground">
                        {formatShortFCFA(boutiques?.accessoires?.valeur_totale)}
                      </span>
                      <span className="text-[10px] text-foreground/40">
                        {boutiques?.accessoires?.quantite_totale?.toLocaleString() ?? 0} {ts('units')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold block text-foreground">
                        {formatFCFA(accessoiresGlobalVal)}
                      </span>
                      <span className="text-[10px] text-foreground/40">
                        {accessoiresGlobalQty.toLocaleString()} {ts('units')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-pink-400">
                        {valeurTotaleGlobale > 0 ? ((accessoiresGlobalVal / valeurTotaleGlobale) * 100).toFixed(2) : 0}%
                      </span>
                    </td>
                  </tr>

                  {/* Essences Labo */}
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-foreground flex items-center gap-2">
                      <FlaskConical size={14} className="text-indigo-400" />
                      {ts('cat_essences')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-semibold block text-foreground">
                        {formatShortFCFA(essencesLaboVal)}
                      </span>
                      <span className="text-[10px] text-foreground/40">
                        {formatVolumeML(essencesLaboMl)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-foreground/30">
                      —
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold block text-foreground">
                        {formatFCFA(essencesLaboVal)}
                      </span>
                      <span className="text-[10px] text-foreground/40">
                        {formatVolumeML(essencesLaboMl)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-indigo-400">
                        {valeurTotaleGlobale > 0 ? ((essencesLaboVal / valeurTotaleGlobale) * 100).toFixed(2) : 0}%
                      </span>
                    </td>
                  </tr>

                  {/* Flacons */}
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-foreground flex items-center gap-2">
                      <Boxes size={14} className="text-emerald-400" />
                      {ts('cat_flacons')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-semibold block text-foreground">
                        {formatShortFCFA(flaconsVal)}
                      </span>
                      <span className="text-[10px] text-foreground/40">
                        {flaconsQty.toLocaleString()} {ts('pieces')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-foreground/30">
                      —
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold block text-foreground">
                        {formatFCFA(flaconsVal)}
                      </span>
                      <span className="text-[10px] text-foreground/40">
                        {flaconsQty.toLocaleString()} {ts('pieces')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-emerald-400">
                        {valeurTotaleGlobale > 0 ? ((flaconsVal / valeurTotaleGlobale) * 100).toFixed(2) : 0}%
                      </span>
                    </td>
                  </tr>

                  {/* Diffuseurs */}
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-foreground flex items-center gap-2">
                      <Wind size={14} className="text-amber-400" />
                      {ts('cat_diffuseurs')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-semibold block text-foreground">
                        {formatShortFCFA(diffuseursVal)}
                      </span>
                      <span className="text-[10px] text-foreground/40">
                        {diffuseursQty.toLocaleString()} {ts('pieces')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-foreground/30">
                      —
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold block text-foreground">
                        {formatFCFA(diffuseursVal)}
                      </span>
                      <span className="text-[10px] text-foreground/40">
                        {diffuseursQty.toLocaleString()} {ts('pieces')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-amber-400">
                        {valeurTotaleGlobale > 0 ? ((diffuseursVal / valeurTotaleGlobale) * 100).toFixed(2) : 0}%
                      </span>
                    </td>
                  </tr>
                </tbody>

                {/* Grand Total */}
                <tfoot className="bg-white/[0.04] border-t-2 border-white/10 font-bold text-foreground">
                  <tr>
                    <td className="py-4 px-4 uppercase text-[11px] tracking-wider text-gold">
                      Valeur Totale Globale
                    </td>
                    <td className="py-4 px-4 text-right text-sm">
                      {formatFCFA(totalMaisonVal)}
                    </td>
                    <td className="py-4 px-4 text-right text-sm">
                      {formatFCFA(totalBoutiquesVal)}
                    </td>
                    <td className="py-4 px-4 text-right text-base text-gold font-extrabold">
                      {formatFCFA(valeurTotaleGlobale)}
                    </td>
                    <td className="py-4 px-4 text-right text-sm text-gold font-extrabold">
                      100%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
