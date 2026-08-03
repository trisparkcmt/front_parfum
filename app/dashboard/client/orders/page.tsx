'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Eye, CheckCircle, Truck, XCircle, Loader2, RefreshCw,
  ChevronLeft, ChevronRight, X, Package, Bike, CreditCard,
  MapPin, Phone, Calendar, Tag, ClipboardList, AlertTriangle,
  SlidersHorizontal, Download, FileText, Mail, ChevronDown,
} from 'lucide-react';
import { orderService, adminService } from '@/services/apiService';
import { invoiceService } from '@/services/invoiceService';
import { useToastStore } from '@/store/useToastStore';
import type { BackendOrder, BackendOrderLine } from '@/types';
import { useOptimisticOrders } from '@/hooks/useOptimisticOrders';

// ─────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────

const STATUT_CFG: Record<string, { label: string; color: string; dot: string }> = {
  en_attente:   { label: 'En attente',  color: 'text-amber-400 bg-amber-500/10 ring-amber-500/20',   dot: 'bg-amber-400'   },
  'validé':     { label: 'Validé',      color: 'text-blue-400 bg-blue-500/10 ring-blue-500/20',       dot: 'bg-blue-400'    },
  'annulée':    { label: 'Annulée',     color: 'text-red-400 bg-red-500/10 ring-red-500/20',          dot: 'bg-red-400'     },
  'remboursée': { label: 'Remboursée',  color: 'text-purple-400 bg-purple-500/10 ring-purple-500/20', dot: 'bg-purple-400'  },
};

const STATUT_LIVRAISON_CFG: Record<string, { label: string; color: string; dot: string }> = {
  en_attente_affectation: { label: 'Non assignée', color: 'text-amber-400 bg-amber-500/10 ring-amber-500/20',    dot: 'bg-amber-400'   },
  'assignée':              { label: 'Assignée',      color: 'text-blue-400 bg-blue-500/10 ring-blue-500/20',      dot: 'bg-blue-400'    },
  'livrée':                { label: 'Livrée',        color: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20', dot: 'bg-emerald-400' },
  'échouée':               { label: 'Échouée',       color: 'text-red-400 bg-red-500/10 ring-red-500/20',         dot: 'bg-red-400'     },
};

const STATUT_PAIEMENT_CFG: Record<string, { label: string; color: string; dot: string }> = {
  en_attente: { label: 'En attente', color: 'text-amber-400 bg-amber-500/10 ring-amber-500/20',    dot: 'bg-amber-400'   },
  'payé':     { label: 'Payé',       color: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20', dot: 'bg-emerald-400' },
  'échoué':   { label: 'Échoué',     color: 'text-red-400 bg-red-500/10 ring-red-500/20',          dot: 'bg-red-400'     },
};

const STATUT_OPTIONS    = ['', 'en_attente', 'validé', 'annulée', 'remboursée'];
const LIVRAISON_OPTIONS = ['', 'en_attente_affectation', 'assignée', 'livrée', 'échouée'];
const PAIEMENT_OPTIONS  = ['', 'en_attente', 'payé', 'échoué'];

const PAGE_SIZE = 100;
const ROWS_PER_TABLE = 10;

// ─────────────────────────────────────────────────────────────────────────
// Small primitives
// ─────────────────────────────────────────────────────────────────────────

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
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
  return order.livreur ? 'Livraison' : 'Retrait boutique';
}

function driverDisplayName(d: any): string {
  return d.user_details?.first_name
    ? `${d.user_details.first_name} ${d.user_details.last_name ?? ''}`.trim()
    : d.name ?? `Livreur #${d.id}`;
}

/** Dot + label chip used for every status everywhere on the page. */
function StatusChip({ cfg, label }: { cfg?: { label: string; color: string; dot: string }; label?: string }) {
  if (!cfg) return <span className="text-xs text-foreground/25">—</span>;
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset', cfg.color)}>
      <span className={cx('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      {label ?? cfg.label}
    </span>
  );
}

/** Compact segmented control used for status pickers in edit forms. */
function SegmentedPicker<T extends string>({
  value, onChange, options, cfg,
}: {
  value: T;
  onChange: (v: T) => void;
  options: T[];
  cfg: Record<string, { label: string }>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(v => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cx(
            'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
            value === v
              ? 'border-gold/40 bg-gold/15 text-gold'
              : 'border-white/10 text-foreground/50 hover:border-white/20 hover:text-foreground/80'
          )}
        >
          {cfg[v]?.label ?? v}
        </button>
      ))}
    </div>
  );
}

function IconButton({
  icon, title, onClick, tone = 'default',
}: { icon: React.ReactNode; title: string; onClick: () => void; tone?: 'default' | 'blue' | 'gold' }) {
  const tones = {
    default: 'text-foreground/45 hover:text-foreground hover:bg-white/10',
    blue: 'text-foreground/45 hover:text-blue-400 hover:bg-blue-500/10',
    gold: 'text-foreground/45 hover:text-gold hover:bg-gold/10',
  } as const;
  return (
    <button title={title} onClick={onClick} className={cx('rounded-lg p-2 transition-colors sm:p-1.5', tones[tone])}>
      {icon}
    </button>
  );
}

