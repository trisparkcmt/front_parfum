'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle, 
  ArrowLeft,
  CheckCircle,
  Edit2,
  FlaskConical,
  Gem,
  Loader2,
  Percent,
  Receipt,
  Search,
  ShoppingBag,
  Store,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { adminService } from '@/services/apiService';
import { BoutiqueFullDetail, BoutiqueEffectuerVersementPayload } from '@/types';
import { useToastStore } from '@/store/useToastStore';
import { resolveImageUrl } from '@/lib/utils';
import AppImage from '@/components/ui/AppImage';
import { SlideOver } from '@/components/ui/SlideOver';
import { EmptyState } from '@/components/ui/EmptyState';

/* -------------------------------------------------------------------------- */
/* Inline Translations Dictionary                                              */
/* -------------------------------------------------------------------------- */

const T = {
  fr: {
    back: 'Boutiques',
    owner_prefix: 'Propriétaire',
    status_actif: 'Active',
    status_en_attente: 'En attente',
    status_other: 'Inactive',
    action_validate: 'Valider la boutique',
    action_payout: 'Effectuer un versement',
    action_commission: 'Modifier la commission',

    kpi_balance: 'Solde disponible',
    kpi_received: 'Total reçu',
    kpi_revenue: 'Chiffre d’affaires brut',
    kpi_platform: 'Commissions plateforme',
    kpi_rate: 'Taux de commission',
    kpi_sales: 'Ventes',

    tab_parfums: 'Parfums',
    tab_accessoires: 'Accessoires',
    tab_payouts: 'Versements',

    info_title: 'Informations',
    info_owner: 'Propriétaire',
    info_email: 'E-mail',
    info_phone: 'Téléphone',
    info_shop_phone: 'Téléphone boutique',
    info_address: 'Adresse',
    info_payment: 'Paiement préféré',
    info_created: 'Créée le',
    info_updated: 'Modifiée le',

    search_products: 'Rechercher un produit, une marque, un SKU…',
    col_product: 'Produit',
    col_category: 'Catégorie',
    col_type: 'Type',
    col_price: 'Prix',
    col_stock: 'Stock',
    col_visibility: 'Visibilité',
    col_date: 'Date',
    col_reference: 'Référence',
    col_method: 'Mode / destination',
    col_amount: 'Montant',
    col_note: 'Note',
    online: 'En ligne',
    hidden: 'Masqué',
    out_of_stock: 'Rupture',
    no_results: 'Aucun résultat',
    empty_parfums_title: 'Aucun parfum',
    empty_accessoires_title: 'Aucun accessoire',
    empty_products_desc: "Cette boutique n'a pas encore publié de produit de ce type.",
    empty_payouts_title: 'Aucun versement',
    empty_payouts_desc: "Les versements effectués à cette boutique apparaîtront ici.",
    page_of: 'Page',
    prev: 'Précédent',
    next: 'Suivant',
    page_note: 'Les produits sont chargés par pages de 100 (parfums et accessoires confondus).',

    validate_title: 'Valider la boutique',
    validate_desc: "Définissez le taux de commission pour activer la boutique. Le propriétaire recevra un e-mail et une notification.",
    commission_title: 'Modifier la commission',
    commission_desc: 'Le nouveau taux sera appliqué aux prochaines ventes de cette boutique.',
    field_commission: 'Taux de commission (%)',
    validate_btn: 'Valider',
    save_btn: 'Enregistrer',
    saving: 'Enregistrement…',

    payout_title: 'Effectuer un versement',
    payout_desc: 'Enregistrez le virement envoyé à la boutique. Le montant est déduit du solde disponible.',
    payout_balance: 'Solde disponible',
    payout_after: 'Solde après versement',
    field_amount: 'Montant (FCFA)',
    field_all: 'Tout verser',
    field_method: 'Mode de paiement',
    field_phone: 'Téléphone bénéficiaire',
    field_note: 'Note interne',
    field_optional: 'facultatif',
    payout_btn: 'Enregistrer le versement',

    err_commission: 'Le taux de commission doit être compris entre 0 et 100 %',
    err_amount: 'Veuillez entrer un montant valide',
    err_amount_max: 'Le montant dépasse le solde disponible',
    toast_load_error: 'Erreur lors du chargement',
    toast_validated: 'Boutique validée avec succès',
    toast_validate_error: 'Erreur de validation',
    toast_commission_ok: 'Taux de commission mis à jour',
    toast_commission_error: 'Erreur lors de la mise à jour de la commission',
    toast_payout_error: 'Erreur lors du versement',
    not_found_title: 'Boutique introuvable',
    not_found_desc: "Cette boutique n'existe pas ou n'est plus accessible.",
    view_logo: 'Voir le logo de la boutique',
    logo_alt: 'Logo de la boutique',
    close: 'Fermer',
    cancel: 'Annuler',
  },
  en: {
    back: 'Boutiques',
    owner_prefix: 'Owner',
    status_actif: 'Active',
    status_en_attente: 'Pending',
    status_other: 'Inactive',
    action_validate: 'Validate boutique',
    action_payout: 'Make a payout',
    action_commission: 'Edit commission',

    kpi_balance: 'Available balance',
    kpi_received: 'Total received',
    kpi_revenue: 'Gross revenue',
    kpi_platform: 'Platform commissions',
    kpi_rate: 'Commission rate',
    kpi_sales: 'Sales',

    tab_parfums: 'Perfumes',
    tab_accessoires: 'Accessories',
    tab_payouts: 'Payouts',

    info_title: 'Information',
    info_owner: 'Owner',
    info_email: 'Email',
    info_phone: 'Phone',
    info_shop_phone: 'Boutique phone',
    info_address: 'Address',
    info_payment: 'Preferred payment',
    info_created: 'Created on',
    info_updated: 'Updated on',

    search_products: 'Search a product, brand or SKU…',
    col_product: 'Product',
    col_category: 'Category',
    col_type: 'Type',
    col_price: 'Price',
    col_stock: 'Stock',
    col_visibility: 'Visibility',
    col_date: 'Date',
    col_reference: 'Reference',
    col_method: 'Method / destination',
    col_amount: 'Amount',
    col_note: 'Note',
    online: 'Online',
    hidden: 'Hidden',
    out_of_stock: 'Out of stock',
    no_results: 'No results found',
    empty_parfums_title: 'No perfumes',
    empty_accessoires_title: 'No accessories',
    empty_products_desc: "This boutique hasn't published any product of this kind yet.",
    empty_payouts_title: 'No payouts',
    empty_payouts_desc: 'Payouts made to this boutique will show up here.',
    page_of: 'Page',
    prev: 'Previous',
    next: 'Next',
    page_note: 'Products load in pages of 100 (perfumes and accessories combined).',

    validate_title: 'Validate boutique',
    validate_desc: 'Set the commission rate to activate the boutique. The owner will get an email and a notification.',
    commission_title: 'Edit commission',
    commission_desc: "The new rate applies to this boutique's upcoming sales.",
    field_commission: 'Commission rate (%)',
    validate_btn: 'Validate',
    save_btn: 'Save',
    saving: 'Saving…',

    payout_title: 'Make a payout',
    payout_desc: 'Record the transfer sent to the boutique. The amount is deducted from its available balance.',
    payout_balance: 'Available balance',
    payout_after: 'Balance after payout',
    field_amount: 'Amount (FCFA)',
    field_all: 'Pay full balance',
    field_method: 'Payment method',
    field_phone: 'Recipient phone',
    field_note: 'Internal note',
    field_optional: 'optional',
    payout_btn: 'Record payout',

    err_commission: 'The commission rate must be between 0 and 100 %',
    err_amount: 'Please enter a valid amount',
    err_amount_max: 'The amount exceeds the available balance',
    toast_load_error: 'Error loading data',
    toast_validated: 'Boutique validated successfully',
    toast_validate_error: 'Validation error',
    toast_commission_ok: 'Commission rate updated',
    toast_commission_error: 'Error updating the commission',
    toast_payout_error: 'Error recording the payout',
    not_found_title: 'Boutique not found',
    not_found_desc: "This boutique doesn't exist or is no longer available.",
    view_logo: 'View boutique logo',
    logo_alt: 'Boutique logo',
    close: 'Close',
    cancel: 'Cancel',
  },
} as const;

