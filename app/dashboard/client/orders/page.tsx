'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Package, Truck, CheckCircle, Clock, XCircle, Loader2,
  RefreshCw, MapPin, Phone, Tag, Calendar, User, ChevronLeft, X,
  Download, FileText, Mail,
} from 'lucide-react';
import { orderService } from '@/services/apiService';
import { invoiceService } from '@/services/invoiceService';
import { useToastStore } from '@/store/useToastStore';
import { useRouter } from 'next/navigation';
import type { BackendOrder } from '@/types';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUT_CFG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  en_attente:   { label: 'En attente de validation', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',      icon: <Clock size={12} /> },
  'validé':     { label: 'Validée',                  color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',          icon: <CheckCircle size={12} /> },
  'annulée':    { label: 'Annulée',                  color: 'text-red-400 bg-red-500/10 border-red-500/20',             icon: <XCircle size={12} /> },
  'remboursée': { label: 'Remboursée',               color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',   icon: <Package size={12} /> },
};

const LIVRAISON_CFG: Record<string, { label: string; color: string }> = {
  en_attente_affectation: { label: 'En attente d\'un livreur', color: 'text-amber-400 bg-amber-500/10' },
  'assignée':             { label: 'Livreur assigné',          color: 'text-blue-400 bg-blue-500/10'   },
  'livrée':               { label: 'Livrée',                   color: 'text-emerald-400 bg-emerald-500/10' },
  'échouée':              { label: 'Livraison échouée',        color: 'text-red-400 bg-red-500/10'     },
};

const STATUS_TABS = [
  { value: 'all',         label: 'Toutes'    },
  { value: 'en_attente',  label: 'En attente'},
  { value: 'validé',      label: 'Validées'  },
  { value: 'annulée',     label: 'Annulées'  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function allLines(o: BackendOrder) {
  return [
    ...(o.lignes_parfums ?? []),
    ...(o.lignes_accessoires ?? []),
    ...(o.lignes_produit_fini_essence ?? []),
    ...(o.lignes_parfums_perso ?? []),
    ...(o.lignes_essence_personnalisee ?? []),
  ];
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClientOrdersPage() {
  const router = useRouter();
  const { addToast } = useToastStore();

  const [orders, setOrders]   = useState<BackendOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('all');
  const [selected, setSelected] = useState<BackendOrder | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  // ── fetch with real-time polling every 15s ───────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrders({ page: 1 });
      const list = (data?.results ?? data?.resultats ?? (Array.isArray(data) ? data : [])) as BackendOrder[];
      setOrders(list);
    } catch (err: any) {
      addToast('Erreur lors du chargement de vos commandes', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15_000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // ── invoice download ──────────────────────────────────────────────────────
  const handleDownloadInvoice = async (order: BackendOrder) => {
    const num = order.numero_commande ?? String(order.id);
    setDownloadingInvoice(true);
    try {
      await invoiceService.downloadInvoiceFile(num, `facture-${num}.pdf`);
      addToast('Facture téléchargée avec succès', 'success');
    } catch {
      addToast('Facture non disponible pour cette commande', 'error');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  // ── helpers ──────────────────────────────────────────────────────────────
  const getStatut = (o: BackendOrder) => o.statut ?? 'en_attente';
  const getCfg = (o: BackendOrder) =>
    STATUT_CFG[getStatut(o)] ?? { label: getStatut(o), color: 'text-foreground/40 bg-white/5 border-white/10', icon: <Package size={12} /> };

  const filtered = tab === 'all'
    ? orders
    : orders.filter(o => getStatut(o) === tab);

  // ── delivery progress steps ───────────────────────────────────────────────
  const getDeliveryStep = (o: BackendOrder): number => {
    if (getStatut(o) === 'annulée') return -1;
    if (o.statut_livraison === 'livrée') return 3;
    if (o.statut_livraison === 'assignée') return 2;
    if (getStatut(o) === 'validé') return 1;
    return 0;
  };

  const deliverySteps = [
    { label: 'Commande reçue',       icon: <Package size={14} /> },
    { label: 'Validée',              icon: <CheckCircle size={14} /> },
    { label: 'En route',             icon: <Truck size={14} /> },
    { label: 'Livrée',               icon: <CheckCircle size={14} /> },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-white/5 text-foreground/40 hover:text-foreground transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mes Commandes</h1>
            <p className="text-sm text-foreground/40 mt-0.5">Suivez l'état de vos commandes en temps réel</p>
          </div>
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
        {[
          { label: 'Total',      value: orders.length,                                                         color: 'text-foreground', bg: 'bg-white/5' },
          { label: 'En attente', value: orders.filter(o => getStatut(o) === 'en_attente').length,              color: 'text-amber-400',  bg: 'bg-amber-500/10' },
          { label: 'Validées',   value: orders.filter(o => getStatut(o) === 'validé').length,                  color: 'text-blue-400',   bg: 'bg-blue-500/10' },
          { label: 'Annulées',   value: orders.filter(o => getStatut(o) === 'annulée').length,                 color: 'text-red-400',    bg: 'bg-red-500/10' },
        ].map(k => (
          <div key={k.label} className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-sm">
            <p className="text-xs text-foreground/40 mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === t.value ? 'bg-gold text-black' : 'border border-white/10 text-foreground/40 hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-gold gap-3">
          <Loader2 className="animate-spin" size={32} />
          <p className="text-sm">Chargement de vos commandes...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white/5 rounded-2xl border border-white/10">
          <Package size={48} className="text-foreground/10 mb-4" />
          <p className="text-foreground font-semibold">Aucune commande</p>
          <p className="text-sm text-foreground/40 mt-1">Vous n'avez pas encore de commandes dans cette catégorie</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => {
            const cfg  = getCfg(order);
            const step = getDeliveryStep(order);
            const lines = allLines(order);
            const hasDelivery = !!(order.livraison_ville?.trim() || order.livraison_quartier?.trim());
            const delivCfg = LIVRAISON_CFG[order.statut_livraison ?? ''];

            return (
              <div
                key={order.id}
                onClick={() => setSelected(order)}
                className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm hover:border-gold/20 hover:bg-white/[0.07] transition-all cursor-pointer group"
              >
                {/* Row top */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
                      <Package size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-foreground font-mono group-hover:text-gold transition-colors">
                        {order.numero_commande ?? `CMD-${String(order.id).padStart(6, '0')}`}
                      </p>
                      <p className="text-xs text-foreground/40">{fmtDate(order.date_creation)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold text-foreground">
                      {Number(order.total_ttc ?? 0).toLocaleString('fr-FR')} FCFA
                    </p>
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                      {cfg.icon}{cfg.label}
                    </span>
                  </div>
                </div>

                {/* Items preview */}
                {lines.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-4">
                    {lines.slice(0, 3).map((l: any, i: number) => (
                      <span key={i} className="text-xs bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-foreground/60">
                        {l.produit_details?.nom ?? l.parfum_details?.nom ?? l.accessoire_details?.nom ?? `Article #${i + 1}`}
                        {l.quantite > 1 && <span className="text-foreground/40 ml-1">×{l.quantite}</span>}
                      </span>
                    ))}
                    {lines.length > 3 && (
                      <span className="text-xs bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-foreground/40">
                        +{lines.length - 3} autre{lines.length - 3 > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}

                {/* Delivery progress bar */}
                {hasDelivery && step >= 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-2">
                      {deliverySteps.map((s, i) => (
                        <div key={i} className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-all ${
                            i <= step ? 'bg-gold text-black' : 'bg-white/10 text-foreground/30'
                          }`}>
                            {s.icon}
                          </div>
                          {i < deliverySteps.length - 1 && (
                            <div className="absolute" />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="relative h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gold rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(0, (step / (deliverySteps.length - 1)) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      {deliverySteps.map((s, i) => (
                        <p key={i} className={`text-[9px] ${i <= step ? 'text-gold' : 'text-foreground/30'}`}>
                          {s.label}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {delivCfg && (
                  <div className="mt-3 flex items-center gap-2">
                    <Truck size={12} className="text-foreground/40" />
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${delivCfg.color}`}>{delivCfg.label}</span>
                    {order.livreur_nom && (
                      <span className="text-xs text-foreground/40">· {order.livreur_nom}</span>
                    )}
                  </div>
                )}

                <p className="text-xs text-foreground/30 mt-3 text-right">Cliquer pour voir les détails →</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Detail modal ──────────────────────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl w-full max-w-lg shadow-sm border border-white/10 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-background border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="font-bold text-foreground text-lg">
                  {selected.numero_commande ?? `CMD-${String(selected.id).padStart(6, '0')}`}
                </h3>
                <p className="text-xs text-foreground/40">{fmtDateTime(selected.date_creation)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-white/5 text-foreground/40 hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Status */}
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${getCfg(selected).color}`}>
                  {getCfg(selected).icon}{getCfg(selected).label}
                </span>
                {selected.statut_livraison && LIVRAISON_CFG[selected.statut_livraison] && (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${LIVRAISON_CFG[selected.statut_livraison].color}`}>
                    {LIVRAISON_CFG[selected.statut_livraison].label}
                  </span>
                )}
              </div>

              {/* Delivery progress */}
              {!!(selected.livraison_ville || selected.livraison_quartier) && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-blue-400 mb-4 flex items-center gap-2">
                    <Truck size={13} /> Suivi de livraison
                  </p>
                  <div className="relative">
                    <div className="absolute top-3 left-3 bottom-3 w-0.5 bg-white/10" />
                    {deliverySteps.map((s, i) => {
                      const step = getDeliveryStep(selected);
                      const done = i <= step;
                      return (
                        <div key={i} className="relative flex items-start gap-4 pb-4 last:pb-0">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                            done ? 'bg-gold text-black' : 'bg-white/10 text-foreground/30'
                          }`}>
                            {s.icon}
                          </div>
                          <div className="pt-0.5">
                            <p className={`text-sm font-medium ${done ? 'text-foreground' : 'text-foreground/30'}`}>{s.label}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Order info */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Tag size={13} />,      label: 'Montant total',    value: `${Number(selected.total_ttc ?? 0).toLocaleString('fr-FR')} FCFA` },
                  { icon: <Calendar size={13} />, label: 'Date de commande', value: fmtDate(selected.date_creation) },
                  { icon: <Truck size={13} />,    label: 'Livreur',          value: selected.livreur_nom ?? '—' },
                  { icon: <Phone size={13} />,    label: 'Téléphone livraison', value: selected.livraison_telephone ?? '—' },
                ].map(row => (
                  <div key={row.label} className="bg-white/5 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] text-foreground/40 mb-0.5 flex items-center gap-1">{row.icon}{row.label}</p>
                    <p className="text-sm font-medium text-foreground">{row.value}</p>
                  </div>
                ))}
              </div>

              {/* Delivery address */}
              {(selected.livraison_ville || selected.livraison_quartier) && (
                <div className="bg-white/5 rounded-xl px-4 py-3">
                  <p className="text-xs text-foreground/40 mb-1.5 flex items-center gap-1"><MapPin size={12} /> Adresse de livraison</p>
                  <p className="text-sm text-foreground font-medium">
                    {[selected.livraison_nom_complet, selected.livraison_quartier, selected.livraison_ville]
                      .filter(Boolean).join(', ')}
                  </p>
                  {selected.livraison_telephone && (
                    <p className="text-xs text-foreground/40 mt-1 flex items-center gap-1">
                      <Phone size={10} /> {selected.livraison_telephone}
                    </p>
                  )}
                </div>
              )}

              {/* Estimated delivery date */}
              {selected.date_livraison_estimee && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
                  <Calendar size={16} className="text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs text-foreground/40">Livraison estimée</p>
                    <p className="text-sm font-semibold text-emerald-400">{fmtDate(selected.date_livraison_estimee)}</p>
                  </div>
                </div>
              )}

              {/* Promo code */}
              {selected.code_promo_utilise && (
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-gold" />
                  <span className="text-xs font-mono bg-gold/10 text-gold px-2 py-1 rounded">
                    {selected.code_promo_utilise}
                  </span>
                  {Number(selected.remise_code_promo) > 0 && (
                    <span className="text-xs text-foreground/40">
                      — {Number(selected.remise_code_promo).toLocaleString('fr-FR')} FCFA de remise
                    </span>
                  )}
                </div>
              )}

              {/* Articles */}
              {allLines(selected).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground/40 uppercase mb-2">Articles commandés</p>
                  <div className="space-y-2">
                    {allLines(selected).map((l: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-white/5 rounded-xl px-4 py-2.5">
                        <span className="text-sm text-foreground">
                          {l.produit_details?.nom ?? l.parfum_details?.nom ?? l.accessoire_details?.nom ?? `Article #${i + 1}`}
                        </span>
                        <div className="text-right">
                          <p className="text-xs text-foreground/40">×{l.quantite}</p>
                          <p className="text-sm font-semibold text-foreground">
                            {Number((l.quantite ?? 1) * (l.prix_unitaire ?? 0)).toLocaleString('fr-FR')} FCFA
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Note client */}
              {selected.note_client && (
                <div className="bg-white/5 rounded-xl px-4 py-3">
                  <p className="text-xs text-foreground/40 mb-1">Votre note</p>
                  <p className="text-sm text-foreground">{selected.note_client}</p>
                </div>
              )}

              {/* ── Reçu / Facture PDF ───────────────────────────────── */}
              {(selected as any).facture ? (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl px-4 py-4 space-y-3">
                  <p className="text-xs font-semibold text-emerald-400 flex items-center gap-2">
                    <FileText size={14} /> Reçu de paiement
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 rounded-xl px-3 py-2">
                      <p className="text-[10px] text-foreground/40 mb-0.5">N° Facture</p>
                      <p className="text-xs font-mono font-semibold text-foreground">
                        {(selected as any).facture.numero_facture}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-xl px-3 py-2">
                      <p className="text-[10px] text-foreground/40 mb-0.5">Date d'émission</p>
                      <p className="text-xs font-medium text-foreground">
                        {fmtDate((selected as any).facture.date_emission)}
                      </p>
                    </div>
                  </div>
                  {(selected as any).facture.envoye_par_email && (
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/70">
                      <Mail size={11} /> Envoyée par email
                    </div>
                  )}
                  <button
                    onClick={() => handleDownloadInvoice(selected)}
                    disabled={downloadingInvoice}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {downloadingInvoice ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                    Télécharger la facture PDF
                  </button>
                </div>
              ) : selected.statut_paiement === 'payé' ? (
                /* If order is paid but no facture object yet, offer direct download */
                <button
                  onClick={() => handleDownloadInvoice(selected)}
                  disabled={downloadingInvoice}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {downloadingInvoice ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                  Télécharger la facture PDF
                </button>
              ) : null}

              <button
                onClick={() => setSelected(null)}
                className="w-full border border-white/10 rounded-xl py-3 text-sm text-foreground/60 hover:bg-white/5 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