function ActionButton({
  children, onClick, tone = 'neutral', icon,
}: { children: React.ReactNode; onClick: () => void; tone?: 'emerald' | 'red' | 'blue' | 'purple' | 'neutral'; icon?: React.ReactNode }) {
  const tones = {
    emerald: 'bg-emerald-500/90 hover:bg-emerald-500 text-black',
    red: 'bg-red-500/90 hover:bg-red-500 text-white',
    blue: 'bg-blue-500/90 hover:bg-blue-500 text-white',
    purple: 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 ring-1 ring-inset ring-purple-500/25',
    neutral: 'border border-white/10 text-foreground/60 hover:bg-white/6',
  } as const;
  return (
    <button
      onClick={onClick}
      className={cx('inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors', tones[tone])}
    >
      {icon}
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Modal shell — used by all popups
// ─────────────────────────────────────────────────────────────────────────

function OrderPopupModal({
  isOpen, onClose, title, subtitle, eyebrow, children, size = '2xl', footer,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: string;
  eyebrow?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (mainEl) mainEl.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      if (mainEl) mainEl.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      if (mainEl) mainEl.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-lg', xl: 'sm:max-w-2xl', '2xl': 'sm:max-w-3xl', '3xl': 'sm:max-w-5xl',
  } as const;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div
        className={cx('flex h-full max-h-full w-full flex-col overflow-hidden rounded-none border-0 bg-background sm:h-auto sm:max-h-[88vh] sm:rounded-xl sm:border sm:border-white/10', sizes[size])}
        onClick={e => e.stopPropagation()}
      >
        {(title || eyebrow) && (
          <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-4 border-b border-white/10 bg-background px-4 py-3.5 sm:px-6 sm:py-4">
            <div className="min-w-0">
              {eyebrow && <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground/35">{eyebrow}</p>}
              {title && <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[15px] font-semibold text-foreground">{title}</div>}
              {subtitle && <p className="mt-0.5 text-xs text-foreground/40">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="shrink-0 rounded-lg p-2 text-foreground/40 transition-colors hover:bg-white/8 hover:text-foreground sm:p-1.5">
              <X size={16} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">{children}</div>
        {footer && <div className="sticky bottom-0 z-10 shrink-0 border-t border-white/10 bg-background px-4 py-3.5 sm:px-6 sm:py-4">{footer}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch]             = useState('');
  const [nomFilter, setNomFilter]       = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [livraisonFilter, setLivraisonFilter] = useState('');
  const [paiementFilter, setPaiementFilter]   = useState('');
  const [showFilters, setShowFilters]   = useState(false);

  const [selected, setSelected]               = useState<BackendOrder | null>(null);
  const [editModal, setEditModal]             = useState<BackendOrder | null>(null);
  const [validationModal, setValidationModal] = useState<BackendOrder | null>(null);

  const [drivers, setDrivers] = useState<any[]>([]);

  const [editStatut, setEditStatut]       = useState<'en_attente' | 'validé' | 'annulée' | 'remboursée' | ''>('');
  const [editLivraison, setEditLivraison] = useState<'en_attente_affectation' | 'assignée' | 'livrée' | 'échouée' | ''>('');
  const [editPaiement, setEditPaiement]   = useState<'en_attente' | 'payé' | 'échoué' | ''>('');
  const [editLivreur, setEditLivreur]     = useState('');
  const [editDateEst, setEditDateEst]     = useState('');
  const [editNote, setEditNote]           = useState('');
  const [editFrais, setEditFrais]         = useState('');
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [valDriverId, setValDriverId]     = useState('');
  const [valDateEst, setValDateEst]       = useState('');

  const [ongoingPage, setOngoingPage]     = useState(1);
  const [completedPage, setCompletedPage] = useState(1);

  const { addToast } = useToastStore();
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { runOptimisticUpdate, pendingIds } = useOptimisticOrders(setOrders, addToast);

  const fetchOrders = useCallback(async (pg = page) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page: pg };
      if (statutFilter)    params.statut = statutFilter;
      if (livraisonFilter) params.statut_livraison = livraisonFilter;
      if (paiementFilter)  params.statut_paiement = paiementFilter;
      if (nomFilter)       params.nom = nomFilter;
      if (search)          params.search = search;

      const data = await orderService.getOrders(params);
      const list = data.results ?? data.resultats ?? (Array.isArray(data) ? data : []);
      setOrders(list);
      setTotal(data.count ?? list.length);
      setOngoingPage(1);
      setCompletedPage(1);
    } catch {
      addToast('Erreur lors du chargement des commandes', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, statutFilter, livraisonFilter, paiementFilter, nomFilter, search, addToast]);

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => { setPage(1); fetchOrders(1); }, 400);
    return () => { if (searchRef.current) clearTimeout(searchRef.current); };
  }, [search, nomFilter, statutFilter, livraisonFilter, paiementFilter]); // eslint-disable-line

  useEffect(() => { fetchOrders(page); }, [page]); // eslint-disable-line

  useEffect(() => {
    adminService.getDeliveryDrivers()
      .then(d => setDrivers(d.results ?? d.resultats ?? (Array.isArray(d) ? d : [])))
      .catch(() => {});
  }, []);

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

  const handleSave = async () => {
    if (!editModal) return;
    const order = editModal;

    const payload: Record<string, any> = {
      statut: editStatut,
      statut_livraison: editLivraison,
      statut_paiement: editPaiement,
      note_interne: editNote,
    };
    if (editLivreur) payload.livreur = Number(editLivreur);
    if (editDateEst) payload.date_livraison_estimee = editDateEst;
    if (editFrais)   payload.frais_livraison = parseFloat(editFrais);

    const driverObj = editLivreur ? drivers.find(d => String(d.id ?? d.user_id) === editLivreur) : null;

    setEditModal(null);

    await runOptimisticUpdate({
      orderId: order.id,
      patch: {
        statut: editStatut as any,
        statut_livraison: editLivraison as any,
        statut_paiement: editPaiement as any,
        note_interne: editNote,
        ...(driverObj ? { livreur: Number(editLivreur), livreur_nom: driverDisplayName(driverObj) } : {}),
        ...(editDateEst ? { date_livraison_estimee: editDateEst } : {}),
        ...(editFrais ? { frais_livraison: editFrais } : {}),
      },
      apiCall: () => orderService.updateOrder(order.numero_commande, payload),
      successMessage: 'Commande mise à jour avec succès',
      errorMessage: 'Erreur lors de la mise à jour',
    });
  };

  const handleDownloadInvoice = async (order: BackendOrder) => {
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

  const openInvoice = async (order: BackendOrder) => {
    if (order.facture?.fichier_pdf) {
      window.open(order.facture.fichier_pdf, '_blank');
      return;
    }
    await handleDownloadInvoice(order);
  };

  const handleCancel = async (order: BackendOrder) => {
    if (!confirm(`Annuler la commande ${order.numero_commande} ?`)) return;
    await runOptimisticUpdate({
      orderId: order.id,
      patch: { statut: 'annulée' },
      apiCall: () => orderService.cancelOrder(order.numero_commande),
      successMessage: 'Commande annulée',
      errorMessage: "Erreur lors de l'annulation",
    });
  };

  const handleValidateClick = async (order: BackendOrder) => {
    const isDelivery = !!order.livraison_ville && order.livraison_ville.trim() !== '';
    if (isDelivery) {
      setValidationModal(order);
      setValDriverId(order.livreur != null ? String(order.livreur) : '');
      setValDateEst(order.date_livraison_estimee ?? '');
      return;
    }
    if (!confirm(`Valider la commande pickup ${order.numero_commande} ?`)) return;
    await runOptimisticUpdate({
      orderId: order.id,
      patch: { statut: 'validé', statut_livraison: 'en_attente_affectation' },
      apiCall: () => orderService.updateOrder(order.numero_commande, {
        statut: 'validé', statut_livraison: 'en_attente_affectation',
      }),
      successMessage: 'Commande pickup validée avec succès',
      errorMessage: 'Erreur lors de la validation',
    });
  };

  const handleConfirmValidation = async () => {
    if (!validationModal) return;
    const order = validationModal;

    const payload: Record<string, any> = {
      statut: 'validé',
      statut_livraison: valDriverId ? 'assignée' : 'en_attente_affectation',
    };
    if (valDriverId) payload.livreur = Number(valDriverId);
    if (valDateEst)  payload.date_livraison_estimee = valDateEst;

    const driverObj = valDriverId ? drivers.find(d => String(d.id ?? d.user_id) === valDriverId) : null;

    setValidationModal(null);

    await runOptimisticUpdate({
      orderId: order.id,
      patch: {
        statut: 'validé',
        statut_livraison: valDriverId ? 'assignée' : 'en_attente_affectation',
        ...(driverObj ? { livreur: Number(valDriverId), livreur_nom: driverDisplayName(driverObj) } : {}),
        ...(valDateEst ? { date_livraison_estimee: valDateEst } : {}),
      },
      apiCall: () => orderService.updateOrder(order.numero_commande, payload),
      successMessage: 'Commande validée et livreur assigné',
      errorMessage: 'Erreur lors de la validation',
    });
  };

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  const kpi = [
    { label: 'Total',      value: total,                                                 color: 'text-foreground' },
    { label: 'En attente', value: orders.filter(o => o.statut === 'en_attente').length,  color: 'text-amber-400'  },
    { label: 'Validées',   value: orders.filter(o => o.statut === 'validé').length,      color: 'text-blue-400'   },
    { label: 'Payées',     value: orders.filter(o => o.statut_paiement === 'payé').length, color: 'text-emerald-400' },
    { label: 'Annulées',   value: orders.filter(o => o.statut === 'annulée').length,     color: 'text-red-400'    },
  ];

  const isCancellable = (o: BackendOrder) => o.statut === 'en_attente' || o.statut === 'validé';

  const handleMarkDelivered = async (order: BackendOrder) => {
    if (!confirm(`Marquer la commande ${order.numero_commande} comme livrée (et payée) ?`)) return;
    await runOptimisticUpdate({
      orderId: order.id,
      patch: { statut_livraison: 'livrée', statut_paiement: 'payé' },
      apiCall: () => orderService.updateOrder(order.numero_commande, {
        statut_livraison: 'livrée', statut_paiement: 'payé',
      }),
      successMessage: 'Commande marquée comme livrée et payée',
      errorMessage: 'Erreur lors de la mise à jour de la livraison',
    });
  };

  const handleRefund = async (order: BackendOrder) => {
    if (!confirm(`Rembourser la commande ${order.numero_commande} ?`)) return;
    await runOptimisticUpdate({
      orderId: order.id,
      patch: { statut: 'remboursée', statut_paiement: 'échoué' },
      apiCall: () => orderService.updateOrder(order.numero_commande, {
        statut: 'remboursée', statut_paiement: 'échoué',
      }),
      successMessage: 'Commande marquée comme remboursée',
      errorMessage: 'Erreur lors du remboursement',
    });
  };

  const ongoingOrders   = orders.filter(o => o.statut !== 'remboursée' && o.statut_livraison !== 'livrée' && o.statut !== 'annulée');
  const completedOrders = orders.filter(o => o.statut === 'remboursée' || o.statut_livraison === 'livrée' || o.statut === 'annulée');

  const ongoingTotalPages   = Math.max(1, Math.ceil(ongoingOrders.length / ROWS_PER_TABLE));
  const completedTotalPages = Math.max(1, Math.ceil(completedOrders.length / ROWS_PER_TABLE));

  useEffect(() => { if (ongoingPage > ongoingTotalPages) setOngoingPage(ongoingTotalPages); }, [ongoingTotalPages, ongoingPage]);
  useEffect(() => { if (completedPage > completedTotalPages) setCompletedPage(completedTotalPages); }, [completedTotalPages, completedPage]);

  const visibleOngoingOrders   = ongoingOrders.slice((ongoingPage - 1) * ROWS_PER_TABLE, ongoingPage * ROWS_PER_TABLE);
  const visibleCompletedOrders = completedOrders.slice((completedPage - 1) * ROWS_PER_TABLE, completedPage * ROWS_PER_TABLE);

  const activeFilterCount = [statutFilter, livraisonFilter, paiementFilter].filter(Boolean).length;

  return (
    <div className="space-y-6">

      {/* Header ------------------------------------------------------------ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Commandes</h1>
          <p className="mt-0.5 text-sm text-foreground/40">
            {total.toLocaleString()} commande{total > 1 ? 's' : ''} au total
          </p>
        </div>
        <button
          onClick={() => fetchOrders(page)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3.5 py-2 text-sm text-foreground/60 transition-colors hover:bg-white/6 hover:text-foreground"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* KPI strip ----------------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-3 sm:flex sm:divide-x sm:divide-white/8 sm:gap-0 overflow-hidden rounded-xl sm:border sm:border-white/10 sm:bg-white/[0.03]">
        {kpi.map(k => (
          <div key={k.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 sm:flex-1 sm:rounded-none sm:border-none sm:bg-transparent sm:px-5 sm:py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{k.label}</p>
            <p className={cx('mt-1 text-xl font-semibold tabular-nums', k.color)}>{k.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Toolbar --------------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 sm:w-auto sm:min-w-[240px] sm:flex-1">
            <Search size={14} className="shrink-0 text-foreground/35" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="N° commande, e-mail, téléphone…"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/35"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-foreground/30 hover:text-foreground/60">
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2.5 sm:flex-nowrap">
            <div className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 sm:w-56">
              <input
                value={nomFilter}
                onChange={e => setNomFilter(e.target.value)}
                placeholder="Nom client"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/35"
              />
            </div>

            <button
              onClick={() => setShowFilters(s => !s)}
              className={cx(
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors',
                showFilters || activeFilterCount
                  ? 'border-gold/30 bg-gold/10 text-gold'
                  : 'border-white/10 text-foreground/55 hover:bg-white/6'
              )}
            >
              <SlidersHorizontal size={14} />
              Filtres
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-gold/25 px-1.5 text-[10px] font-bold text-gold">{activeFilterCount}</span>
              )}
              <ChevronDown size={13} className={cx('transition-transform', showFilters && 'rotate-180')} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:grid-cols-3">
            <FilterGroup
              label="Statut commande"
              options={STATUT_OPTIONS}
              value={statutFilter}
              onChange={v => { setStatutFilter(v); setPage(1); }}
              cfg={STATUT_CFG}
            />
            <FilterGroup
              label="Statut livraison"
              options={LIVRAISON_OPTIONS}
              value={livraisonFilter}
              onChange={v => { setLivraisonFilter(v); setPage(1); }}
              cfg={STATUT_LIVRAISON_CFG}
            />
            <FilterGroup
              label="Paiement"
              options={PAIEMENT_OPTIONS}
              value={paiementFilter}
              onChange={v => { setPaiementFilter(v); setPage(1); }}
              cfg={STATUT_PAIEMENT_CFG}
            />
          </div>
        )}
      </div>

      {/* Table: en cours --------------------------------------------------- */}
      <OrdersTable
        heading="En cours"
        accent="bg-amber-400"
        count={ongoingOrders.length}
        orders={visibleOngoingOrders}
        loading={loading}
        pendingIds={pendingIds}
        emptyLabel="Aucune commande en cours."
        onView={setSelected}
        onEdit={openEdit}
        renderActions={order => (
          <>
            {order.statut === 'en_attente' && (
              <ActionButton tone="emerald" onClick={() => handleValidateClick(order)}>Valider</ActionButton>
            )}
            {order.statut === 'validé' && order.statut_livraison !== 'livrée' && (
              <ActionButton tone="blue" icon={<Truck size={11} />} onClick={() => handleMarkDelivered(order)}>Livré</ActionButton>
            )}
            {isCancellable(order) && (
              <ActionButton tone="red" onClick={() => handleCancel(order)}>Annuler</ActionButton>
            )}
          </>
        )}
      />
      {!loading && ongoingOrders.length > 0 && (
        <TablePagination page={ongoingPage} totalPages={ongoingTotalPages} onChange={setOngoingPage} totalItems={ongoingOrders.length} />
      )}

      {/* Table: complétées --------------------------------------------------- */}
      <div className="pt-2">
        <OrdersTable
          heading="Complétées"
          accent="bg-emerald-400"
          count={completedOrders.length}
          orders={visibleCompletedOrders}
          loading={loading}
          pendingIds={pendingIds}
          emptyLabel="Aucune commande complétée."
          onView={setSelected}
          renderActions={order => (
            order.statut !== 'remboursée' && order.statut !== 'annulée' && (
              <ActionButton tone="purple" onClick={() => handleRefund(order)}>Rembourser</ActionButton>
            )
          )}
        />
      </div>
      {!loading && completedOrders.length > 0 && (
        <TablePagination page={completedPage} totalPages={completedTotalPages} onChange={setCompletedPage} totalItems={completedOrders.length} />
      )}

      {/* Server page control --------------------------------------------------- */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-foreground/40">Page {page} / {totalPages} · {total.toLocaleString()} commandes</p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="rounded-lg border border-white/10 p-1.5 text-foreground/60 transition-colors hover:bg-white/6 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const pg = start + i;
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={cx(
                    'h-7 w-7 rounded-lg text-xs font-medium transition-colors',
                    pg === page ? 'bg-gold text-black font-semibold' : 'text-foreground/50 hover:bg-white/6'
                  )}
                >
                  {pg}
                </button>
              );
            })}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-white/10 p-1.5 text-foreground/60 transition-colors hover:bg-white/6 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          DETAIL MODAL
      ══════════════════════════════════════════════════════════════════ */}
      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
          onManage={() => { setSelected(null); openEdit(selected); }}
          onValidate={() => { handleValidateClick(selected); setSelected(null); }}
          onCancel={() => { handleCancel(selected); setSelected(null); }}
          onDownloadInvoice={() => openInvoice(selected)}
          downloadingInvoice={downloadingInvoice}
          isCancellable={isCancellable(selected)}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          EDIT / MANAGE MODAL
      ══════════════════════════════════════════════════════════════════ */}
      {editModal && (
        <OrderPopupModal
          isOpen
          onClose={() => setEditModal(null)}
          eyebrow="Gérer la commande"
          title={<span className="font-mono">{editModal.numero_commande}</span>}
          size="2xl"
          footer={
            <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
              <button
                onClick={() => setEditModal(null)}
                className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium text-foreground/60 transition-colors hover:bg-white/6"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gold py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gold/85"
              >
                Enregistrer les modifications
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <FormSection title="Statuts & Suivi" icon={<ClipboardList size={11} />}>
              <div className="space-y-4">
                <Field label="Statut de la commande">
                  <SegmentedPicker value={editStatut} onChange={setEditStatut} options={STATUT_OPTIONS.filter(v => v) as any} cfg={STATUT_CFG} />
                </Field>
                <Field label="Statut de livraison" icon={<Truck size={11} />}>
                  <SegmentedPicker value={editLivraison} onChange={setEditLivraison} options={LIVRAISON_OPTIONS.filter(v => v) as any} cfg={STATUT_LIVRAISON_CFG} />
                </Field>
                <Field label="Statut paiement" icon={<CreditCard size={11} />}>
                  <SegmentedPicker value={editPaiement} onChange={setEditPaiement} options={PAIEMENT_OPTIONS.filter(v => v) as any} cfg={STATUT_PAIEMENT_CFG} />
                </Field>
              </div>
            </FormSection>

            <FormSection title="Acheminement & Frais" icon={<Bike size={11} />}>
              <div className="space-y-4">
                <Field label="Assigner un livreur" icon={<Bike size={11} />}>
                  <select
                    value={editLivreur}
                    onChange={e => setEditLivreur(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-gold/50"
                  >
                    <option value="" className="bg-background">— Aucun —</option>
                    {drivers.map(d => {
                      const id = d.id ?? d.user_id;
                      return <option key={id} value={id} className="bg-background">{driverDisplayName(d)}</option>;
                    })}
                  </select>
                </Field>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Date estimée" icon={<Calendar size={11} />}>
                    <input
                      type="date"
                      value={editDateEst}
                      onChange={e => setEditDateEst(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-gold/50"
                    />
                  </Field>
                  <Field label="Frais de livraison" icon={<Tag size={11} />}>
                    <input
                      type="number"
                      value={editFrais}
                      onChange={e => setEditFrais(e.target.value)}
                      placeholder={editModal.frais_livraison}
                      className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-gold/50"
                    />
                  </Field>
                </div>
              </div>
            </FormSection>

            <FormSection title="Notes d'équipe" icon={<ClipboardList size={11} />}>
              <Field label="Note interne">
                <textarea
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  rows={3}
                  placeholder="Commentaire interne visible uniquement par l'équipe…"
                  className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-gold/50"
                />
              </Field>
            </FormSection>
          </div>
        </OrderPopupModal>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          VALIDATION / DRIVER ASSIGNMENT MODAL
      ══════════════════════════════════════════════════════════════════ */}
      {validationModal && (
        <OrderPopupModal
          isOpen
          onClose={() => setValidationModal(null)}
          eyebrow="Validation & livraison"
          title={<span className="font-mono">{validationModal.numero_commande}</span>}
          size="xl"
          footer={
            <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
              <button
                onClick={() => setValidationModal(null)}
                className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium text-foreground/60 transition-colors hover:bg-white/6"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmValidation}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-emerald-400"
              >
                <CheckCircle size={15} />
                Confirmer la validation
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <FormSection title="Destinataire" icon={<MapPin size={11} />}>
              <dl className="space-y-1.5 text-xs">
                <RowKV k="Nom" v={validationModal.livraison_nom_complet} />
                <RowKV k="Téléphone" v={validationModal.livraison_telephone} />
                <RowKV k="Adresse" v={`${validationModal.livraison_ville}, ${validationModal.livraison_quartier}`} />
              </dl>
            </FormSection>

            <FormSection title="Assignation" icon={<Bike size={11} />}>
              <div className="space-y-4">
                <Field label="Choisir un livreur" icon={<Bike size={11} />}>
                  <select
                    value={valDriverId}
                    onChange={e => setValDriverId(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-gold/50"
                  >
                    <option value="" className="bg-background">— Assigner plus tard —</option>
                    {drivers.map(d => {
                      const id = d.id ?? d.user_id;
                      return <option key={id} value={id} className="bg-background">{driverDisplayName(d)}</option>;
                    })}
                  </select>
                </Field>

                <Field label="Date estimée de livraison" icon={<Calendar size={11} />}>
                  <input
                    type="date"
                    value={valDateEst}
                    onChange={e => setValDateEst(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-gold/50"
                  />
                </Field>
              </div>
            </FormSection>
          </div>
        </OrderPopupModal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Form helpers
// ─────────────────────────────────────────────────────────────────────────

function FormSection({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-foreground/40">
        {icon}{title}
      </p>
      {children}
    </div>
  );
}

function FilterGroup({
  label, options, value, onChange, cfg,
}: { label: string; options: string[]; value: string; onChange: (v: string) => void; cfg: Record<string, { label: string }> }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-foreground/35">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(v => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={cx(
              'rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
              value === v ? 'border-gold/40 bg-gold/15 text-gold' : 'border-white/10 text-foreground/50 hover:border-white/20'
            )}
          >
            {v === '' ? 'Tous' : cfg[v]?.label ?? v}
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({ label, icon, required, children }: { label: string; icon?: React.ReactNode; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-foreground/35">
        {icon}{label}
        {required && <span className="text-gold">*</span>}
      </label>
      {children}
    </div>
  );
}

function RowKV({ k, v }: { k: string; v?: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-foreground/40">{k}</dt>
      <dd className="text-right font-medium text-foreground/85">{v || '—'}</dd>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Orders table (shared between "en cours" and "complétées")
// ─────────────────────────────────────────────────────────────────────────

function OrdersTable({
  heading, accent, count, orders, loading, pendingIds, emptyLabel, onView, onEdit, renderActions,
}: {
  heading: string;
  accent: string;
  count: number;
  orders: BackendOrder[];
  loading: boolean;
  pendingIds: Set<string>;
  emptyLabel: string;
  onView: (o: BackendOrder) => void;
  onEdit?: (o: BackendOrder) => void;
  renderActions: (o: BackendOrder) => React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2">
        <span className={cx('h-1.5 w-1.5 rounded-full', accent)} />
        <h2 className="text-sm font-semibold text-foreground/85">{heading}</h2>
        <span className="text-xs text-foreground/35">{count}</span>
      </div>

      <div className="min-h-[120px] overflow-hidden rounded-xl border border-white/10">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2.5 py-16 text-foreground/40">
            <Loader2 className="animate-spin text-gold" size={26} />
            <p className="text-xs">Chargement…</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    {['N° Commande', 'Client', 'Total TTC', 'Promo', 'Livreur', 'Statut', 'Livraison', 'Date', ''].map(h => (
                      <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.map(order => {
                    const isPending = pendingIds.has(String(order.id));
                    return (
                      <tr key={order.id} className={cx('transition-colors hover:bg-white/[0.02]', isPending && 'opacity-50')}>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-gold">
                            {order.numero_commande}
                            {isPending && <Loader2 size={11} className="animate-spin text-gold/70" />}
                          </span>
                        </td>
                        <td className="min-w-[160px] px-4 py-3">
                          <p className="text-xs font-medium leading-tight text-foreground">{order.livraison_nom_complet}</p>
                          <p className="mt-0.5 text-[10px] text-foreground/40">{order.client_email}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-foreground">{fmt(order.total_ttc)}</td>
                        <td className="px-4 py-3">
                          {order.code_promo_utilise
                            ? <span className="rounded border border-gold/20 bg-gold/10 px-1.5 py-0.5 font-mono text-[11px] text-gold">{order.code_promo_utilise}</span>
                            : <span className="text-xs text-foreground/25">—</span>}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-foreground/55">{order.livreur_nom ?? '—'}</td>
                        <td className="px-4 py-3"><StatusChip cfg={STATUT_CFG[order.statut]} /></td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-foreground/55">{getDeliveryMethod(order)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[11px] text-foreground/35">{fmtDate(order.date_creation)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <IconButton icon={<Eye size={14} />} title="Voir le détail" onClick={() => onView(order)} tone="gold" />
                            {onEdit && <IconButton icon={<ClipboardList size={14} />} title="Modifier / gérer" onClick={() => onEdit(order)} tone="blue" />}
                            {renderActions(order)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-sm italic text-foreground/30">{emptyLabel}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="divide-y divide-white/5 md:hidden">
              {orders.map(order => {
                const isPending = pendingIds.has(String(order.id));
                return (
                  <div key={order.id} className={cx('p-4 space-y-3', isPending && 'opacity-50')}>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-gold">
                        {order.numero_commande}
                        {isPending && <Loader2 size={11} className="animate-spin text-gold/70" />}
                      </span>
                      <StatusChip cfg={STATUT_CFG[order.statut]} />
                    </div>

                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="text-xs font-medium text-foreground">{order.livraison_nom_complet}</p>
                        <p className="text-[11px] text-foreground/40">{order.client_email}</p>
                      </div>
                      <p className="text-sm font-semibold text-foreground text-right">{fmt(order.total_ttc)}</p>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-foreground/45 border-t border-white/5 pt-2">
                      <span>{getDeliveryMethod(order)}</span>
                      {order.livreur_nom && <span>• {order.livreur_nom}</span>}
                      <span>• {fmtDate(order.date_creation)}</span>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <IconButton icon={<Eye size={14} />} title="Voir le détail" onClick={() => onView(order)} tone="gold" />
                      {onEdit && <IconButton icon={<ClipboardList size={14} />} title="Modifier / gérer" onClick={() => onEdit(order)} tone="blue" />}
                      {renderActions(order)}
                    </div>
                  </div>
                );
              })}
              {orders.length === 0 && (
                <p className="py-10 text-center text-sm italic text-foreground/30">{emptyLabel}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TablePagination({
  page, totalPages, onChange, totalItems,
}: { page: number; totalPages: number; onChange: (p: number) => void; totalItems: number }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-1">
      <p className="text-[11px] text-foreground/40">{totalItems} commande{totalItems > 1 ? 's' : ''} · page {page}/{totalPages}</p>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onChange(Math.max(1, page - 1))}
          className="rounded-md p-1 text-foreground/50 transition-colors hover:bg-white/6 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft size={13} />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const start = Math.max(1, Math.min(page - 2, totalPages - 4));
          const pg = start + i;
          return (
            <button
              key={pg}
              onClick={() => onChange(pg)}
              className={cx('h-6 w-6 rounded-md text-[11px] font-medium transition-colors', pg === page ? 'bg-gold text-black font-semibold' : 'text-foreground/45 hover:bg-white/6')}
            >
              {pg}
            </button>
          );
        })}
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          className="rounded-md p-1 text-foreground/50 transition-colors hover:bg-white/6 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Order detail modal
// ─────────────────────────────────────────────────────────────────────────

function OrderDetailModal({
  order, onClose, onManage, onValidate, onCancel, onDownloadInvoice, downloadingInvoice, isCancellable,
}: {
  order: BackendOrder;
  onClose: () => void;
  onManage: () => void;
  onValidate: () => void;
  onCancel: () => void;
  onDownloadInvoice: () => void;
  downloadingInvoice: boolean;
  isCancellable: boolean;
}) {
  const lines = allLines(order);
  const groups: Array<{ title: string; icon: React.ReactNode; lines: BackendOrderLine[] }> = [
    { title: 'Parfums', icon: <Package size={12} />, lines: order.lignes_parfums },
    { title: 'Accessoires', icon: <Package size={12} />, lines: order.lignes_accessoires },
    { title: 'Essences finies', icon: <Package size={12} />, lines: order.lignes_produit_fini_essence },
    { title: 'Parfums personnalisés', icon: <Package size={12} />, lines: order.lignes_parfums_perso },
    { title: 'Essences personnalisées', icon: <Package size={12} />, lines: order.lignes_essence_personnalisee },
  ].filter(g => g.lines.length > 0);

  return (
    <OrderPopupModal
      isOpen
      onClose={onClose}
      eyebrow={fmtDate(order.date_creation, true)}
      title={
        <>
          <span className="font-mono">{order.numero_commande}</span>
          <StatusChip cfg={STATUT_CFG[order.statut]} />
        </>
      }
      size="3xl"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          {order.statut === 'en_attente' && (
            <button onClick={onValidate} className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2.5 px-4 text-xs font-semibold text-black transition-colors hover:bg-emerald-400">
              <CheckCircle size={14} />Valider
            </button>
          )}
          {isCancellable && (
            <button onClick={onCancel} className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-lg bg-red-500/90 hover:bg-red-500 py-2.5 px-4 text-xs font-semibold text-white transition-colors">
              <XCircle size={14} />Annuler
            </button>
          )}
          <button onClick={onManage} className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-lg bg-gold px-5 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-gold/85">
            <ClipboardList size={14} />Gérer
          </button>
          <button onClick={onClose} className="rounded-lg border border-white/10 px-5 py-2.5 text-xs text-foreground/60 transition-colors hover:bg-white/6">
            Fermer
          </button>
        </div>
      }
    >
      <div className="space-y-6">

        {/* Summary strip */}
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
          <SummaryStat label="Total TTC" value={fmt(order.total_ttc)} emphasize />
          <div className="hidden h-8 w-px bg-white/10 sm:block" />
          <SummaryStat label="Paiement" node={<StatusChip cfg={STATUT_PAIEMENT_CFG[order.statut_paiement]} />} />
          <div className="hidden h-8 w-px bg-white/10 sm:block" />
          <SummaryStat label="Mode" value={getDeliveryMethod(order)} />
          {order.code_promo_utilise && (
            <>
              <div className="hidden h-8 w-px bg-white/10 sm:block" />
              <SummaryStat label="Code promo" node={<span className="rounded border border-gold/20 bg-gold/10 px-1.5 py-0.5 font-mono text-xs text-gold">{order.code_promo_utilise}</span>} />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Left: delivery + notes */}
          <div className="space-y-5 lg:col-span-2">
            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <SectionLabel icon={<MapPin size={11} />}>Livraison</SectionLabel>
              <dl className="space-y-1.5 text-xs">
                <RowKV k="Destinataire" v={order.livraison_nom_complet} />
                <RowKV k="Téléphone" v={order.livraison_telephone} />
                {order.livraison_ville && (
                  <RowKV k="Ville" v={`${order.livraison_ville}${order.livraison_quartier ? ` – ${order.livraison_quartier}` : ''}`} />
                )}
                <RowKV k="Livreur" v={order.livreur_nom ?? '—'} />
                <RowKV k="Date estimée" v={fmtDate(order.date_livraison_estimee)} />
                <RowKV k="Date réelle" v={fmtDate(order.date_livraison_reelle)} />
              </dl>
              {order.motif_echec_livraison && (
                <div className="mt-3 flex gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-400">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  {order.motif_echec_livraison}
                </div>
              )}
            </section>

            {(order.note_client || order.note_interne) && (
              <section className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                {order.note_client && (
                  <div>
                    <SectionLabel icon={<Phone size={11} />}>Note client</SectionLabel>
                    <p className="text-xs leading-relaxed text-foreground/65">{order.note_client}</p>
                  </div>
                )}
                {order.note_interne && (
                  <div>
                    <SectionLabel icon={<ClipboardList size={11} />}>Note interne</SectionLabel>
                    <p className="text-xs leading-relaxed text-foreground/65">{order.note_interne}</p>
                  </div>
                )}
              </section>
            )}

            {(order.facture || order.statut_paiement === 'payé') && (
              <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <SectionLabel icon={<FileText size={11} />}>Facture</SectionLabel>
                <div className="space-y-2.5">
                  {order.facture?.numero_facture && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground/40">N° {order.facture.numero_facture}</span>
                      <span className="text-foreground/50">{fmtDate(order.facture.date_emission)}</span>
                    </div>
                  )}
                  {order.facture?.envoye_par_email && (
                    <p className="flex items-center gap-1.5 text-[11px] text-emerald-400/80"><Mail size={11} />Envoyée par e-mail</p>
                  )}
                  <div className="flex gap-2">
                    {order.facture?.fichier_pdf && (
                      <a
                        href={order.facture.fichier_pdf}
                        target="_blank" rel="noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 py-2 text-xs font-medium text-foreground/75 transition-colors hover:bg-white/6"
                      >
                        <FileText size={13} />Ouvrir
                      </a>
                    )}
                    <button
                      onClick={onDownloadInvoice}
                      disabled={downloadingInvoice}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500/15 py-2 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/25 transition-colors hover:bg-emerald-500/25 disabled:opacity-50"
                    >
                      {downloadingInvoice ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                      Télécharger
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Right: items + receipt */}
          <div className="space-y-5 lg:col-span-3">
            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <SectionLabel icon={<Package size={11} />}>Articles ({lines.length})</SectionLabel>
              <div className="max-h-[300px] space-y-4 overflow-y-auto pr-1">
                {groups.map(g => (
                  <LinesGroup key={g.title} title={g.title} icon={g.icon} lines={g.lines} />
                ))}
                {lines.length === 0 && <p className="py-4 text-center text-xs italic text-foreground/30">Aucun article dans cette commande.</p>}
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <SectionLabel icon={<CreditCard size={11} />}>Récapitulatif</SectionLabel>
              <div className="space-y-1.5 text-xs">
                <ReceiptRow k="Sous-total" v={fmt(order.sous_total)} />
                <ReceiptRow k="Frais de livraison" v={fmt(order.frais_livraison)} />
                {Number(order.remise_code_promo) > 0 && <ReceiptRow k="Remise promo" v={`-${fmt(order.remise_code_promo)}`} negative />}
                <div className="my-1.5 border-t border-dashed border-white/10" />
                <ReceiptRow k="Total TTC" v={fmt(order.total_ttc)} bold />
                <div className="my-1.5 border-t border-white/10" />
                <ReceiptRow k="Commission" v={`${fmt(order.commission_montant)} · ${order.commission_statut}`} muted />
                <ReceiptRow k="Prestataire" v={order.prestataire_code ?? '—'} muted />
              </div>
            </section>
          </div>
        </div>
      </div>
    </OrderPopupModal>
  );
}

function SummaryStat({ label, value, node, emphasize }: { label: string; value?: string; node?: React.ReactNode; emphasize?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{label}</p>
      {node ?? <p className={cx('mt-0.5', emphasize ? 'text-base font-semibold text-foreground' : 'text-sm text-foreground/75')}>{value}</p>}
    </div>
  );
}

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-foreground/35">
      {icon}{children}
    </p>
  );
}

function ReceiptRow({ k, v, bold, negative, muted }: { k: string; v: string; bold?: boolean; negative?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? 'text-foreground/35' : 'text-foreground/50'}>{k}</span>
      <span className={cx(
        bold && 'text-sm font-semibold text-foreground',
        negative && 'text-red-400',
        muted && 'text-foreground/45',
        !bold && !negative && !muted && 'text-foreground/80'
      )}>
        {v}
      </span>
    </div>
  );
}

function getOrderLineName(line: BackendOrderLine) {
  return (
    line.nom_snapshot ||
    line.nom ||
    line.detail_produit?.nom ||
    line.essence_nom ||
    line.produit_details?.nom ||
    line.parfum_details?.nom ||
    line.accessoire_details?.nom ||
    line.composition?.nom ||
    'Article'
  );
}

function getOrderLineDetailMeta(line: BackendOrderLine) {
  const essenceName = line.essence_nom || line.detail_produit?.nom || line.produit_details?.nom || line.nom_snapshot;
  const marque = line.essence_marque || line.detail_produit?.marque;
  const tailleMl = line.taille_ml ?? line.detail_produit?.taille_ml;
  const categorie = line.categorie || line.detail_produit?.categorie;
  const prixParMl = line.prix_par_ml ?? line.detail_produit?.prix_par_ml;
  const prixActuel = line.prix_actuel || line.detail_produit?.prix_actuel || line.detail_produit?.prix;
  const codeReference = line.detail_produit?.code_reference;

  return { essenceName, marque, tailleMl, categorie, prixParMl, prixActuel, codeReference };
}

function LinesGroup({ title, icon, lines }: { title: string; icon: React.ReactNode; lines: BackendOrderLine[] }) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground/30">
        {icon}{title}
      </p>
      <div className="space-y-1.5">
        {lines.map(line => {
          const isCustom = !!line.parfum_personnalise || !!line.composition;
          const name = getOrderLineName(line);
          const detailMeta = getOrderLineDetailMeta(line);
          const hasDetailMeta = Boolean(
            line.produit_fini_essence ||
            line.detail_produit ||
            line.essence_nom ||
            line.essence_marque ||
            line.taille_ml ||
            line.categorie ||
            line.prix_par_ml ||
            line.prix_actuel ||
            line.produit_details?.nom
          );

          return (
            <div key={line.id} className="rounded-lg border border-white/8 bg-white/[0.015] px-3 py-2.5 text-xs">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium text-foreground/85">{name}</span>
                <div className="flex shrink-0 items-center gap-2 text-foreground/45 sm:gap-3">
                  <span>{line.quantite} ×</span>
                  <span>{Number(line.prix_unitaire_snapshot).toLocaleString()} FCFA</span>
                  <span className="font-semibold text-foreground/75">{Number(line.sous_total).toLocaleString()} FCFA</span>
                </div>
              </div>
              {isCustom && line.composition?.lignes && line.composition.lignes.length > 0 && (
                <div className="mt-2 ml-2 space-y-1 border-l border-white/10 pl-2.5">
                  {line.composition.lignes.map((essence, i) => (
                    <div key={i} className="flex justify-between text-foreground/50">
                      <span>{essence.essence_nom || 'Essence'}</span>
                      <span>{essence.quantite_ml || '—'} ml</span>
                    </div>
                  ))}
                  {line.composition.flacon_nom && (
                    <div className="flex justify-between text-foreground/35">
                      <span>Flacon</span>
                      <span>{line.composition.flacon_nom} {line.composition.flacon_contenance_ml ? `· ${line.composition.flacon_contenance_ml}ml` : ''}</span>
                    </div>
                  )}
                </div>
              )}
              {hasDetailMeta && (
                <div className="mt-2 space-y-1 text-[11px] text-foreground/50">
                  <div className="flex justify-between gap-2">
                    <span>{[detailMeta.essenceName, detailMeta.marque].filter(Boolean).join(' · ') || 'Produit fini'}</span>
                    <span>{detailMeta.tailleMl ? `${detailMeta.tailleMl} ml` : ''}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>Catégorie: {detailMeta.categorie || '—'}</span>
                    <span>
                      {detailMeta.prixParMl
                        ? `${Number(detailMeta.prixParMl).toLocaleString()} FCFA/ml`
                        : detailMeta.prixActuel
                          ? `${Number(detailMeta.prixActuel).toLocaleString()} FCFA`
                          : '—'}
                    </span>
                  </div>
                  {detailMeta.codeReference && (
                    <div className="text-[10px] text-foreground/35">Réf: {detailMeta.codeReference}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}