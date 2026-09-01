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
import { useTranslation } from 'react-i18next';
import type { BackendOrder, BackendOrderLine } from '@/types';
import { useOptimisticOrders } from '@/hooks/useOptimisticOrders';
import { CustomSelect } from '@/components/ui/CustomSelect';

const T = {
  fr: {
    title: 'Commandes',
    subtitle_orders: 'commande',
    subtitle_orders_plural: 'commandes',
    subtitle_total: 'au total',
    refresh: 'Actualiser',
    loading: 'Chargement…',
    search_placeholder: 'N° commande, e-mail, téléphone…',
    client_name_placeholder: 'Nom client',
    filters: 'Filtres',
    filter_order_status: 'Statut commande',
    filter_delivery: 'Statut livraison',
    filter_payment: 'Paiement',
    all: 'Tous',
    table_order: 'N° Commande',
    table_client: 'Client',
    table_total: 'Total TTC',
    table_promo: 'Promo',
    table_driver: 'Livreur',
    table_status: 'Statut',
    table_delivery: 'Livraison',
    table_date: 'Date',
    ongoing: 'En cours',
    completed: 'Complétées',
    no_ongoing: 'Aucune commande en cours.',
    no_completed: 'Aucune commande complétée.',
    no_items: 'Aucun article dans cette commande.',
    page_info: 'Page',
    of: '/',
    validate: 'Valider',
    delivered: 'Livré',
    cancel: 'Annuler',
    refund: 'Rembourser',
    close: 'Fermer',
    manage: 'Gérer',
    save: 'Enregistrer les modifications',
    saving: 'Enregistrement…',
    view_detail: 'Voir le détail',
    manage_order: 'Modifier / gérer',
    manage_order_eyebrow: 'Gérer la commande',
    validation_eyebrow: 'Validation & livraison',
    confirm_validation: 'Confirmer la validation',
    assign_later: '— Assigner plus tard —',
    none_driver: '— Aucun —',
    section_statuses: 'Statuts & Assignations',
    section_logistics: 'Livraison & Logistique',
    section_notes: 'Notes internes',
    section_recipient: 'Destinataire',
    section_expedition: "Paramètres d'expédition",
    section_delivery: 'Livraison',
    section_items: 'Articles',
    section_receipt: 'Récapitulatif',
    section_invoice: 'Facture',
    field_order_status: 'Statut de la commande',
    field_delivery_status: 'Statut de livraison',
    field_payment_status: 'Statut paiement',
    field_assign_driver: 'Assigner un livreur',
    field_choose_driver: 'Choisir un livreur',
    field_est_date: 'Date estimée',
    field_est_date_delivery: 'Date estimée de livraison',
    field_fees: 'Frais de livraison',
    field_note: 'Commentaire de gestion',
    note_placeholder: "Commentaire interne visible uniquement par l'équipe…",
    delivery_method: 'Livraison',
    pickup: 'Retrait boutique',
    kpi_total: 'Total',
    kpi_pending: 'En attente',
    kpi_validated: 'Validées',
    kpi_paid: 'Payées',
    kpi_cancelled: 'Annulées',
    confirm_cancel: 'Annuler la commande',
    confirm_pickup_validate: 'Valider la commande pickup',
    confirm_deliver: 'Marquer la commande',
    confirm_deliver_suffix: 'comme livrée (et payée) ?',
    confirm_refund: 'Rembourser la commande',
    invoice_open: 'Ouvrir',
    invoice_download: 'Télécharger',
    invoice_sent_email: 'Envoyée par e-mail',
    download_success: 'Facture PDF téléchargée',
    download_error: 'Facture non disponible',
    update_success: 'Commande mise à jour avec succès',
    update_error: 'Erreur lors de la mise à jour',
    cancel_success: 'Commande annulée',
    cancel_error: "Erreur lors de l'annulation",
    deliver_success: 'Commande marquée comme livrée et payée',
    deliver_error: 'Erreur lors de la mise à jour de la livraison',
    validate_pickup_success: 'Commande pickup validée avec succès',
    validate_error: 'Erreur lors de la validation',
    validate_driver_success: 'Commande validée et livreur assigné',
    refund_success: 'Commande marquée comme remboursée',
    refund_error: 'Erreur lors du remboursement',
    load_error: 'Erreur lors du chargement des commandes',
    row_name: 'Nom',
    row_phone: 'Téléphone',
    row_address: 'Adresse',
    row_city: 'Ville',
    row_driver: 'Livreur',
    row_est_date: 'Date estimée',
    row_actual_date: 'Date réelle',
    row_note_client: 'Note client',
    row_note_internal: 'Note interne',
    row_recipient: 'Destinataire',
    receipt_subtotal: 'Sous-total',
    receipt_delivery_fees: 'Frais de livraison',
    receipt_promo_discount: 'Remise promo',
    receipt_total: 'Total TTC',
    receipt_commission: 'Commission',
    receipt_provider: 'Prestataire',
    group_perfumes: 'Parfums',
    group_accessories: 'Accessoires',
    group_essences: 'Essences finies',
    group_custom_perfumes: 'Parfums personnalisés',
    group_custom_essences: 'Essences personnalisées',
    flacon: 'Flacon',
    category: 'Catégorie',
    ref: 'Réf',
    essence_product: 'Produit fini',
    orders_page: 'commandes · page',
    items_count: 'Articles',
    confirm_q: '?',
  },
  en: {
    title: 'Orders',
    subtitle_orders: 'order',
    subtitle_orders_plural: 'orders',
    subtitle_total: 'total',
    refresh: 'Refresh',
    loading: 'Loading…',
    search_placeholder: 'Order #, email, phone…',
    client_name_placeholder: 'Client name',
    filters: 'Filters',
    filter_order_status: 'Order status',
    filter_delivery: 'Delivery status',
    filter_payment: 'Payment',
    all: 'All',
    table_order: 'Order #',
    table_client: 'Client',
    table_total: 'Total',
    table_promo: 'Promo',
    table_driver: 'Driver',
    table_status: 'Status',
    table_delivery: 'Delivery',
    table_date: 'Date',
    ongoing: 'Ongoing',
    completed: 'Completed',
    no_ongoing: 'No ongoing orders.',
    no_completed: 'No completed orders.',
    no_items: 'No items in this order.',
    page_info: 'Page',
    of: '/',
    validate: 'Validate',
    delivered: 'Delivered',
    cancel: 'Cancel',
    refund: 'Refund',
    close: 'Close',
    manage: 'Manage',
    save: 'Save changes',
    saving: 'Saving…',
    view_detail: 'View detail',
    manage_order: 'Edit / manage',
    manage_order_eyebrow: 'Manage order',
    validation_eyebrow: 'Validation & delivery',
    confirm_validation: 'Confirm validation',
    assign_later: '— Assign later —',
    none_driver: '— None —',
    section_statuses: 'Statuses & Assignments',
    section_logistics: 'Delivery & Logistics',
    section_notes: 'Internal notes',
    section_recipient: 'Recipient',
    section_expedition: 'Shipping settings',
    section_delivery: 'Delivery',
    section_items: 'Items',
    section_receipt: 'Summary',
    section_invoice: 'Invoice',
    field_order_status: 'Order status',
    field_delivery_status: 'Delivery status',
    field_payment_status: 'Payment status',
    field_assign_driver: 'Assign a driver',
    field_choose_driver: 'Choose a driver',
    field_est_date: 'Estimated date',
    field_est_date_delivery: 'Estimated delivery date',
    field_fees: 'Delivery fees',
    field_note: 'Management note',
    note_placeholder: 'Internal comment visible to team only…',
    delivery_method: 'Delivery',
    pickup: 'Store pickup',
    kpi_total: 'Total',
    kpi_pending: 'Pending',
    kpi_validated: 'Validated',
    kpi_paid: 'Paid',
    kpi_cancelled: 'Cancelled',
    confirm_cancel: 'Cancel order',
    confirm_pickup_validate: 'Validate pickup order',
    confirm_deliver: 'Mark order',
    confirm_deliver_suffix: 'as delivered (and paid)?',
    confirm_refund: 'Refund order',
    invoice_open: 'Open',
    invoice_download: 'Download',
    invoice_sent_email: 'Sent by email',
    download_success: 'Invoice PDF downloaded',
    download_error: 'Invoice not available',
    update_success: 'Order updated successfully',
    update_error: 'Error updating order',
    cancel_success: 'Order cancelled',
    cancel_error: 'Error cancelling order',
    deliver_success: 'Order marked as delivered and paid',
    deliver_error: 'Error updating delivery',
    validate_pickup_success: 'Pickup order validated',
    validate_error: 'Error validating order',
    validate_driver_success: 'Order validated and driver assigned',
    refund_success: 'Order marked as refunded',
    refund_error: 'Error processing refund',
    load_error: 'Error loading orders',
    row_name: 'Name',
    row_phone: 'Phone',
    row_address: 'Address',
    row_city: 'City',
    row_driver: 'Driver',
    row_est_date: 'Estimated date',
    row_actual_date: 'Actual date',
    row_note_client: 'Client note',
    row_note_internal: 'Internal note',
    row_recipient: 'Recipient',
    receipt_subtotal: 'Subtotal',
    receipt_delivery_fees: 'Delivery fees',
    receipt_promo_discount: 'Promo discount',
    receipt_total: 'Total',
    receipt_commission: 'Commission',
    receipt_provider: 'Provider',
    group_perfumes: 'Perfumes',
    group_accessories: 'Accessories',
    group_essences: 'Finished essences',
    group_custom_perfumes: 'Custom perfumes',
    group_custom_essences: 'Custom essences',
    flacon: 'Bottle',
    category: 'Category',
    ref: 'Ref',
    essence_product: 'Finished product',
    orders_page: 'orders · page',
    items_count: 'Items',
    confirm_q: '?',
  },
} as const;
type TKey = keyof typeof T.fr;

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

