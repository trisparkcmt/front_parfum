'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Edit2, Trash2, Plus, Search, Image as ImageIcon, SlidersHorizontal, AlertCircle, X, Package } from 'lucide-react';
import { shopService } from '@/services/apiService';
import { adminService } from '@/services/apiService';
import { InlineCell } from '@/components/admin/InlineCell';
import { useTranslation } from 'react-i18next';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { AdminTableSkeleton } from '@/components/ui/AdminTableSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { mapErrorToUserMessage } from '@/lib/errorMapper';

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
    filter_genre_homme: 'Homme', filter_genre_femme: 'Femme', filter_genre_mixte: 'Mixte',
    filter_bestseller: 'Bestseller :', filter_bs_all: 'Tous',
    filter_bs_only: 'Bestsellers uniquement', filter_bs_not: 'Non bestsellers',
    filter_reset: 'Réinitialiser', filter_btn: 'Filtres',
    kpi_rupture: 'En Rupture', kpi_total: 'Total', kpi_low: 'Stock Bas',
    search_placeholder: 'Rechercher un parfum...',
    delete_selected: 'Supprimer la sélection',
    section_id: 'Identification', section_pricing: 'Tarification',
    section_stock: 'Stock & disponibilité', section_promo: 'Promotion',
    section_olfactive: 'Profil olfactif', section_notes: 'Notes parfum',
    section_images: 'Images du parfum',
    field_brand: 'Marque', field_name: 'Nom du parfum', field_slug: 'Slug URL',
    field_sku: 'SKU', field_category: 'Catégorie', field_genre: 'Genre cible',
    field_intensite: 'Intensité', field_volume: 'Contenance (ml)', field_price: 'Prix de vente (FCFA)',
    field_purchase: "Prix d'achat (FCFA)", field_promo_price: 'Prix promotionnel (FCFA)',
    field_reduction: 'Réduction (%)', field_stock: 'Stock', field_alert: "Seuil d'alerte",
    field_notes_tete: 'Notes de tête', field_notes_coeur: 'Notes de cœur', field_notes_fond: 'Notes de fond',
    field_desc_short: 'Description courte', field_desc_long: 'Description longue',
    field_bestseller: 'Bestseller', field_new: 'Nouveau', field_active: 'Actif',
    field_date_debut: 'Date début promo', field_date_fin: 'Date fin promo',
    field_promo_msg: 'Message promotion',
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
    section_id: 'Identification', section_pricing: 'Pricing',
    section_stock: 'Stock & availability', section_promo: 'Promotion',
    section_olfactive: 'Olfactive profile', section_notes: 'Perfume notes',
    section_images: 'Perfume images',
    field_brand: 'Brand', field_name: 'Perfume name', field_slug: 'URL slug',
    field_sku: 'SKU', field_category: 'Category', field_genre: 'Target gender',
    field_intensite: 'Intensity', field_volume: 'Volume (ml)', field_price: 'Sale price (FCFA)',
    field_purchase: 'Purchase price (FCFA)', field_promo_price: 'Promotional price (FCFA)',
    field_reduction: 'Discount (%)', field_stock: 'Stock', field_alert: 'Alert threshold',
    field_notes_tete: 'Top notes', field_notes_coeur: 'Heart notes', field_notes_fond: 'Base notes',
    field_desc_short: 'Short description', field_desc_long: 'Long description',
    field_bestseller: 'Bestseller', field_new: 'New', field_active: 'Active',
    field_date_debut: 'Promo start date', field_date_fin: 'Promo end date',
    field_promo_msg: 'Promo message',
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
  },
} as const;
type TKey = keyof typeof T.fr;
import { useToastStore } from '@/store/useToastStore';
import { useCatalogPermissions } from '@/hooks/useCatalogPermissions';
import CatalogAccessNotice from '@/components/catalog/CatalogAccessNotice';
import { extractCatalogList } from '@/lib/catalogUtils';
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
  const [perfumes, setPerfumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [estBestsellerFilter, setEstBestsellerFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPerfume, setEditingPerfume] = useState<any | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    marque: 'Accessoire Exclusif',
    nom: '',
    slug: '',
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
  const [imageFiles, setImageFiles] = useState<{ [key: string]: File | null }>({
    image_principale: null,
    image_supp_1: null,
    image_supp_2: null,
    image_supp_3: null,
    image_supp_4: null,
  });
  const { addToast } = useToastStore();

  const fetchPerfumes = useCallback(async () => {
    if (!permissions.canRead) return;
    try {
      setLoading(true);
      const params: Record<string, unknown> = {};
      if (search) params.search = search;
      if (genreFilter) params.genre = genreFilter;
      if (estBestsellerFilter === 'true') params.est_bestseller = true;
      if (estBestsellerFilter === 'false') params.est_bestseller = false;
      const data = await shopService.getPerfumes(params);
      setPerfumes(extractCatalogList(data));
    } catch {
      addToast(t('toast_load_error'), 'error');
    } finally {
      setLoading(false);
    }
  }, [search, genreFilter, estBestsellerFilter, addToast, permissions.canRead]);

  useEffect(() => {
    const timer = setTimeout(fetchPerfumes, 300);
    return () => clearTimeout(timer);
  }, [fetchPerfumes]);

  useEffect(() => {
    shopService.getPerfumeCategories()
      .then(data => {
        const list = data.results || data.resultats || (Array.isArray(data) ? data : []);
        setCategories(list);
      })
      .catch(() => addToast(t('toast_category_error'), 'error'));
  }, [addToast]);

  const updateForm = (field: keyof typeof form, value: any) => {
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

  const patchPerfume = async (slug: string, field: string, value: string) => {
    if (!permissions.canUpdate) return;
    setPerfumes(prev => prev.map(p => (p.slug || String(p.id)) === slug ? { ...p, [field]: value } : p));
    try {
      const fd = new FormData();
      fd.append(field, value);
      await adminService.patchFormData(`shop/parfums/${slug}/`, fd);
    } catch {
      addToast(t('toast_patch_error'), 'error');
      fetchPerfumes();
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
      slug: '',
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
    setFormErrors({});
    setShowModal(true);
  };

  const handleOpenEdit = (perf: any) => {
    setEditingPerfume(perf);
    setForm({
      marque: perf.marque || 'Accessoire Exclusif',
      nom: perf.nom || perf.name || '',
      slug: perf.slug || '',
      reference_sku: perf.reference_sku || '',
      description_courte: perf.description_courte || '',
      description_longue: perf.description_longue || '',
      description_ia: perf.description_ia || '',
      contenance_ml: String(perf.contenance_ml || ''),
      prix_unitaire: String(perf.prix_unitaire || ''),
      prix_achat: perf.prix_achat ? String(perf.prix_achat) : '',
      prix_promotionnel: perf.prix_promotionnel ? String(perf.prix_promotionnel) : '',
      taux_reduction: perf.taux_reduction ? String(perf.taux_reduction) : '',
      date_debut: toDatetimeLocalValue(perf.date_debut),
      date_fin: toDatetimeLocalValue(perf.date_fin),
      genre_cible: perf.genre_cible || 'mixte',
      intensite: perf.intensite || 'moyenne',
      notes_tete: perf.notes_tete || '',
      notes_coeur: perf.notes_coeur || '',
      notes_fond: perf.notes_fond || '',
      est_nouveau: !!perf.est_nouveau,
      est_bestseller: !!perf.est_bestseller,
      stock_quantite: String(perf.stock_quantite || ''),
      seuil_alerte_stock: String(perf.seuil_alerte_stock || '5'),
      categorie: String(perf.categorie?.id || perf.categorie || ''),
      actif: perf.actif !== undefined ? perf.actif : true,
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
        await fetchPerfumes();
      } else {
        await adminService.postFormData('shop/parfums/', formData);
        addToast(t('toast_create_ok'), 'success');
        setShowModal(false);
        handleOpenAdd(); // reset form for next entry
        await fetchPerfumes();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || t('toast_save_error');
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

  const filtered = perfumes;
  const activeFiltersCount = (genreFilter ? 1 : 0) + (estBestsellerFilter ? 1 : 0);

  // ── Pagination & stock split ──────────────────────────────────────────────
  const ITEMS_PER_PAGE = 50;
  const [pageInStock, setPageInStock] = useState(1);
  const [pageOutOfStock, setPageOutOfStock] = useState(1);

  const inStockItems  = filtered.filter(p => Number(p.stock_quantite ?? p.stock ?? 0) > 0);
  const outOfStockItems = filtered.filter(p => Number(p.stock_quantite ?? p.stock ?? 0) === 0);

  const inStockTotalPages  = Math.max(1, Math.ceil(inStockItems.length / ITEMS_PER_PAGE));
  const outStockTotalPages = Math.max(1, Math.ceil(outOfStockItems.length / ITEMS_PER_PAGE));

  const pagedInStock  = inStockItems.slice((pageInStock - 1) * ITEMS_PER_PAGE, pageInStock * ITEMS_PER_PAGE);
  const pagedOutOfStock = outOfStockItems.slice((pageOutOfStock - 1) * ITEMS_PER_PAGE, pageOutOfStock * ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => { setPageInStock(1); setPageOutOfStock(1); }, [search, genreFilter, estBestsellerFilter]);

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
                  { value: 'mixte', label: t('filter_genre_mixte') },
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

            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setGenreFilter('');
                  setEstBestsellerFilter('');
                }}
                className="ml-auto text-[11px] text-foreground/45 hover:text-foreground"
              >
                {t('filter_reset')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="shadow-black/30 shadow-sm rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden min-h-[300px]">
        {/* Selection Bar */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 bg-white/[0.01]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
            {selectedSlugs.length > 0 ? `${selectedSlugs.length} sélectionné(s)` : 'Catalogue'}
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
          <div className="overflow-x-auto">
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
                          setSelectedSlugs(filtered.map((p: any) => p.slug || String(p.id)));
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
                {pagedInStock.map(p => {
                  const productImg = p.image_principale || p.image;
                  const slugKey = p.slug || String(p.id);
                  const isSelected = selectedSlugs.includes(slugKey);
                  const prixVenteNum = parseFloat(String(p.prix_unitaire || 0));
                  const prixAchatNum = parseFloat(String(p.prix_achat || 0));
                  const beneficeCalc = p.benefice_unitaire !== undefined 
                    ? parseFloat(String(p.benefice_unitaire))
                    : (p.prix_unitaire && p.prix_achat ? prixVenteNum - prixAchatNum : null);
                  const stockQty = Number(p.stock_quantite ?? p.stock ?? 0);

                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-4 py-3 whitespace-nowrap">
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
                        <div className="flex flex-col">
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
                          {p.est_bestseller && <StatusChip label="Bestseller" type="gold" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs tabular-nums text-foreground/60 whitespace-nowrap">
                        <InlineCell value={String(stockQty)} onSave={v => patchPerfume(p.slug || String(p.id), 'stock_quantite', v)} disabled={!permissions.canUpdate} inputType="number" className="text-foreground/60 tabular-nums" />
                      </td>
                      <td className="px-4 py-3 text-xs tabular-nums text-foreground/60 whitespace-nowrap">
                        <InlineCell value={String(p.contenance_ml ?? '')} onSave={v => patchPerfume(p.slug || String(p.id), 'contenance_ml', v)} disabled={!permissions.canUpdate} inputType="number" display={p.contenance_ml ? <>{p.contenance_ml} ml</> : <>—</>} className="text-foreground/60 tabular-nums" />
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold tabular-nums text-foreground whitespace-nowrap">
                        <InlineCell value={String(p.prix_unitaire ?? '')} onSave={v => patchPerfume(p.slug || String(p.id), 'prix_unitaire', v)} disabled={!permissions.canUpdate} inputType="number" display={p.taux_reduction ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-foreground/40 line-through text-[11px] font-normal">{p.prix_unitaire} FCFA</span>
                            <span className="text-gold">{p.prix_actuel} FCFA</span>
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
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {permissions.canUpdate && (
                            <IconButton variant="gold" onClick={() => handleOpenEdit(p)} title="Modifier">
                              <Edit2 size={14} />
                            </IconButton>
                          )}
                          {permissions.canDelete && (
                            <IconButton variant="red" onClick={() => handleDelete(p.slug)} title="Supprimer">
                              <Trash2 size={14} />
                            </IconButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {inStockItems.length === 0 && filtered.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 9 : 8} className="text-center py-16 text-xs italic text-foreground/30">
                      {t('no_results')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <TablePagination
              currentPage={pageInStock}
              totalPages={inStockTotalPages}
              totalItems={inStockItems.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setPageInStock}
              itemLabel={isEn ? 'in-stock perfumes' : 'parfums en stock'}
            />
            {outOfStockItems.length > 0 && (
              <div className="border-t-2 border-red-500/20">
                <div className="px-4 py-2.5 bg-red-500/5 border-b border-red-500/10 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400">
                    {isEn ? `Out of Stock (${outOfStockItems.length})` : `En Rupture de Stock (${outOfStockItems.length})`}
                  </p>
                </div>
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-white/5 opacity-70">
                    {pagedOutOfStock.map(p => {
                      const productImg = p.image_principale || p.image;
                      const slugKey = p.slug || String(p.id);
                      const stockQty = Number(p.stock_quantite ?? p.stock ?? 0);
                      return (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="w-10 px-4 py-2.5">
                            <input type="checkbox" checked={selectedSlugs.includes(slugKey)} onChange={() => toggleSelectedSlug(slugKey)} className="rounded border-white/10 bg-white/5 text-gold focus:ring-0 focus:ring-offset-0" />
                          </td>
                          <td className="w-14 px-4 py-2.5">
                            <div className="relative w-8 h-8 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                              {productImg ? <AppImage src={productImg} alt={p.nom || 'Parfum'} fill className="object-cover opacity-50" /> : <ImageIcon size={13} className="text-foreground/15" />}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-foreground/50">
                            {p.nom || p.name || '—'}
                            {p.marque && <span className="block text-[10px] text-foreground/30">{p.marque}</span>}
                          </td>
                          <td className="px-4 py-2.5"><StatusChip label={t('out_of_stock')} type="red" /></td>
                          <td className="px-4 py-2.5 text-xs tabular-nums text-foreground/40">
                            <InlineCell value={String(stockQty)} onSave={v => patchPerfume(p.slug || String(p.id), 'stock_quantite', v)} disabled={!permissions.canUpdate} inputType="number" className="text-foreground/40 tabular-nums" />
                          </td>
                          <td className="px-4 py-2.5 text-xs text-foreground/35">{p.contenance_ml ? `${p.contenance_ml} ml` : '—'}</td>
                          <td className="px-4 py-2.5 text-xs text-foreground/40">{p.prix_unitaire ? `${p.prix_unitaire} FCFA` : '—'}</td>
                          {isAdmin && <td className="px-4 py-2.5 text-xs text-foreground/35">—</td>}
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {permissions.canUpdate && <IconButton variant="gold" onClick={() => handleOpenEdit(p)} title="Modifier"><Edit2 size={13} /></IconButton>}
                              {permissions.canDelete && <IconButton variant="red" onClick={() => handleDelete(p.slug)} title="Supprimer"><Trash2 size={13} /></IconButton>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <TablePagination
                  currentPage={pageOutOfStock}
                  totalPages={outStockTotalPages}
                  totalItems={outOfStockItems.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setPageOutOfStock}
                  itemLabel={isEn ? 'out-of-stock perfumes' : 'parfums en rupture'}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Modal (Verbatim copy of form structure & handlers to prevent broken logic) */}
      <FormModal
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

          <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_0.9fr] gap-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">{t('field_brand')} *</label>
                    <input
                      data-field="marque"
                      value={form.marque}
                      onChange={(e) => updateForm('marque', e.target.value)}
                      className={`w-full bg-white/5 border rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold ${formErrors.marque ? 'border-red-500/50' : 'border-white/10'}`}
                    />
                    {formErrors.marque && <p className="mt-1 text-xs text-red-500">{formErrors.marque}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">{t('field_name')} *</label>
                    <input
                      data-field="nom"
                      value={form.nom}
                      onChange={(e) => updateForm('nom', e.target.value)}
                      className={`w-full bg-white/5 border rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold ${formErrors.nom ? 'border-red-500/50' : 'border-white/10'}`}
                    />
                    {formErrors.nom && <p className="mt-1 text-xs text-red-500">{formErrors.nom}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">{t('field_slug')}</label>
                    <input
                      data-field="slug"
                      value={form.slug}
                      onChange={(e) => updateForm('slug', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">{t('field_sku')}</label>
                    <input
                      data-field="reference_sku"
                      value={form.reference_sku}
                      onChange={(e) => updateForm('reference_sku', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">{t('field_category')} *</label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <CustomSelect
                          data-field="categorie"
                          value={form.categorie}
                          onChange={(value) => updateForm('categorie', value)}
                          options={categories.map((c) => ({
                            value: String(c.id),
                            label: c.nom,
                          }))}
                          placeholder="Catégorie"
                          error={!!formErrors.categorie}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="px-3 py-2.5 bg-gold text-neutral-900 rounded-lg hover:bg-gold/80 font-medium"
                        title="Créer une nouvelle catégorie"
                      >
                        +
                      </button>
                    </div>
                    {formErrors.categorie && <p className="mt-1 text-xs text-red-500">{formErrors.categorie}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">{t('field_genre')}</label>
                      <CustomSelect
                        data-field="genre_cible"
                        value={form.genre_cible}
                        onChange={(value) => updateForm('genre_cible', value)}
                        options={[
                          { value: 'homme', label: t('filter_genre_homme') },
                          { value: 'femme', label: t('filter_genre_femme') },
                          { value: 'mixte', label: t('filter_genre_mixte') },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">{t('field_intensite')}</label>
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
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">{t('field_notes_tete')}</label>
                      <input
                        data-field="notes_tete"
                        value={form.notes_tete}
                        onChange={(e) => updateForm('notes_tete', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">{t('field_notes_coeur')}</label>
                      <input
                        data-field="notes_coeur"
                        value={form.notes_coeur}
                        onChange={(e) => updateForm('notes_coeur', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">{t('field_notes_fond')}</label>
                      <input
                        data-field="notes_fond"
                        value={form.notes_fond}
                        onChange={(e) => updateForm('notes_fond', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">{t('field_volume')} *</label>
                    <input
                      data-field="contenance_ml"
                      type="number"
                      placeholder="ex: 100"
                      value={form.contenance_ml}
                      onChange={(e) => updateForm('contenance_ml', e.target.value)}
                      className={`w-full bg-white/5 border rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold ${formErrors.contenance_ml ? 'border-red-500/50' : 'border-white/10'}`}
                    />
                    {formErrors.contenance_ml && <p className="mt-1 text-xs text-red-500">{formErrors.contenance_ml}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">{t('field_price')} *</label>
                    <input
                      data-field="prix_unitaire"
                      type="number"
                      placeholder="ex: 25000"
                      value={form.prix_unitaire}
                      onChange={(e) => updateForm('prix_unitaire', e.target.value)}
                      className={`w-full bg-white/5 border rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold ${formErrors.prix_unitaire ? 'border-red-500/50' : 'border-white/10'}`}
                    />
                    {formErrors.prix_unitaire && <p className="mt-1 text-xs text-red-500">{formErrors.prix_unitaire}</p>}
                  </div>
                  {isAdmin && (
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-amber-400/80 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        Prix d'achat (FCFA) <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1 rounded">(Admin)</span>
                      </label>
                      <input
                        data-field="prix_achat"
                        type="number"
                        placeholder="ex: 15000"
                        value={form.prix_achat}
                        onChange={(e) => updateForm('prix_achat', e.target.value)}
                        className="w-full bg-white/5 border border-amber-500/20 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                      />
                      {form.prix_unitaire && form.prix_achat && (
                        <p className="text-xs text-emerald-400 mt-1">
                          Bénéfice estimé : +{(parseFloat(form.prix_unitaire) - parseFloat(form.prix_achat)).toLocaleString()} FCFA
                        </p>
                      )}
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">{t('field_stock')} *</label>
                    <input
                      data-field="stock_quantite"
                      type="number"
                      value={form.stock_quantite}
                      onChange={(e) => updateForm('stock_quantite', e.target.value)}
                      className={`w-full bg-white/5 border rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold ${formErrors.stock_quantite ? 'border-red-500/50' : 'border-white/10'}`}
                    />
                    {formErrors.stock_quantite && <p className="mt-1 text-xs text-red-500">{formErrors.stock_quantite}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">{t('field_alert')}</label>
                    <input
                      data-field="seuil_alerte_stock"
                      type="number"
                      value={form.seuil_alerte_stock}
                      onChange={(e) => updateForm('seuil_alerte_stock', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">{t('field_promo_price')}</label>
                      <input
                        data-field="prix_promotionnel"
                        type="number"
                        placeholder="ex: 18000"
                        value={form.prix_promotionnel}
                        onChange={(e) => updateForm('prix_promotionnel', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">{t('field_reduction')}</label>
                      <input
                        data-field="taux_reduction"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="ex: 20"
                        value={form.taux_reduction}
                        onChange={(e) => updateForm('taux_reduction', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">{t('field_date_debut')}</label>
                        <input
                          data-field="date_debut"
                          type="datetime-local"
                          value={form.date_debut}
                          onChange={(e) => updateForm('date_debut', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">{t('field_date_fin')}</label>
                        <input
                          data-field="date_fin"
                          type="datetime-local"
                          value={form.date_fin}
                          onChange={(e) => updateForm('date_fin', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        updateForm('date_debut', '');
                        updateForm('date_fin', '');
                      }}
                      className="text-xs font-medium text-foreground/60 hover:text-gold transition-colors px-2 py-1"
                    >
                      Réinitialiser les dates
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">{t('field_desc_short')}</label>
                  <textarea
                    data-field="description_courte"
                    value={form.description_courte}
                    onChange={(e) => updateForm('description_courte', e.target.value)}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">{t('field_desc_long')}</label>
                  <textarea
                    data-field="description_longue"
                    value={form.description_longue}
                    onChange={(e) => updateForm('description_longue', e.target.value)}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">{t('field_desc_short')} IA</label>
                  <textarea
                    data-field="description_ia"
                    value={form.description_ia}
                    onChange={(e) => updateForm('description_ia', e.target.value)}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">{t('field_promo_msg')}</label>
                  <textarea
                    data-field="message_promotion"
                    value={form.message_promotion}
                    onChange={(e) => updateForm('message_promotion', e.target.value)}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold resize-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.est_nouveau} onChange={(e) => updateForm('est_nouveau', e.target.checked)} className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold" />
                  <span className="text-xs text-foreground/60">{t('field_new')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.est_bestseller} onChange={(e) => updateForm('est_bestseller', e.target.checked)} className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold" />
                  <span className="text-xs text-foreground/60">{t('field_bestseller')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.actif} onChange={(e) => updateForm('actif', e.target.checked)} className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold" />
                  <span className="text-xs text-foreground/60">{t('field_active')}</span>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 xl:sticky xl:top-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Images</h3>
                <MultiImageUpload onImagesChange={(images) => setImageFiles(images)} />
              </div>
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