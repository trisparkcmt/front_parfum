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
  const [statut, setStatut] = useState('validé');
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
      if (statut && statut !== 'tous') params.statut = statut;

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
          addToast('Erreur serveur sur l\'endpoint lab/benefices/ (500). Vérifiez la configuration backend.', 'error');
        }
        setLabData(null);
      }
    } catch {
      addToast('Erreur inattendue lors du chargement', 'error');
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

  const totaux = profitData?.totaux || {};
  const caGlobal = parseFloat(String(totaux.chiffre_affaires || labData?.chiffre_affaires_total || 0));
  const coutTotal = parseFloat(String(totaux.cout_total || 0));
  const beneficeNet = parseFloat(String(totaux.benefice_net || labData?.benefice_total || 0));
  const nbCommandes = profitData?.nb_commandes ?? '—';
  const margeGlobale = caGlobal > 0 ? ((beneficeNet / caGlobal) * 100).toFixed(1) : (labData?.marge_globale ?? '0');

  const parCategorie = profitData?.par_categorie || {};
  const essencesCat = parCategorie.essences || {};
  const parfumsCat = parCategorie.parfums || {};
  const accessoiresCat = parCategorie.accessoires || {};
  const parfumsPersoCat = parCategorie.parfums_personnalises || {};
  const essencesSurMesureCat = parCategorie.essences_sur_mesure || {};

  const detailEssences: EssenceDetail[] = essencesCat.detail_par_essence || labData?.benefices_par_essence?.map((e: any) => ({
    essence_id: e.essence_id || e.id,
    essence_nom: e.essence || e.nom,
    essence_categorie: e.categorie || 'Essence',
    ca_total: e.chiffre_affaires || 0,
    cout_total: e.cout_achat || 0,
    benefice_total: e.benefice || 0,
    lots: e.lots || []
  })) || [];

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
              <h2 className="text-lg font-bold text-foreground">Tableau de Bord des Bénéfices</h2>
              <p className="text-xs text-foreground/40">Analyse détaillée du chiffre d'affaires, coûts d'achat et marge nette</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-foreground/70 hover:text-foreground transition-all self-start sm:self-auto flex items-center gap-2 text-xs font-semibold"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-gold' : ''} />
            Actualiser
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/5">
          <div>
            <label className="block text-[10px] font-bold text-foreground/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar size={12} /> Date Début
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
              <Calendar size={12} /> Date Fin
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
              <Filter size={12} /> Statut Commande
            </label>
            <select
              value={statut}
              onChange={e => setStatut(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-gold"
            >
              <option value="validé" className="bg-neutral-900 text-white">Validées (Recommandé)</option>
              <option value="livré" className="bg-neutral-900 text-white">Livrées uniquement</option>
              <option value="payé" className="bg-neutral-900 text-white">Payées uniquement</option>
              <option value="tous" className="bg-neutral-900 text-white">Tous les statuts</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
          <Loader2 className="animate-spin" size={32} />
          <p className="text-sm font-medium">Calcul et analyse des bénéfices en cours...</p>
        </div>
      ) : error === 'auth' ? (
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <Award size={24} className="text-red-400" />
          </div>
          <h3 className="font-bold text-foreground text-base">Accès non autorisé (401)</h3>
          <p className="text-sm text-foreground/50 max-w-sm mx-auto">
            Votre session a expiré ou votre compte n'a pas les droits Admin requis pour accéder aux statistiques financières.
            Reconnectez-vous avec un compte administrateur.
          </p>
          <a
            href="/login"
            className="inline-block mt-2 px-5 py-2 rounded-xl bg-gold text-black text-xs font-bold hover:bg-gold/80 transition-colors"
          >
            Se reconnecter
          </a>
        </div>
      ) : (
        <>
          {/* Section 1: KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground/40">Chiffre d'Affaires Global</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <DollarSign size={18} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-foreground">{caGlobal.toLocaleString()} <span className="text-xs font-normal text-foreground/40">FCFA</span></p>
              <p className="text-[11px] text-foreground/40 mt-1">Total des ventes générées</p>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground/40">Coût d'Achat Total</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Layers size={18} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-foreground">{coutTotal.toLocaleString()} <span className="text-xs font-normal text-foreground/40">FCFA</span></p>
              <p className="text-[11px] text-foreground/40 mt-1">Coût cumulé des produits & lots</p>
            </div>

            <div className="bg-white/5 rounded-2xl border border-gold/20 p-5 shadow-sm bg-gradient-to-br from-gold/5 to-transparent">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gold">Bénéfice Net Global</span>
                <div className="p-2 rounded-xl bg-gold/10 text-gold">
                  <Award size={18} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-gold">{beneficeNet.toLocaleString()} <span className="text-xs font-normal text-gold/60">FCFA</span></p>
              <p className="text-[11px] text-gold/60 mt-1">Marge nette globale : <span className="font-bold">{margeGlobale}%</span></p>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground/40">Nombre de Commandes</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <Package size={18} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-foreground">{nbCommandes}</p>
              <p className="text-[11px] text-foreground/40 mt-1">Commandes comptabilisées</p>
            </div>
          </div>

          {/* Section 2: Category Breakdown */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <PieChartIcon size={16} className="text-gold" />
                Répartition Financière par Catégorie de Produit
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { title: 'Essences Catalogues', data: essencesCat, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                { title: 'Parfums Standards', data: parfumsCat, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                { title: 'Accessoires', data: accessoiresCat, color: 'text-sky-400', bg: 'bg-sky-500/10' },
                { title: 'Parfums Personnalisés', data: parfumsPersoCat, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { title: 'Essences Sur-Mesure', data: essencesSurMesureCat, color: 'text-pink-400', bg: 'bg-pink-500/10' },
              ].map(cat => {
                const ca = parseFloat(String(cat.data?.chiffre_affaires || 0));
                const cout = parseFloat(String(cat.data?.cout_total || 0));
                const ben = parseFloat(String(cat.data?.benefice_net || (ca - cout)));
                return (
                  <div key={cat.title} className="bg-white/5 rounded-xl border border-white/5 p-4 space-y-2">
                    <p className={`text-xs font-bold ${cat.color}`}>{cat.title}</p>
                    <div>
                      <p className="text-[10px] text-foreground/40 uppercase">Chiffre d'Affaires</p>
                      <p className="text-sm font-bold text-foreground">{ca.toLocaleString()} FCFA</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-foreground/40 uppercase">Bénéfice Net</p>
                      <p className={`text-sm font-extrabold ${ben >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {ben >= 0 ? '+' : ''}{ben.toLocaleString()} FCFA
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Detailed Essence Sales Table */}
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <Sparkles size={16} className="text-gold" />
                  Détail des Ventes & Lots par Essence
                </h3>
                <p className="text-xs text-foreground/40 mt-0.5">Cliquez sur une ligne pour afficher la répartition des lots associés</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Essence</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Catégorie</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">CA Cumulé</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Coût Achat Cumulé</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Bénéfice Total</th>
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
                                  Lots d'essence consommés & rentabilité
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
                                            Stock restant : <span className="text-foreground/70 font-semibold">{stockRestant} ml</span>
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-xs text-foreground/40 italic">Aucun lot spécifique enregistré pour cette essence.</p>
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
                        Aucune vente d'essence enregistrée sur cette période.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