function getDeliveryMethod(order: BackendOrder, isEn = false): string {
  return order.livreur
    ? (isEn ? T.en.delivery_method : T.fr.delivery_method)
    : (isEn ? T.en.pickup : T.fr.pickup);
}

function driverDisplayName(d: any): string {
  return d.user_details?.first_name
    ? `${d.user_details.first_name} ${d.user_details.last_name ?? ''}`.trim()
    : d.name ?? `Livreur #${d.id}`;
}

/** Shared status chip indicator */
function StatusChip({ cfg, label }: { cfg?: { label: string; color: string; dot: string }; label?: string }) {
  if (!cfg) return <span className="text-xs text-foreground/25">—</span>;
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset', cfg.color)}>
      <span className={cx('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      {label ?? cfg.label}
    </span>
  );
}

/** Segmented selector for status choices */
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
    default: 'text-foreground/45 hover:text-foreground hover:bg-white/8',
    blue: 'text-foreground/45 hover:text-blue-400 hover:bg-blue-500/10',
    gold: 'text-foreground/45 hover:text-gold hover:bg-gold/10',
  } as const;
  return (
    <button title={title} onClick={onClick} className={cx('rounded-md p-2 sm:p-1.5 transition-colors', tones[tone])}>
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
    neutral: 'bg-white/8 hover:bg-white/14 text-foreground/80',
  } as const;
  return (
    <button
      onClick={onClick}
      className={cx('inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors', tones[tone])}
    >
      {icon}
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Modal shell - Optimized edge-to-edge for mobile
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
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-6" onClick={onClose}>
      <div
        className={cx(
          'flex h-full sm:h-auto max-h-full sm:max-h-[88vh] w-full flex-col overflow-hidden rounded-none sm:rounded-xl border-0 sm:border border-white/10 bg-background',
          sizes[size]
        )}
        onClick={e => e.stopPropagation()}
      >
        {(title || eyebrow) && (
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-4 sm:px-6 py-4">
            <div className="min-w-0">
              {eyebrow && <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground/35">{eyebrow}</p>}
              {title && <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[15px] font-semibold text-foreground">{title}</div>}
              {subtitle && <p className="mt-0.5 text-xs text-foreground/40">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="shrink-0 rounded-md p-2 sm:p-1.5 text-foreground/40 transition-colors hover:bg-white/8 hover:text-foreground">
              <X size={16} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">{children}</div>
        {footer && <div className="shrink-0 border-t border-white/10 bg-background px-4 sm:px-6 py-3.5 sm:py-4">{footer}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en') ?? false;
  const t = (k: TKey) => isEn ? T.en[k] : T.fr[k];

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
  const [isSavingEdit, setIsSavingEdit]   = useState(false);
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
      addToast(isEn ? T.en.load_error : T.fr.load_error, 'error');
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

    setIsSavingEdit(true);
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
      successMessage: isEn ? T.en.update_success : T.fr.update_success,
      errorMessage: isEn ? T.en.update_error : T.fr.update_error,
    });
    setIsSavingEdit(false);
  };

  const handleDownloadInvoice = async (order: BackendOrder) => {
    const num = order.numero_commande ?? String(order.id);
    setDownloadingInvoice(true);
    try {
      await invoiceService.downloadInvoiceFile(num, `facture-${num}.pdf`);
      addToast(isEn ? T.en.download_success : T.fr.download_success, 'success');
    } catch (err: any) {
      addToast(err.response?.data?.detail ?? (isEn ? T.en.download_error : T.fr.download_error), 'error');
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
    if (!confirm(`${isEn ? T.en.confirm_cancel : T.fr.confirm_cancel} ${order.numero_commande} ?`)) return;
    await runOptimisticUpdate({
      orderId: order.id,
      patch: { statut: 'annulée' },
      apiCall: () => orderService.cancelOrder(order.numero_commande),
      successMessage: isEn ? T.en.cancel_success : T.fr.cancel_success,
      errorMessage: isEn ? T.en.cancel_error : T.fr.cancel_error,
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
    if (!confirm(`${isEn ? T.en.confirm_pickup_validate : T.fr.confirm_pickup_validate} ${order.numero_commande} ?`)) return;
    await runOptimisticUpdate({
      orderId: order.id,
      patch: { statut: 'validé', statut_livraison: 'en_attente_affectation' },
      apiCall: () => orderService.updateOrder(order.numero_commande, {
        statut: 'validé', statut_livraison: 'en_attente_affectation',
      }),
      successMessage: isEn ? T.en.validate_pickup_success : T.fr.validate_pickup_success,
      errorMessage: isEn ? T.en.validate_error : T.fr.validate_error,
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
      successMessage: isEn ? T.en.validate_driver_success : T.fr.validate_driver_success,
      errorMessage: isEn ? T.en.validate_error : T.fr.validate_error,
    });
  };

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  const kpi = [
    { label: t('kpi_total'),     value: total,                                                 color: 'text-foreground' },
    { label: t('kpi_pending'),   value: orders.filter(o => o.statut === 'en_attente').length,  color: 'text-amber-400'  },
    { label: t('kpi_validated'), value: orders.filter(o => o.statut === 'validé').length,      color: 'text-blue-400'   },
    { label: t('kpi_paid'),      value: orders.filter(o => o.statut_paiement === 'payé').length, color: 'text-emerald-400' },
    { label: t('kpi_cancelled'), value: orders.filter(o => o.statut === 'annulée').length,     color: 'text-red-400'    },
  ];

  const isCancellable = (o: BackendOrder) => o.statut === 'en_attente' || o.statut === 'validé';

  const handleMarkDelivered = async (order: BackendOrder) => {
    if (!confirm(`${isEn ? T.en.confirm_deliver : T.fr.confirm_deliver} ${order.numero_commande} ${isEn ? T.en.confirm_deliver_suffix : T.fr.confirm_deliver_suffix}`)) return;
    await runOptimisticUpdate({
      orderId: order.id,
      patch: { statut_livraison: 'livrée', statut_paiement: 'payé' },
      apiCall: () => orderService.updateOrder(order.numero_commande, {
        statut_livraison: 'livrée', statut_paiement: 'payé',
      }),
      successMessage: isEn ? T.en.deliver_success : T.fr.deliver_success,
      errorMessage: isEn ? T.en.deliver_error : T.fr.deliver_error,
      onSuccess: () => {
        // ── GA4: purchase — API confirmed delivery, this is the real conversion
        import('@/lib/gtag').then(({ trackPurchase, orderLineToGA4Item }) => {
          const allLines = [
            ...(order.lignes_parfums ?? []).map(l => ({ ...l, type: 'parfum' })),
            ...(order.lignes_accessoires ?? []).map(l => ({ ...l, type: 'accessoire' })),
            ...(order.lignes_produit_fini_essence ?? []).map(l => ({ ...l, type: 'produit-fini-essence' })),
            ...(order.lignes_parfums_perso ?? []).map(l => ({ ...l, type: 'parfum-personnalise' })),
            ...(order.lignes_essence_personnalisee ?? []).map(l => ({ ...l, type: 'essence-personnalisee' })),
          ];
          trackPurchase({
            transactionId: order.numero_commande,
            value: parseFloat(order.total_ttc ?? '0'),
            coupon: order.code_promo_utilise ?? undefined,
            items: allLines.map(orderLineToGA4Item),
          });
        }).catch(() => { /* never surface analytics errors */ });
      },
    });
  };

  const handleRefund = async (order: BackendOrder) => {
    if (!confirm(`${isEn ? T.en.confirm_refund : T.fr.confirm_refund} ${order.numero_commande} ?`)) return;
    await runOptimisticUpdate({
      orderId: order.id,
      patch: { statut: 'remboursée', statut_paiement: 'échoué' },
      apiCall: () => orderService.updateOrder(order.numero_commande, {
        statut: 'remboursée', statut_paiement: 'échoué',
      }),
      successMessage: isEn ? T.en.refund_success : T.fr.refund_success,
      errorMessage: isEn ? T.en.refund_error : T.fr.refund_error,
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
          <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
          <p className="mt-0.5 text-sm text-foreground/40">
            {total.toLocaleString()} {total > 1 ? t('subtitle_orders_plural') : t('subtitle_orders')} {t('subtitle_total')}
          </p>
        </div>
        <button
          onClick={() => fetchOrders(page)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3.5 py-2 text-sm text-foreground/60 transition-colors hover:bg-white/6 hover:text-foreground"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {t('refresh')}
        </button>
      </div>

      {/* KPI strip ----------------------------------------------------------- */}
      <div className="shadow-black/30 shadow-sm grid grid-cols-2 gap-2.5 sm:flex sm:divide-x sm:divide-white/8 sm:gap-0 overflow-hidden sm:rounded-xl sm:border sm:border-white/10 sm:bg-white/[0.03]">
        {kpi.map(k => (
          <div key={k.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 sm:border-none sm:bg-transparent sm:flex-1 sm:px-5 sm:py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{k.label}</p>
            <p className={cx('mt-1 text-xl font-semibold tabular-nums', k.color)}>{k.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Toolbar --------------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="shadow-black/30 shadow-sm flex w-full sm:flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
            <Search size={14} className="shrink-0 text-foreground/35" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('search_placeholder')}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/35"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-foreground/30 hover:text-foreground/60">
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex w-full sm:w-56 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
            <input
              value={nomFilter}
              onChange={e => setNomFilter(e.target.value)}
              placeholder={t('client_name_placeholder')}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/35"
            />
          </div>

          <button
            onClick={() => setShowFilters(s => !s)}
            className={cx(
              'shadow-black/30 shadow-sm inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors',
              showFilters || activeFilterCount
                ? 'border-gold/30 bg-gold/10 text-gold'
                : 'border-white/10 text-foreground/55 hover:bg-white/6'
            )}
          >
            <SlidersHorizontal size={14} />
            {t('filters')}
            {activeFilterCount > 0 && (
              <span className="shadow-black/30 shadow-sm rounded-full bg-gold/25 px-1.5 text-[10px] font-bold text-gold">{activeFilterCount}</span>
            )}
            <ChevronDown size={13} className={cx('transition-transform', showFilters && 'rotate-180')} />
          </button>
        </div>

        {showFilters && (
          <div className="shadow-black/30 shadow-sm grid grid-cols-1 gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:grid-cols-3">
            <FilterGroup
              label={t('filter_order_status')}
              options={STATUT_OPTIONS}
              value={statutFilter}
              onChange={v => { setStatutFilter(v); setPage(1); }}
              cfg={STATUT_CFG}
              allLabel={t('all')}
            />
            <FilterGroup
              label={t('filter_delivery')}
              options={LIVRAISON_OPTIONS}
              value={livraisonFilter}
              onChange={v => { setLivraisonFilter(v); setPage(1); }}
              cfg={STATUT_LIVRAISON_CFG}
              allLabel={t('all')}
            />
            <FilterGroup
              label={t('filter_payment')}
              options={PAIEMENT_OPTIONS}
              value={paiementFilter}
              onChange={v => { setPaiementFilter(v); setPage(1); }}
              cfg={STATUT_PAIEMENT_CFG}
              allLabel={t('all')}
            />
          </div>
        )}
      </div>

      {/* Table: en cours --------------------------------------------------- */}
      <OrdersTable
        heading={t('ongoing')}
        accent="bg-amber-400"
        count={ongoingOrders.length}
        orders={visibleOngoingOrders}
        loading={loading}
        pendingIds={pendingIds}
        emptyLabel={t('no_ongoing')}
        onView={setSelected}
        onEdit={openEdit}
        tableHeaders={[t('table_order'), t('table_client'), t('table_total'), t('table_promo'), t('table_driver'), t('table_status'), t('table_delivery'), t('table_date'), '']}
        loadingLabel={t('loading')}
        viewTitle={t('view_detail')}
        manageTitle={t('manage_order')}
        renderActions={order => (
          <>
            {order.statut === 'en_attente' && (
              <ActionButton tone="emerald" onClick={() => handleValidateClick(order)}>{t('validate')}</ActionButton>
            )}
            {order.statut === 'validé' && order.statut_livraison !== 'livrée' && (
              <ActionButton tone="blue" icon={<Truck size={11} />} onClick={() => handleMarkDelivered(order)}>{t('delivered')}</ActionButton>
            )}
            {isCancellable(order) && (
              <ActionButton tone="red" onClick={() => handleCancel(order)}>{t('cancel')}</ActionButton>
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
          heading={t('completed')}
          accent="bg-emerald-400"
          count={completedOrders.length}
          orders={visibleCompletedOrders}
          loading={loading}
          pendingIds={pendingIds}
          emptyLabel={t('no_completed')}
          onView={setSelected}
          tableHeaders={[t('table_order'), t('table_client'), t('table_total'), t('table_promo'), t('table_driver'), t('table_status'), t('table_delivery'), t('table_date'), '']}
          loadingLabel={t('loading')}
          viewTitle={t('view_detail')}
          manageTitle={t('manage_order')}
          renderActions={order => (
            order.statut !== 'remboursée' && order.statut !== 'annulée' && (
              <ActionButton tone="purple" onClick={() => handleRefund(order)}>{t('refund')}</ActionButton>
            )
          )}
        />
      </div>
      {!loading && completedOrders.length > 0 && (
        <TablePagination page={completedPage} totalPages={completedTotalPages} onChange={setCompletedPage} totalItems={completedOrders.length} />
      )}

      {/* Server page control --------------------------------------------------- */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-white/10 pt-4">
          <p className="text-xs text-foreground/40">
            {t('page_info')} {page} {t('of')} {totalPages} · {total.toLocaleString()} {t('subtitle_orders_plural')}
          </p>
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
                    pg === page ? 'bg-gold text-black' : 'text-foreground/50 hover:bg-white/6'
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
          isEn={isEn}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          EDIT / MANAGE MODAL
      ══════════════════════════════════════════════════════════════════ */}
      {editModal && (
        <OrderPopupModal
          isOpen
          onClose={() => setEditModal(null)}
          eyebrow={t('manage_order_eyebrow')}
          title={<span className="font-mono">{editModal.numero_commande}</span>}
          size="2xl"
          footer={
            <div className="flex flex-col-reverse sm:flex-row gap-2.5">
              <button
                onClick={() => setEditModal(null)}
                className="w-full sm:w-auto rounded-lg border border-white/10 px-5 py-2.5 text-sm text-foreground/60 transition-colors hover:bg-white/6"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={isSavingEdit}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gold py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gold/85 disabled:opacity-60"
              >
                {isSavingEdit ? <Loader2 size={14} className="animate-spin" /> : null}
                {isSavingEdit ? t('saving') : t('save')}
              </button>
            </div>
          }
        >
          <FormSection title={t('section_statuses')} icon={<ClipboardList size={11} />}>
            <div className="space-y-4">
              <Field label={t('field_order_status')}>
                <SegmentedPicker value={editStatut} onChange={setEditStatut} options={STATUT_OPTIONS.filter(v => v) as any} cfg={STATUT_CFG} />
              </Field>
              <Field label={t('field_delivery_status')} icon={<Truck size={11} />}>
                <SegmentedPicker value={editLivraison} onChange={setEditLivraison} options={LIVRAISON_OPTIONS.filter(v => v) as any} cfg={STATUT_LIVRAISON_CFG} />
              </Field>
              <Field label={t('field_payment_status')} icon={<CreditCard size={11} />}>
                <SegmentedPicker value={editPaiement} onChange={setEditPaiement} options={PAIEMENT_OPTIONS.filter(v => v) as any} cfg={STATUT_PAIEMENT_CFG} />
              </Field>
            </div>
          </FormSection>

          <FormSection title={t('section_logistics')} icon={<Bike size={11} />}>
            <div className="space-y-4">
              <Field label={t('field_assign_driver')}>
                <CustomSelect
                  value={editLivreur}
                  onChange={setEditLivreur}
                  options={[
                    { value: '', label: t('none_driver') },
                    ...drivers.map(d => ({
                      value: d.id ?? d.user_id,
                      label: driverDisplayName(d)
                    })),
                  ]}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={t('field_est_date')} icon={<Calendar size={11} />}>
                  <input
                    type="date"
                    value={editDateEst}
                    onChange={e => setEditDateEst(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-gold/50"
                  />
                </Field>
                <Field label={t('field_fees')} icon={<Tag size={11} />}>
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

          <FormSection title={t('section_notes')} icon={<ClipboardList size={11} />}>
            <Field label={t('field_note')}>
              <textarea
                value={editNote}
                onChange={e => setEditNote(e.target.value)}
                rows={3}
                placeholder={t('note_placeholder')}
                className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-gold/50"
              />
            </Field>
          </FormSection>
        </OrderPopupModal>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          VALIDATION / DRIVER ASSIGNMENT MODAL
      ══════════════════════════════════════════════════════════════════ */}
      {validationModal && (
        <OrderPopupModal
          isOpen
          onClose={() => setValidationModal(null)}
          eyebrow={t('validation_eyebrow')}
          title={<span className="font-mono">{validationModal.numero_commande}</span>}
          size="xl"
          footer={
            <div className="flex flex-col-reverse sm:flex-row gap-2.5">
              <button
                onClick={() => setValidationModal(null)}
                className="w-full sm:w-auto rounded-lg border border-white/10 px-5 py-2.5 text-sm text-foreground/60 transition-colors hover:bg-white/6"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleConfirmValidation}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-emerald-400"
              >
                <CheckCircle size={15} />
                {t('confirm_validation')}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <FormSection title={t('section_recipient')} icon={<MapPin size={11} />}>
              <dl className="space-y-1.5 text-xs">
                <RowKV k={t('row_name')} v={validationModal.livraison_nom_complet} />
                <RowKV k={t('row_phone')} v={validationModal.livraison_telephone} />
                <RowKV k={t('row_address')} v={`${validationModal.livraison_ville}, ${validationModal.livraison_quartier}`} />
              </dl>
            </FormSection>

            <FormSection title={t('section_expedition')} icon={<Bike size={11} />}>
              <div className="space-y-4">
                <Field label={t('field_choose_driver')}>
                  <CustomSelect
                    value={valDriverId}
                    onChange={setValDriverId}
                    options={[
                      { value: '', label: t('assign_later') },
                      ...drivers.map(d => ({
                        value: d.id ?? d.user_id,
                        label: driverDisplayName(d)
                      })),
                    ]}
                  />
                </Field>

                <Field label={t('field_est_date_delivery')} icon={<Calendar size={11} />}>
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
// Form Field & Section Wrappers
// ─────────────────────────────────────────────────────────────────────────

function FormSection({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3 mb-4">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-foreground/40">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function FilterGroup({
  label, options, value, onChange, cfg, allLabel = 'Tous',
}: { label: string; options: string[]; value: string; onChange: (v: string) => void; cfg: Record<string, { label: string }>; allLabel?: string }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-foreground/35">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(v => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={cx(
              'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
              value === v ? 'border-gold/40 bg-gold/15 text-gold' : 'border-white/10 text-foreground/50 hover:border-white/20'
            )}
          >
            {v === '' ? allLabel : cfg[v]?.label ?? v}
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-foreground/35">
        {icon}{label}
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
// Mobile Card View - Alternative to Table for Phone screens
// ─────────────────────────────────────────────────────────────────────────

function CardView({
  orders, pendingIds, onView, onEdit, renderActions, emptyLabel, viewTitle = 'Voir', manageTitle = 'Gérer',
}: {
  orders: BackendOrder[];
  pendingIds: Set<string>;
  onView: (o: BackendOrder) => void;
  onEdit?: (o: BackendOrder) => void;
  renderActions: (o: BackendOrder) => React.ReactNode;
  emptyLabel: string;
  viewTitle?: string;
  manageTitle?: string;
}) {
  if (orders.length === 0) {
    return (
      <div className="py-10 text-center text-sm italic text-foreground/30 border border-white/10 rounded-xl">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map(order => {
        const isPending = pendingIds.has(String(order.id));
        return (
          <div key={order.id} className={cx('rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3', isPending && 'opacity-50')}>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-gold">
                {order.numero_commande}
                {isPending && <Loader2 size={11} className="animate-spin text-gold/70" />}
              </span>
              <StatusChip cfg={STATUT_CFG[order.statut]} />
            </div>

            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">{order.livraison_nom_complet}</p>
                <p className="text-[10px] text-foreground/40">{order.client_email}</p>
              </div>
              <p className="font-semibold text-foreground text-sm">{fmt(order.total_ttc)}</p>
            </div>

            <div className="flex items-center justify-between text-xs text-foreground/50 pt-1 border-t border-white/5">
              <span>{getDeliveryMethod(order)}</span>
              <span>{fmtDate(order.date_creation)}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1">
                <IconButton icon={<Eye size={16} />} title={viewTitle} onClick={() => onView(order)} tone="gold" />
                {onEdit && <IconButton icon={<ClipboardList size={16} />} title={manageTitle} onClick={() => onEdit(order)} tone="blue" />}
              </div>
              <div className="flex items-center gap-1.5">
                {renderActions(order)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Orders table (shared between "en cours" and "complétées")
// ─────────────────────────────────────────────────────────────────────────

function OrdersTable({
  heading, accent, count, orders, loading, pendingIds, emptyLabel, onView, onEdit, renderActions,
  tableHeaders = ['N° Commande', 'Client', 'Total TTC', 'Promo', 'Livreur', 'Statut', 'Livraison', 'Date', ''],
  loadingLabel = 'Chargement…',
  viewTitle = 'Voir',
  manageTitle = 'Gérer',
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
  tableHeaders?: string[];
  loadingLabel?: string;
  viewTitle?: string;
  manageTitle?: string;
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2">
        <span className={cx('h-1.5 w-1.5 rounded-full', accent)} />
        <h2 className="text-sm font-semibold text-foreground/85">{heading}</h2>
        <span className="text-xs text-foreground/35">{count}</span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-2.5 py-16 text-foreground/40 rounded-xl border border-white/10">
          <Loader2 className="animate-spin text-gold" size={26} />
          <p className="text-xs">{loadingLabel}</p>
        </div>
      ) : (
        <>
          {/* Mobile Card List View */}
          <div className="block md:hidden">
            <CardView
              orders={orders}
              pendingIds={pendingIds}
              onView={onView}
              onEdit={onEdit}
              renderActions={renderActions}
              emptyLabel={emptyLabel}
              viewTitle={viewTitle}
              manageTitle={manageTitle}
            />
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block min-h-[120px] overflow-hidden rounded-xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    {tableHeaders.map(h => (
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
                            <IconButton icon={<Eye size={14} />} title={viewTitle} onClick={() => onView(order)} tone="gold" />
                            {onEdit && <IconButton icon={<ClipboardList size={14} />} title={manageTitle} onClick={() => onEdit(order)} tone="blue" />}
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
          </div>
        </>
      )}
    </div>
  );
}

function TablePagination({
  page, totalPages, onChange, totalItems,
}: { page: number; totalPages: number; onChange: (p: number) => void; totalItems: number }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-1">
      <p className="text-[11px] text-foreground/40">{totalItems} {totalItems > 1 ? 'commandes' : 'commande'} · page {page}/{totalPages}</p>
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
              className={cx('h-6 w-6 rounded-md text-[11px] font-medium transition-colors', pg === page ? 'bg-gold text-black' : 'text-foreground/45 hover:bg-white/6')}
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
  order, onClose, onManage, onValidate, onCancel, onDownloadInvoice, downloadingInvoice, isCancellable, isEn,
}: {
  order: BackendOrder;
  onClose: () => void;
  onManage: () => void;
  onValidate: () => void;
  onCancel: () => void;
  onDownloadInvoice: () => void;
  downloadingInvoice: boolean;
  isCancellable: boolean;
  isEn: boolean;
}) {
  const t = (k: TKey) => isEn ? T.en[k] : T.fr[k];
  const lines = allLines(order);
  const groups: Array<{ title: string; icon: React.ReactNode; lines: BackendOrderLine[] }> = [
    { title: t('group_perfumes'),        icon: <Package size={12} />, lines: order.lignes_parfums },
    { title: t('group_accessories'),     icon: <Package size={12} />, lines: order.lignes_accessoires },
    { title: t('group_essences'),        icon: <Package size={12} />, lines: order.lignes_produit_fini_essence },
    { title: t('group_custom_perfumes'), icon: <Package size={12} />, lines: order.lignes_parfums_perso },
    { title: t('group_custom_essences'), icon: <Package size={12} />, lines: order.lignes_essence_personnalisee },
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
        <div className="flex flex-col-reverse sm:flex-row flex-wrap gap-2.5">
          <button onClick={onClose} className="w-full sm:w-auto rounded-lg border border-white/10 px-5 py-2.5 text-xs text-foreground/60 transition-colors hover:bg-white/6">
            {t('close')}
          </button>
          {isCancellable && (
            <button onClick={onCancel} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-500 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-red-400">
              <XCircle size={14} />{t('cancel')}
            </button>
          )}
          {order.statut === 'en_attente' && (
            <button onClick={onValidate} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-emerald-400">
              <CheckCircle size={14} />{t('validate')}
            </button>
          )}
          <button onClick={onManage} className="inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg bg-gold px-5 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-gold/85">
            <ClipboardList size={14} />{t('manage')}
          </button>
        </div>
      }
    >
      <div className="space-y-6">

        {/* Summary strip */}
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3.5 sm:px-4 sm:py-3">
          <SummaryStat label={t('receipt_total')} value={fmt(order.total_ttc)} emphasize />
          <div className="hidden sm:block h-8 w-px bg-white/10" />
          <SummaryStat label={t('field_payment_status')} node={<StatusChip cfg={STATUT_PAIEMENT_CFG[order.statut_paiement]} />} />
          <div className="hidden sm:block h-8 w-px bg-white/10" />
          <SummaryStat label={t('section_delivery')} value={getDeliveryMethod(order, isEn)} />
          {order.code_promo_utilise && (
            <>
              <div className="hidden sm:block h-8 w-px bg-white/10" />
              <SummaryStat label={t('table_promo')} node={<span className="rounded border border-gold/20 bg-gold/10 px-1.5 py-0.5 font-mono text-xs text-gold">{order.code_promo_utilise}</span>} />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Left: delivery + notes */}
          <div className="space-y-5 lg:col-span-2">
            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <SectionLabel icon={<MapPin size={11} />}>{t('section_delivery')}</SectionLabel>
              <dl className="space-y-1.5 text-xs">
                <RowKV k={t('row_recipient')} v={order.livraison_nom_complet} />
                <RowKV k={t('row_phone')} v={order.livraison_telephone} />
                {order.livraison_ville && (
                  <RowKV k={t('row_city')} v={`${order.livraison_ville}${order.livraison_quartier ? ` – ${order.livraison_quartier}` : ''}`} />
                )}
                <RowKV k={t('row_driver')} v={order.livreur_nom ?? '—'} />
                <RowKV k={t('row_est_date')} v={fmtDate(order.date_livraison_estimee)} />
                <RowKV k={t('row_actual_date')} v={fmtDate(order.date_livraison_reelle)} />
              </dl>
              {order.motif_echec_livraison && (
                <div className="mt-3 flex gap-2 rounded-lg bg-red-500/8 p-2.5 text-xs text-red-400">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  {order.motif_echec_livraison}
                </div>
              )}
            </section>

            {(order.note_client || order.note_interne) && (
              <section className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                {order.note_client && (
                  <div>
                    <SectionLabel icon={<Phone size={11} />}>{t('row_note_client')}</SectionLabel>
                    <p className="text-xs leading-relaxed text-foreground/65">{order.note_client}</p>
                  </div>
                )}
                {order.note_interne && (
                  <div className={order.note_client ? 'mt-3 pt-3 border-t border-white/5' : ''}>
                    <SectionLabel icon={<ClipboardList size={11} />}>{t('row_note_internal')}</SectionLabel>
                    <p className="text-xs leading-relaxed text-foreground/65">{order.note_interne}</p>
                  </div>
                )}
              </section>
            )}

            {(order.facture || order.statut_paiement === 'payé') && (
              <section>
                <SectionLabel icon={<FileText size={11} />}>{t('section_invoice')}</SectionLabel>
                <div className="space-y-2.5 rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                  {order.facture?.numero_facture && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground/40">N° {order.facture.numero_facture}</span>
                      <span className="text-foreground/50">{fmtDate(order.facture.date_emission)}</span>
                    </div>
                  )}
                  {order.facture?.envoye_par_email && (
                    <p className="flex items-center gap-1.5 text-[11px] text-emerald-400/80"><Mail size={11} />{t('invoice_sent_email')}</p>
                  )}
                  <div className="flex gap-2">
                    {order.facture?.fichier_pdf && (
                      <a
                        href={order.facture.fichier_pdf}
                        target="_blank" rel="noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 py-2 text-xs font-medium text-foreground/75 transition-colors hover:bg-white/6"
                      >
                        <FileText size={13} />{t('invoice_open')}
                      </a>
                    )}
                    <button
                      onClick={onDownloadInvoice}
                      disabled={downloadingInvoice}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500/15 py-2 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/25 transition-colors hover:bg-emerald-500/25 disabled:opacity-50"
                    >
                      {downloadingInvoice ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                      {t('invoice_download')}
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Right: items + receipt */}
          <div className="space-y-5 lg:col-span-3">
            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <SectionLabel icon={<Package size={11} />}>{t('section_items')} ({lines.length})</SectionLabel>
              <div className="max-h-[280px] space-y-4 overflow-y-auto pr-1">
                {groups.map(g => (
                  <LinesGroup key={g.title} title={g.title} icon={g.icon} lines={g.lines} isEn={isEn} />
                ))}
                {lines.length === 0 && <p className="py-4 text-center text-xs italic text-foreground/30">{t('no_items')}</p>}
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <SectionLabel icon={<CreditCard size={11} />}>{t('section_receipt')}</SectionLabel>
              <div className="space-y-1.5 text-xs">
                <ReceiptRow k={t('receipt_subtotal')} v={fmt(order.sous_total)} />
                <ReceiptRow k={t('receipt_delivery_fees')} v={fmt(order.frais_livraison)} />
                {Number(order.remise_code_promo) > 0 && <ReceiptRow k={t('receipt_promo_discount')} v={`-${fmt(order.remise_code_promo)}`} negative />}
                <div className="my-1.5 border-t border-dashed border-white/10" />
                <ReceiptRow k={t('receipt_total')} v={fmt(order.total_ttc)} bold />
                <div className="my-1.5 border-t border-white/10" />
                <ReceiptRow k={t('receipt_commission')} v={`${fmt(order.commission_montant)} · ${order.commission_statut}`} muted />
                <ReceiptRow k={t('receipt_provider')} v={order.prestataire_code ?? '—'} muted />
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

function ColorPopup({ color, onClose }: { color: string; onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center gap-5 rounded-2xl border border-white/15 bg-background p-7 shadow-2xl w-full max-w-[260px]"
        onClick={e => e.stopPropagation()}
      >
        {/* Large color swatch */}
        <div
          className="h-32 w-32 rounded-full border-4 border-white/20 shadow-2xl"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 40px ${color}60, 0 0 80px ${color}30, inset 0 0 20px ${color}20`,
          }}
        />

        {/* Hex code */}
        <div className="text-center space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground/35">
            Couleur du flacon
          </p>
          <code className="block rounded-lg border border-white/10 bg-white/[0.04] px-4 py-1.5 font-mono text-sm font-bold tracking-widest text-gold">
            {color.toUpperCase()}
          </code>
        </div>

        {/* Copy button */}
        <button
          onClick={() => { navigator.clipboard?.writeText(color); onClose(); }}
          className="w-full rounded-xl border border-white/10 py-2 text-xs font-medium text-foreground/60 transition-colors hover:border-gold/30 hover:text-gold"
        >
          Copier
        </button>

        <button
          onClick={onClose}
          className="absolute top-3 right-3 rounded-full p-1.5 text-foreground/30 transition-colors hover:text-foreground"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

function LinesGroup({ title, icon, lines, isEn = false }: { title: string; icon: React.ReactNode; lines: BackendOrderLine[]; isEn?: boolean }) {
  const [colorPreview, setColorPreview] = useState<string | null>(null);

  return (
    <div>
      {/* Color popup */}
      {colorPreview && <ColorPopup color={colorPreview} onClose={() => setColorPreview(null)} />}

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
            <div key={line.id} className="rounded-lg border border-white/8 bg-white/[0.015] p-2.5 sm:px-3 sm:py-2 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3">
                <span className="font-medium text-foreground/85">{name}</span>
                <div className="flex shrink-0 items-center justify-between sm:justify-start gap-3 text-foreground/45">
                  <span>{line.quantite} × {Number(line.prix_unitaire_snapshot).toLocaleString()} FCFA</span>
                  <span className="font-semibold text-foreground/75">{Number(line.sous_total).toLocaleString()} FCFA</span>
                </div>
              </div>
              {isCustom && line.composition?.lignes && line.composition.lignes.length > 0 && (
                <div className="mt-2 ml-3 space-y-1 border-l border-white/10 pl-3">
                  {line.composition.lignes.map((essence, i) => (
                    <div key={i} className="flex justify-between text-foreground/50">
                      <span>{essence.essence_nom || 'Essence'}</span>
                      <span>{essence.quantite_ml || '—'} ml</span>
                    </div>
                  ))}
                  {line.composition.flacon_nom && (
                    <div className="flex justify-between items-center text-foreground/35">
                      <span>{isEn ? T.en.flacon : T.fr.flacon}</span>
                      <span>{line.composition.flacon_nom} {line.composition.flacon_contenance_ml ? `· ${line.composition.flacon_contenance_ml}ml` : ''}</span>
                    </div>
                  )}
                  {line.composition.couleur && (
                    <div className="flex justify-between items-center text-foreground/35 pt-1 border-t border-white/5">
                      <span>{isEn ? 'Color' : 'Couleur'}</span>
                      <div className="flex items-center gap-2">
                        <code className="text-[10px] font-mono text-gold">{line.composition.couleur}</code>
                        <button
                          type="button"
                          onClick={() => setColorPreview(line.composition!.couleur!)}
                          title="Voir la couleur en grand"
                          className="group relative w-6 h-6 rounded-full border-2 border-white/20 shadow-md transition-all hover:scale-125 hover:border-white/60 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gold/50"
                          style={{ backgroundColor: line.composition.couleur }}
                        >
                          <span
                            className="absolute inset-0 rounded-full pointer-events-none"
                            style={{
                              boxShadow: `inset 0 0 4px ${line.composition.couleur}40, 0 0 8px ${line.composition.couleur}40`,
                            }}
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {hasDetailMeta && (
                <div className="mt-2 ml-0 space-y-1 text-[11px] text-foreground/50 border-t border-white/5 pt-1.5">
                  <div className="flex justify-between gap-2">
                    <span>{[detailMeta.essenceName, detailMeta.marque].filter(Boolean).join(' · ') || (isEn ? T.en.essence_product : T.fr.essence_product)}</span>
                    <span>{detailMeta.tailleMl ? `${detailMeta.tailleMl} ml` : ''}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>{isEn ? T.en.category : T.fr.category}: {detailMeta.categorie || '—'}</span>
                    <span>
                      {detailMeta.prixParMl
                        ? `${Number(detailMeta.prixParMl).toLocaleString()} FCFA/ml`
                        : detailMeta.prixActuel
                          ? `${Number(detailMeta.prixActuel).toLocaleString()} FCFA`
                          : '—'}
                    </span>
                  </div>
                  {detailMeta.codeReference && (
                    <div className="text-[10px] text-foreground/35">{isEn ? T.en.ref : T.fr.ref}: {detailMeta.codeReference}</div>
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