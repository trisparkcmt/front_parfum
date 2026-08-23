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
  const [loading, setLoading] = useState(true);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [statut, setStatut] = useState('validated');
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
  const caGlobal = parseFloat(
    String(profitData?.chiffre_affaires_total ?? profitData?.totaux?.chiffre_affaires ?? labData?.chiffre_affaires_total ?? 0)
  );
  const coutTotal = parseFloat(
    String(profitData?.totaux?.cout_total ?? 0)
  );
  const beneficeNet = parseFloat(
    String(profitData?.benefice_total ?? profitData?.totaux?.benefice_net ?? labData?.benefice_total ?? 0)
  );
  const nbCommandes = profitData?.nb_commandes ?? '—';
  const margeGlobale = profitData?.marge_globale != null
    ? Number(profitData.marge_globale).toFixed(1)
    : (caGlobal > 0 ? ((beneficeNet / caGlobal) * 100).toFixed(1) : (labData?.marge_globale ?? '0'));

  // Category breakdown — prefer flat benefices_par_type array, fall back to par_categorie map
  const beneficesParType: { type: string; nombre_articles: number; chiffre_affaires: string; cout_achat: string; benefice: string; marge_percent: number }[] =
    profitData?.benefices_par_type ?? [];

  const parCategorie = profitData?.par_categorie || {};
  const essencesCat = parCategorie.essences || {};
  const parfumsCat = parCategorie.parfums || {};
  const accessoiresCat = parCategorie.accessoires || {};
  const parfumsPersoCat = parCategorie.parfums_personnalises || {};
  const essencesSurMesureCat = parCategorie.essences_sur_mesure || {};

  // Individual products from flat produits[] array
  const produits: { type: string; id: number; nom: string; prix_vente: string; prix_achat: string; benefice: string; marge_percent: number }[] =
    profitData?.produits ?? [];

  // Essence lots from flat lots[] array
  const lotsApi: { type: string; id: number; essence: string; chiffre_affaires_genere: string; benefice: string }[] =
    profitData?.lots ?? [];

  const detailEssences: EssenceDetail[] = essencesCat.detail_par_essence || labData?.benefices_par_essence?.map((e: any) => ({
    essence_id: e.essence_id || e.id,
    essence_nom: e.essence || e.nom,
    essence_categorie: e.categorie || 'Essence',
    ca_total: e.chiffre_affaires || 0,
    cout_total: e.cout_achat || 0,
    benefice_total: e.benefice || 0,
    lots: e.lots || []
  })) || [];

  const TYPE_LABELS: Record<string, string> = {
    parfum: 'Parfums',
    accessoire: 'Accessoires',
    produit_fini_essence: 'Essences finies',
    essence: 'Essences',
    parfum_personnalise: 'Parfums personnalisés',
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
              <h2 className="text-lg font-bold text-foreground">Profit Analytics Dashboard</h2>
              <p className="text-xs text-foreground/40">Detailed analysis of revenue, purchase costs, and net margin</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-foreground/70 hover:text-foreground transition-all self-start sm:self-auto flex items-center gap-2 text-xs font-semibold"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-gold' : ''} />
            Refresh
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/5">
          <div>
            <label className="block text-[10px] font-bold text-foreground/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar size={12} /> Start Date
            </label>
            <input
              type="date"
              value={dateDebut}
              onChange={e => setDateDebut(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-foreground/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar size={12} /> End Date
            </label>
            <input
              type="date"
              value={dateFin}
              onChange={e => setDateFin(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-foreground/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Filter size={12} /> Order Status
            </label>
            <select
              value={statut}
              onChange={e => setStatut(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-gold"
            >
              <option value="validated" className="bg-neutral-900 text-white">Validated (Recommended)</option>
              <option value="delivered" className="bg-neutral-900 text-white">Delivered only</option>
              <option value="paid" className="bg-neutral-900 text-white">Paid only</option>
              <option value="all" className="bg-neutral-900 text-white">All statuses</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
          <Loader2 className="animate-spin" size={32} />
          <p className="text-sm font-medium">Calculating and analyzing profit data...</p>
        </div>
      ) : error === 'auth' ? (
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <Award size={24} className="text-red-400" />
          </div>
          <h3 className="font-bold text-foreground text-base">Unauthorized Access (401)</h3>
          <p className="text-sm text-foreground/50 max-w-sm mx-auto">
            Your session has expired or your account lacks the required Admin privileges to access financial analytics.
            Please sign in with an administrator account.
          </p>
          <a
            href="/login"
            className="inline-block mt-2 px-5 py-2 rounded-xl bg-gold text-black text-xs font-bold hover:bg-gold/80 transition-colors"
          >
            Sign In Again
          </a>
        </div>
      ) : (
        <>
          {/* Section 1: KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground/40">Overall Revenue</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <DollarSign size={18} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-foreground">{caGlobal.toLocaleString()} <span className="text-xs font-normal text-foreground/40">FCFA</span></p>
              <p className="text-[11px] text-foreground/40 mt-1">Total sales generated</p>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground/40">Total Purchase Cost</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Layers size={18} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-foreground">{coutTotal.toLocaleString()} <span className="text-xs font-normal text-foreground/40">FCFA</span></p>
              <p className="text-[11px] text-foreground/40 mt-1">Cumulative cost of products & lots</p>
            </div>

            <div className="bg-white/5 rounded-2xl border border-gold/20 p-5 shadow-sm bg-gradient-to-br from-gold/5 to-transparent">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gold">Overall Net Profit</span>
                <div className="p-2 rounded-xl bg-gold/10 text-gold">
                  <Award size={18} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-gold">{beneficeNet.toLocaleString()} <span className="text-xs font-normal text-gold/60">FCFA</span></p>
              <p className="text-[11px] text-gold/60 mt-1">Overall net margin: <span className="font-bold">{margeGlobale}%</span></p>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground/40">Number of Orders</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <Package size={18} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-foreground">{nbCommandes}</p>
              <p className="text-[11px] text-foreground/40 mt-1">Completed orders counted</p>
            </div>
          </div>

          {/* Section 2: Category Breakdown — benefices_par_type (flat API) or par_categorie (old API) */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <PieChartIcon size={16} className="text-gold" />
                Financial Breakdown by Product Category
              </h3>
            </div>

            {beneficesParType.length > 0 ? (
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
                      <p className={`text-xs font-bold ${colorMap[cat.type] ?? 'text-foreground/60'}`}>
                        {TYPE_LABELS[cat.type] ?? cat.type}
                        <span className="ml-2 text-foreground/30 font-normal">({cat.nombre_articles} articles)</span>
                      </p>
                      <div>
                        <p className="text-[10px] text-foreground/40 uppercase">Revenue</p>
                        <p className="text-sm font-bold text-foreground">{ca.toLocaleString()} FCFA</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-foreground/40 uppercase">Purchase Cost</p>
                        <p className="text-sm font-bold text-foreground/60">{cout.toLocaleString()} FCFA</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-foreground/40 uppercase">Net Profit</p>
                        <p className={`text-sm font-extrabold ${ben >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {ben >= 0 ? '+' : ''}{ben.toLocaleString()} FCFA
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
                  { title: 'Catalog Essences', data: essencesCat, color: 'text-amber-400' },
                  { title: 'Standard Perfumes', data: parfumsCat, color: 'text-purple-400' },
                  { title: 'Accessories', data: accessoiresCat, color: 'text-sky-400' },
                  { title: 'Custom Perfumes', data: parfumsPersoCat, color: 'text-emerald-400' },
                  { title: 'Tailor-Made Essences', data: essencesSurMesureCat, color: 'text-pink-400' },
                ].map(cat => {
                  const ca = parseFloat(String(cat.data?.chiffre_affaires || 0));
                  const cout = parseFloat(String(cat.data?.cout_total || 0));
                  const ben = parseFloat(String(cat.data?.benefice_net || (ca - cout)));
                  return (
                    <div key={cat.title} className="bg-white/5 rounded-xl border border-white/5 p-4 space-y-2">
                      <p className={`text-xs font-bold ${cat.color}`}>{cat.title}</p>
                      <div>
                        <p className="text-[10px] text-foreground/40 uppercase">Revenue</p>
                        <p className="text-sm font-bold text-foreground">{ca.toLocaleString()} FCFA</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-foreground/40 uppercase">Net Profit</p>
                        <p className={`text-sm font-extrabold ${ben >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {ben >= 0 ? '+' : ''}{ben.toLocaleString()} FCFA
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
                  Product-Level Profit Detail
                </h3>
                <p className="text-xs text-foreground/40 mt-0.5">{produits.length} products with profit data</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Product</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Type</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Sale Price</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Purchase Cost</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Profit / Unit</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider text-right">Margin</th>
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
                            <span className={ben >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                              {ben >= 0 ? '+' : ''}{ben.toLocaleString()} FCFA
                            </span>
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
                  Essence Lots Revenue
                </h3>
                <p className="text-xs text-foreground/40 mt-0.5">{lotsApi.length} essence lots</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Lot #</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Essence</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Revenue Generated</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider text-right">Lot Profit</th>
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
                            <span className={ben >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                              {ben >= 0 ? '+' : ''}{ben.toLocaleString()} FCFA
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

          {/* Section 5: Detailed Essence Sales Table (from labData / par_essence) */}
          {detailEssences.length > 0 && (
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <Sparkles size={16} className="text-gold" />
                    Sales & Lots Detail by Essence
                  </h3>
                  <p className="text-xs text-foreground/40 mt-0.5">Click a row to expand associated lots breakdown</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Essence</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Category</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Cumulative Revenue</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Cumulative Cost</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Total Profit</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider text-right">Lots</th>
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
                          <tr
                            onClick={() => toggleExpandEssence(essId)}
                            className="hover:bg-white/5 transition-colors cursor-pointer group"
                          >
                            <td className="px-5 py-4 font-bold text-foreground text-sm flex items-center gap-2">
                              {lotsList.length > 0 ? (
                                isExpanded ? <ChevronUp size={14} className="text-gold" /> : <ChevronDown size={14} className="text-foreground/40 group-hover:text-gold" />
                              ) : null}
                              {ess.essence_nom}
                            </td>
                            <td className="px-5 py-4 text-xs text-foreground/60">
                              {ess.essence_categorie || 'Standard'}
                            </td>
                            <td className="px-5 py-4 text-xs font-mono font-semibold text-foreground">
                              {ca.toLocaleString()} FCFA
                            </td>
                            <td className="px-5 py-4 text-xs font-mono text-foreground/60">
                              {cout.toLocaleString()} FCFA
                            </td>
                            <td className="px-5 py-4 text-xs font-mono font-bold">
                              <span className={ben >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                {ben >= 0 ? '+' : ''}{ben.toLocaleString()} FCFA
                              </span>
                            </td>
                            <td className="px-5 py-4 text-xs text-right">
                              <span className="px-2 py-1 rounded bg-white/5 text-foreground/60 text-[10px] font-bold">
                                {lotsList.length} lot(s)
                              </span>
                            </td>
                          </tr>

                          {/* Expandable Lots Row */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={6} className="bg-black/30 px-6 py-4 border-t border-b border-white/5">
                                <div className="space-y-3">
                                  <p className="text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-1.5">
                                    <Layers size={13} />
                                    Consumed essence lots & profitability
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
                                              Remaining stock: <span className="text-foreground/70 font-semibold">{stockRestant} ml</span>
                                            </p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-foreground/40 italic">No specific lots recorded for this essence.</p>
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