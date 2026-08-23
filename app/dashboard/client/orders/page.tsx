'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { useTranslation } from 'react-i18next';
import { BackButton } from '@/components/ui/BackButton';

// ─────────────────────────────────────────────────────────────────────────
// Config — color/dot styling only (language-independent). Labels are
// merged in at render time from STATUS_LABELS based on the current language.
// ─────────────────────────────────────────────────────────────────────────

const STATUT_META: Record<string, { color: string; dot: string }> = {
  en_attente:   { color: 'text-amber-400 bg-amber-500/10 ring-amber-500/20',   dot: 'bg-amber-400'   },
  'validé':     { color: 'text-blue-400 bg-blue-500/10 ring-blue-500/20',       dot: 'bg-blue-400'    },
  'annulée':    { color: 'text-red-400 bg-red-500/10 ring-red-500/20',          dot: 'bg-red-400'     },
  'remboursée': { color: 'text-purple-400 bg-purple-500/10 ring-purple-500/20', dot: 'bg-purple-400'  },
};

const STATUT_LIVRAISON_META: Record<string, { color: string; dot: string }> = {
  en_attente_affectation: { color: 'text-amber-400 bg-amber-500/10 ring-amber-500/20',    dot: 'bg-amber-400'   },
  'assignée':              { color: 'text-blue-400 bg-blue-500/10 ring-blue-500/20',      dot: 'bg-blue-400'    },
  'livrée':                { color: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20', dot: 'bg-emerald-400' },
  'échouée':               { color: 'text-red-400 bg-red-500/10 ring-red-500/20',         dot: 'bg-red-400'     },
};

const STATUT_PAIEMENT_META: Record<string, { color: string; dot: string }> = {
  en_attente: { color: 'text-amber-400 bg-amber-500/10 ring-amber-500/20',    dot: 'bg-amber-400'   },
  'payé':     { color: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20', dot: 'bg-emerald-400' },
  'échoué':   { color: 'text-red-400 bg-red-500/10 ring-red-500/20',          dot: 'bg-red-400'     },
};

const STATUT_OPTIONS    = ['', 'en_attente', 'validé', 'annulée', 'remboursée'];
const LIVRAISON_OPTIONS = ['', 'en_attente_affectation', 'assignée', 'livrée', 'échouée'];
const PAIEMENT_OPTIONS  = ['', 'en_attente', 'payé', 'échoué'];

const PAGE_SIZE = 100;
const ROWS_PER_TABLE = 10;

// ─────────────────────────────────────────────────────────────────────────
// Translation — this page has no shared locale-file setup yet, so all
// strings live here and switch based on the app's current language.
// ─────────────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { commande: Record<string, string>; livraison: Record<string, string>; paiement: Record<string, string> }> = {
  fr: {
    commande: { en_attente: 'En attente', 'validé': 'Validé', 'annulée': 'Annulée', 'remboursée': 'Remboursée' },
    livraison: { en_attente_affectation: 'Non assignée', 'assignée': 'Assignée', 'livrée': 'Livrée', 'échouée': 'Échouée' },
    paiement: { en_attente: 'En attente', 'payé': 'Payé', 'échoué': 'Échoué' },
  },
  en: {
    commande: { en_attente: 'Pending', 'validé': 'Validated', 'annulée': 'Cancelled', 'remboursée': 'Refunded' },
    livraison: { en_attente_affectation: 'Unassigned', 'assignée': 'Assigned', 'livrée': 'Delivered', 'échouée': 'Failed' },
    paiement: { en_attente: 'Pending', 'payé': 'Paid', 'échoué': 'Failed' },
  },
};

function withLabels(meta: Record<string, { color: string; dot: string }>, labels: Record<string, string>) {
  const out: Record<string, { label: string; color: string; dot: string }> = {};
  for (const k in meta) out[k] = { ...meta[k], label: labels[k] ?? k };
  return out;
}

const LOCAL_STRINGS: Record<string, Record<string, string>> = {
  fr: {
    page_title: 'Commandes',
    orders_word_singular: 'commande',
    orders_word_plural: 'commandes',
    in_total: 'au total',
    refresh: 'Actualiser',
    kpi_total: 'Total',
    kpi_pending: 'En attente',
    kpi_validated: 'Validées',
    kpi_paid: 'Payées',
    kpi_cancelled: 'Annulées',
    search_placeholder: 'N° commande, e-mail, téléphone…',
    client_name_placeholder: 'Nom client',
    filters: 'Filtres',
    filter_order_status: 'Statut commande',
    filter_delivery_status: 'Statut livraison',
    filter_payment: 'Paiement',
    filter_all: 'Tous',
    ongoing_heading: 'En cours',
    completed_heading: 'Complétées',
    empty_ongoing: 'Aucune commande en cours.',
    empty_completed: 'Aucune commande complétée.',
    col_order_number: 'N° Commande',
    col_client: 'Client',
    col_total_ttc: 'Total TTC',
    col_promo: 'Promo',
    col_driver: 'Livreur',
    col_status: 'Statut',
    col_delivery: 'Livraison',
    col_date: 'Date',
    view_details: 'Voir le détail',
    edit_manage: 'Modifier / gérer',
    action_validate: 'Valider',
    action_delivered: 'Livré',
    action_cancel: 'Annuler',
    action_refund: 'Rembourser',
    delivery_mode_delivery: 'Livraison',
    delivery_mode_pickup: 'Retrait boutique',
    driver_fallback: 'Livreur #{id}',
    page_of: 'Page {page} / {totalPages}',
    server_pagination_summary: '{total} commandes',
    table_pagination_summary: '{count} {word} · page {page}/{totalPages}',
    confirm_cancel_order: 'Annuler la commande {num} ?',
    confirm_validate_pickup: 'Valider la commande pickup {num} ?',
    confirm_mark_delivered: 'Marquer la commande {num} comme livrée (et payée) ?',
    confirm_refund: 'Rembourser la commande {num} ?',
    toast_load_error: 'Erreur lors du chargement des commandes',
    toast_update_success: 'Commande mise à jour avec succès',
    toast_update_error: 'Erreur lors de la mise à jour',
    toast_invoice_downloaded: 'Facture PDF téléchargée',
    toast_invoice_unavailable: 'Facture non disponible',
    toast_order_cancelled: 'Commande annulée',
    toast_cancel_error: "Erreur lors de l'annulation",
    toast_pickup_validated: 'Commande pickup validée avec succès',
    toast_validate_error: 'Erreur lors de la validation',
    toast_validated_driver_assigned: 'Commande validée et livreur assigné',
    toast_marked_delivered: 'Commande marquée comme livrée et payée',
    toast_delivery_update_error: 'Erreur lors de la mise à jour de la livraison',
    toast_marked_refunded: 'Commande marquée comme remboursée',
    toast_refund_error: 'Erreur lors du remboursement',
    manage_order: 'Gérer la commande',
    section_status_tracking: 'Statuts & Suivi',
    field_order_status: 'Statut de la commande',
    field_delivery_status: 'Statut de livraison',
    field_payment_status: 'Statut paiement',
    section_shipping_fees: 'Acheminement & Frais',
    field_assign_driver: 'Assigner un livreur',
    option_none: '— Aucun —',
    option_assign_later: '— Assigner plus tard —',
    field_estimated_date: 'Date estimée',
    field_delivery_fee: 'Frais de livraison',
    section_team_notes: "Notes d'équipe",
    field_internal_note: 'Note interne',
    internal_note_placeholder: "Commentaire interne visible uniquement par l'équipe…",
    cancel: 'Annuler',
    saving: 'Enregistrement…',
    save_changes: 'Enregistrer les modifications',
    validation_delivery: 'Validation & livraison',
    section_recipient: 'Destinataire',
    label_name: 'Nom',
    label_phone: 'Téléphone',
    label_address: 'Adresse',
    section_assignment: 'Assignation',
    field_choose_driver: 'Choisir un livreur',
    field_estimated_delivery_date: 'Date estimée de livraison',
    confirm_validation: 'Confirmer la validation',
    group_perfumes: 'Parfums',
    group_accessories: 'Accessoires',
    group_finished_essences: 'Essences finies',
    group_custom_perfumes: 'Parfums personnalisés',
    group_custom_essences: 'Essences personnalisées',
    close: 'Fermer',
    manage: 'Gérer',
    summary_total_ttc: 'Total TTC',
    summary_payment: 'Paiement',
    summary_mode: 'Mode',
    summary_promo_code: 'Code promo',
    section_delivery: 'Livraison',
    label_recipient: 'Destinataire',
    label_city: 'Ville',
    label_driver: 'Livreur',
    label_estimated_date: 'Date estimée',
    label_actual_date: 'Date réelle',
    section_client_note: 'Note client',
    section_internal_note: 'Note interne',
    section_invoice: 'Facture',
    invoice_sent_by_email: 'Envoyée par e-mail',
    open: 'Ouvrir',
    download: 'Télécharger',
    section_articles: 'Articles ({count})',
    no_articles: 'Aucun article dans cette commande.',
    section_summary: 'Récapitulatif',
    row_subtotal: 'Sous-total',
    row_delivery_fee: 'Frais de livraison',
    row_promo_discount: 'Remise promo',
    row_total_ttc: 'Total TTC',
    row_commission: 'Commission',
    row_provider: 'Prestataire',
    article_fallback: 'Article',
    essence_fallback: 'Essence',
    flask_label: 'Flacon',
    category_label: 'Catégorie',
    reference_label: 'Réf',
    finished_product_fallback: 'Produit fini',
  },
  en: {
    page_title: 'Orders',
    orders_word_singular: 'order',
    orders_word_plural: 'orders',
    in_total: 'in total',
    refresh: 'Refresh',
    kpi_total: 'Total',
    kpi_pending: 'Pending',
    kpi_validated: 'Validated',
    kpi_paid: 'Paid',
    kpi_cancelled: 'Cancelled',
    search_placeholder: 'Order #, email, phone…',
    client_name_placeholder: 'Client name',
    filters: 'Filters',
    filter_order_status: 'Order status',
    filter_delivery_status: 'Delivery status',
    filter_payment: 'Payment',
    filter_all: 'All',
    ongoing_heading: 'Ongoing',
    completed_heading: 'Completed',
    empty_ongoing: 'No ongoing orders.',
    empty_completed: 'No completed orders.',
    col_order_number: 'Order #',
    col_client: 'Client',
    col_total_ttc: 'Total',
    col_promo: 'Promo',
    col_driver: 'Driver',
    col_status: 'Status',
    col_delivery: 'Delivery',
    col_date: 'Date',
    view_details: 'View details',
    edit_manage: 'Edit / manage',
    action_validate: 'Validate',
    action_delivered: 'Delivered',
    action_cancel: 'Cancel',
    action_refund: 'Refund',
    delivery_mode_delivery: 'Delivery',
    delivery_mode_pickup: 'Store pickup',
    driver_fallback: 'Driver #{id}',
    page_of: 'Page {page} / {totalPages}',
    server_pagination_summary: '{total} orders',
    table_pagination_summary: '{count} {word} · page {page}/{totalPages}',
    confirm_cancel_order: 'Cancel order {num}?',
    confirm_validate_pickup: 'Validate pickup order {num}?',
    confirm_mark_delivered: 'Mark order {num} as delivered (and paid)?',
    confirm_refund: 'Refund order {num}?',
    toast_load_error: 'Error loading orders',
    toast_update_success: 'Order updated successfully',
    toast_update_error: 'Error updating order',
    toast_invoice_downloaded: 'Invoice PDF downloaded',
    toast_invoice_unavailable: 'Invoice unavailable',
    toast_order_cancelled: 'Order cancelled',
    toast_cancel_error: 'Error cancelling order',
    toast_pickup_validated: 'Pickup order validated successfully',
    toast_validate_error: 'Error validating order',
    toast_validated_driver_assigned: 'Order validated and driver assigned',
    toast_marked_delivered: 'Order marked as delivered and paid',
    toast_delivery_update_error: 'Error updating delivery',
    toast_marked_refunded: 'Order marked as refunded',
    toast_refund_error: 'Error refunding order',
    manage_order: 'Manage order',
    section_status_tracking: 'Status & Tracking',
    field_order_status: 'Order status',
    field_delivery_status: 'Delivery status',
    field_payment_status: 'Payment status',
    section_shipping_fees: 'Shipping & Fees',
    field_assign_driver: 'Assign a driver',
    option_none: '— None —',
    option_assign_later: '— Assign later —',
    field_estimated_date: 'Estimated date',
    field_delivery_fee: 'Delivery fee',
    section_team_notes: 'Team Notes',
    field_internal_note: 'Internal note',
    internal_note_placeholder: 'Internal comment visible only to the team…',
    cancel: 'Cancel',
    saving: 'Saving…',
    save_changes: 'Save changes',
    validation_delivery: 'Validation & delivery',
    section_recipient: 'Recipient',
    label_name: 'Name',
    label_phone: 'Phone',
    label_address: 'Address',
    section_assignment: 'Assignment',
    field_choose_driver: 'Choose a driver',
    field_estimated_delivery_date: 'Estimated delivery date',
    confirm_validation: 'Confirm validation',
    group_perfumes: 'Perfumes',
    group_accessories: 'Accessories',
    group_finished_essences: 'Finished essences',
    group_custom_perfumes: 'Custom perfumes',
    group_custom_essences: 'Custom essences',
    close: 'Close',
    manage: 'Manage',
    summary_total_ttc: 'Total',
    summary_payment: 'Payment',
    summary_mode: 'Mode',
    summary_promo_code: 'Promo code',
    section_delivery: 'Delivery',
    label_recipient: 'Recipient',
    label_city: 'City',
    label_driver: 'Driver',
    label_estimated_date: 'Estimated date',
    label_actual_date: 'Actual date',
    section_client_note: 'Client note',
    section_internal_note: 'Internal note',
    section_invoice: 'Invoice',
    invoice_sent_by_email: 'Sent by email',
    open: 'Open',
    download: 'Download',
    section_articles: 'Items ({count})',
    no_articles: 'No items in this order.',
    section_summary: 'Summary',
    row_subtotal: 'Subtotal',
    row_delivery_fee: 'Delivery fee',
    row_promo_discount: 'Promo discount',
    row_total_ttc: 'Total',
    row_commission: 'Commission',
    row_provider: 'Provider',
    article_fallback: 'Item',
    essence_fallback: 'Essence',
    flask_label: 'Bottle',
    category_label: 'Category',
    reference_label: 'Ref',
    finished_product_fallback: 'Finished product',
  },
};

function translate(lang: string, key: string, vars?: Record<string, string | number>) {
  let str = LOCAL_STRINGS[lang]?.[key] ?? LOCAL_STRINGS.fr[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) str = str.replace(`{${k}}`, String(v));
  }
  return str;
}

