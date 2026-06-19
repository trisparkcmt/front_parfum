'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Eye, CheckCircle, Truck, XCircle, Loader2, RefreshCw,
  ChevronLeft, ChevronRight, X, Package, Bike, CreditCard,
  MapPin, Phone, User, Calendar, Tag, ClipboardList, AlertTriangle,
  Filter, ShoppingBag, Droplets, Save, SlidersHorizontal,
} from 'lucide-react';
import { orderService, adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import type { BackendOrder, BackendOrderLine } from '@/types';

// ─── Status configs ───────────────────────────────────────────────────────────

const STATUT_CFG: Record<string, { label: string; color: string; dot: string }> = {
  en_attente:  { label: 'En attente',   color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',   dot: 'bg-amber-400'   },
  'validé':    { label: 'Validé',       color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',       dot: 'bg-blue-400'    },
  'annulée':   { label: 'Annulée',      color: 'text-red-400 bg-red-500/10 border-red-500/20',          dot: 'bg-red-400'     },
  'remboursée':{ label: 'Remboursée',   color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', dot: 'bg-purple-400'  },
};

const STATUT_LIVRAISON_CFG: Record<string, { label: string; color: string }> = {
  en_attente_affectation: { label: 'Non assignée', color: 'text-amber-400 bg-amber-500/10'   },
  'assignée':             { label: 'Assignée',     color: 'text-blue-400 bg-blue-500/10'     },
  'livrée':               { label: 'Livrée',       color: 'text-emerald-400 bg-emerald-500/10'},
  'échouée':              { label: 'Échouée',      color: 'text-red-400 bg-red-500/10'       },
};

const STATUT_PAIEMENT_CFG: Record<string, { label: string; color: string }> = {
  en_attente: { label: 'En attente', color: 'text-amber-400 bg-amber-500/10'   },
  'payé':     { label: 'Payé',       color: 'text-emerald-400 bg-emerald-500/10'},
  'échoué':   { label: 'Échoué',    color: 'text-red-400 bg-red-500/10'       },
};

const STATUT_OPTIONS    = ['', 'en_attente', 'validé', 'annulée', 'remboursée'];
const LIVRAISON_OPTIONS = ['', 'en_attente_affectation', 'assignée', 'livrée', 'échouée'];
const PAIEMENT_OPTIONS  = ['', 'en_attente', 'payé', 'échoué'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Badge({ text, cfg }: { text: string; cfg?: { label: string; color: string } }) {
  if (!cfg) return <span className="text-xs text-foreground/30 italic">—</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${cfg.color}`}>
      {text}
    </span>
  );
}

function fmt(v?: string | number | null) {
  if (v == null || v === '') return '—';
  return Number(v).toLocaleString('fr-FR') + ' FCFA';
}

function fmtDate(d?: string | null, time = false) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...(time ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

function allLines(order: BackendOrder): BackendOrderLine[] {
  return [
    ...order.lignes_parfums,
    ...order.lignes_accessoires,
    ...order.lignes_produit_fini_essence,
    ...order.lignes_parfums_perso,
    ...order.lignes_essence_personnalisee,
  ];
}

function getDeliveryMethod(order: BackendOrder): string {
  return order.livreur ? 'livraison' : 'retrait en boutique';
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  // ── sidebar state ──────────────────────────────────────────────────────────────
  
  // ── list state ──────────────────────────────────────────────────────────────
  const [orders, setOrders]     = useState<BackendOrder[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);

  // ── filters ─────────────────────────────────────────────────────────────────
  const [search,           setSearch]           = useState('');
  const [nomFilter,        setNomFilter]        = useState('');
  const [statutFilter,     setStatutFilter]     = useState('');
  const [livraisonFilter,  setLivraisonFilter]  = useState('');
  const [paiementFilter,   setPaiementFilter]   = useState('');
  const [showFilters,      setShowFilters]      = useState(false);

  const [selected,         setSelected]         = useState<BackendOrder | null>(null);
  const [editModal,        setEditModal]        = useState<BackendOrder | null>(null);
  const [validationModal,  setValidationModal]  = useState<BackendOrder | null>(null);

  // ── drivers ─────────────────────────────────────────────────────────────────
  const [drivers,          setDrivers]          = useState<any[]>([]);

  // ── edit form ───────────────────────────────────────────────────────────────
  const [editStatut,       setEditStatut]       = useState('');
  const [editLivraison,    setEditLivraison]    = useState('');
  const [editPaiement,     setEditPaiement]     = useState('');
  const [editLivreur,      setEditLivreur]      = useState('');
  const [editDateEst,      setEditDateEst]      = useState('');
  const [editNote,         setEditNote]         = useState('');
  const [editFrais,        setEditFrais]        = useState('');
  const [saving,           setSaving]           = useState(false);
  const [valDriverId,      setValDriverId]      = useState('');
  const [valDateEst,       setValDateEst]       = useState('');


  const { addToast } = useToastStore();
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const PAGE_SIZE = 100;

  // ── fetch orders ─────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (pg = page) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page: pg };
      if (statutFilter)    params.statut            = statutFilter;
      if (livraisonFilter) params.statut_livraison  = livraisonFilter;
      if (paiementFilter)  params.statut_paiement   = paiementFilter;
      if (nomFilter)       params.nom               = nomFilter;
      if (search)          params.search            = search;

      const data = await orderService.getOrders(params);
      const list  = data.results ?? data.resultats ?? (Array.isArray(data) ? data : []);
      setOrders(list);
      setTotal(data.count ?? list.length);
    } catch {
      addToast('Erreur lors du chargement des commandes', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, statutFilter, livraisonFilter, paiementFilter, nomFilter, search, addToast]);

  // debounce search
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => { setPage(1); fetchOrders(1); }, 400);
    return () => { if (searchRef.current) clearTimeout(searchRef.current); };
  }, [search, nomFilter, statutFilter, livraisonFilter, paiementFilter]); // eslint-disable-line

  useEffect(() => { fetchOrders(page); }, [page]); // eslint-disable-line

  // ── fetch drivers ─────────────────────────────────────────────────────────────
  useEffect(() => {
    adminService.getDeliveryDrivers()
      .then(d => setDrivers(d.results ?? d.resultats ?? (Array.isArray(d) ? d : [])))
      .catch(() => {});
  }, []);

  // ── open edit modal ───────────────────────────────────────────────────────────
  const openEdit = (order: BackendOrder) => {
    setEditModal(order);
    setEditStatut(order.statut);
    setEditLivraison(order.statut_livraison);
    setEditPaiement(order.statut_paiement);
    setEditLivreur(order.livreur != null ? String(order.livreur) : '');
    setEditDateEst(order.date_livraison_estimee ?? '');
    setEditNote(order.note_interne ?? '');
    setEditFrais(order.frais_livraison ?? '');
  };

  // ── save patch ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!editModal) return;
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        statut:               editStatut,
        statut_livraison:     editLivraison,
        statut_paiement:      editPaiement,
        note_interne:         editNote,
      };
      if (editLivreur)  payload.livreur               = Number(editLivreur);
      if (editDateEst)  payload.date_livraison_estimee = editDateEst;
      if (editFrais)    payload.frais_livraison        = parseFloat(editFrais);

      await orderService.updateOrder(editModal.numero_commande, payload);
      addToast('Commande mise à jour avec succès', 'success');
      setEditModal(null);
      fetchOrders(page);
    } catch (err: any) {
      addToast(err.response?.data?.detail ?? 'Erreur lors de la mise à jour', 'error');
    } finally {
      setSaving(false);
    }
  };
  // ── cancel ────────────────────────────────────────────────────────────────────
  const handleCancel = async (order: BackendOrder) => {
    if (!confirm(`Annuler la commande ${order.numero_commande} ?`)) return;
    try {
      await orderService.cancelOrder(order.numero_commande);
      addToast('Commande annulée', 'success');
      fetchOrders(page);
    } catch (err: any) {
      addToast(err.response?.data?.detail ?? 'Erreur lors de l\'annulation', 'error');
    }
  };

  // ── validate click ─────────────────────────────────────────────────────────────
  const handleValidateClick = async (order: BackendOrder) => {
    const isDelivery = !!order.livraison_ville && order.livraison_ville.trim() !== '';
    if (isDelivery) {
      setValidationModal(order);
      setValDriverId(order.livreur != null ? String(order.livreur) : '');
      setValDateEst(order.date_livraison_estimee ?? '');
    } else {
      if (!confirm(`Valider la commande pickup ${order.numero_commande} ?`)) return;
      try {
        setLoading(true);
        await orderService.updateOrder(order.numero_commande, {
          statut: 'validé',
          statut_livraison: 'en_attente_affectation',
        });
        addToast('Commande pickup validée avec succès', 'success');
        fetchOrders(page);
      } catch (err: any) {
        addToast(err.response?.data?.detail ?? 'Erreur lors de la validation', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // ── confirm validation with driver ─────────────────────────────────────────────
  const handleConfirmValidation = async () => {
    if (!validationModal) return;
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        statut: 'validé',
        statut_livraison: valDriverId ? 'assignée' : 'en_attente_affectation',
      };
      if (valDriverId) payload.livreur = Number(valDriverId);
      if (valDateEst) payload.date_livraison_estimee = valDateEst;

      await orderService.updateOrder(validationModal.numero_commande, payload);
      addToast('Commande validée et livreur assigné', 'success');
      setValidationModal(null);
      fetchOrders(page);
    } catch (err: any) {
      addToast(err.response?.data?.detail ?? 'Erreur lors de la validation', 'error');
    } finally {
      setSaving(false);
    }
  };
  // ── pagination ────────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  // ── KPI counts ────────────────────────────────────────────────────────────────
  const kpi = [
    { label: 'Total',      value: total,                                                            color: 'text-foreground' },
    { label: 'En attente', value: orders.filter(o => o.statut === 'en_attente').length,              color: 'text-amber-400'   },
    { label: 'Validées',   value: orders.filter(o => o.statut === 'validé').length,                 color: 'text-blue-400'    },
    { label: 'Payées',     value: orders.filter(o => o.statut_paiement === 'payé').length,           color: 'text-emerald-400' },
    { label: 'Annulées',   value: orders.filter(o => o.statut === 'annulée').length,                color: 'text-red-400'     },
  ];

  const isCancellable = (o: BackendOrder) =>
    o.statut === 'en_attente' || o.statut === 'validé';

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des Commandes</h1>
          <p className="text-sm text-foreground/40 mt-0.5">
            {total.toLocaleString()} commande{total > 1 ? 's' : ''} · {PAGE_SIZE} par page
          </p>
        </div>
        <button
          onClick={() => fetchOrders(page)}
          className="flex items-center gap-2 border border-white/10 px-4 py-2.5 rounded-xl text-sm text-foreground/60 hover:bg-white/5 transition-all"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* ── KPI Row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {kpi.map(k => (
          <div key={k.label} className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-xl backdrop-blur-md">
            <p className="text-[10px] text-foreground/40 uppercase font-bold tracking-widest mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-xl backdrop-blur-md space-y-3">
        {/* row 1: search + toggle */}
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 flex-1">
            <Search size={15} className="text-foreground/40 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Numéro CMD, email, téléphone…"
              className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-foreground/40"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-foreground/30 hover:text-foreground/60">
                <X size={13} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 flex-1 max-w-56">
            <User size={14} className="text-foreground/40 shrink-0" />
            <input
              value={nomFilter}
              onChange={e => setNomFilter(e.target.value)}
              placeholder="Nom client / destinataire"
              className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-foreground/40"
            />
          </div>
          <button
            onClick={() => setShowFilters(s => !s)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition-all ${
              showFilters ? 'bg-gold/10 border-gold/30 text-gold' : 'border-white/10 text-foreground/50 hover:bg-white/5'
            }`}
          >
            <SlidersHorizontal size={15} />
            Filtres
            {(statutFilter || livraisonFilter || paiementFilter) && (
              <span className="w-2 h-2 bg-gold rounded-full" />
            )}
          </button>
        </div>

        {/* row 2: advanced filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10">
            {/* Statut commande */}
            <div>
              <label className="text-[10px] text-foreground/40 uppercase font-bold tracking-widest mb-1.5 block">Statut commande</label>
              <div className="flex flex-wrap gap-1.5">
                {STATUT_OPTIONS.map(v => (
                  <button
                    key={v}
                    onClick={() => { setStatutFilter(v); setPage(1); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      statutFilter === v
                        ? 'bg-gold text-black border-gold'
                        : 'border-white/10 text-foreground/50 hover:bg-white/5'
                    }`}
                  >
                    {v === '' ? 'Tous' : STATUT_CFG[v]?.label ?? v}
                  </button>
                ))}
              </div>
            </div>
            {/* Statut livraison */}
            <div>
              <label className="text-[10px] text-foreground/40 uppercase font-bold tracking-widest mb-1.5 block">Statut livraison</label>
              <div className="flex flex-wrap gap-1.5">
                {LIVRAISON_OPTIONS.map(v => (
                  <button
                    key={v}
                    onClick={() => { setLivraisonFilter(v); setPage(1); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      livraisonFilter === v
                        ? 'bg-gold text-black border-gold'
                        : 'border-white/10 text-foreground/50 hover:bg-white/5'
                    }`}
                  >
                    {v === '' ? 'Tous' : STATUT_LIVRAISON_CFG[v]?.label ?? v}
                  </button>
                ))}
              </div>
            </div>
            {/* Statut paiement */}
            <div>
              <label className="text-[10px] text-foreground/40 uppercase font-bold tracking-widest mb-1.5 block">Paiement</label>
              <div className="flex flex-wrap gap-1.5">
                {PAIEMENT_OPTIONS.map(v => (
                  <button
                    key={v}
                    onClick={() => { setPaiementFilter(v); setPage(1); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      paiementFilter === v
                        ? 'bg-gold text-black border-gold'
                        : 'border-white/10 text-foreground/50 hover:bg-white/5'
                    }`}
                  >
                    {v === '' ? 'Tous' : STATUT_PAIEMENT_CFG[v]?.label ?? v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="bg-white/5 rounded-3xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gold gap-3">
            <Loader2 className="animate-spin" size={36} />
            <p className="text-sm font-semibold">Chargement des commandes…</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  {['N° Commande', 'Client / Destinataire', 'Total TTC', 'Code Promo', 'Livreur', 'Statut', 'Livraison', 'Paiement', 'Date', ''].map(h => (
                    <th key={h} className="text-left text-[10px] font-bold text-foreground/40 uppercase tracking-wider px-4 py-3.5 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-white/[0.03] transition-colors group">
                    {/* N° commande */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-bold text-gold tracking-wider">
                        {order.numero_commande}
                      </span>
                    </td>

                    {/* Client / destinataire */}
                    <td className="px-4 py-3.5 min-w-[160px]">
                      <p className="text-xs font-semibold text-foreground leading-tight">{order.livraison_nom_complet}</p>
                      <p className="text-[10px] text-foreground/40 mt-0.5">{order.client_email}</p>
                      {order.livraison_ville && (
                        <p className="text-[10px] text-foreground/30">{order.livraison_ville}{order.livraison_quartier ? `, ${order.livraison_quartier}` : ''}</p>
                      )}
                    </td>

                    {/* Total TTC */}
                    <td className="px-4 py-3.5 font-bold text-foreground whitespace-nowrap">
                      {fmt(order.total_ttc)}
                    </td>

                    {/* Code promo */}
                    <td className="px-4 py-3.5">
                      {order.code_promo_utilise
                        ? <span className="font-mono text-xs bg-gold/10 text-gold px-2 py-0.5 rounded border border-gold/20">{order.code_promo_utilise}</span>
                        : <span className="text-foreground/30 text-xs">—</span>}
                    </td>

                    {/* Livreur */}
                    <td className="px-4 py-3.5 text-xs text-foreground/60 whitespace-nowrap">
                      {order.livreur_nom ?? <span className="text-foreground/30">—</span>}
                    </td>

                    {/* Statut commande */}
                    <td className="px-4 py-3.5">
                      <Badge text={STATUT_CFG[order.statut]?.label ?? order.statut} cfg={STATUT_CFG[order.statut]} />
                    </td>

                    {/* Statut livraison */}
                    <td className="px-4 py-3.5">
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border capitalize inline-flex
                        {order.livreur ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'}">
                        {getDeliveryMethod(order)}
                      </span>
                    </td>

                    {/* Statut paiement */}
                    <td className="px-4 py-3.5">
                      <Badge text={STATUT_PAIEMENT_CFG[order.statut_paiement]?.label ?? order.statut_paiement} cfg={STATUT_PAIEMENT_CFG[order.statut_paiement]} />
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 text-[10px] text-foreground/40 whitespace-nowrap">
                      {fmtDate(order.date_creation)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          title="Voir le détail"
                          onClick={() => setSelected(order)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-foreground/60 hover:text-gold transition-colors"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          title="Modifier / Gérer"
                          onClick={() => openEdit(order)}
                          className="p-1.5 rounded-lg hover:bg-blue-500/10 text-foreground/60 hover:text-blue-400 transition-colors"
                        >
                          <ClipboardList size={15} />
                        </button>
                        {order.statut === 'en_attente' && (
                          <button
                            onClick={() => handleValidateClick(order)}
                            className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg text-[10px] font-bold transition-all"
                          >
                            Valider
                          </button>
                        )}
                        {isCancellable(order) && (
                          <button
                            onClick={() => handleCancel(order)}
                            className="px-2 py-1 bg-red-500 hover:bg-red-600 text-foreground rounded-lg text-[10px] font-bold transition-all"
                          >
                            Annuler
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && !loading && (
                  <tr>
                    <td colSpan={10} className="text-center py-20 text-foreground/30 italic text-sm">
                      Aucune commande trouvée pour ces critères.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-foreground/40">
            Page {page} / {totalPages} · {total.toLocaleString()} commandes
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-2 rounded-xl border border-white/10 text-foreground/60 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const pg = start + i;
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-8 h-8 rounded-xl text-xs font-semibold transition-all border ${
                    pg === page
                      ? 'bg-gold text-black border-gold'
                      : 'border-white/10 text-foreground/50 hover:bg-white/5'
                  }`}
                >
                  {pg}
                </button>
              );
            })}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="p-2 rounded-xl border border-white/10 text-foreground/60 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          DETAIL MODAL
      ════════════════════════════════════════════════════════════════════════ */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div className="bg-background rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10">
            {/* header */}
            <div className="sticky top-0 bg-background border-b border-white/10 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
              <div>
                <h3 className="font-bold text-foreground text-lg">{selected.numero_commande}</h3>
                <p className="text-xs text-foreground/40">{fmtDate(selected.date_creation, true)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-white/5 text-foreground/40 hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* status badges */}
              <div className="flex flex-wrap gap-2">
                <Badge text={STATUT_CFG[selected.statut]?.label ?? selected.statut} cfg={STATUT_CFG[selected.statut]} />
                {selected.livreur ? (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border text-emerald-400 bg-emerald-500/10 border-emerald-500/20">livraison</span>
                ) : (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border text-amber-400 bg-amber-500/10 border-amber-500/20">retrait en boutique</span>
                )}
                <Badge text={STATUT_PAIEMENT_CFG[selected.statut_paiement]?.label ?? selected.statut_paiement} cfg={STATUT_PAIEMENT_CFG[selected.statut_paiement]} />
              </div>

              {/* info grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* delivery info */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-4 space-y-2.5">
                  <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest flex items-center gap-1.5"><MapPin size={11} />Livraison</p>
                  <InfoRow label="Destinataire" value={selected.livraison_nom_complet} />
                  <InfoRow label="Téléphone"    value={selected.livraison_telephone} />
                  {selected.livraison_ville && <InfoRow label="Ville" value={`${selected.livraison_ville}${selected.livraison_quartier ? ` – ${selected.livraison_quartier}` : ''}`} />}
                  <InfoRow label="Livreur"       value={selected.livreur_nom ?? '—'} />
                  <InfoRow label="Livraison est." value={fmtDate(selected.date_livraison_estimee)} />
                  <InfoRow label="Livraison réelle" value={fmtDate(selected.date_livraison_reelle)} />
                  {selected.motif_echec_livraison && (
                    <div className="text-xs text-red-400 bg-red-500/10 rounded-xl p-2.5 border border-red-500/10 flex gap-1.5">
                      <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                      {selected.motif_echec_livraison}
                    </div>
                  )}
                </div>

                {/* financial info */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-4 space-y-2.5">
                  <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest flex items-center gap-1.5"><CreditCard size={11} />Finances</p>
                  <InfoRow label="Sous-total"   value={fmt(selected.sous_total)} />
                  <InfoRow label="Frais de livraison" value={fmt(selected.frais_livraison)} />
                  {Number(selected.remise_code_promo) > 0 && (
                    <InfoRow label="Remise promo"  value={`-${fmt(selected.remise_code_promo)}`} />
                  )}
                  <InfoRow label="Total TTC"    value={fmt(selected.total_ttc)} bold />
                  {selected.code_promo_utilise && (
                    <InfoRow label="Code promo"  value={selected.code_promo_utilise} mono />
                  )}
                  <InfoRow label="Commission"   value={`${fmt(selected.commission_montant)} (${selected.commission_statut})`} />
                  <InfoRow label="Prestataire"  value={selected.prestataire_code ?? '—'} />
                </div>
              </div>

              {/* client notes */}
              {selected.note_client && (
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-amber-400/60 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Phone size={11} />Note client</p>
                  <p className="text-sm text-foreground/70">{selected.note_client}</p>
                </div>
              )}
              {selected.note_interne && (
                <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-blue-400/60 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><ClipboardList size={11} />Note interne</p>
                  <p className="text-sm text-foreground/70">{selected.note_interne}</p>
                </div>
              )}

              {/* order lines */}
              <div>
                <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <ShoppingBag size={11} />Articles ({allLines(selected).length})
                </p>
                <div className="space-y-2">
                  {selected.lignes_parfums.length > 0 && <LinesSection title="Parfums" icon={<Droplets size={12} />} lines={selected.lignes_parfums} />}
                  {selected.lignes_accessoires.length > 0 && <LinesSection title="Accessoires" icon={<ShoppingBag size={12} />} lines={selected.lignes_accessoires} />}
                  {selected.lignes_produit_fini_essence.length > 0 && <LinesSection title="Essences finies" icon={<Droplets size={12} />} lines={selected.lignes_produit_fini_essence} />}
                  {selected.lignes_parfums_perso.length > 0 && <LinesSection title="Parfums personnalisés" icon={<Package size={12} />} lines={selected.lignes_parfums_perso} />}
                  {selected.lignes_essence_personnalisee.length > 0 && <LinesSection title="Essences personnalisées" icon={<Droplets size={12} />} lines={selected.lignes_essence_personnalisee} />}
                  {allLines(selected).length === 0 && (
                    <p className="text-xs text-foreground/30 italic text-center py-4">Aucun article dans cette commande.</p>
                  )}
                </div>
              </div>

              {/* actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                {selected.statut === 'en_attente' && (
                  <button
                    onClick={() => { handleValidateClick(selected); setSelected(null); }}
                    className="flex-1 min-w-[120px] bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CheckCircle size={14} />
                    Valider
                  </button>
                )}
                {isCancellable(selected) && (
                  <button
                    onClick={() => { handleCancel(selected); setSelected(null); }}
                    className="flex-1 min-w-[120px] bg-red-500 hover:bg-red-600 text-foreground rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <XCircle size={14} />
                    Annuler
                  </button>
                )}
                <button
                  onClick={() => { setSelected(null); openEdit(selected); }}
                  className="px-4 bg-gold text-black rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-gold/80 transition-all"
                >
                  <ClipboardList size={14} />
                  Gérer
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="px-4 border border-white/10 rounded-xl py-2.5 text-xs text-foreground/60 hover:bg-white/5 transition-all"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          EDIT / MANAGE MODAL
      ════════════════════════════════════════════════════════════════════════ */}
      {editModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setEditModal(null); }}
        >
          <div className="bg-background rounded-3xl w-full max-w-lg shadow-2xl border border-white/10">
            {/* header */}
            <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground">Gérer la commande</h3>
                <p className="text-xs text-gold font-mono mt-0.5">{editModal.numero_commande}</p>
              </div>
              <button onClick={() => setEditModal(null)} className="p-2 rounded-xl hover:bg-white/5 text-foreground/40 hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Statut commande */}
              <div>
                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-2 block">Statut de la commande</label>
                <div className="flex flex-wrap gap-2">
                  {STATUT_OPTIONS.filter(v => v !== '').map(v => (
                    <button
                      key={v}
                      onClick={() => setEditStatut(v)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        editStatut === v
                          ? 'bg-gold text-black border-gold'
                          : 'border-white/10 text-foreground/50 hover:bg-white/5'
                      }`}
                    >
                      {STATUT_CFG[v]?.label ?? v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Statut livraison */}
              <div>
                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-2 block flex items-center gap-1"><Truck size={10} />Statut de livraison</label>
                <div className="flex flex-wrap gap-2">
                  {LIVRAISON_OPTIONS.filter(v => v !== '').map(v => (
                    <button
                      key={v}
                      onClick={() => setEditLivraison(v)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        editLivraison === v
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'border-white/10 text-foreground/50 hover:bg-white/5'
                      }`}
                    >
                      {STATUT_LIVRAISON_CFG[v]?.label ?? v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Statut paiement */}
              <div>
                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-2 block flex items-center gap-1"><CreditCard size={10} />Statut paiement</label>
                <div className="flex flex-wrap gap-2">
                  {PAIEMENT_OPTIONS.filter(v => v !== '').map(v => (
                    <button
                      key={v}
                      onClick={() => setEditPaiement(v)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        editPaiement === v
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'border-white/10 text-foreground/50 hover:bg-white/5'
                      }`}
                    >
                      {STATUT_PAIEMENT_CFG[v]?.label ?? v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assign driver */}
              <div>
                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-2 block flex items-center gap-1"><Bike size={10} />Assigner un livreur</label>
                <select
                  value={editLivreur}
                  onChange={e => setEditLivreur(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold transition-all"
                >
                  <option value="" className="bg-background">— Aucun —</option>
                  {drivers.map(d => {
                    const name = d.user_details?.first_name
                      ? `${d.user_details.first_name} ${d.user_details.last_name ?? ''}`.trim()
                      : d.name ?? `Livreur #${d.id}`;
                    const id = d.id ?? d.user_id;
                    return <option key={id} value={id} className="bg-background">{name}</option>;
                  })}
                </select>
              </div>

              {/* two-col: date + frais */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-2 block flex items-center gap-1"><Calendar size={10} />Date estimée</label>
                  <input
                    type="date"
                    value={editDateEst}
                    onChange={e => setEditDateEst(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-2 block flex items-center gap-1"><Tag size={10} />Frais de livraison (FCFA)</label>
                  <input
                    type="number"
                    value={editFrais}
                    onChange={e => setEditFrais(e.target.value)}
                    placeholder={editModal.frais_livraison}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold transition-all"
                  />
                </div>
              </div>

              {/* note interne */}
              <div>
                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-2 block flex items-center gap-1"><ClipboardList size={10} />Note interne</label>
                <textarea
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  rows={2}
                  placeholder="Commentaire interne visible uniquement par l'équipe…"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold transition-all resize-none"
                />
              </div>

              {/* submit */}
              <div className="flex gap-3 pt-2 border-t border-white/10">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-gold text-black rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 hover:bg-gold/80 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Enregistrer les modifications
                </button>
                <button
                  onClick={() => setEditModal(null)}
                  className="px-5 border border-white/10 rounded-xl py-3 text-sm text-foreground/60 hover:bg-white/5 transition-all"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          VALIDATION / DRIVER ASSIGNMENT MODAL
      ════════════════════════════════════════════════════════════════════════ */}
      {validationModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setValidationModal(null); }}
        >
          <div className="bg-background rounded-3xl w-full max-w-md shadow-2xl border border-white/10">
            {/* header */}
            <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground">Validation & Livraison</h3>
                <p className="text-xs text-gold font-mono mt-0.5">{validationModal.numero_commande}</p>
              </div>
              <button onClick={() => setValidationModal(null)} className="p-2 rounded-xl hover:bg-white/5 text-foreground/40 hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-xs space-y-2">
                <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest flex items-center gap-1.5"><MapPin size={11} />Destinataire & Adresse</p>
                <div><span className="text-foreground/40">Nom: </span><span className="text-foreground/85 font-medium">{validationModal.livraison_nom_complet}</span></div>
                <div><span className="text-foreground/40">Téléphone: </span><span className="text-foreground/85 font-medium">{validationModal.livraison_telephone}</span></div>
                <div><span className="text-foreground/40">Adresse: </span><span className="text-foreground/85 font-medium">{validationModal.livraison_ville}, {validationModal.livraison_quartier}</span></div>
              </div>

              {/* Assign driver */}
              <div>
                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-2 block flex items-center gap-1"><Bike size={10} />Choisir un livreur</label>
                <select
                  value={valDriverId}
                  onChange={e => setValDriverId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold transition-all"
                >
                  <option value="" className="bg-background">— Aucun / Assigner plus tard —</option>
                  {drivers.map(d => {
                    const name = d.user_details?.first_name
                      ? `${d.user_details.first_name} ${d.user_details.last_name ?? ''}`.trim()
                      : d.name ?? `Livreur #${d.id}`;
                    const id = d.id ?? d.user_id;
                    return <option key={id} value={id} className="bg-background">{name}</option>;
                  })}
                </select>
              </div>

              {/* Date estimée */}
              <div>
                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-2 block flex items-center gap-1"><Calendar size={10} />Date estimée de livraison</label>
                <input
                  type="date"
                  value={valDateEst}
                  onChange={e => setValDateEst(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold transition-all"
                />
              </div>

              {/* submit */}
              <div className="flex gap-3 pt-2 border-t border-white/10">
                <button
                  onClick={handleConfirmValidation}
                  disabled={saving}
                  className="flex-1 bg-emerald-500 text-black rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  Confirmer la validation
                </button>
                <button
                  onClick={() => setValidationModal(null)}
                  className="px-5 border border-white/10 rounded-xl py-3 text-sm text-foreground/60 hover:bg-white/5 transition-all"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ label, value, bold, mono }: { label: string; value: string; bold?: boolean; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-2 text-xs">
      <span className="text-foreground/40 shrink-0">{label}</span>
      <span className={`text-right ${bold ? 'font-bold text-foreground' : 'text-foreground/70'} ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function LinesSection({ title, icon, lines }: { title: string; icon: React.ReactNode; lines: BackendOrderLine[] }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-foreground/30 uppercase tracking-wider flex items-center gap-1 mb-1.5">
        {icon}{title}
      </p>
      <div className="space-y-1.5">
        {lines.map(line => (
          <div key={line.id} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs">
            <span className="text-foreground/80 font-medium">{line.nom_snapshot}</span>
            <div className="flex items-center gap-3 text-foreground/50">
              <span>{line.quantite} ×</span>
              <span>{Number(line.prix_unitaire_snapshot).toLocaleString()} FCFA</span>
              <span className="text-foreground/70 font-semibold">{Number(line.sous_total).toLocaleString()} FCFA</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
