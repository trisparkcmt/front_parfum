'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Edit2, Trash2, Plus, Search, Image as ImageIcon, SlidersHorizontal, AlertCircle, X, Package, ChevronDown, Tag, Layers, DollarSign, Boxes, Sparkles } from 'lucide-react';
import { shopService } from '@/services/apiService';
import { adminService } from '@/services/apiService';
import { InlineCell } from '@/components/admin/InlineCell';
import { useTranslation } from 'react-i18next';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { AdminTableSkeleton } from '@/components/ui/AdminTableSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';

/* -- Inline translations --------------------------------------------------- */
const T = {
  fr: {
    title: 'Parfums', subtitle: 'Catalogue des parfums de la boutique',
    add: 'Ajouter un parfum', edit_modal: 'Modifier le parfum', new_modal: 'Nouveau parfum',
    col_image: 'Image', col_name: 'Nom', col_status: 'Statut', col_stock: 'Stock',
    col_volume: 'Contenance', col_price: 'Prix', col_margin: 'Marge', col_actions: 'Actions',
    loading: 'Chargement des parfums...', no_results: 'Aucun parfum trouvé.',
    in_stock: 'En stock', low_stock: 'Stock bas', out_of_stock: 'Rupture',
    bestseller: 'Bestseller', new_label: 'Nouveau',
    filter_genre: 'Genre :', filter_genre_all: 'Tous les genres',
    filter_genre_homme: 'Homme', filter_genre_femme: 'Femme', filter_genre_mixte: 'Unisex',
    filter_bestseller: 'Bestseller :', filter_bs_all: 'Tous',
    filter_bs_only: 'Bestsellers uniquement', filter_bs_not: 'Non bestsellers',
    filter_reset: 'Réinitialiser', filter_btn: 'Filtres',
    kpi_rupture: 'En Rupture', kpi_total: 'Total', kpi_low: 'Stock Bas',
    search_placeholder: 'Rechercher un parfum...',
    delete_selected: 'Supprimer la sélection',
    section_id: 'Identification', section_pricing: 'Tarification & promotion',
    section_stock: 'Contenance & stock', section_promo: 'Promotion',
    section_olfactive: 'Profil olfactif', section_notes: 'Notes parfum',
    section_desc: 'Descriptions', section_flags: 'Mise en avant',
    section_images: 'Images du parfum',
    field_brand: 'Marque', field_name: 'Nom du parfum', field_slug: 'Slug URL',
    field_sku: 'SKU', field_category: 'Catégorie', field_genre: 'Genre cible',
    field_intensite: 'Intensité', field_volume: 'Contenance (ml)', field_price: 'Prix de vente (FCFA)',
    field_purchase: "Prix d'achat (FCFA)", field_promo_price: 'Prix promotionnel (FCFA)',
    field_reduction: 'Réduction (%)', field_stock: 'Stock', field_alert: "Seuil d'alerte",
    field_notes_tete: 'Notes de tête', field_notes_coeur: 'Notes de cœur', field_notes_fond: 'Notes de fond',
    field_desc_short: 'Description courte', field_desc_long: 'Description longue', field_desc_ai: 'Description IA',
    field_bestseller: 'Bestseller', field_new: 'Nouveau', field_active: 'Actif',
    field_date_debut: 'Date début promo', field_date_fin: 'Date fin promo',
    field_promo_msg: 'Message promotion', field_reset_dates: 'Réinitialiser les dates',
    field_choose_category: 'Choisir une catégorie',
    margin_label: 'Bénéfice estimé :',
    confirm_delete: 'Êtes-vous sûr de vouloir supprimer ce parfum ?',
    confirm_bulk: 'Supprimer',
    toast_load_error: 'Erreur lors du chargement des parfums',
    toast_create_ok: 'Parfum créé avec succès', toast_update_ok: 'Parfum mis à jour avec succès',
    toast_save_error: 'Erreur lors de la sauvegarde', toast_delete_ok: 'Parfum supprimé',
    toast_delete_error: 'Erreur lors de la suppression', toast_patch_error: 'Erreur lors de la mise à jour',
    toast_bulk_ok: 'parfum(s) supprimé(s)', toast_bulk_error: 'Erreur lors de la suppression en masse',
    toast_required: 'Veuillez corriger les champs obligatoires.',
    toast_category_ok: 'Catégorie créée avec succès', toast_category_error: 'Erreur chargement catégories',
    catalogue: 'Catalogue',
    admin_badge: 'Admin',
  },
  en: {
    title: 'Perfumes', subtitle: 'Shop perfume catalogue',
    add: 'Add perfume', edit_modal: 'Edit perfume', new_modal: 'New perfume',
    col_image: 'Image', col_name: 'Name', col_status: 'Status', col_stock: 'Stock',
    col_volume: 'Volume', col_price: 'Price', col_margin: 'Margin', col_actions: 'Actions',
    loading: 'Loading perfumes...', no_results: 'No perfumes found.',
    in_stock: 'In stock', low_stock: 'Low stock', out_of_stock: 'Out of stock',
    bestseller: 'Bestseller', new_label: 'New',
    filter_genre: 'Gender:', filter_genre_all: 'All genders',
    filter_genre_homme: 'Men', filter_genre_femme: 'Women', filter_genre_mixte: 'Unisex',
    filter_bestseller: 'Bestseller:', filter_bs_all: 'All',
    filter_bs_only: 'Bestsellers only', filter_bs_not: 'Non-bestsellers',
    filter_reset: 'Reset', filter_btn: 'Filters',
    kpi_rupture: 'Out of Stock', kpi_total: 'Total', kpi_low: 'Low Stock',
    search_placeholder: 'Search perfume...',
    delete_selected: 'Delete selection',
    section_id: 'Identification', section_pricing: 'Pricing & promotion',
    section_stock: 'Volume & stock', section_promo: 'Promotion',
    section_olfactive: 'Olfactive profile', section_notes: 'Perfume notes',
    section_desc: 'Descriptions', section_flags: 'Highlighting',
    section_images: 'Perfume images',
    field_brand: 'Brand', field_name: 'Perfume name', field_slug: 'URL slug',
    field_sku: 'SKU', field_category: 'Category', field_genre: 'Target gender',
    field_intensite: 'Intensity', field_volume: 'Volume (ml)', field_price: 'Sale price (FCFA)',
    field_purchase: 'Purchase price (FCFA)', field_promo_price: 'Promotional price (FCFA)',
    field_reduction: 'Discount (%)', field_stock: 'Stock', field_alert: 'Alert threshold',
    field_notes_tete: 'Top notes', field_notes_coeur: 'Heart notes', field_notes_fond: 'Base notes',
    field_desc_short: 'Short description', field_desc_long: 'Long description', field_desc_ai: 'AI description',
    field_bestseller: 'Bestseller', field_new: 'New', field_active: 'Active',
    field_date_debut: 'Promo start date', field_date_fin: 'Promo end date',
    field_promo_msg: 'Promo message', field_reset_dates: 'Reset dates',
    field_choose_category: 'Choose a category',
    margin_label: 'Estimated margin:',
    confirm_delete: 'Are you sure you want to delete this perfume?',
    confirm_bulk: 'Delete',
    toast_load_error: 'Error loading perfumes',
    toast_create_ok: 'Perfume created successfully', toast_update_ok: 'Perfume updated successfully',
    toast_save_error: 'Error saving', toast_delete_ok: 'Perfume deleted',
    toast_delete_error: 'Error deleting', toast_patch_error: 'Error updating',
    toast_bulk_ok: 'perfume(s) deleted', toast_bulk_error: 'Error during bulk delete',
    toast_required: 'Please fix the required fields.',
    toast_category_ok: 'Category created successfully', toast_category_error: 'Error loading categories',
    catalogue: 'Catalogue',
    admin_badge: 'Admin',
  },
} as const;
type TKey = keyof typeof T.fr;