type TKey = keyof typeof T.fr;
type TabKey = 'parfums' | 'accessoires' | 'versements';
type PanelKey = null | 'validate' | 'commission' | 'payout';

/** Slide-over width used for the three small forms of this page. */
const FORM_PANEL_SIZE = 'xl';

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

/* -------------------------------------------------------------------------- */
/* Helpers & local types                                                       */
/* -------------------------------------------------------------------------- */

interface ProductRow {
  id: number;
  type_produit: 'parfum' | 'accessoire';
  nom: string;
  marque?: string | null;
  reference_sku?: string | null;
  prix_unitaire?: string | number | null;
  prix_promo?: string | number | null;
  stock_quantite?: number | null;
  actif?: boolean;
  categorie?: { id: number; nom: string } | null;
  type_accessoire?: { id: number; nom: string } | null;
  images?: Array<{ image: string; est_principale?: boolean }>;
}

const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
};

const formatFcfa = (v: unknown) => {
  const n = toNum(v);
  return n === null ? '—' : `${new Intl.NumberFormat('fr-FR').format(n)} FCFA`;
};

/* -------------------------------------------------------------------------- */
/* Shared Design System Primitives (same as the categories page)               */
/* -------------------------------------------------------------------------- */

const inputClassName =
  'w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-foreground outline-none transition-colors focus:border-gold/50 focus:bg-white/[0.05] placeholder:text-foreground/35 disabled:opacity-50';