// ─────────────────────────────────────────────────────────────────────────
// Small primitives
// ─────────────────────────────────────────────────────────────────────────

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function fmt(v?: string | number | null, lang: string = 'fr') {
  if (v == null || v === '') return '—';
  return Number(v).toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR') + ' FCFA';
}

function fmtDate(d?: string | null, time = false, lang: string = 'fr') {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', {
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

function getDeliveryMethod(order: BackendOrder, lang: string): string {
  return order.livreur ? translate(lang, 'delivery_mode_delivery') : translate(lang, 'delivery_mode_pickup');
}

function driverDisplayName(d: any, lang: string): string {
  return d.user_details?.first_name
    ? `${d.user_details.first_name} ${d.user_details.last_name ?? ''}`.trim()
    : d.name ?? translate(lang, 'driver_fallback', { id: d.id });
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
  const { i18n } = useTranslation();
  const lang = LOCAL_STRINGS[i18n.language] ? i18n.language : 'fr';
  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);

  const statutCfg    = useMemo(() => withLabels(STATUT_META, STATUS_LABELS[lang].commande), [lang]);
  const livraisonCfg = useMemo(() => withLabels(STATUT_LIVRAISON_META, STATUS_LABELS[lang].livraison), [lang]);
  const paiementCfg  = useMemo(() => withLabels(STATUT_PAIEMENT_META, STATUS_LABELS[lang].paiement), [lang]);

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
      addToast(t('toast_load_error'), 'error');
    } finally {
      setLoading(false);
    }
  }, [page, statutFilter, livraisonFilter, paiementFilter, nomFilter, search, addToast, lang]);

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
        ...(driverObj ? { livreur: Number(editLivreur), livreur_nom: driverDisplayName(driverObj, lang) } : {}),
        ...(editDateEst ? { date_livraison_estimee: editDateEst } : {}),
        ...(editFrais ? { frais_livraison: editFrais } : {}),
      },
      apiCall: () => orderService.updateOrder(order.numero_commande, payload),
      successMessage: t('toast_update_success'),
      errorMessage: t('toast_update_error'),
    });
    setIsSavingEdit(false);
  };

  const handleDownloadInvoice = async (order: BackendOrder) => {
    const num = order.numero_commande ?? String(order.id);
    setDownloadingInvoice(true);
    try {
      await invoiceService.downloadInvoiceFile(num, `facture-${num}.pdf`);
      addToast(t('toast_invoice_downloaded'), 'success');
    } catch (err: any) {
      addToast(err.response?.data?.detail ?? t('toast_invoice_unavailable'), 'error');
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
    if (!confirm(t('confirm_cancel_order', { num: order.numero_commande }))) return;
    await runOptimisticUpdate({
      orderId: order.id,
      patch: { statut: 'annulée' },
      apiCall: () => orderService.cancelOrder(order.numero_commande),
      successMessage: t('toast_order_cancelled'),
      errorMessage: t('toast_cancel_error'),
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
    if (!confirm(t('confirm_validate_pickup', { num: order.numero_commande }))) return;
    await runOptimisticUpdate({
      orderId: order.id,
      patch: { statut: 'validé', statut_livraison: 'en_attente_affectation' },
      apiCall: () => orderService.updateOrder(order.numero_commande, {
        statut: 'validé', statut_livraison: 'en_attente_affectation',
      }),
      successMessage: t('toast_pickup_validated'),
      errorMessage: t('toast_validate_error'),
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
        ...(driverObj ? { livreur: Number(valDriverId), livreur_nom: driverDisplayName(driverObj, lang) } : {}),
        ...(valDateEst ? { date_livraison_estimee: valDateEst } : {}),
      },
      apiCall: () => orderService.updateOrder(order.numero_commande, payload),
      successMessage: t('toast_validated_driver_assigned'),
      errorMessage: t('toast_validate_error'),
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
    if (!confirm(t('confirm_mark_delivered', { num: order.numero_commande }))) return;
    await runOptimisticUpdate({
      orderId: order.id,
      patch: { statut_livraison: 'livrée', statut_paiement: 'payé' },
      apiCall: () => orderService.updateOrder(order.numero_commande, {
        statut_livraison: 'livrée', statut_paiement: 'payé',
      }),
      successMessage: t('toast_marked_delivered'),
      errorMessage: t('toast_delivery_update_error'),
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
    if (!confirm(t('confirm_refund', { num: order.numero_commande }))) return;
    await runOptimisticUpdate({
      orderId: order.id,
      patch: { statut: 'remboursée', statut_paiement: 'échoué' },
      apiCall: () => orderService.updateOrder(order.numero_commande, {
        statut: 'remboursée', statut_paiement: 'échoué',
      }),
      successMessage: t('toast_marked_refunded'),
      errorMessage: t('toast_refund_error'),
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

  const tableHeaders = [
    t('col_order_number'), t('col_client'), t('col_total_ttc'), t('col_promo'),
    t('col_driver'), t('col_status'), t('col_delivery'), t('col_date'), '',
  ];

  return (
    <div className="space-y-6 px-4 sm:px-6 py-4 sm:py-6">
      <BackButton />

      {/* Header ------------------------------------------------------------ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t('page_title')}</h1>
          <p className="mt-0.5 text-sm text-foreground/40">
            {total.toLocaleString()} {total > 1 ? t('orders_word_plural') : t('orders_word_singular')} {t('in_total')}
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
              placeholder={t('search_placeholder')}
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
                placeholder={t('client_name_placeholder')}
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
              {t('filters')}
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
              label={t('filter_order_status')}
              allLabel={t('filter_all')}
              options={STATUT_OPTIONS}
              value={statutFilter}
              onChange={v => { setStatutFilter(v); setPage(1); }}
              cfg={statutCfg}
            />
            <FilterGroup
              label={t('filter_delivery_status')}
              allLabel={t('filter_all')}
              options={LIVRAISON_OPTIONS}
              value={livraisonFilter}
              onChange={v => { setLivraisonFilter(v); setPage(1); }}
              cfg={livraisonCfg}
            />
            <FilterGroup
              label={t('filter_payment')}
              allLabel={t('filter_all')}
              options={PAIEMENT_OPTIONS}
              value={paiementFilter}
              onChange={v => { setPaiementFilter(v); setPage(1); }}
              cfg={paiementCfg}
            />
          </div>
        )}
      </div>

      {/* Table: en cours --------------------------------------------------- */}
      <OrdersTable
        heading={t('ongoing_heading')}
        accent="bg-amber-400"
        count={ongoingOrders.length}
        orders={visibleOngoingOrders}
        loading={loading}
        pendingIds={pendingIds}
        emptyLabel={t('empty_ongoing')}
        onView={setSelected}
        onEdit={openEdit}
        headers={tableHeaders}
        viewLabel={t('view_details')}
        editLabel={t('edit_manage')}
        statutCfg={statutCfg}
        lang={lang}
        renderActions={order => (
          <>
            {order.statut === 'en_attente' && (
              <ActionButton tone="emerald" onClick={() => handleValidateClick(order)}>{t('action_validate')}</ActionButton>
            )}
            {order.statut === 'validé' && order.statut_livraison !== 'livrée' && (
              <ActionButton tone="blue" icon={<Truck size={11} />} onClick={() => handleMarkDelivered(order)}>{t('action_delivered')}</ActionButton>
            )}
            {isCancellable(order) && (
              <ActionButton tone="red" onClick={() => handleCancel(order)}>{t('action_cancel')}</ActionButton>
            )}
          </>
        )}
      />
      {!loading && ongoingOrders.length > 0 && (
        <TablePagination page={ongoingPage} totalPages={ongoingTotalPages} onChange={setOngoingPage} totalItems={ongoingOrders.length} lang={lang} />
      )}

      {/* Table: complétées --------------------------------------------------- */}
      <div className="pt-2">
        <OrdersTable
          heading={t('completed_heading')}
          accent="bg-emerald-400"
          count={completedOrders.length}
          orders={visibleCompletedOrders}
          loading={loading}
          pendingIds={pendingIds}
          emptyLabel={t('empty_completed')}
          onView={setSelected}
          headers={tableHeaders}
          viewLabel={t('view_details')}
          editLabel={t('edit_manage')}
          statutCfg={statutCfg}
          lang={lang}
          renderActions={order => (
            order.statut !== 'remboursée' && order.statut !== 'annulée' && (
              <ActionButton tone="purple" onClick={() => handleRefund(order)}>{t('action_refund')}</ActionButton>
            )
          )}
        />
      </div>
      {!loading && completedOrders.length > 0 && (
        <TablePagination page={completedPage} totalPages={completedTotalPages} onChange={setCompletedPage} totalItems={completedOrders.length} lang={lang} />
      )}

      {/* Server page control --------------------------------------------------- */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-foreground/40">
            {t('page_of', { page, totalPages })} · {t('server_pagination_summary', { total: total.toLocaleString() })}
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
          lang={lang}
          statutCfg={statutCfg}
          paiementCfg={paiementCfg}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          EDIT / MANAGE MODAL
      ══════════════════════════════════════════════════════════════════ */}
      {editModal && (
        <OrderPopupModal
          isOpen
          onClose={() => setEditModal(null)}
          eyebrow={t('manage_order')}
          title={<span className="font-mono">{editModal.numero_commande}</span>}
          size="2xl"
          footer={
            <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
              <button
                onClick={() => setEditModal(null)}
                className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium text-foreground/60 transition-colors hover:bg-white/6"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={isSavingEdit}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gold py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gold/85 disabled:opacity-60"
              >
                {isSavingEdit ? <Loader2 size={14} className="animate-spin" /> : null}
                {isSavingEdit ? t('saving') : t('save_changes')}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <FormSection title={t('section_status_tracking')} icon={<ClipboardList size={11} />}>
              <div className="space-y-4">
                <Field label={t('field_order_status')}>
                  <SegmentedPicker value={editStatut} onChange={setEditStatut} options={STATUT_OPTIONS.filter(v => v) as any} cfg={statutCfg} />
                </Field>
                <Field label={t('field_delivery_status')} icon={<Truck size={11} />}>
                  <SegmentedPicker value={editLivraison} onChange={setEditLivraison} options={LIVRAISON_OPTIONS.filter(v => v) as any} cfg={livraisonCfg} />
                </Field>
                <Field label={t('field_payment_status')} icon={<CreditCard size={11} />}>
                  <SegmentedPicker value={editPaiement} onChange={setEditPaiement} options={PAIEMENT_OPTIONS.filter(v => v) as any} cfg={paiementCfg} />
                </Field>
              </div>
            </FormSection>

            <FormSection title={t('section_shipping_fees')} icon={<Bike size={11} />}>
              <div className="space-y-4">
                <Field label={t('field_assign_driver')} icon={<Bike size={11} />}>
                  <select
                    value={editLivreur}
                    onChange={e => setEditLivreur(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-gold/50"
                  >
                    <option value="" className="bg-background">{t('option_none')}</option>
                    {drivers.map(d => {
                      const id = d.id ?? d.user_id;
                      return <option key={id} value={id} className="bg-background">{driverDisplayName(d, lang)}</option>;
                    })}
                  </select>
                </Field>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label={t('field_estimated_date')} icon={<Calendar size={11} />}>
                    <input
                      type="date"
                      value={editDateEst}
                      onChange={e => setEditDateEst(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-gold/50"
                    />
                  </Field>
                  <Field label={t('field_delivery_fee')} icon={<Tag size={11} />}>
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

            <FormSection title={t('section_team_notes')} icon={<ClipboardList size={11} />}>
              <Field label={t('field_internal_note')}>
                <textarea
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  rows={3}
                  placeholder={t('internal_note_placeholder')}
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
          eyebrow={t('validation_delivery')}
          title={<span className="font-mono">{validationModal.numero_commande}</span>}
          size="xl"
          footer={
            <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
              <button
                onClick={() => setValidationModal(null)}
                className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium text-foreground/60 transition-colors hover:bg-white/6"
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
                <RowKV k={t('label_name')} v={validationModal.livraison_nom_complet} />
                <RowKV k={t('label_phone')} v={validationModal.livraison_telephone} />
                <RowKV k={t('label_address')} v={`${validationModal.livraison_ville}, ${validationModal.livraison_quartier}`} />
              </dl>
            </FormSection>

            <FormSection title={t('section_assignment')} icon={<Bike size={11} />}>
              <div className="space-y-4">
                <Field label={t('field_choose_driver')} icon={<Bike size={11} />}>
                  <select
                    value={valDriverId}
                    onChange={e => setValDriverId(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-gold/50"
                  >
                    <option value="" className="bg-background">{t('option_assign_later')}</option>
                    {drivers.map(d => {
                      const id = d.id ?? d.user_id;
                      return <option key={id} value={id} className="bg-background">{driverDisplayName(d, lang)}</option>;
                    })}
                  </select>
                </Field>

                <Field label={t('field_estimated_delivery_date')} icon={<Calendar size={11} />}>
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
  label, allLabel, options, value, onChange, cfg,
}: { label: string; allLabel: string; options: string[]; value: string; onChange: (v: string) => void; cfg: Record<string, { label: string }> }) {
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
            {v === '' ? allLabel : cfg[v]?.label ?? v}
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
  headers, viewLabel, editLabel, statutCfg, lang,
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
  headers: string[];
  viewLabel: string;
  editLabel: string;
  statutCfg: Record<string, { label: string; color: string; dot: string }>;
  lang: string;
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
            <p className="text-xs">…</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    {headers.map((h, i) => (
                      <th key={`${h}-${i}`} className="whitespace-nowrap px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
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
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-foreground">{fmt(order.total_ttc, lang)}</td>
                        <td className="px-4 py-3">
                          {order.code_promo_utilise
                            ? <span className="rounded border border-gold/20 bg-gold/10 px-1.5 py-0.5 font-mono text-[11px] text-gold">{order.code_promo_utilise}</span>
                            : <span className="text-xs text-foreground/25">—</span>}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-foreground/55">{order.livreur_nom ?? '—'}</td>
                        <td className="px-4 py-3"><StatusChip cfg={statutCfg[order.statut]} /></td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-foreground/55">{getDeliveryMethod(order, lang)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[11px] text-foreground/35">{fmtDate(order.date_creation, false, lang)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <IconButton icon={<Eye size={14} />} title={viewLabel} onClick={() => onView(order)} tone="gold" />
                            {onEdit && <IconButton icon={<ClipboardList size={14} />} title={editLabel} onClick={() => onEdit(order)} tone="blue" />}
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
                      <StatusChip cfg={statutCfg[order.statut]} />
                    </div>

                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="text-xs font-medium text-foreground">{order.livraison_nom_complet}</p>
                        <p className="text-[11px] text-foreground/40">{order.client_email}</p>
                      </div>
                      <p className="text-sm font-semibold text-foreground text-right">{fmt(order.total_ttc, lang)}</p>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-foreground/45 border-t border-white/5 pt-2">
                      <span>{getDeliveryMethod(order, lang)}</span>
                      {order.livreur_nom && <span>• {order.livreur_nom}</span>}
                      <span>• {fmtDate(order.date_creation, false, lang)}</span>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <IconButton icon={<Eye size={14} />} title={viewLabel} onClick={() => onView(order)} tone="gold" />
                      {onEdit && <IconButton icon={<ClipboardList size={14} />} title={editLabel} onClick={() => onEdit(order)} tone="blue" />}
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
  page, totalPages, onChange, totalItems, lang,
}: { page: number; totalPages: number; onChange: (p: number) => void; totalItems: number; lang: string }) {
  if (totalPages <= 1) return null;
  const word = totalItems > 1 ? translate(lang, 'orders_word_plural') : translate(lang, 'orders_word_singular');
  return (
    <div className="flex items-center justify-between px-1">
      <p className="text-[11px] text-foreground/40">{translate(lang, 'table_pagination_summary', { count: totalItems, word, page, totalPages })}</p>
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
  order, onClose, onManage, onValidate, onCancel, onDownloadInvoice, downloadingInvoice, isCancellable, lang, statutCfg, paiementCfg,
}: {
  order: BackendOrder;
  onClose: () => void;
  onManage: () => void;
  onValidate: () => void;
  onCancel: () => void;
  onDownloadInvoice: () => void;
  downloadingInvoice: boolean;
  isCancellable: boolean;
  lang: string;
  statutCfg: Record<string, { label: string; color: string; dot: string }>;
  paiementCfg: Record<string, { label: string; color: string; dot: string }>;
}) {
  const lines = allLines(order);
  const groups: Array<{ title: string; icon: React.ReactNode; lines: BackendOrderLine[] }> = [
    { title: translate(lang, 'group_perfumes'), icon: <Package size={12} />, lines: order.lignes_parfums },
    { title: translate(lang, 'group_accessories'), icon: <Package size={12} />, lines: order.lignes_accessoires },
    { title: translate(lang, 'group_finished_essences'), icon: <Package size={12} />, lines: order.lignes_produit_fini_essence },
    { title: translate(lang, 'group_custom_perfumes'), icon: <Package size={12} />, lines: order.lignes_parfums_perso },
    { title: translate(lang, 'group_custom_essences'), icon: <Package size={12} />, lines: order.lignes_essence_personnalisee },
  ].filter(g => g.lines.length > 0);

  return (
    <OrderPopupModal
      isOpen
      onClose={onClose}
      eyebrow={fmtDate(order.date_creation, true, lang)}
      title={
        <>
          <span className="font-mono">{order.numero_commande}</span>
          <StatusChip cfg={statutCfg[order.statut]} />
        </>
      }
      size="3xl"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          {order.statut === 'en_attente' && (
            <button onClick={onValidate} className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2.5 px-4 text-xs font-semibold text-black transition-colors hover:bg-emerald-400">
              <CheckCircle size={14} />{translate(lang, 'action_validate')}
            </button>
          )}
          {isCancellable && (
            <button onClick={onCancel} className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-lg bg-red-500/90 hover:bg-red-500 py-2.5 px-4 text-xs font-semibold text-white transition-colors">
              <XCircle size={14} />{translate(lang, 'action_cancel')}
            </button>
          )}
          <button onClick={onManage} className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-lg bg-gold px-5 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-gold/85">
            <ClipboardList size={14} />{translate(lang, 'manage')}
          </button>
          <button onClick={onClose} className="rounded-lg border border-white/10 px-5 py-2.5 text-xs text-foreground/60 transition-colors hover:bg-white/6">
            {translate(lang, 'close')}
          </button>
        </div>
      }
    >
      <div className="space-y-6">

        {/* Summary strip */}
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
          <SummaryStat label={translate(lang, 'summary_total_ttc')} value={fmt(order.total_ttc, lang)} emphasize />
          <div className="hidden h-8 w-px bg-white/10 sm:block" />
          <SummaryStat label={translate(lang, 'summary_payment')} node={<StatusChip cfg={paiementCfg[order.statut_paiement]} />} />
          <div className="hidden h-8 w-px bg-white/10 sm:block" />
          <SummaryStat label={translate(lang, 'summary_mode')} value={getDeliveryMethod(order, lang)} />
          {order.code_promo_utilise && (
            <>
              <div className="hidden h-8 w-px bg-white/10 sm:block" />
              <SummaryStat label={translate(lang, 'summary_promo_code')} node={<span className="rounded border border-gold/20 bg-gold/10 px-1.5 py-0.5 font-mono text-xs text-gold">{order.code_promo_utilise}</span>} />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Left: delivery + notes */}
          <div className="space-y-5 lg:col-span-2">
            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <SectionLabel icon={<MapPin size={11} />}>{translate(lang, 'section_delivery')}</SectionLabel>
              <dl className="space-y-1.5 text-xs">
                <RowKV k={translate(lang, 'label_recipient')} v={order.livraison_nom_complet} />
                <RowKV k={translate(lang, 'label_phone')} v={order.livraison_telephone} />
                {order.livraison_ville && (
                  <RowKV k={translate(lang, 'label_city')} v={`${order.livraison_ville}${order.livraison_quartier ? ` – ${order.livraison_quartier}` : ''}`} />
                )}
                <RowKV k={translate(lang, 'label_driver')} v={order.livreur_nom ?? '—'} />
                <RowKV k={translate(lang, 'label_estimated_date')} v={fmtDate(order.date_livraison_estimee, false, lang)} />
                <RowKV k={translate(lang, 'label_actual_date')} v={fmtDate(order.date_livraison_reelle, false, lang)} />
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
                    <SectionLabel icon={<Phone size={11} />}>{translate(lang, 'section_client_note')}</SectionLabel>
                    <p className="text-xs leading-relaxed text-foreground/65">{order.note_client}</p>
                  </div>
                )}
                {order.note_interne && (
                  <div>
                    <SectionLabel icon={<ClipboardList size={11} />}>{translate(lang, 'section_internal_note')}</SectionLabel>
                    <p className="text-xs leading-relaxed text-foreground/65">{order.note_interne}</p>
                  </div>
                )}
              </section>
            )}

            {(order.facture || order.statut_paiement === 'payé') && (
              <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <SectionLabel icon={<FileText size={11} />}>{translate(lang, 'section_invoice')}</SectionLabel>
                <div className="space-y-2.5">
                  {order.facture?.numero_facture && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground/40">N° {order.facture.numero_facture}</span>
                      <span className="text-foreground/50">{fmtDate(order.facture.date_emission, false, lang)}</span>
                    </div>
                  )}
                  {order.facture?.envoye_par_email && (
                    <p className="flex items-center gap-1.5 text-[11px] text-emerald-400/80"><Mail size={11} />{translate(lang, 'invoice_sent_by_email')}</p>
                  )}
                  <div className="flex gap-2">
                    {order.facture?.fichier_pdf && (
                      <a
                        href={order.facture.fichier_pdf}
                        target="_blank" rel="noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 py-2 text-xs font-medium text-foreground/75 transition-colors hover:bg-white/6"
                      >
                        <FileText size={13} />{translate(lang, 'open')}
                      </a>
                    )}
                    <button
                      onClick={onDownloadInvoice}
                      disabled={downloadingInvoice}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500/15 py-2 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/25 transition-colors hover:bg-emerald-500/25 disabled:opacity-50"
                    >
                      {downloadingInvoice ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                      {translate(lang, 'download')}
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Right: items + receipt */}
          <div className="space-y-5 lg:col-span-3">
            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <SectionLabel icon={<Package size={11} />}>{translate(lang, 'section_articles', { count: lines.length })}</SectionLabel>
              <div className="max-h-[300px] space-y-4 overflow-y-auto pr-1">
                {groups.map(g => (
                  <LinesGroup key={g.title} title={g.title} icon={g.icon} lines={g.lines} lang={lang} />
                ))}
                {lines.length === 0 && <p className="py-4 text-center text-xs italic text-foreground/30">{translate(lang, 'no_articles')}</p>}
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <SectionLabel icon={<CreditCard size={11} />}>{translate(lang, 'section_summary')}</SectionLabel>
              <div className="space-y-1.5 text-xs">
                <ReceiptRow k={translate(lang, 'row_subtotal')} v={fmt(order.sous_total, lang)} />
                <ReceiptRow k={translate(lang, 'row_delivery_fee')} v={fmt(order.frais_livraison, lang)} />
                {Number(order.remise_code_promo) > 0 && <ReceiptRow k={translate(lang, 'row_promo_discount')} v={`-${fmt(order.remise_code_promo, lang)}`} negative />}
                <div className="my-1.5 border-t border-dashed border-white/10" />
                <ReceiptRow k={translate(lang, 'row_total_ttc')} v={fmt(order.total_ttc, lang)} bold />
                <div className="my-1.5 border-t border-white/10" />
                <ReceiptRow k={translate(lang, 'row_commission')} v={`${fmt(order.commission_montant, lang)} · ${order.commission_statut}`} muted />
                <ReceiptRow k={translate(lang, 'row_provider')} v={order.prestataire_code ?? '—'} muted />
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

function getOrderLineName(line: BackendOrderLine, lang: string) {
  return (
    line.nom_snapshot ||
    line.nom ||
    line.detail_produit?.nom ||
    line.essence_nom ||
    line.produit_details?.nom ||
    line.parfum_details?.nom ||
    line.accessoire_details?.nom ||
    line.composition?.nom ||
    translate(lang, 'article_fallback')
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

function LinesGroup({ title, icon, lines, lang }: { title: string; icon: React.ReactNode; lines: BackendOrderLine[]; lang: string }) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground/30">
        {icon}{title}
      </p>
      <div className="space-y-1.5">
        {lines.map(line => {
          const isCustom = !!line.parfum_personnalise || !!line.composition;
          const name = getOrderLineName(line, lang);
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
                      <span>{essence.essence_nom || translate(lang, 'essence_fallback')}</span>
                      <span>{essence.quantite_ml || '—'} ml</span>
                    </div>
                  ))}
                  {line.composition.flacon_nom && (
                    <div className="flex justify-between text-foreground/35">
                      <span>{translate(lang, 'flask_label')}</span>
                      <span>{line.composition.flacon_nom} {line.composition.flacon_contenance_ml ? `· ${line.composition.flacon_contenance_ml}ml` : ''}</span>
                    </div>
                  )}
                </div>
              )}
              {hasDetailMeta && (
                <div className="mt-2 space-y-1 text-[11px] text-foreground/50">
                  <div className="flex justify-between gap-2">
                    <span>{[detailMeta.essenceName, detailMeta.marque].filter(Boolean).join(' · ') || translate(lang, 'finished_product_fallback')}</span>
                    <span>{detailMeta.tailleMl ? `${detailMeta.tailleMl} ml` : ''}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>{translate(lang, 'category_label')}: {detailMeta.categorie || '—'}</span>
                    <span>
                      {detailMeta.prixParMl
                        ? `${Number(detailMeta.prixParMl).toLocaleString()} FCFA/ml`
                        : detailMeta.prixActuel
                          ? `${Number(detailMeta.prixActuel).toLocaleString()} FCFA`
                          : '—'}
                    </span>
                  </div>
                  {detailMeta.codeReference && (
                    <div className="text-[10px] text-foreground/35">{translate(lang, 'reference_label')}: {detailMeta.codeReference}</div>
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