type PerfumeRecord = {
  id?: number | string;
  slug?: string;
  name?: string;
  nom?: string;
  marque?: string;
  reference_sku?: string;
  description_courte?: string;
  description_longue?: string;
  description_ia?: string;
  contenance_ml?: number | string;
  prix_unitaire?: number | string;
  prix_achat?: number | string;
  prix_promotionnel?: number | string;
  taux_reduction?: number | string;
  prix_actuel?: number | string;
  date_debut?: string | null;
  date_fin?: string | null;
  date_creation?: string | null;
  genre_cible?: string;
  intensite?: string;
  notes_tete?: string;
  notes_coeur?: string;
  notes_fond?: string;
  est_nouveau?: boolean;
  est_bestseller?: boolean;
  stock_quantite?: number | string;
  stock?: number | string;
  seuil_alerte_stock?: number | string;
  categorie?: { id?: number | string } | number | string;
  actif?: boolean;
  message_promotion?: string;
  image_principale?: string | null;
  image?: string | null;
  image_supp_1?: string | null;
  image_supp_2?: string | null;
  image_supp_3?: string | null;
  image_supp_4?: string | null;
  [key: string]: unknown;
};

type CategoryRecord = {
  id?: number | string;
  nom?: string;
  [key: string]: unknown;
};

import { useToastStore } from '@/store/useToastStore';
import { useCatalogPermissions } from '@/hooks/useCatalogPermissions';
import CatalogAccessNotice from '@/components/catalog/CatalogAccessNotice';
import { extractCatalogList, fetchAllCatalogPages, extractCatalogMeta } from '@/lib/catalogUtils';
import { fromDatetimeLocalValue, toDatetimeLocalValue } from '@/lib/promotionUtils';
import AppImage from '@/components/ui/AppImage';
import { MultiImageUpload } from '@/components/MultiImageUpload';
import { CreateCategoryModal } from '@/components/CreateCategoryModal';
import { useAuthStore } from '@/store/useAuthStore';
import { FormModal } from '@/components/ui/FormModal';
import { TablePagination } from '@/components/admin/TablePagination';

/* -------------------------------------------------------------------------- */
/*                               SHARED PRIMITIVES                            */
/* -------------------------------------------------------------------------- */

function cx(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

type StatusType = 'emerald' | 'blue' | 'amber' | 'red' | 'purple' | 'gold' | 'neutral';

interface StatusChipProps {
  label: string;
  type?: StatusType;
}

function StatusChip({ label, type = 'neutral' }: StatusChipProps) {
  const styles: Record<StatusType, { bg: string; text: string; ring: string; dot: string }> = {
    emerald: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      ring: 'ring-emerald-500/20',
      dot: 'bg-emerald-400',
    },
    blue: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      ring: 'ring-blue-500/20',
      dot: 'bg-blue-400',
    },
    amber: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      ring: 'ring-amber-500/20',
      dot: 'bg-amber-400',
    },
    red: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      ring: 'ring-red-500/20',
      dot: 'bg-red-400',
    },
    purple: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      ring: 'ring-purple-500/20',
      dot: 'bg-purple-400',
    },
    gold: {
      bg: 'bg-gold/10',
      text: 'text-gold',
      ring: 'ring-gold/20',
      dot: 'bg-gold',
    },
    neutral: {
      bg: 'bg-white/5',
      text: 'text-foreground/60',
      ring: 'ring-white/10',
      dot: 'bg-foreground/40',
    },
  };

  const style = styles[type] || styles.neutral;

  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset',
        style.bg,
        style.text,
        style.ring
      )}
    >
      <span className={cx('h-1.5 w-1.5 rounded-full', style.dot)} />
      {label}
    </span>
  );
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'red' | 'blue' | 'neutral';
  children: React.ReactNode;
}