function Field({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
        {label} {required && <span className="text-gold">*</span>}
        {hint && <span className="ml-1 normal-case tracking-normal text-foreground/30">({hint})</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

function FormSection({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">{children}</div>;
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-medium transition-colors',
        active ? 'border-gold text-gold' : 'border-transparent text-foreground/45 hover:text-foreground/75'
      )}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-foreground/60">
          {count}
        </span>
      )}
    </button>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tone?: 'default' | 'gold' | 'green' | 'red';
}) {
  const toneClass = { default: 'text-foreground', gold: 'text-gold', green: 'text-green-400', red: 'text-red-300' }[tone];
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
        <Icon size={12} className="text-gold" />
        <span className="truncate">{label}</span>
      </div>
      <p className={cx('mt-2 truncate text-lg font-semibold tabular-nums', toneClass)}>{value}</p>
    </div>
  );
}

function StatusBadge({ statut, t }: { statut: string; t: (k: TKey) => string }) {
  const map: Record<string, { cls: string; label: string }> = {
    actif: { cls: 'bg-green-500/10 text-green-400 ring-green-500/20', label: t('status_actif') },
    en_attente: { cls: 'bg-gold/10 text-gold ring-gold/20', label: t('status_en_attente') },
  };
  const s = map[statut] ?? { cls: 'bg-white/5 text-foreground/50 ring-white/10', label: t('status_other') };
  return (
    <span className={cx('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset', s.cls)}>
      {s.label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{label}</dt>
      <dd className="break-words text-xs text-foreground/80">{value || '—'}</dd>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Products table (used by both the Perfumes and Accessories tabs)             */
/* -------------------------------------------------------------------------- */

function ProductThumb({ product }: { product: ProductRow }) {
  const image = product.images?.find((i) => i.est_principale)?.image || product.images?.[0]?.image;
  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
      {image ? (
        <AppImage src={resolveImageUrl(image)} alt={product.nom} fill className="object-cover" />
      ) : product.type_produit === 'parfum' ? (
        <FlaskConical size={14} className="text-foreground/25" />
      ) : (
        <Gem size={14} className="text-foreground/25" />
      )}
    </div>
  );
}

function ProductsTable({
  rows,
  kind,
  t,
}: {
  rows: ProductRow[];
  kind: 'parfum' | 'accessoire';
  t: (k: TKey) => string;
}) {
  const categoryOf = (p: ProductRow) => (kind === 'parfum' ? p.categorie?.nom : p.type_accessoire?.nom) || '—';

  const Price = ({ p }: { p: ProductRow }) =>
    p.prix_promo ? (
      <div className="leading-tight">
        <p className="font-mono font-semibold tabular-nums text-gold">{formatFcfa(p.prix_promo)}</p>
        <p className="font-mono text-[10px] tabular-nums text-foreground/35 line-through">{formatFcfa(p.prix_unitaire)}</p>
      </div>
    ) : (
      <p className="font-mono tabular-nums text-foreground/80">{formatFcfa(p.prix_unitaire)}</p>
    );

  const Stock = ({ p }: { p: ProductRow }) => {
    const q = p.stock_quantite ?? 0;
    if (q <= 0) return <span className="text-red-400">{t('out_of_stock')}</span>;
    return <span className={cx('tabular-nums', q <= 5 ? 'text-amber-400' : 'text-foreground/70')}>{q}</span>;
  };

  const Visibility = ({ p }: { p: ProductRow }) => (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
        p.actif ? 'bg-green-500/10 text-green-400 ring-green-500/20' : 'bg-white/5 text-foreground/45 ring-white/10'
      )}
    >
      {p.actif ? t('online') : t('hidden')}
    </span>
  );

  if (rows.length === 0) {
    return <div className="py-12 text-center text-sm italic text-foreground/30">{t('no_results')}</div>;
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-xl border border-white/10 md:block">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              {(['col_product', 'col_category', 'col_price', 'col_stock', 'col_visibility'] as TKey[]).map((k) => (
                <th key={k} className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                  {k === 'col_category' && kind === 'accessoire' ? t('col_type') : t(k)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((p) => (
              <tr key={`${p.type_produit}-${p.id}`} className="transition-colors hover:bg-white/[0.02]">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <ProductThumb product={p} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{p.nom}</p>
                      <p className="truncate text-[11px] text-foreground/40">
                        {[p.marque, p.reference_sku].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-foreground/60">{categoryOf(p)}</td>
                <td className="px-4 py-2.5"><Price p={p} /></td>
                <td className="px-4 py-2.5"><Stock p={p} /></td>
                <td className="px-4 py-2.5"><Visibility p={p} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {rows.map((p) => (
          <div key={`${p.type_produit}-${p.id}`} className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <ProductThumb product={p} />
                <div className="min-w-0">
                  <h3 className="truncate text-xs font-semibold text-foreground">{p.nom}</h3>
                  <p className="truncate text-[11px] text-foreground/40">
                    {[p.marque, categoryOf(p)].filter((v) => v && v !== '—').join(' · ')}
                  </p>
                </div>
              </div>
              <Visibility p={p} />
            </div>
            <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[11px]">
              <Price p={p} />
              <div className="text-right">
                <span className="mr-1.5 text-foreground/40">{t('col_stock')}:</span>
                <Stock p={p} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                              */
/* -------------------------------------------------------------------------- */

export default function AdminBoutiqueDetailPage() {
  const router = useRouter();
  const params = useParams();
  const boutiqueId = Number(params.id);
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en') ?? false;
  const t = useCallback((k: TKey): string => (isEn ? T.en[k] : T.fr[k]), [isEn]);
  const addToast = useToastStore((s) => s.addToast);

  const [boutique, setBoutique] = useState<BoutiqueFullDetail | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [productsPage, setProductsPage] = useState(1);
  const [activeTab, setActiveTab] = useState<TabKey>('parfums');
  const [search, setSearch] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [panel, setPanel] = useState<PanelKey>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [commissionValue, setCommissionValue] = useState('10');
  const [commissionError, setCommissionError] = useState('');

  const [amount, setAmount] = useState('');
  const [payoutMode, setPayoutMode] = useState('');
  const [payoutPhone, setPayoutPhone] = useState('');
  const [payoutNote, setPayoutNote] = useState('');
  const [amountError, setAmountError] = useState('');
  const payoutIdempotencyKey = useRef<string | null>(null);

  // Product edit / delete state
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [editPriceValue, setEditPriceValue] = useState('');
  const [editPromoValue, setEditPromoValue] = useState('');
  const [showEditPriceModal, setShowEditPriceModal] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const fetchDetail = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await adminService.getBoutiqueDetail(boutiqueId, { page: productsPage , page_size: 100 });
      setBoutique(data);
    } catch (err: any) {
      addToast(err.response?.data?.detail || t('toast_load_error'), 'error');
    } finally {
      setRefreshing(false);
      setInitialLoading(false);
    }
  }, [boutiqueId, productsPage, addToast, t]);

  useEffect(() => {
    if (boutiqueId) fetchDetail();
  }, [boutiqueId, fetchDetail]);

  /* ---- derived data (hooks must stay above any early return) ---- */
  const allProducts = useMemo(
    () => ((boutique?.produits?.results ?? []) as unknown as ProductRow[]),
    [boutique]
  );

  const filterProducts = (kind: 'parfum' | 'accessoire') => {
    const q = search.trim().toLowerCase();
    return allProducts
      .filter((p) => p.type_produit === kind)
      .filter(
        (p) =>
          !q ||
          p.nom?.toLowerCase().includes(q) ||
          (p.marque || '').toLowerCase().includes(q) ||
          (p.reference_sku || '').toLowerCase().includes(q)
      );
  };

  const parfums = useMemo(() => filterProducts('parfum'), [allProducts, search]); // eslint-disable-line react-hooks/exhaustive-deps
  const accessoires = useMemo(() => filterProducts('accessoire'), [allProducts, search]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- actions ---- */
  const openCommissionPanel = (mode: 'validate' | 'commission') => {
    setCommissionValue(mode === 'commission' ? String(toNum(boutique?.taux_commission) ?? 10) : '10');
    setCommissionError('');
    setPanel(mode);
  };

  const openPayoutPanel = () => {
    if (!boutique) return;
    setAmount('');
    setAmountError('');
    setPayoutMode(boutique.mode_paiement_prefere || 'OM');
    setPayoutPhone(boutique.telephone_paiement || '');
    setPayoutNote('');
    payoutIdempotencyKey.current = null;
    setPanel('payout');
  };

  const handleCommissionSubmit = async () => {
    const commission = Number(commissionValue);
    if (!Number.isFinite(commission) || commission < 0 || commission > 100) {
      setCommissionError(t('err_commission'));
      return;
    }
    setIsSaving(true);
    try {
      if (panel === 'validate') {
        await adminService.validateBoutique(boutiqueId, { taux_commission: commission.toFixed(2) });
        addToast(t('toast_validated'), 'success');
      } else {
        await adminService.updateBoutiqueCommission(boutiqueId, commission.toFixed(2));
        addToast(t('toast_commission_ok'), 'success');
      }
      setPanel(null);
      fetchDetail();
    } catch (err: any) {
      addToast(
        err.response?.data?.detail || (panel === 'validate' ? t('toast_validate_error') : t('toast_commission_error')),
        'error'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePayout = async () => {
    if (!boutique) return;
    const value = Number(amount);
    if (!amount || !Number.isFinite(value) || value <= 0) {
      setAmountError(t('err_amount'));
      return;
    }
    if (value > Number(boutique.solde_disponible || 0)) {
      setAmountError(t('err_amount_max'));
      return;
    }
    setIsSaving(true);
    try {
      payoutIdempotencyKey.current ||= `PAYOUT-${boutiqueId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const payload: BoutiqueEffectuerVersementPayload = {
        montant: amount,
        mode_paiement: payoutMode || boutique.mode_paiement_prefere || undefined,
        telephone_destination: payoutPhone || boutique.telephone_paiement || undefined,
        note_admin: payoutNote || undefined,
        idempotency_key: payoutIdempotencyKey.current,
      };
      const res = await adminService.effectuerVersementBoutique(boutiqueId, payload);
      addToast(res.detail, 'success');
      payoutIdempotencyKey.current = null;
      setPanel(null);
      setActiveTab('versements');
      fetchDetail();
    } catch (err: any) {
      addToast(err.response?.data?.detail || t('toast_payout_error'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditPrice = (p: ProductRow) => {
    setEditingProduct(p);
    setEditPriceValue(String(p.prix_unitaire || ''));
    setEditPromoValue(String((p as any).prix_promotionnel || p.prix_promo || ''));
    setShowEditPriceModal(true);
  };

  const handleSaveProductPrice = async () => {
    if (!editingProduct) return;
    setIsSavingProduct(true);
    try {
      const slugOrId = editingProduct.slug || String(editingProduct.id);
      const formData = new FormData();
      formData.append('prix_unitaire', editPriceValue);
      // Send empty string to clear promo price
      formData.append('prix_promotionnel', editPromoValue);
      if (editingProduct.type_produit === 'parfum') {
        await adminService.patchFormData(`shop/parfums/${slugOrId}/`, formData);
      } else {
        await adminService.patchFormData(`shop/accessoires/${slugOrId}/`, formData);
      }
      addToast('Prix mis à jour avec succès', 'success');
      setShowEditPriceModal(false);
      fetchDetail();
    } catch (err: any) {
      addToast(err.response?.data?.detail || 'Erreur lors de la mise à jour du prix', 'error');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (p: ProductRow) => {
    if (!confirm(`Supprimer "${p.nom}" du catalogue ?`)) return;
    const slugOrId = p.slug || String(p.id);
    try {
      if (p.type_produit === 'parfum') {
        await shopService.deletePerfume(slugOrId);
      } else {
        await shopService.deleteAccessory(slugOrId);
      }
      addToast('Produit supprimé avec succès', 'success');
      fetchDetail();
    } catch (err: any) {
      addToast(err.response?.data?.detail || 'Erreur lors de la suppression', 'error');
    }
  };

  /* ---- loading / not found ---- */
  if (initialLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="animate-spin text-gold" size={32} />
      </div>
    );
  }

  if (!boutique) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push('/dashboard/admin/boutiques')}
          className="inline-flex items-center gap-1.5 text-xs text-foreground/50 transition-colors hover:text-gold"
        >
          <ArrowLeft size={14} /> {t('back')}
        </button>
        <EmptyState icon={<AlertCircle size={48} />} title={t('not_found_title')} description={t('not_found_desc')} />
      </div>
    );
  }

  /* ---- render ---- */
  const statut = String(boutique.statut || '').toLowerCase();
  const logo = boutique.photo || boutique.photo_url || boutique.avatar_url;
  const dateFmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString(isEn ? 'en-GB' : 'fr-FR') : '—');
  const payoutValue = Number(amount);
  const balance = toNum(boutique.solde_disponible) ?? 0;
  const balanceAfter = Number.isFinite(payoutValue) && payoutValue > 0 ? balance - payoutValue : balance;
  const versements = boutique.versements_recents ?? [];
  const totalPages = boutique.produits?.total_pages || 1;
  const showProductPagination = (activeTab === 'parfums' || activeTab === 'accessoires') && totalPages > 1;

  const buttonSecondary =
    'inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-foreground/70 transition-colors hover:bg-white/[0.06]';
  const buttonPrimary =
    'inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-3.5 py-2 text-xs font-semibold text-black transition-colors hover:bg-gold/85';

  const panelTitle =
    panel === 'validate' ? t('validate_title') : panel === 'commission' ? t('commission_title') : t('payout_title');
  const panelDescription =
    panel === 'validate' ? t('validate_desc') : panel === 'commission' ? t('commission_desc') : t('payout_desc');

  return (
    <>
      <div className="space-y-6">
        {/* Back */}
        <button
          onClick={() => router.push('/dashboard/admin/boutiques')}
          className="inline-flex items-center gap-1.5 text-xs text-foreground/50 transition-colors hover:text-gold"
        >
          <ArrowLeft size={14} /> {t('back')}
        </button>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              disabled={!logo}
              onClick={() => logo && setPreviewImage(resolveImageUrl(logo))}
              title={logo ? t('view_logo') : undefined}
              className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition-colors enabled:hover:border-gold/40 disabled:cursor-default"
            >
              {logo ? (
                <AppImage src={resolveImageUrl(logo)} alt={boutique.nom} fill className="object-cover" />
              ) : (
                <span className="text-xs font-bold uppercase text-foreground/40">{boutique.nom.slice(0, 2)}</span>
              )}
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="truncate text-xl font-semibold text-foreground">{boutique.nom}</h1>
                <StatusBadge statut={statut} t={t} />
                {refreshing && <Loader2 size={14} className="animate-spin text-foreground/30" />}
              </div>
              <p className="mt-0.5 truncate text-sm text-foreground/40">
                {t('owner_prefix')} : {boutique.proprietaire_nom || '—'}
                {boutique.ville ? ` · ${boutique.ville}` : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {statut === 'en_attente' && (
              <button onClick={() => openCommissionPanel('validate')} className={buttonPrimary}>
                <CheckCircle size={14} />
                {t('action_validate')}
              </button>
            )}
            {statut === 'actif' && (
              <>
                <button onClick={() => openCommissionPanel('commission')} className={buttonSecondary}>
                  <Edit2 size={13} />
                  {t('action_commission')}
                </button>
                <button onClick={openPayoutPanel} className={buttonPrimary}>
                  <Wallet size={14} />
                  {t('action_payout')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          <Kpi label={t('kpi_balance')} value={formatFcfa(boutique.solde_disponible)} icon={Wallet} tone="green" />
          <Kpi label={t('kpi_received')} value={formatFcfa(boutique.solde_total_recu)} icon={Receipt} />
          <Kpi label={t('kpi_revenue')} value={formatFcfa(boutique.chiffre_affaires_brut)} icon={TrendingUp} />
          <Kpi
            label={t('kpi_platform')}
            value={formatFcfa(boutique.total_commissions_admin ?? boutique.commissions_admin_perdues)}
            icon={Percent}
            tone="red"
          />
          <Kpi
            label={t('kpi_rate')}
            value={toNum(boutique.taux_commission) !== null ? `${toNum(boutique.taux_commission)!.toFixed(1)} %` : '—'}
            icon={Percent}
            tone="gold"
          />
          <Kpi label={t('kpi_sales')} value={String(boutique.nb_ventes_total ?? 0)} icon={ShoppingBag} />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Catalogue + payouts */}
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] shadow-sm shadow-black/30 lg:col-span-2">
            <div className="flex overflow-x-auto border-b border-white/10 bg-white/[0.02]">
              <TabButton
                active={activeTab === 'parfums'}
                onClick={() => setActiveTab('parfums')}
                icon={<FlaskConical size={14} />}
                label={t('tab_parfums')}
                count={boutique.nb_produits_parfums ?? 0}
              />
              <TabButton
                active={activeTab === 'accessoires'}
                onClick={() => setActiveTab('accessoires')}
                icon={<Gem size={14} />}
                label={t('tab_accessoires')}
                count={boutique.nb_produits_accessoires ?? 0}
              />
              <TabButton
                active={activeTab === 'versements'}
                onClick={() => setActiveTab('versements')}
                icon={<Wallet size={14} />}
                label={t('tab_payouts')}
                count={versements.length}
              />
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              {activeTab !== 'versements' && (
                <div className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 sm:max-w-sm">
                  <Search size={14} className="shrink-0 text-foreground/35" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('search_products')}
                    className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-foreground/35"
                  />
                </div>
              )}

              {activeTab === 'parfums' &&
                ((boutique.nb_produits_parfums ?? 0) === 0 && allProducts.every((p) => p.type_produit !== 'parfum') ? (
                  <EmptyState icon={<FlaskConical size={48} />} title={t('empty_parfums_title')} description={t('empty_products_desc')} />
                ) : (
                  <ProductsTable rows={parfums} kind="parfum" t={t} onEditPrice={handleEditPrice} onDeleteProduct={handleDeleteProduct} />
                ))}

              {activeTab === 'accessoires' &&
                ((boutique.nb_produits_accessoires ?? 0) === 0 && allProducts.every((p) => p.type_produit !== 'accessoire') ? (
                  <EmptyState icon={<Gem size={48} />} title={t('empty_accessoires_title')} description={t('empty_products_desc')} />
                ) : (
                  <ProductsTable rows={accessoires} kind="accessoire" t={t} onEditPrice={handleEditPrice} onDeleteProduct={handleDeleteProduct} />
                ))}

              {activeTab === 'versements' &&
                (versements.length === 0 ? (
                  <EmptyState icon={<Wallet size={48} />} title={t('empty_payouts_title')} description={t('empty_payouts_desc')} />
                ) : (
                  <>
                    <div className="hidden overflow-hidden rounded-xl border border-white/10 md:block">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/[0.02]">
                            {(['col_date', 'col_reference', 'col_method', 'col_amount', 'col_note'] as TKey[]).map((k) => (
                              <th key={k} className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                                {t(k)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {versements.map((v) => (
                            <tr key={v.id} className="transition-colors hover:bg-white/[0.02]">
                              <td className="whitespace-nowrap px-4 py-2.5 text-foreground/60">{dateFmt(v.date_versement)}</td>
                              <td className="px-4 py-2.5 font-mono text-[11px] text-foreground/60">{v.reference_transaction || '—'}</td>
                              <td className="px-4 py-2.5 text-foreground/60">
                                {[v.mode_paiement, v.telephone_destination].filter(Boolean).join(' · ') || '—'}
                              </td>
                              <td className="whitespace-nowrap px-4 py-2.5 font-mono font-semibold tabular-nums text-green-400">
                                {formatFcfa(v.montant)}
                              </td>
                              <td className="max-w-[200px] truncate px-4 py-2.5 text-foreground/45">{v.note_admin || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:hidden">
                      {versements.map((v) => (
                        <div key={v.id} className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3.5 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="text-foreground/40">{dateFmt(v.date_versement)}</span>
                            <span className="font-mono font-semibold tabular-nums text-green-400">{formatFcfa(v.montant)}</span>
                          </div>
                          <p className="font-mono text-[10px] text-foreground/50">{v.reference_transaction || '—'}</p>
                          <p className="text-foreground/50">
                            {[v.mode_paiement, v.telephone_destination].filter(Boolean).join(' · ') || '—'}
                          </p>
                          {v.note_admin && <p className="border-t border-white/5 pt-2 text-foreground/40">{v.note_admin}</p>}
                        </div>
                      ))}
                    </div>
                  </>
                ))}

              {showProductPagination && (
                <div className="flex flex-col gap-2 border-t border-white/5 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[11px] text-foreground/35">{t('page_note')}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] tabular-nums text-foreground/45">
                      {t('page_of')} {boutique.produits?.current_page || 1} / {totalPages}
                    </span>
                    <button
                      disabled={productsPage <= 1}
                      onClick={() => setProductsPage((p) => p - 1)}
                      className="rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-foreground/70 transition-colors hover:text-gold disabled:opacity-30"
                    >
                      {t('prev')}
                    </button>
                    <button
                      disabled={productsPage >= totalPages}
                      onClick={() => setProductsPage((p) => p + 1)}
                      className="rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-foreground/70 transition-colors hover:text-gold disabled:opacity-30"
                    >
                      {t('next')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info sidebar */}
          <aside className="h-fit rounded-xl border border-white/10 bg-white/[0.02] p-4 shadow-sm shadow-black/30 sm:p-5">
            <div className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-foreground/40">
              <Store size={12} className="text-gold" />
              <span>{t('info_title')}</span>
            </div>
            <dl className="divide-y divide-white/5">
              <InfoRow label={t('info_owner')} value={boutique.proprietaire_nom} />
              <InfoRow
                label={t('info_email')}
                value={boutique.proprietaire_email || boutique.user_details?.email}
              />
              <InfoRow
                label={t('info_phone')}
                value={boutique.proprietaire_telephone || boutique.user_details?.telephone}
              />
              <InfoRow label={t('info_shop_phone')} value={boutique.telephone} />
              <InfoRow
                label={t('info_address')}
                value={[boutique.adresse, boutique.ville].filter(Boolean).join(', ')}
              />
              <InfoRow
                label={t('info_payment')}
                value={
                  boutique.mode_paiement_prefere || boutique.telephone_paiement
                    ? [boutique.mode_paiement_prefere, boutique.telephone_paiement].filter(Boolean).join(' · ')
                    : null
                }
              />
              <InfoRow label={t('info_created')} value={dateFmt(boutique.date_creation)} />
              <InfoRow label={t('info_updated')} value={dateFmt(boutique.date_modification)} />
            </dl>
          </aside>
        </div>
      </div>

      {/* Commission / validation / payout panel */}
      <SlideOver
        isOpen={panel !== null}
        onClose={() => !isSaving && setPanel(null)}
        title={panelTitle}
        description={panelDescription}
        size={FORM_PANEL_SIZE}
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setPanel(null)}
              disabled={isSaving}
              className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-foreground/60 transition-colors hover:bg-white/5 disabled:opacity-60"
            >
              {t('cancel')}
            </button>
            <button
              onClick={panel === 'payout' ? handlePayout : handleCommissionSubmit}
              disabled={isSaving || (panel === 'payout' && !amount)}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-gold/85 disabled:opacity-60"
            >
              {isSaving ? <Loader2 size={13} className="animate-spin" /> : null}
              {isSaving
                ? t('saving')
                : panel === 'payout'
                ? t('payout_btn')
                : panel === 'validate'
                ? t('validate_btn')
                : t('save_btn')}
            </button>
          </div>
        }
      >
        {panel === 'payout' ? (
          <div className="space-y-4">
            <FormSection>
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground/50">{t('payout_balance')}</span>
                <span className="font-mono font-semibold tabular-nums text-green-400">{formatFcfa(balance)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground/50">{t('payout_after')}</span>
                <span
                  className={cx(
                    'font-mono font-semibold tabular-nums',
                    balanceAfter < 0 ? 'text-red-400' : 'text-foreground/80'
                  )}
                >
                  {formatFcfa(balanceAfter)}
                </span>
              </div>
            </FormSection>

            <FormSection>
              <Field label={t('field_amount')} required error={amountError}>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setAmountError('');
                      payoutIdempotencyKey.current = null;
                    }}
                    className={inputClassName}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setAmount(String(balance));
                      setAmountError('');
                      payoutIdempotencyKey.current = null;
                    }}
                    className="shrink-0 rounded-lg border border-white/10 px-3 text-[11px] font-semibold text-foreground/60 transition-colors hover:border-gold/40 hover:text-gold"
                  >
                    {t('field_all')}
                  </button>
                </div>
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label={t('field_method')}>
                  <input
                    value={payoutMode}
                    onChange={(e) => {
                      setPayoutMode(e.target.value);
                      payoutIdempotencyKey.current = null;
                    }}
                    placeholder="OM"
                    className={inputClassName}
                  />
                </Field>
                <Field label={t('field_phone')}>
                  <input
                    type="tel"
                    value={payoutPhone}
                    onChange={(e) => {
                      setPayoutPhone(e.target.value);
                      payoutIdempotencyKey.current = null;
                    }}
                    className={inputClassName}
                  />
                </Field>
              </div>
              <Field label={t('field_note')} hint={t('field_optional')}>
                <textarea
                  value={payoutNote}
                  onChange={(e) => {
                    setPayoutNote(e.target.value);
                    payoutIdempotencyKey.current = null;
                  }}
                  rows={2}
                  className={cx(inputClassName, 'resize-none')}
                />
              </Field>
            </FormSection>
          </div>
        ) : (
          <FormSection>
            <Field label={t('field_commission')} required error={commissionError}>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={commissionValue}
                onChange={(e) => {
                  setCommissionValue(e.target.value);
                  setCommissionError('');
                }}
                className={inputClassName}
              />
            </Field>
          </FormSection>
        )}
      </SlideOver>

      {/* Logo preview */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative w-full max-w-2xl rounded-xl border border-white/10 bg-[#0a0a0a] p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/50 p-1.5 text-foreground/70 hover:text-foreground"
              aria-label={t('close')}
            >
              <X size={14} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewImage} alt={t('logo_alt')} className="max-h-[70vh] w-full rounded-lg object-contain" />
          </div>
        </div>
      )}
    </>
  );
}