'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Eye, CheckCircle, XCircle, Truck, Loader2, RefreshCw,
  Package, MapPin, Phone, User, Calendar, Tag, X, Download, FileText, Mail,
} from 'lucide-react';
import { orderService, adminService } from '@/services/apiService';
import { invoiceService } from '@/services/invoiceService';
import { useToastStore } from '@/store/useToastStore';

// ─── Status configs ───────────────────────────────────────────────────────────

const STATUT_CFG: Record<string, { label: string; color: string }> = {
  en_attente:   { label: 'En attente',   color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'     },
  'validé':     { label: 'Validé',       color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'         },
  'annulée':    { label: 'Annulée',      color: 'text-red-400 bg-red-500/10 border-red-500/20'            },
  'remboursée': { label: 'Remboursée',   color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'  },
  // legacy aliases
  pending:    { label: 'En attente',   color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'     },
  validated:  { label: 'Validé',       color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'         },
  cancelled:  { label: 'Annulée',      color: 'text-red-400 bg-red-500/10 border-red-500/20'            },
  valide:     { label: 'Validé',       color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'         },
  annule:     { label: 'Annulée',      color: 'text-red-400 bg-red-500/10 border-red-500/20'            },
};

const STATUS_FILTERS = [
  { value: 'all',         label: 'Tous'          },
  { value: 'en_attente',  label: 'En attente'    },
  { value: 'validé',      label: 'Validé'        },
  { value: 'annulée',     label: 'Annulée'       },
  { value: 'remboursée',  label: 'Remboursée'    },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function fmtDateTime(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [orders, setOrders]   = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');

  // modals
  const [selected,         setSelected]         = useState<any | null>(null);
  const [validationModal,  setValidationModal]  = useState<any | null>(null);
  const [valDriverId,      setValDriverId]      = useState('');
  const [valDateEst,       setValDateEst]       = useState('');
  const [saving,           setSaving]           = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const { addToast } = useToastStore();

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {};
      if (filter !== 'all') params.statut = filter;
      if (search)           params.search = search;

      const data = await orderService.getOrders(params);
      const list = data.results ?? data.resultats ?? (Array.isArray(data) ? data : []);
      setOrders(list);
    } catch {
      addToast('Erreur lors du chargement des commandes', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, search, addToast]);

  const fetchDrivers = useCallback(async () => {
    try {
      const data = await adminService.getDeliveryDrivers();
      const list = data.results ?? data.resultats ?? (Array.isArray(data) ? data : []);
      setDrivers(list);
    } catch { /* non-blocking */ }
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchOrders, 300);
    return () => clearTimeout(t);
  }, [fetchOrders]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  // ── helpers ────────────────────────────────────────────────────────────────
  const getStatut = (o: any): string => o.statut ?? o.status ?? 'en_attente';

  const getCfg = (o: any) => STATUT_CFG[getStatut(o)] ?? { label: getStatut(o), color: 'text-foreground/40 bg-white/5 border-white/10' };

  const isPending = (o: any) =>
    ['en_attente', 'pending'].includes(getStatut(o));

  const isCancellable = (o: any) =>
    ['en_attente', 'pending', 'validé', 'validated', 'valide'].includes(getStatut(o));

  // ── validate click ────────────────────────────────────────────────────────
  const handleValidateClick = async (order: any) => {
    const isDelivery =
      !!(order.livraison_ville && order.livraison_ville.trim() !== '') ||
      !!(order.adresse_livraison && order.adresse_livraison.trim() !== '');

    if (isDelivery) {
      setValidationModal(order);
      setValDriverId(order.livreur != null ? String(order.livreur) : '');
      setValDateEst(order.date_livraison_estimee ?? '');
    } else {
      if (!confirm(`Valider la commande pickup ${order.numero_commande ?? `#${order.id}`} ?`)) return;
      try {
        setLoading(true);
        await orderService.updateOrder(order.numero_commande, {
          statut: 'validé',
          statut_livraison: 'en_attente_affectation',
        });
        addToast('Commande pickup validée avec succès', 'success');
        fetchOrders();
      } catch (err: any) {
        addToast(err.response?.data?.detail ?? 'Erreur lors de la validation', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // ── confirm validation with driver ────────────────────────────────────────
  const handleConfirmValidation = async () => {
    if (!validationModal) return;
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        statut: 'validé',
        statut_livraison: valDriverId ? 'assignée' : 'en_attente_affectation',
      };
      if (valDriverId) payload.livreur = Number(valDriverId);
      if (valDateEst)  payload.date_livraison_estimee = valDateEst;

      await orderService.updateOrder(validationModal.numero_commande, payload);
      addToast('Commande validée avec succès', 'success');
      setValidationModal(null);
      fetchOrders();
    } catch (err: any) {
      addToast(err.response?.data?.detail ?? 'Erreur lors de la validation', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── cancel ────────────────────────────────────────────────────────────────
  const handleCancel = async (order: any) => {
    const label = order.numero_commande ?? `#${order.id}`;
    if (!confirm(`Annuler la commande ${label} ?`)) return;
    try {
      await orderService.cancelOrder(order.numero_commande);
      addToast('Commande annulée', 'success');
      fetchOrders();
    } catch (err: any) {
      addToast(err.response?.data?.detail ?? "Erreur lors de l'annulation", 'error');
    }
  };

  const handleDownloadInvoice = async (order: any) => {
    const num = order.numero_commande ?? String(order.id);
    setDownloadingInvoice(true);
    try {
      await invoiceService.downloadInvoiceFile(num, `facture-${num}.pdf`);
      addToast('Facture PDF téléchargée', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.detail ?? 'Facture non disponible', 'error');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const openInvoice = async (order: any) => {
    if (order.facture?.fichier_pdf) {
      window.open(order.facture.fichier_pdf, '_blank');
      return;
    }
    await handleDownloadInvoice(order);
  };

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const kpiCounts = STATUS_FILTERS.filter(f => f.value !== 'all').map(f => ({
    ...f,
    count: orders.filter(o => getStatut(o) === f.value || getStatut(o) === f.value.replace('annulée','annule').replace('validé','valide')).length,
    cfg: STATUT_CFG[f.value],
  }));

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des Commandes</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Validation et suivi des commandes clients</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 border border-white/10 px-4 py-2.5 rounded-xl text-sm text-foreground/60 hover:bg-white/5 transition-all"
        >
          <RefreshCw size={15} />
          Actualiser
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCounts.map(f => (
          <div key={f.value} className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-sm">
            <p className="text-xs text-foreground/40 mb-1">{f.label}</p>
            <p className={`text-2xl font-bold ${f.cfg?.color.split(' ')[0] ?? 'text-foreground'}`}>{f.count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 border border-white/10 rounded-lg px-3 py-2 flex-1 min-w-48">
          <Search size={15} className="text-foreground/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher commande ou client..."
            className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-foreground/40"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${filter === f.value
                  ? 'bg-gold text-black'
                  : 'border border-white/10 text-foreground/40 hover:bg-white/5'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-sm overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm font-medium">Chargement des commandes...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  {['N° Commande', 'Client', 'Montant', 'Date', 'Livraison', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider px-5 py-3.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map(order => {
                  const clientName = order.client_details?.first_name
                    ?? order.client_email
                    ?? order.client_name
                    ?? `Client #${order.client ?? order.utilisateur ?? '?'}`;
                  const total      = order.total_ttc ?? order.montant_total ?? order.total ?? 0;
                  const hasDelivery = !!(order.livraison_ville?.trim() || order.adresse_livraison?.trim());
                  const cfg = getCfg(order);

                  return (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-5 py-4 font-mono text-xs text-gold font-semibold">
                        {order.numero_commande ?? `#${String(order.id).padStart(5, '0')}`}
                      </td>
                      <td className="px-5 py-4 font-medium text-foreground">{clientName}</td>
                      <td className="px-5 py-4 font-semibold text-foreground">
                        {Number(total).toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="px-5 py-4 text-foreground/40 text-xs">
                        {fmtDate(order.date_creation ?? order.date)}
                      </td>
                      <td className="px-5 py-4">
                        {hasDelivery
                          ? <span className="inline-flex items-center gap-1 text-xs text-blue-400"><Truck size={12} /> Livraison</span>
                          : <span className="inline-flex items-center gap-1 text-xs text-emerald-400"><Package size={12} /> Pickup</span>
                        }
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {/* Detail */}
                          <button
                            title="Voir le détail"
                            onClick={() => setSelected(order)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Validate */}
                          {isPending(order) && (
                            <button
                              title="Valider la commande"
                              onClick={() => handleValidateClick(order)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold transition-colors"
                            >
                              <CheckCircle size={12} />
                              Valider
                            </button>
                          )}

                          {/* Cancel */}
                          {isCancellable(order) && (
                            <button
                              title="Annuler la commande"
                              onClick={() => handleCancel(order)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-colors"
                            >
                              <XCircle size={12} />
                              Annuler
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-20 text-foreground/40 italic">
                      Aucune commande trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Detail modal ──────────────────────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-lg shadow-sm border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-foreground text-lg">
                  {selected.numero_commande ?? `Commande #${String(selected.id).padStart(5, '0')}`}
                </h3>
                <p className="text-xs text-foreground/40">{fmtDateTime(selected.date_creation ?? selected.date)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-white/5 text-foreground/40 hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Status badge */}
            <div className="mb-5">
              <span className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full border ${getCfg(selected).color}`}>
                {getCfg(selected).label}
              </span>
            </div>

            {/* Info rows */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { icon: <User size={14} />,     label: 'Client',       value: selected.client_details?.first_name ?? selected.client_email ?? `ID ${selected.client ?? '—'}` },
                { icon: <Phone size={14} />,    label: 'Téléphone',    value: selected.livraison_telephone ?? '—' },
                { icon: <Tag size={14} />,      label: 'Montant',      value: `${Number(selected.total_ttc ?? selected.montant_total ?? 0).toLocaleString('fr-FR')} FCFA` },
                { icon: <Calendar size={14} />, label: 'Date',         value: fmtDate(selected.date_creation ?? selected.date) },
                { icon: <Truck size={14} />,    label: 'Livreur',      value: selected.livreur_nom ?? selected.livreur_details?.first_name ?? '—' },
                { icon: <Package size={14} />,  label: 'Code promo',   value: selected.code_promo_utilise ?? selected.code_promo ?? '—' },
              ].map(row => (
                <div key={row.label} className="bg-white/5 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-foreground/40 mb-0.5 flex items-center gap-1">{row.icon}{row.label}</p>
                  <p className="text-sm font-medium text-foreground">{row.value}</p>
                </div>
              ))}
            </div>

            {/* Delivery address */}
            {(selected.livraison_ville || selected.adresse_livraison) && (
              <div className="mb-5 bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-3">
                <p className="text-xs text-foreground/40 mb-1 flex items-center gap-1"><MapPin size={12} /> Adresse de livraison</p>
                <p className="text-sm text-foreground font-medium">
                  {[selected.livraison_quartier, selected.livraison_ville].filter(Boolean).join(', ') || selected.adresse_livraison || '—'}
                </p>
              </div>
            )}

            {/* Order lines */}
            {(selected.lignes_parfums?.length > 0 || selected.lignes_accessoires?.length > 0) && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-foreground/40 uppercase mb-2">Articles</p>
                <div className="space-y-1.5">
                  {[
                    ...(selected.lignes_parfums ?? []),
                    ...(selected.lignes_accessoires ?? []),
                    ...(selected.lignes_produit_fini_essence ?? []),
                    ...(selected.lignes_parfums_perso ?? []),
                    ...(selected.lignes_essence_personnalisee ?? []),
                  ].map((l: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs bg-white/5 rounded-lg px-3 py-2">
                      <span className="text-foreground">{l.produit_details?.nom ?? l.parfum_details?.nom ?? l.accessoire_details?.nom ?? `Article #${i + 1}`}</span>
                      <span className="text-foreground/60">{l.quantite} × {Number(l.prix_unitaire ?? 0).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(selected.facture || selected.statut_paiement === 'payé') && (
              <div className="mb-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-widest">
                    <FileText size={14} /> Reçu / Facture PDF
                  </div>
                  {selected.facture?.envoye_par_email && (
                    <span className="text-[10px] text-emerald-400/70 flex items-center gap-1">
                      <Mail size={11} /> Envoyé par email
                    </span>
                  )}
                </div>
                {selected.facture?.numero_facture && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 rounded-xl px-3 py-2">
                      <p className="text-[10px] text-foreground/40 mb-0.5">N° Facture</p>
                      <p className="text-xs font-mono font-semibold text-foreground">{selected.facture.numero_facture}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl px-3 py-2">
                      <p className="text-[10px] text-foreground/40 mb-0.5">Date d'émission</p>
                      <p className="text-xs font-medium text-foreground">{fmtDate(selected.facture.date_emission)}</p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selected.facture?.fichier_pdf && (
                    <a
                      href={selected.facture.fichier_pdf}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2.5 text-sm font-semibold text-foreground transition-colors"
                    >
                      <FileText size={15} /> Ouvrir le PDF
                    </a>
                  )}
                  <button
                    onClick={() => openInvoice(selected)}
                    disabled={downloadingInvoice}
                    className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {downloadingInvoice ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                    Télécharger le PDF
                  </button>
                </div>
              </div>
            )}

            {/* Actions inside modal */}
            <div className="flex gap-3">
              {isPending(selected) && (
                <button
                  onClick={() => { setSelected(null); handleValidateClick(selected); }}
                  className="flex-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl py-2.5 text-sm font-semibold hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={15} /> Valider
                </button>
              )}
              {isCancellable(selected) && (
                <button
                  onClick={() => { setSelected(null); handleCancel(selected); }}
                  className="flex-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl py-2.5 text-sm font-semibold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle size={15} /> Annuler
                </button>
              )}
              <button
                onClick={() => setSelected(null)}
                className="flex-1 border border-white/10 rounded-xl py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Validation modal (delivery orders) ───────────────────────────────── */}
      {validationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-md shadow-sm border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-foreground">Valider la commande</h3>
                <p className="text-sm text-foreground/40">
                  {validationModal.numero_commande ?? `#${String(validationModal.id).padStart(5, '0')}`}
                </p>
              </div>
              <button
                onClick={() => setValidationModal(null)}
                className="p-2 rounded-xl hover:bg-white/5 text-foreground/40 hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-3 mb-5 flex items-start gap-3">
              <Truck size={16} className="text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-400">Commande en livraison</p>
                <p className="text-xs text-foreground/40 mt-0.5">
                  Assignez un livreur et définissez une date estimée (optionnel).
                </p>
              </div>
            </div>

            {/* Driver select */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-foreground/60 mb-1.5">Livreur</label>
              <select
                value={valDriverId}
                onChange={e => setValDriverId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold transition-colors"
              >
                <option value="" className="bg-background">Choisir un livreur (optionnel)...</option>
                {drivers.map(d => {
                  const name = d.name ?? d.user_details?.first_name ?? d.first_name ?? `Livreur #${d.id}`;
                  const id   = d.user_id ?? d.id;
                  return <option key={id} value={id} className="bg-background">{name}</option>;
                })}
              </select>
            </div>

            {/* Estimated date */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-foreground/60 mb-1.5">Date de livraison estimée</label>
              <input
                type="date"
                value={valDateEst}
                onChange={e => setValDateEst(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold transition-colors"
              />
            </div>

            {!valDriverId && (
              <p className="text-xs text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2 mb-4">
                Sans livreur assigné, la commande sera validée et mise en attente d'affectation.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setValidationModal(null)}
                className="flex-1 border border-white/10 rounded-xl py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmValidation}
                disabled={saving}
                className="flex-1 bg-gold text-black rounded-xl py-2.5 text-sm font-semibold hover:bg-gold/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