function IconButton({ variant = 'neutral', children, className, ...props }: IconButtonProps) {
  const variants = {
    gold: 'hover:text-gold hover:bg-gold/10',
    red: 'hover:text-red-400 hover:bg-red-500/10',
    blue: 'hover:text-blue-400 hover:bg-blue-500/10',
    neutral: 'hover:text-foreground hover:bg-white/5',
  };

  return (
    <button
      {...props}
      className={cx(
        'rounded-md p-1.5 text-foreground/45 transition-colors focus:outline-none',
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

// ── Form primitives — same visual language as the Accessories admin form ──
function FormSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-t border-white/8 pt-6 first:border-t-0 first:pt-0">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gold/75">
        {icon}{title}
      </p>
      {children}
    </section>
  );
}

function Field({
  label, required, error, children,
}: { label: React.ReactNode; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-foreground/55">
        {label}{required && <span className="ml-0.5 text-gold">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/30 focus:border-gold/50';

/* -------------------------------------------------------------------------- */
/*                                MAIN COMPONENT                              */
/* -------------------------------------------------------------------------- */

export default function PerfumeAdminPage() {
  const permissions = useCatalogPermissions('parfums');
  const { user } = useAuthStore();
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en') ?? false;
  const t = (k: TKey) => isEn ? T.en[k] : T.fr[k];
  const isAdmin = Boolean(user?.is_staff || user?.is_superuser || user?.role === 'superadmin');
  const [perfumes, setPerfumes] = useState<PerfumeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [estBestsellerFilter, setEstBestsellerFilter] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPerfume, setEditingPerfume] = useState<PerfumeRecord | null>(null);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [tagTypes, setTagTypes] = useState<Array<{ id: number; nom: string; slug?: string }>>([]);
  const [tagValues, setTagValues] = useState<Record<number, string>>({});
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    marque: 'Accessoire Exclusif',
    nom: '',
    reference_sku: '',
    description_courte: '',
    description_longue: '',
    description_ia: '',
    contenance_ml: '',
    prix_unitaire: '',
    prix_achat: '',
    prix_promotionnel: '',
    taux_reduction: '',
    date_debut: '',
    date_fin: '',
    genre_cible: 'mixte',
    intensite: 'moyenne',
    notes_tete: '',
    notes_coeur: '',
    notes_fond: '',
    est_nouveau: false,
    est_bestseller: false,
    stock_quantite: '',
    seuil_alerte_stock: '5',
    categorie: '',
    actif: true,
    message_promotion: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageResetKey, setImageResetKey] = useState(0);
  const [imageFiles, setImageFiles] = useState<{ [key: string]: File | null }>({
    image_principale: null,
    image_supp_1: null,
    image_supp_2: null,
    image_supp_3: null,
    image_supp_4: null,
  });
  const [existingImages, setExistingImages] = useState<Partial<Record<'image_principale' | 'image_supp_1' | 'image_supp_2' | 'image_supp_3' | 'image_supp_4', string | null>>>({});
  const { addToast } = useToastStore();

  // ── Server-side pagination state ──────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const activeRequestRef = useRef(0);

  const fetchPerfumes = useCallback(async (page = 1) => {
    if (!permissions.canRead) return;
    const requestId = ++activeRequestRef.current;
    try {
      setLoading(true);
      const params: Record<string, unknown> = { page, limit: 50 };
      if (search.trim()) params.search = search.trim();
      if (genreFilter) params.genre = genreFilter;
      if (estBestsellerFilter === 'true') params.est_bestseller = true;
      if (estBestsellerFilter === 'false') params.est_bestseller = false;

      const data = await shopService.getPerfumes(params as Parameters<typeof shopService.getPerfumes>[0]);
      if (requestId !== activeRequestRef.current) return;

      const { items, total, pages, currentPage: apiPage } = extractCatalogMeta<PerfumeRecord>(data);
      setPerfumes(items);
      setTotalItems(total);
      setTotalPages(pages);
      setCurrentPage(apiPage);
    } catch {
      if (requestId === activeRequestRef.current) {
        addToast(t('toast_load_error'), 'error');
      }
    } finally {
      if (requestId === activeRequestRef.current) {
        setLoading(false);
      }
    }
  }, [search, genreFilter, estBestsellerFilter, addToast, permissions.canRead]);

  // Fetch page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
    const timer = setTimeout(() => fetchPerfumes(1), 300);
    return () => clearTimeout(timer);
  }, [search, genreFilter, estBestsellerFilter, createdFrom, createdTo, fetchPerfumes]);


  useEffect(() => {
    shopService.getPerfumeCategories()
      .then(data => {
        const list = data.results || data.resultats || (Array.isArray(data) ? data : []);
        setCategories(list);
      })
      .catch(() => addToast(t('toast_category_error'), 'error'));

    shopService.getTags()
      .then(data => {
        const list = data.results || data.resultats || (Array.isArray(data) ? data : []);
        setTagTypes(list);
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addToast]);

  const updateForm = (field: keyof typeof form, value: string | number | boolean | null | undefined) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const toggleSelectedSlug = (slug: string) => {
    setSelectedSlugs(prev => prev.includes(slug) ? prev.filter(item => item !== slug) : [...prev, slug]);
  };

  const updateTagValue = (tagId: number, value: string) => {
    setTagValues(prev => ({ ...prev, [tagId]: value }));
  };

  const patchPerfume = async (slug: string, field: string, value: string) => {
    if (!permissions.canUpdate) return;
    setPerfumes(prev => prev.map(p => (p.slug || String(p.id)) === slug ? { ...p, [field]: value } : p));
    try {
      const fd = new FormData();
      fd.append(field, value);
      await adminService.patchFormData(`shop/parfums/${slug}/`, fd);
    } catch {
      addToast(t('toast_patch_error'), 'error');
      fetchPerfumes(currentPage);
    }
  };

  const handleBulkDelete = async () => {
    if (!permissions.canDelete || selectedSlugs.length === 0) return;
    if (!confirm(`Supprimer ${selectedSlugs.length} parfum(s) sélectionné(s) ?`)) return;
    const snapshots = perfumes.filter(p => selectedSlugs.includes(p.slug || String(p.id)));
    setPerfumes(prev => prev.filter(p => !selectedSlugs.includes(p.slug || String(p.id))));
    setSelectedSlugs([]);
    try {
      await Promise.all(selectedSlugs.map((slug) => shopService.deletePerfume(slug)));
      addToast(`${snapshots.length} ${t('toast_bulk_ok')}`, 'success');
    } catch {
      setPerfumes(prev => [...snapshots, ...prev]);
      addToast(t('toast_bulk_error'), 'error');
    }
  };

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    if (!form.marque.trim()) errors.marque = 'La marque est requise';
    if (!form.nom.trim()) errors.nom = 'Le nom du parfum est requis';
    if (!form.contenance_ml || Number(form.contenance_ml) <= 0) errors.contenance_ml = 'La contenance doit être supérieure à 0';
    if (!form.prix_unitaire || Number(form.prix_unitaire) <= 0) errors.prix_unitaire = 'Le prix doit être supérieur à 0';
    if (!form.categorie) errors.categorie = 'Une catégorie est requise';
    if (!form.stock_quantite || Number(form.stock_quantite) < 0) errors.stock_quantite = 'Le stock est requis';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setTimeout(() => {
        const firstField = Object.keys(errors)[0];
        const el = document.querySelector(`[data-field="${firstField}"]`);
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
          el.focus();
        }
      }, 0);
    }
    return Object.keys(errors).length === 0;
  }, [form.marque, form.nom, form.contenance_ml, form.prix_unitaire, form.categorie, form.stock_quantite]);

  const handleAddCategory = async (name: string) => {
    const newCategory = await shopService.createPerfumeCategory({
      nom: name,
      actif: true,
      ordre_affichage: 0,
      taux_reduction: '0.00',
    });
    setCategories(prev => [...prev, newCategory]);
    updateForm('categorie', String(newCategory.id));
    addToast(t('toast_category_ok'), 'success');
  };

  const handleOpenAdd = () => {
    setEditingPerfume(null);
    setForm({
      marque: '',
      nom: '',
      reference_sku: '',
      description_courte: '',
      description_longue: '',
      description_ia: '',
      contenance_ml: '',
      prix_unitaire: '',
      prix_achat: '',
      prix_promotionnel: '',
      taux_reduction: '',
      date_debut: '',
      date_fin: '',
      genre_cible: '',
      intensite: '',
      notes_tete: '',
      notes_coeur: '',
      notes_fond: '',
      est_nouveau: false,
      est_bestseller: false,
      stock_quantite: '',
      seuil_alerte_stock: '',
      categorie: '',
      actif: true,
      message_promotion: '',
    });
    setImageFile(null);
    setImageFiles({
      image_principale: null,
      image_supp_1: null,
      image_supp_2: null,
      image_supp_3: null,
      image_supp_4: null,
    });
    setExistingImages({});
    setImageResetKey(prev => prev + 1);
    setTagValues({});
    setFormErrors({});
    setShowModal(true);
  };

  const handleOpenEdit = (perf: PerfumeRecord) => {
    if (!permissions.canUpdate) return;
    setEditingPerfume(perf);
    setForm({
      marque: perf.marque || 'Accessoire Exclusif',
      nom: perf.nom || perf.name || '',
      reference_sku: perf.reference_sku || '',
      description_courte: perf.description_courte || '',
      description_longue: perf.description_longue || '',
      description_ia: perf.description_ia || '',
      contenance_ml: String(perf.contenance_ml || ''),
      prix_unitaire: String(perf.prix_unitaire || ''),
      prix_achat: perf.prix_achat ? String(perf.prix_achat) : '',
      prix_promotionnel: perf.prix_promotionnel ? String(perf.prix_promotionnel) : '',
      taux_reduction: perf.taux_reduction ? String(perf.taux_reduction) : '',
      date_debut: toDatetimeLocalValue(typeof perf.date_debut === 'string' ? perf.date_debut : null),
      date_fin: toDatetimeLocalValue(typeof perf.date_fin === 'string' ? perf.date_fin : null),
      genre_cible: perf.genre_cible || 'mixte',
      intensite: perf.intensite || 'moyenne',
      notes_tete: perf.notes_tete || '',
      notes_coeur: perf.notes_coeur || '',
      notes_fond: perf.notes_fond || '',
      est_nouveau: !!perf.est_nouveau,
      est_bestseller: !!perf.est_bestseller,
      stock_quantite: String(perf.stock_quantite || ''),
      seuil_alerte_stock: String(perf.seuil_alerte_stock || '5'),
      categorie: String((typeof perf.categorie === 'object' && perf.categorie !== null ? perf.categorie.id : perf.categorie) || ''),
      actif: perf.actif !== undefined ? Boolean(perf.actif) : true,
      message_promotion: perf.message_promotion || '',
    });
    setImageFile(null);
    setImageFiles({
      image_principale: null,
      image_supp_1: null,
      image_supp_2: null,
      image_supp_3: null,
      image_supp_4: null,
    });
    setExistingImages({
      image_principale: perf.image_principale || perf.image || null,
      image_supp_1: perf.image_supp_1 || null,
      image_supp_2: perf.image_supp_2 || null,
      image_supp_3: perf.image_supp_3 || null,
      image_supp_4: perf.image_supp_4 || null,
    });
    setImageResetKey(prev => prev + 1);
    const nextTagValues: Record<number, string> = {};
    (Array.isArray((perf as any).tags) ? (perf as any).tags : []).forEach((tag: any) => {
      const tagId = Number(tag.tag ?? tag.id ?? 0);
      if (tagId > 0 && tag.valeur !== undefined) nextTagValues[tagId] = String(tag.valeur);
    });
    setTagValues(nextTagValues);
    setFormErrors({});
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!permissions.canCreate && !permissions.canUpdate) return;
    if (!validateForm()) {
      addToast(t('toast_required'), 'error');
      return;
    }

    // Clear previous error
    setFormError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      if (key === 'date_debut' || key === 'date_fin') return;
      if (val !== undefined && val !== null && (val !== '' || typeof val === 'boolean')) {
        formData.append(key, String(val));
      }
    });
    const promoDateDebut = fromDatetimeLocalValue(form.date_debut);
    const promoDateFin = fromDatetimeLocalValue(form.date_fin);
    if (promoDateDebut) formData.append('date_debut', promoDateDebut);
    if (promoDateFin) formData.append('date_fin', promoDateFin);

    Object.entries(imageFiles).forEach(([key, file]) => {
      if (file instanceof File) {
        formData.append(key, file);
      }
    });
    Object.entries(existingImages).forEach(([key, url]) => {
      if (editingPerfume && url === null) formData.append(key, '');
    });

    const normalizedTags = Object.entries(tagValues)
      .filter(([, value]) => typeof value === 'string' && value.trim() !== '')
      .map(([tagId, valeur]) => ({ tag: Number(tagId), valeur: valeur.trim() }));
    formData.append('tags', JSON.stringify(normalizedTags));

    try {
      if (editingPerfume) {
        await adminService.patchFormData(`shop/parfums/${editingPerfume.slug}/`, formData);
        setPerfumes(prev => prev.map(p =>
          (p.slug || String(p.id)) === editingPerfume.slug
            ? { ...p, ...Object.fromEntries(Array.from(formData.entries()).filter(([k]) => !k.startsWith('image'))) }
            : p
        ));
        addToast(t('toast_update_ok'), 'success');
        setShowModal(false);
        await fetchPerfumes(currentPage);
      } else {
        await adminService.postFormData('shop/parfums/', formData);
        addToast(t('toast_create_ok'), 'success');
        setShowModal(false);
        handleOpenAdd(); // reset form for next entry
        await fetchPerfumes(1);
      }
    } catch (error: unknown) {
      const responseDetail =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      const errorMessage = responseDetail || t('toast_save_error');
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!permissions.canDelete) return;
    if (!confirm(t('confirm_delete'))) return;
    const snapshot = perfumes.find(p => (p.slug || String(p.id)) === slug);
    setPerfumes(prev => prev.filter(p => (p.slug || String(p.id)) !== slug));
    try {
      await shopService.deletePerfume(slug);
      addToast(t('toast_delete_ok'), 'success');
    } catch {
      if (snapshot) setPerfumes(prev => [snapshot, ...prev]);
      addToast(t('toast_delete_error'), 'error');
    }
  };

  const filtered = perfumes; // server already filters; date filter applied client-side on current page only
  const activeFiltersCount = (genreFilter ? 1 : 0) + (estBestsellerFilter ? 1 : 0) + (createdFrom ? 1 : 0) + (createdTo ? 1 : 0);

  const profitPreview = form.prix_unitaire && form.prix_achat
    ? (parseFloat(form.prix_unitaire) - parseFloat(form.prix_achat))
    : null;

  if (!permissions.canRead) {
    return (
      <div className="space-y-6">
        <CatalogAccessNotice permissions={permissions} resourceLabel="les parfums" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
          <p className="text-sm text-foreground/40">{t('subtitle')}</p>
        </div>
        {permissions.canCreate && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 rounded-lg bg-gold px-3.5 py-2 text-xs font-semibold text-black transition-opacity hover:opacity-90"
          >
            <Plus size={15} />
            <span>{t('add')}</span>
          </button>
        )}
      </div>

      <CatalogAccessNotice permissions={permissions} resourceLabel="les parfums" />

      {/* KPI Summary Strip */}
      <div className="shadow-black/30 shadow-sm flex items-center rounded-xl border border-white/10 bg-white/[0.02] divide-x divide-white/10 overflow-x-auto">
        <div className="flex-1 min-w-[120px] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('kpi_total')}</p>
          <p className="text-xl font-semibold tabular-nums text-foreground mt-0.5">{perfumes.length}</p>
        </div>
        <div className="flex-1 min-w-[120px] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('bestseller')}</p>
          <p className="text-xl font-semibold tabular-nums text-foreground mt-0.5">
            {perfumes.filter(p => p.est_bestseller).length}
          </p>
        </div>
        <div className="flex-1 min-w-[120px] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('kpi_rupture')}</p>
          <p className="text-xl font-semibold tabular-nums text-foreground mt-0.5">
            {perfumes.filter(p => Number(p.stock_quantite ?? p.stock ?? 0) === 0).length}
          </p>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="  space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('search_placeholder')}
              className="w-full rounded-lg border border-white/10 bg-white/[0.02] pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-foreground/40 outline-none focus:border-white/20"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cx(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
              showFilters || activeFiltersCount > 0
                ? 'border-gold/40 text-gold bg-gold/5'
                : 'border-white/10 text-foreground/60 hover:bg-white/[0.03]'
            )}
          >
            <SlidersHorizontal size={14} />
            <span>{t('filter_btn')}</span>
            {activeFiltersCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-black">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Expanded Filters Panel */}
        {showFilters && (
          <div className="shadow-black/30 shadow-sm flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Genre:</span>
              <CustomSelect
                size="sm"
                value={genreFilter}
                onChange={setGenreFilter}
                options={[
                  { value: '', label: t('filter_genre_all') },
                  { value: 'homme', label: t('filter_genre_homme') },
                  { value: 'femme', label: t('filter_genre_femme') },
                  { value: 'mixte', label: 'Unisex' },
                ]}
                className="min-w-[110px]"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Bestseller:</span>
              <CustomSelect
                size="sm"
                value={estBestsellerFilter}
                onChange={setEstBestsellerFilter}
                options={[
                  { value: '', label: t('filter_bs_all') },
                  { value: 'true', label: t('filter_bs_only') },
                  { value: 'false', label: t('filter_bs_not') },
                ]}
                className="min-w-[110px]"
              />
            </div>
            <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
              Créé du
              <input type="date" value={createdFrom} onChange={e => setCreatedFrom(e.target.value)} className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs font-normal normal-case text-foreground" />
            </label>
            <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
              au
              <input type="date" value={createdTo} onChange={e => setCreatedTo(e.target.value)} className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs font-normal normal-case text-foreground" />
            </label>

            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setGenreFilter('');
                  setEstBestsellerFilter('');
                  setCreatedFrom('');
                  setCreatedTo('');
                }}
                className="ml-auto text-[11px] text-foreground/45 hover:text-foreground"
              >
                {t('filter_reset')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* List ------------------------------------------------------------------
          Two renderings of the same data:
          - Desktop (sm and up): full table, row click opens edit modal
          - Mobile (below sm): single-line compact rows that expand on tap
            for volume/margin/bestseller/actions; tapping the row itself
            opens the edit modal
      -------------------------------------------------------------------- */}
      <div className="shadow-black/30 shadow-sm rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden min-h-[300px]">
        {/* Selection Bar */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 bg-white/[0.01]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
            {selectedSlugs.length > 0 ? `${selectedSlugs.length} sélectionné(s)` : t('catalogue')}
          </p>
          {selectedSlugs.length > 0 && permissions.canDelete && (
            <button
              onClick={handleBulkDelete}
              className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
            >
              {t('delete_selected')}
            </button>
          )}
        </div>

        {loading ? (
          <AdminTableSkeleton columns={9} rows={8} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Package size={48} />}
            title="No perfumes"
            description="Create your first perfume to get started"
          />
        ) : (
          <>
            {/* ── Mobile: compact expandable rows ─────────────────────── */}
            <div className="divide-y divide-white/5 sm:hidden">
              {filtered.map(p => {
                const productImg = (typeof p.image_principale === 'string' ? p.image_principale : null) || (typeof p.image === 'string' ? p.image : null);
                const slugKey = p.slug || String(p.id);
                const isSelected = selectedSlugs.includes(slugKey);
                const prixVenteNum = parseFloat(String(p.prix_unitaire || 0));
                const prixAchatNum = parseFloat(String(p.prix_achat || 0));
                const beneficeCalc = p.benefice_unitaire !== undefined
                  ? parseFloat(String(p.benefice_unitaire))
                  : (p.prix_unitaire && p.prix_achat ? prixVenteNum - prixAchatNum : null);
                const stockQty = Number(p.stock_quantite ?? p.stock ?? 0);
                const isExpanded = expandedRow === slugKey;

                return (
                  <div key={slugKey}>
                    <div
                      onClick={() => handleOpenEdit(p)}
                      className={cx(
                        'flex items-center gap-2.5 px-3 py-2.5',
                        permissions.canUpdate && 'cursor-pointer active:bg-white/[0.03]'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectedSlug(slugKey)}
                        onClick={e => e.stopPropagation()}
                        className="rounded border-white/10 bg-white/5 text-gold focus:ring-0 focus:ring-offset-0"
                      />
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5 flex items-center justify-center">
                        {productImg ? (
                          <AppImage src={productImg} alt={p.nom || 'Parfum'} fill className="object-cover" />
                        ) : (
                          <ImageIcon size={14} className="text-foreground/20" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground">{p.nom || p.name || ''}</p>
                        {p.marque && <p className="truncate text-[10px] text-foreground/40">{p.marque}</p>}
                      </div>
                      <p className="shrink-0 whitespace-nowrap text-xs font-semibold tabular-nums text-foreground">
                        {Number(p.prix_actuel ?? p.prix_unitaire ?? 0).toLocaleString()} F
                      </p>
                      {stockQty === 0 ? (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" title={t('out_of_stock')} />
                      ) : stockQty <= Number(p.seuil_alerte_stock || 5) ? (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" title={t('low_stock')} />
                      ) : (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" title={t('in_stock')} />
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); setExpandedRow(isExpanded ? null : slugKey); }}
                        aria-label={isEn ? 'Toggle details' : 'Afficher les détails'}
                        className="shrink-0 rounded-md p-1 text-foreground/40 transition-colors hover:bg-white/6 hover:text-foreground/70"
                      >
                        <ChevronDown size={15} className={cx('transition-transform', isExpanded && 'rotate-180')} />
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="flex flex-wrap items-center gap-2 bg-white/[0.02] px-3 pb-3 pt-1">
                        <StatusChip
                          label={stockQty === 0 ? t('out_of_stock') : stockQty <= Number(p.seuil_alerte_stock || 5) ? t('low_stock') : t('in_stock')}
                          type={stockQty === 0 ? 'red' : stockQty <= Number(p.seuil_alerte_stock || 5) ? 'amber' : 'emerald'}
                        />
                        {Boolean(p.est_bestseller) && <StatusChip label={t('bestseller')} type="gold" />}
                        <span className="rounded-full bg-white/6 px-2.5 py-1 text-[11px] font-medium text-foreground/60">
                          {p.contenance_ml ? `${p.contenance_ml} ml` : '—'}
                        </span>
                        {isAdmin && beneficeCalc !== null && (
                          <span className={cx(
                            'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                            beneficeCalc >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          )}>
                            +{beneficeCalc.toLocaleString()} FCFA
                          </span>
                        )}
                        <div className="ml-auto flex items-center gap-1">
                          {permissions.canUpdate && (
                            <IconButton variant="gold" onClick={() => handleOpenEdit(p)} title="Modifier">
                              <Edit2 size={14} />
                            </IconButton>
                          )}
                          {permissions.canDelete && (
                            <IconButton variant="red" onClick={() => handleDelete(p.slug || String(p.id))} title="Supprimer">
                              <Trash2 size={14} />
                            </IconButton>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Desktop: full table ─────────────────────────────────── */}
            <div className="hidden sm:block sm:overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35 w-10">
                      <input
                        type="checkbox"
                        checked={filtered.length > 0 && selectedSlugs.length === filtered.length}
                        onChange={() => {
                          if (selectedSlugs.length === filtered.length) {
                            setSelectedSlugs([]);
                          } else {
                            setSelectedSlugs(filtered.map((p: PerfumeRecord) => p.slug || String(p.id)));
                          }
                        }}
                        className="rounded border-white/10 bg-white/5 text-gold focus:ring-0 focus:ring-offset-0"
                      />
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35 w-14">{t('col_image')}</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('col_name')}</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('col_status')}</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('col_stock')}</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('col_volume')}</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('col_price')}</th>
                    {isAdmin && (
                      <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('col_margin')}</th>
                    )}
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35 text-right">{t('col_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map(p => {
                    const productImg = (typeof p.image_principale === 'string' ? p.image_principale : null) || (typeof p.image === 'string' ? p.image : null);
                    const slugKey = p.slug || String(p.id);
                    const isSelected = selectedSlugs.includes(slugKey);
                    const prixVenteNum = parseFloat(String(p.prix_unitaire || 0));
                    const prixAchatNum = parseFloat(String(p.prix_achat || 0));
                    const beneficeCalc = p.benefice_unitaire !== undefined
                      ? parseFloat(String(p.benefice_unitaire))
                      : (p.prix_unitaire && p.prix_achat ? prixVenteNum - prixAchatNum : null);
                    const stockQty = Number(p.stock_quantite ?? p.stock ?? 0);

                    return (
                      <tr
                        key={p.id}
                        onClick={() => handleOpenEdit(p)}
                        className={cx(
                          'hover:bg-white/[0.02] transition-colors group',
                          permissions.canUpdate && 'cursor-pointer'
                        )}
                      >
                        <td className="px-4 py-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectedSlug(slugKey)}
                            className="rounded border-white/10 bg-white/5 text-gold focus:ring-0 focus:ring-offset-0"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="relative w-9 h-9 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                            {productImg ? (
                              <AppImage
                                src={productImg}
                                alt={p.nom || 'Parfum'}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <ImageIcon size={14} className="text-foreground/20" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-foreground whitespace-nowrap">
                          <div className="flex flex-col" onClick={e => e.stopPropagation()}>
                            <InlineCell value={p.nom || p.name || ''} onSave={v => patchPerfume(p.slug || String(p.id), 'nom', v)} disabled={!permissions.canUpdate} className="font-medium text-foreground" />
                            {p.marque && <span className="text-[10px] text-foreground/40">{p.marque}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {stockQty === 0 ? (
                              <StatusChip label={t('out_of_stock')} type="red" />
                            ) : stockQty <= Number(p.seuil_alerte_stock || 5) ? (
                              <StatusChip label={t('low_stock')} type="amber" />
                            ) : (
                              <StatusChip label={t('in_stock')} type="emerald" />
                            )}
                            {Boolean(p.est_bestseller) && <StatusChip label={t('bestseller')} type="gold" />}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs tabular-nums text-foreground/60 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <InlineCell value={String(stockQty)} onSave={v => patchPerfume(p.slug || String(p.id), 'stock_quantite', v)} disabled={!permissions.canUpdate} inputType="number" className="text-foreground/60 tabular-nums" />
                        </td>
                        <td className="px-4 py-3 text-xs tabular-nums text-foreground/60 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <InlineCell value={String(p.contenance_ml ?? '')} onSave={v => patchPerfume(p.slug || String(p.id), 'contenance_ml', v)} disabled={!permissions.canUpdate} inputType="number" display={p.contenance_ml ? <>{p.contenance_ml} ml</> : <>—</>} className="text-foreground/60 tabular-nums" />
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold tabular-nums text-foreground whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <InlineCell value={String(p.prix_unitaire ?? '')} onSave={v => patchPerfume(p.slug || String(p.id), 'prix_unitaire', v)} disabled={!permissions.canUpdate} inputType="number" display={p.taux_reduction ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-foreground/40 line-through text-[11px] font-normal">{String(p.prix_unitaire ?? '')} FCFA</span>
                              <span className="text-gold">{String(p.prix_actuel ?? '')} FCFA</span>
                            </div>
                          ) : <span>{p.prix_unitaire ? `${p.prix_unitaire} FCFA` : '—'}</span>} className="font-semibold text-foreground tabular-nums" />
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-xs font-medium tabular-nums whitespace-nowrap">
                            {beneficeCalc !== null ? (
                              <span className={beneficeCalc >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                +{beneficeCalc.toLocaleString()} FCFA
                              </span>
                            ) : (
                              <span className="text-foreground/30 text-[11px] italic">—</span>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {permissions.canUpdate && (
                              <IconButton variant="gold" onClick={() => handleOpenEdit(p)} title="Modifier">
                                <Edit2 size={14} />
                              </IconButton>
                            )}
                            {permissions.canDelete && (
                              <IconButton variant="red" onClick={() => handleDelete(p.slug || String(p.id))} title="Supprimer">
                                <Trash2 size={14} />
                              </IconButton>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={50}
              onPageChange={(page) => { setCurrentPage(page); fetchPerfumes(page); }}
              itemLabel={isEn ? 'perfumes' : 'parfums'}
            />
          </>
        )}
      </div>

      {/* Form Modal ────────────────────────────────────────────────────────── */}
      <FormModal
        key={editingPerfume ? `edit-${editingPerfume.id}` : 'new'}
        isOpen={showModal && (permissions.canCreate || permissions.canUpdate)}
        onClose={() => setShowModal(false)}
        title={editingPerfume ? t('edit_modal') : t('new_modal')}
        subtitle="Formulaire complet, sans popup ni défilement gênant."
        size="3xl"
      >
        <div className="p-6 lg:p-8">
          {/* Error Banner */}
          {formError && (
            <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400">{isEn ? 'Save Error' : 'Erreur lors de la sauvegarde'}</p>
                <p className="mt-1 text-xs text-red-400/80">{formError}</p>
              </div>
              <button
                onClick={() => setFormError(null)}
                className="text-red-400/60 hover:text-red-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.65fr_1fr] lg:items-start">
            {/* ── Left: one cohesive form card ─────────────────────────── */}
            <div className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">

              <FormSection title={t('section_id')} icon={<Tag size={11} />}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label={t('field_brand')} required error={formErrors.marque}>
                    <input
                      data-field="marque"
                      value={form.marque}
                      onChange={(e) => updateForm('marque', e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label={t('field_name')} required error={formErrors.nom}>
                    <input
                      data-field="nom"
                      value={form.nom}
                      onChange={(e) => updateForm('nom', e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label={t('field_category')} required error={formErrors.categorie}>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative z-[9999]">
                        <CustomSelect
                          data-field="categorie"
                          value={form.categorie}
                          onChange={(value) => updateForm('categorie', value)}
                          options={categories.map((c) => ({ value: String(c.id), label: c.nom || '' }))}
                          placeholder={t('field_choose_category')}
                          error={!!formErrors.categorie}
                          className="relative z-[9999]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="flex h-11 w-11 items-center justify-center rounded-lg border border-gold/40 bg-gold/10 text-lg font-semibold text-gold transition-colors hover:bg-gold/20"
                        aria-label="Créer une nouvelle catégorie"
                        title="Créer une nouvelle catégorie"
                      >
                        +
                      </button>
                    </div>
                  </Field>
                  <Field label={t('field_sku')}>
                    <input
                      data-field="reference_sku"
                      value={form.reference_sku}
                      onChange={(e) => updateForm('reference_sku', e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label={t('field_genre')}>
                    <CustomSelect
                      data-field="genre_cible"
                      value={form.genre_cible}
                      onChange={(value) => updateForm('genre_cible', value)}
                      options={[
                        { value: 'homme', label: t('filter_genre_homme') },
                        { value: 'femme', label: t('filter_genre_femme') },
                        { value: 'mixte', label: 'Unisex' },
                      ]}
                    />
                  </Field>
                  <Field label={t('field_intensite')}>
                    <CustomSelect
                      data-field="intensite"
                      value={form.intensite}
                      onChange={(value) => updateForm('intensite', value)}
                      options={[
                        { value: 'légère', label: isEn ? 'Light' : 'Légère' },
                        { value: 'moyenne', label: isEn ? 'Medium' : 'Moyenne' },
                        { value: 'forte', label: isEn ? 'Strong' : 'Forte' },
                        { value: 'très forte', label: isEn ? 'Very strong' : 'Très forte' },
                      ]}
                    />
                  </Field>
                </div>
              </FormSection>

              <FormSection title={t('section_olfactive')} icon={<Sparkles size={11} />}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label={t('field_notes_tete')}>
                    <input
                      data-field="notes_tete"
                      value={form.notes_tete}
                      onChange={(e) => updateForm('notes_tete', e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label={t('field_notes_coeur')}>
                    <input
                      data-field="notes_coeur"
                      value={form.notes_coeur}
                      onChange={(e) => updateForm('notes_coeur', e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label={t('field_notes_fond')}>
                    <input
                      data-field="notes_fond"
                      value={form.notes_fond}
                      onChange={(e) => updateForm('notes_fond', e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                </div>
              </FormSection>

              <FormSection title={t('section_desc')} icon={<Layers size={11} />}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label={t('field_desc_short')}>
                      <textarea
                        data-field="description_courte"
                        value={form.description_courte}
                        onChange={(e) => updateForm('description_courte', e.target.value)}
                        rows={3}
                        className={cx(inputCls, 'resize-none')}
                      />
                    </Field>
                    <Field label={t('field_desc_ai')}>
                      <textarea
                        data-field="description_ia"
                        value={form.description_ia}
                        onChange={(e) => updateForm('description_ia', e.target.value)}
                        rows={3}
                        className={cx(inputCls, 'resize-none')}
                      />
                    </Field>
                  </div>
                  <Field label={t('field_desc_long')}>
                    <textarea
                      data-field="description_longue"
                      value={form.description_longue}
                      onChange={(e) => updateForm('description_longue', e.target.value)}
                      rows={4}
                      className={cx(inputCls, 'resize-none')}
                    />
                  </Field>
                </div>
              </FormSection>

              <FormSection title={t('section_stock')} icon={<Boxes size={11} />}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Field label={t('field_volume')} required error={formErrors.contenance_ml}>
                    <input
                      data-field="contenance_ml"
                      type="number"
                      placeholder="ex: 100"
                      value={form.contenance_ml}
                      onChange={(e) => updateForm('contenance_ml', e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label={t('field_stock')} required error={formErrors.stock_quantite}>
                    <input
                      data-field="stock_quantite"
                      type="number"
                      value={form.stock_quantite}
                      onChange={(e) => updateForm('stock_quantite', e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label={t('field_alert')}>
                    <input
                      data-field="seuil_alerte_stock"
                      type="number"
                      value={form.seuil_alerte_stock}
                      onChange={(e) => updateForm('seuil_alerte_stock', e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                </div>
              </FormSection>

              <FormSection title={t('section_pricing')} icon={<DollarSign size={11} />}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t('field_price')} required error={formErrors.prix_unitaire}>
                      <input
                        data-field="prix_unitaire"
                        type="number"
                        placeholder="ex: 25000"
                        value={form.prix_unitaire}
                        onChange={(e) => updateForm('prix_unitaire', e.target.value)}
                        className={inputCls}
                      />
                    </Field>
                    <Field label={t('field_promo_price')}>
                      <input
                        data-field="prix_promotionnel"
                        type="number"
                        placeholder="ex: 18000"
                        value={form.prix_promotionnel}
                        onChange={(e) => updateForm('prix_promotionnel', e.target.value)}
                        className={inputCls}
                      />
                    </Field>
                  </div>

                  {isAdmin && (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                      <Field
                        label={
                          <span className="flex items-center gap-1.5 text-amber-400/90">
                            {t('field_purchase')}
                            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400">{t('admin_badge')}</span>
                          </span>
                        }
                      >
                        <input
                          data-field="prix_achat"
                          type="number"
                          placeholder="ex: 15000"
                          value={form.prix_achat}
                          onChange={(e) => updateForm('prix_achat', e.target.value)}
                          className={cx(inputCls, 'border-amber-500/20')}
                        />
                      </Field>
                      {profitPreview !== null && (
                        <p className={cx('mt-2 text-xs font-medium', profitPreview >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                          {t('margin_label')} {profitPreview >= 0 ? '+' : ''}{profitPreview.toLocaleString()} FCFA
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t('field_reduction')}>
                      <input
                        data-field="taux_reduction"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="ex: 20"
                        value={form.taux_reduction}
                        onChange={(e) => updateForm('taux_reduction', e.target.value)}
                        className={inputCls}
                      />
                    </Field>
                    <Field label={t('field_promo_msg')}>
                      <input
                        data-field="message_promotion"
                        value={form.message_promotion}
                        onChange={(e) => updateForm('message_promotion', e.target.value)}
                        className={inputCls}
                      />
                    </Field>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={t('field_date_debut')}>
                        <input
                          data-field="date_debut"
                          type="datetime-local"
                          value={form.date_debut}
                          onChange={(e) => updateForm('date_debut', e.target.value)}
                          className={inputCls}
                        />
                      </Field>
                      <Field label={t('field_date_fin')}>
                        <input
                          data-field="date_fin"
                          type="datetime-local"
                          value={form.date_fin}
                          onChange={(e) => updateForm('date_fin', e.target.value)}
                          className={inputCls}
                        />
                      </Field>
                    </div>
                    <button
                      type="button"
                      onClick={() => { updateForm('date_debut', ''); updateForm('date_fin', ''); }}
                      className="mt-2 text-[11px] font-medium text-foreground/50 transition-colors hover:text-gold"
                    >
                      {t('field_reset_dates')}
                    </button>
                  </div>
                </div>
              </FormSection>

              <FormSection title={t('section_flags')} icon={<Sparkles size={11} />}>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.est_nouveau} onChange={(e) => updateForm('est_nouveau', e.target.checked)} className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold" />
                    <span className="text-xs text-foreground/70">{t('field_new')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.est_bestseller} onChange={(e) => updateForm('est_bestseller', e.target.checked)} className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold" />
                    <span className="text-xs text-foreground/70">{t('field_bestseller')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.actif} onChange={(e) => updateForm('actif', e.target.checked)} className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold" />
                    <span className="text-xs text-foreground/70">{t('field_active')}</span>
                  </label>
                </div>
              </FormSection>

              {tagTypes.length > 0 && (
                <FormSection title="Tags" icon={<Tag size={11} />}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {tagTypes.map((tagType) => (
                      <Field key={tagType.id} label={tagType.nom}>
                        <input
                          value={tagValues[tagType.id] ?? ''}
                          onChange={(e) => updateTagValue(tagType.id, e.target.value)}
                          placeholder={tagType.nom}
                          className={inputCls}
                        />
                      </Field>
                    ))}
                  </div>
                </FormSection>
              )}
            </div>

            {/* ── Right: sticky images panel ───────────────────────────── */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 lg:sticky lg:top-6">
              <p className="mb-4 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gold/75">
                {t('section_images')}
              </p>
              <MultiImageUpload
                key={imageResetKey}
                initialImages={existingImages}
                onExistingImagesChange={(changes) => setExistingImages(prev => ({ ...prev, ...changes }))}
                onImagesChange={(images) => setImageFiles(images)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">{isEn ? 'Cancel' : 'Annuler'}</button>
            <button onClick={handleSave} disabled={isSubmitting} className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-bold hover:bg-gold/80 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>{isEn ? 'Sending...' : 'Envoi...'}</span>
                </>
              ) : (
                isEn ? 'Save' : 'Enregistrer'
              )}
            </button>
          </div>
        </div>
      </FormModal>

      <CreateCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={handleAddCategory}
        title="Nouvelle catégorie parfum"
        categoryType="Catégorie"
      />
    </div>
  );
}