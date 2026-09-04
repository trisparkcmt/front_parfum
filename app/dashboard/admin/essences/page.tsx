'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { type LucideIcon,
  Search, Plus, Edit2, Trash2, Loader2,
  ShoppingBag, RefreshCw, ChevronLeft, ChevronRight, X, AlertCircle, Filter
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { InlineCell } from '@/components/admin/InlineCell';
import { AdminTableSkeleton } from '@/components/ui/AdminTableSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { mapErrorToUserMessage } from '@/lib/errorMapper';

/* ── Inline translations ─────────────────────────────────────────────────── */
const T = {
  fr: {
    title: 'Essences', subtitle: 'Catalogue des huiles essentielles du laboratoire',
    add: 'Ajouter une essence', kpi_total: 'Total Essences',
    kpi_boutique: 'Disponibles Boutique', kpi_labo: 'Usage Labo Exclusif',
    col_essence: 'Essence', col_ref: 'Code Réf.', col_category: 'Catégorie',
    col_characteristics: 'Caractéristiques', col_price: 'Prix / ml', col_canal: 'Canal', col_actions: 'Actions',
    canal_boutique: 'Boutique', canal_labo: 'Labo Seul',
    search_placeholder: 'Rechercher par nom, référence, marque...',
    filter_btn: 'Filtres', filter_reset: 'Réinitialiser',
    filter_category: 'Catégorie :', filter_category_all: 'Toutes',
    filter_intensity: 'Intensité :', filter_intensity_all: 'Toutes',
    filter_genre: 'Genre :', filter_genre_all: 'Tous',
    filter_boutique: 'Canal :', filter_boutique_all: 'Tous', filter_boutique_yes: 'Boutique', filter_boutique_no: 'Labo seul',
    intensite_label: 'Intensité :', genre_label: 'Cible :',
    delete_selected: 'Supprimer',
    loading: 'Chargement...', no_results: 'Aucune essence trouvée.',
    modal_new: 'Nouvelle essence', modal_edit: "Modifier l'essence",
    section_general: 'Informations générales', section_pricing: 'Tarification labo',
    section_lot: 'Lot initial (stock)', section_boutique: 'Format boutique',
    field_name: 'Nom *', field_brand: 'Marque / Fournisseur *', field_ref: 'Code référence *',
    field_category: 'Catégorie *', field_intensity: 'Intensité *', field_genre: 'Genre cible *',
    field_price: 'Prix par ml (FCFA) *', field_description: 'Description',
    field_lot_stock: 'Stock initial (ml) *', field_lot_alert: "Seuil d'alerte (ml) *",
    field_lot_ref: 'Référence fournisseur',
    field_boutique_toggle: 'Créer un format boutique',
    field_boutique_size: 'Taille (ml) *', field_boutique_price: 'Prix (FCFA) *',
    field_boutique_promo: 'Prix promo (FCFA)', field_boutique_stock: 'Stock disponible *',
    field_boutique_image: 'Image du format boutique *',
    confirm_delete: "Supprimer cette essence ? Cela affectera l'inventaire et les lots associés.",
    confirm_bulk: 'Supprimer',
    toast_load_error: 'Erreur lors du chargement des données',
    toast_create_ok: 'Essence créée avec succès', toast_update_ok: 'Essence mise à jour avec succès',
    toast_save_error: 'Erreur lors de la sauvegarde', toast_delete_ok: 'Essence supprimée',
    toast_delete_error: 'Erreur lors de la suppression', toast_patch_error: 'Erreur lors de la mise à jour',
    toast_bulk_ok: 'essence(s) supprimée(s)', toast_bulk_error: 'Erreur lors de la suppression en masse',
    essences_label: 'essence(s)',
  },
  en: {
    title: 'Essences', subtitle: 'Laboratory essential oil catalogue',
    add: 'Add essence', kpi_total: 'Total Essences',
    kpi_boutique: 'Available in Shop', kpi_labo: 'Lab Only',
    col_essence: 'Essence', col_ref: 'Ref. Code', col_category: 'Category',
    col_characteristics: 'Characteristics', col_price: 'Price / ml', col_canal: 'Channel', col_actions: 'Actions',
    canal_boutique: 'Shop', canal_labo: 'Lab Only',
    search_placeholder: 'Search by name, reference, brand...',
    filter_btn: 'Filters', filter_reset: 'Reset',
    filter_category: 'Category:', filter_category_all: 'All',
    filter_intensity: 'Intensity:', filter_intensity_all: 'All',
    filter_genre: 'Gender:', filter_genre_all: 'All',
    filter_boutique: 'Channel:', filter_boutique_all: 'All', filter_boutique_yes: 'Shop', filter_boutique_no: 'Lab only',
    intensite_label: 'Intensity:', genre_label: 'Target:',
    delete_selected: 'Delete',
    loading: 'Loading...', no_results: 'No essence found.',
    modal_new: 'New essence', modal_edit: 'Edit essence',
    section_general: 'General information', section_pricing: 'Lab pricing',
    section_lot: 'Initial lot (stock)', section_boutique: 'Shop format',
    field_name: 'Name *', field_brand: 'Brand / Supplier *', field_ref: 'Reference code *',
    field_category: 'Category *', field_intensity: 'Intensity *', field_genre: 'Target gender *',
    field_price: 'Price per ml (FCFA) *', field_description: 'Description',
    field_lot_stock: 'Initial stock (ml) *', field_lot_alert: 'Alert threshold (ml) *',
    field_lot_ref: 'Supplier reference',
    field_boutique_toggle: 'Create shop format',
    field_boutique_size: 'Size (ml) *', field_boutique_price: 'Price (FCFA) *',
    field_boutique_promo: 'Promo price (FCFA)', field_boutique_stock: 'Available stock *',
    field_boutique_image: 'Shop format image *',
    confirm_delete: 'Delete this essence? This will affect the inventory and associated lots.',
    confirm_bulk: 'Delete',
    toast_load_error: 'Error loading data',
    toast_create_ok: 'Essence created successfully', toast_update_ok: 'Essence updated successfully',
    toast_save_error: 'Error saving', toast_delete_ok: 'Essence deleted',
    toast_delete_error: 'Error deleting', toast_patch_error: 'Error updating',
    toast_bulk_ok: 'essence(s) deleted', toast_bulk_error: 'Error during bulk delete',
    essences_label: 'essence(s)',
  },
} as const;
type TKey = keyof typeof T.fr;

type EssenceRecord = {
  id: number;
  slug?: string;
  nom?: string;
  marque?: string;
  code_reference?: string;
  categorie?: string;
  description?: string;
  intensite?: string;
  genre_cible?: string;
  prix_par_ml?: number | string;
  vendu_comme_produit_fini?: boolean;
  initial_lot?: {
    stock_ml?: number | string;
    seuil_alerte_ml?: number | string;
    reference_fournisseur?: string;
  };
  produits_finis?: Array<{
    taille_ml?: number | string;
    prix?: number | string;
    prix_promotionnel?: number | string | null;
    stock_disponible?: number | string;
  }>;
};

import { labService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { useCatalogPermissions } from '@/hooks/useCatalogPermissions';
import CatalogAccessNotice from '@/components/catalog/CatalogAccessNotice';
import { FloatInput } from '@/components/ui/Input';
import { SlideOver } from '@/components/ui/SlideOver';

const STATIC_CATEGORIES = ['super_premium', 'premium', 'high'];

// Utility function for conditional class names
function cx(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

// Reusable Status Chip Primitive
function StatusChip({ variant, label, icon: Icon }: { variant: 'emerald' | 'blue' | 'amber' | 'red' | 'purple' | 'neutral', label: string, icon?: LucideIcon }) {
  const styles = {
    emerald: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20',
    blue: 'text-blue-400 bg-blue-500/10 ring-blue-500/20',
    amber: 'text-amber-400 bg-amber-500/10 ring-amber-500/20',
    red: 'text-red-400 bg-red-500/10 ring-red-500/20',
    purple: 'text-purple-400 bg-purple-500/10 ring-purple-500/20',
    neutral: 'text-foreground/50 bg-white/5 ring-white/10',
  };

  const dotStyles = {
    emerald: 'bg-emerald-400',
    blue: 'bg-blue-400',
    amber: 'bg-amber-400',
    red: 'bg-red-400',
    purple: 'bg-purple-400',
    neutral: 'bg-foreground/40',
  };

  return (
    <span className={cx(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset',
      styles[variant]
    )}>
      {Icon ? <Icon size={12} /> : <span className={cx('h-1.5 w-1.5 rounded-full', dotStyles[variant])} />}
      {label}
    </span>
  );
}

// Reusable Action Button Primitive
function IconButton({ icon: Icon, onClick, title, tint = 'gold' }: { icon: LucideIcon, onClick?: () => void, title?: string, tint?: 'gold' | 'red' | 'blue' | 'neutral' }) {
  const tintStyles = {
    gold: 'hover:text-gold hover:bg-gold/10',
    red: 'hover:text-red-400 hover:bg-red-500/10',
    blue: 'hover:text-blue-400 hover:bg-blue-500/10',
    neutral: 'hover:text-foreground hover:bg-white/10',
  };

  return (
    <button
      onClick={onClick}
      title={title}
      className={cx(
        'rounded-md p-1.5 text-foreground/45 transition-colors',
        tintStyles[tint]
      )}
    >
      <Icon size={15} />
    </button>
  );
}

export default function EssencesPage() {
  const permissions = useCatalogPermissions('essences');
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en') ?? false;
  const t = useCallback((k: TKey) => isEn ? T.en[k] : T.fr[k], [isEn]);
  const [essences, setEssences] = useState<EssenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEssence, setEditingEssence] = useState<EssenceRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { addToast } = useToastStore();

  // Pagination locale (Max 20 éléments par page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Form State
  const [form, setForm] = useState({
    nom: '',
    marque: '',
    codeReference: '',
    categorie: 'premium',
    description: '',
    intensite: 'moyenne',
    genreCible: 'mixte',
    prixParMl: '',
    lotStockMl: '',
    lotSeuilAlerteMl: '',
    lotReferenceFournisseur: '',
    includeProduitsFinis: false,
    produitFini: {
      taille_ml: '',
      prix: '',
      prix_promotionnel: '',
      stock_disponible: '',
    },
  });
  const [, setProduitFiniImageFile] = useState<File | null>(null);
  const [selectedEssences, setSelectedEssences] = useState<Set<string>>(new Set());

  const validateBoutiqueFormat = (nextForm = form) => {
    const nextErrors: Record<string, string> = {};

    if (!nextForm.includeProduitsFinis) {
      return nextErrors;
    }

    const tailleMl = Number(nextForm.produitFini.taille_ml);
    const stockDisponible = Number(nextForm.produitFini.stock_disponible);

    if (nextForm.produitFini.taille_ml !== '' && (!Number.isFinite(tailleMl) || tailleMl <= 0)) {
      nextErrors['produitFini.taille_ml'] = 'La taille doit être supérieure à 0';
    }

    if (nextForm.produitFini.stock_disponible !== '' && (!Number.isFinite(stockDisponible) || stockDisponible < 0)) {
      nextErrors['produitFini.stock_disponible'] = 'Le stock disponible doit être supérieur ou égal à 0';
    }

    return nextErrors;
  };

  const updateForm = (field: string, value: string | boolean | File | null | Record<string, string | number | boolean | null>) => {
    // Support nested dot-notation keys like "produitFini.taille_ml"
    let nextForm = form;

    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      const parentValue = form[parent as keyof typeof form];
      const currentNested = typeof parentValue === 'object' && parentValue !== null ? parentValue as Record<string, string | number | boolean | null> : {};
      nextForm = {
        ...form,
        [parent]: {
          ...currentNested,
          [child]: value,
        },
      };
    } else {
      nextForm = {
        ...form,
        [field]: value,
      };
    }

    setForm(nextForm);

    setFormErrors(prev => {
      const updated = { ...prev };
      delete updated[field];

      if (field === 'includeProduitsFinis' || field === 'lotStockMl' || field.includes('produitFini')) {
        const validationErrors = validateBoutiqueFormat(nextForm);
        Object.keys(validationErrors).forEach((key) => {
          updated[key] = validationErrors[key];
        });
        if (!nextForm.includeProduitsFinis) {
          delete updated['produitFini.taille_ml'];
          delete updated['produitFini.prix'];
        }
      }

      return updated;
    });
  };

  const resetForm = () => {
    setForm({
      nom: '',
      marque: '',
      codeReference: '',
      categorie: 'premium',
      description: '',
      intensite: 'moyenne',
      genreCible: 'mixte',
      prixParMl: '',
      lotStockMl: '',
      lotSeuilAlerteMl: '',
      lotReferenceFournisseur: '',
      includeProduitsFinis: false,
      produitFini: {
        taille_ml: '',
        prix: '',
        prix_promotionnel: '',
        stock_disponible: '',
      },
    });
    setFormErrors({});
    setFormError(null);
    setProduitFiniImageFile(null);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const essencesData = await labService.getEssences();
      const essList = Array.isArray(essencesData) ? essencesData : (essencesData as Record<string, unknown>)?.results || (essencesData as Record<string, unknown>)?.resultats || [];
      setEssences(essList as EssenceRecord[]);
    } catch {
      addToast(t('toast_load_error'), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchData(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  const openAdd = () => {
    if (!permissions.canCreate) return;
    setEditingEssence(null);
    resetForm();
    setShowModal(true);
  };

  const openEdit = (item: EssenceRecord) => {
    if (!permissions.canUpdate) return;
    setEditingEssence(item);
    setForm({
      nom: item.nom || '',
      marque: item.marque || '',
      codeReference: item.code_reference || '',
      categorie: item.categorie || 'premium',
      description: item.description || '',
      intensite: item.intensite || 'moyenne',
      genreCible: item.genre_cible || 'mixte',
      prixParMl: String(item.prix_par_ml || '0.00'),
      lotStockMl: String(item.initial_lot?.stock_ml ?? ''),
      lotSeuilAlerteMl: String(item.initial_lot?.seuil_alerte_ml ?? ''),
      lotReferenceFournisseur: item.initial_lot?.reference_fournisseur || '',
      includeProduitsFinis: !!item.produits_finis?.length,
      produitFini: item.produits_finis?.[0] ? {
        taille_ml: String(item.produits_finis[0].taille_ml || ''),
        prix: String(item.produits_finis[0].prix || ''),
        prix_promotionnel: String(item.produits_finis[0].prix_promotionnel ?? ''),
        stock_disponible: String(item.produits_finis[0].stock_disponible ?? ''),
      } : {
        taille_ml: '',
        prix: '',
        prix_promotionnel: '',
        stock_disponible: '',
      },
    });
    setProduitFiniImageFile(null);
    setFormErrors({});
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!permissions.canCreate && !permissions.canUpdate) return;
    
    // Clear previous error banner
    setFormError(null);
    
    const errors: Record<string, string> = {};
    
    if (!form.nom.trim()) errors.nom = 'Le nom est requis';
    if (!form.codeReference.trim()) errors.codeReference = 'Le code de référence est requis';
    if (!form.marque.trim()) errors.marque = 'La marque est requise';
    if (!form.categorie) errors.categorie = 'La catégorie est requise';
    if (!form.intensite) errors.intensite = 'L\'intensité est requise';
    if (!form.genreCible) errors.genreCible = 'Le genre cible est requis';
    if (!form.prixParMl) errors.prixParMl = 'Le prix par ml est requis';
    else if (isNaN(Number(form.prixParMl)) || Number(form.prixParMl) <= 0) 
      errors.prixParMl = 'Le prix par ml doit être supérieur à 0';
    
    if (form.description && form.description.trim().length < 10) 
      errors.description = 'La description doit contenir au moins 10 caractères';
    
    if (!editingEssence) {
      if (form.lotStockMl && (isNaN(Number(form.lotStockMl)) || Number(form.lotStockMl) <= 0))
        errors.lotStockMl = 'Le stock ML doit être supérieur à 0';
      if (form.lotSeuilAlerteMl && (isNaN(Number(form.lotSeuilAlerteMl)) || Number(form.lotSeuilAlerteMl) < 0))
        errors.lotSeuilAlerteMl = 'Le seuil d\'alerte ML doit être supérieur ou égal à 0';
    }
    
    if (!editingEssence && form.includeProduitsFinis) {
      if (!form.produitFini.taille_ml) errors['produitFini.taille_ml'] = 'La taille du format boutique est requise';
      else if (isNaN(Number(form.produitFini.taille_ml)) || Number(form.produitFini.taille_ml) <= 0) 
        errors['produitFini.taille_ml'] = 'La taille doit être supérieure à 0';

      if (!form.produitFini.prix) errors['produitFini.prix'] = 'Le prix du format boutique est requis';
      else if (isNaN(Number(form.produitFini.prix)) || Number(form.produitFini.prix) <= 0) 
        errors['produitFini.prix'] = 'Le prix doit être supérieur à 0';

      if (form.produitFini.stock_disponible === '') {
        errors['produitFini.stock_disponible'] = 'Le stock disponible est requis';
      } else if (isNaN(Number(form.produitFini.stock_disponible)) || Number(form.produitFini.stock_disponible) < 0) {
        errors['produitFini.stock_disponible'] = 'Le stock disponible doit être supérieur ou égal à 0';
      }

      const boutiqueFormatErrors = validateBoutiqueFormat(form);
      Object.assign(errors, boutiqueFormatErrors);
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setTimeout(() => {
        const firstField = Object.keys(errors)[0];
        const el = document.querySelector(`[data-field="${firstField}"]`);
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
          el.focus();
        }
      }, 0);
      return;
    }
    
    try {
      setSaving(true);
      
      if (editingEssence) {
        const payload: Record<string, unknown> = {
          nom: form.nom,
          marque: form.marque,
          code_reference: form.codeReference,
          categorie: form.categorie,
          description: form.description || undefined,
          intensite: form.intensite,
          genre_cible: form.genreCible,
          prix_par_ml: form.prixParMl,
        };
        await labService.updateEssence(editingEssence.slug || editingEssence.id, payload);
        setEssences(prev => prev.map(e => (e.slug || String(e.id)) === (editingEssence.slug || String(editingEssence.id)) ? { ...e, ...payload } : e));
        addToast(t('toast_update_ok'), 'success');
        setShowModal(false);
        resetForm();
        fetchData();
      } else {
        const payload: {
          marque: string;
          nom: string;
          categorie: string;
          code_reference: string;
          description?: string;
          intensite: string;
          genre_cible: string;
          prix_par_ml: string;
          seuil_alerte_ml?: string;
          actif: boolean;
          initial_lot?: {
            stock_ml: string;
            prix_achat_par_ml?: string;
            reference_fournisseur?: string;
            actif?: boolean;
          };
          produits_finis?: Array<{
            taille_ml: number;
            prix: string;
            prix_promotionnel?: string | null;
          }>;
        } = {
          marque: form.marque,
          nom: form.nom,
          categorie: form.categorie,
          code_reference: form.codeReference,
          description: form.description || undefined,
          intensite: form.intensite,
          genre_cible: form.genreCible,
          prix_par_ml: form.prixParMl,
          seuil_alerte_ml: form.lotSeuilAlerteMl || undefined,
          actif: true,
        };
        if (form.lotStockMl) {
          payload.initial_lot = {
            stock_ml: form.lotStockMl,
            prix_achat_par_ml: undefined,
            reference_fournisseur: form.lotReferenceFournisseur || undefined,
            actif: true,
          };
        }
        if (form.includeProduitsFinis) {
          payload.produits_finis = [{
            taille_ml: Number(form.produitFini.taille_ml),
            prix: form.produitFini.prix,
            prix_promotionnel: form.produitFini.prix_promotionnel || null,
          }];
        }
        await labService.createEssence(payload);
        addToast(t('toast_create_ok'), 'success');
        setShowModal(false);
        resetForm();
        fetchData();
      }
    } catch (e: unknown) {
      const errorResponse = e as { response?: { data?: { detail?: string; error?: string } } };
      const errorMessage = errorResponse.response?.data?.detail || errorResponse.response?.data?.error || t('toast_save_error');
      setFormError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const patchEssence = async (slug: string, field: string, value: string) => {
    if (!permissions.canUpdate) return;
    setEssences(prev => prev.map(e => ((e.slug || String(e.id)) === slug ? { ...e, [field]: value } : e)));
    try {
      await labService.updateEssence(slug, { [field]: value });
    } catch {
      addToast(t('toast_patch_error'), 'error');
      fetchData();
    }
  };

  const handleDelete = async (slugOrId: string | number) => {
    if (!permissions.canDelete) return;
    if (!confirm(t('confirm_delete'))) return;
    const snapshot = essences.find(e => (e.slug || String(e.id)) === String(slugOrId));
    setEssences(prev => prev.filter(e => (e.slug || String(e.id)) !== String(slugOrId)));
    try {
      await labService.deleteEssence(slugOrId);
      addToast(t('toast_delete_ok'), 'success');
    } catch {
      if (snapshot) setEssences(prev => [snapshot, ...prev]);
      addToast(t('toast_delete_error'), 'error');
    }
  };

  const toggleSelectEssence = (slugOrId: string) => {
    setSelectedEssences(prev => {
      const newSet = new Set(prev);
      if (newSet.has(slugOrId)) {
        newSet.delete(slugOrId);
      } else {
        newSet.add(slugOrId);
      }
      return newSet;
    });
  };

  const handleBulkDelete = async () => {
    if (!permissions.canDelete || selectedEssences.size === 0) return;
    if (!confirm(`${t('confirm_bulk')} ${selectedEssences.size} ${t('essences_label')} ?`)) return;
    const slugsOrIds = Array.from(selectedEssences);
    const snapshots = essences.filter(e => slugsOrIds.includes(e.slug || String(e.id)));
    setEssences(prev => prev.filter(e => !slugsOrIds.includes(e.slug || String(e.id))));
    setSelectedEssences(new Set());
    try {
      for (const slugOrId of slugsOrIds) {
        try { await labService.deleteEssence(slugOrId); } catch (e) { console.error(`Failed to delete essence ${slugOrId}:`, e); }
      }
      addToast(`${slugsOrIds.length} ${t('toast_bulk_ok')}`, 'success');
    } catch {
      setEssences(prev => [...snapshots, ...prev]);
      addToast(t('toast_bulk_error'), 'error');
    }
  };

  const filtered = useMemo(() => {
    return essences.filter(e => {
      const matchesSearch = 
        (e.nom || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.code_reference || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.marque || '').toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || e.categorie === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [essences, search, selectedCategory]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const currentItems = useMemo(() => {
    return filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filtered, currentPage]);

  const boutiqueCount = useMemo(() => {
    return essences.filter(e => e.vendu_comme_produit_fini).length;
  }, [essences]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    return count;
  }, [selectedCategory]);

  if (!permissions.canRead) {
    return (
      <div className="space-y-6">
        <CatalogAccessNotice permissions={permissions} resourceLabel="les essences" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
          <p className="text-sm text-foreground/40 mt-0.5">
            {t('subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedEssences.size > 0 && permissions.canDelete && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-500/90 hover:bg-red-500 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              {t('delete_selected')} ({selectedEssences.size})
            </button>
          )}
          <IconButton 
            icon={RefreshCw} 
            onClick={fetchData} 
            title={isEn ? 'Refresh' : 'Rafraîchir'}
            tint="neutral"
          />
          {permissions.canCreate && (
            <button
              onClick={openAdd}
              className="bg-gold text-black font-semibold rounded-lg px-3.5 py-1.5 text-xs hover:bg-gold/90 transition-colors flex items-center gap-1.5"
            >
              <Plus size={15} /> {t('add')}
            </button>
          )}
        </div>
      </div>

      <CatalogAccessNotice permissions={permissions} resourceLabel="les essences" />

      {/* KPI Bordered Strip */}
      <div className="shadow-black/30 shadow-sm rounded-xl border border-white/10 bg-white/[0.02] grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
        <div className="p-4 flex flex-col justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('kpi_total')}</span>
          <span className="text-xl font-semibold tabular-nums text-foreground mt-1">{essences.length}</span>
        </div>

        <div className="p-4 flex flex-col justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('kpi_boutique')}</span>
          <span className="text-xl font-semibold tabular-nums text-emerald-400 mt-1">{boutiqueCount}</span>
        </div>

        <div className="p-4 flex flex-col justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('kpi_labo')}</span>
          <span className="text-xl font-semibold tabular-nums text-foreground/80 mt-1">{essences.length - boutiqueCount}</span>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t('search_placeholder')}
              className="w-full bg-white/[0.02] border border-white/10 rounded-lg pl-9 pr-8 py-1.5 text-xs text-foreground placeholder:text-foreground/40 outline-none focus:border-white/20 transition-all"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cx(
              'shadow-black/30 shadow-sm flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium transition-colors',
              showFilters || activeFiltersCount > 0 ? 'bg-white/10 text-foreground' : 'text-foreground/60 hover:bg-white/5'
            )}
          >
            <Filter size={13} />
            <span>{t('filter_btn')}</span>
            {activeFiltersCount > 0 && (
              <span className="ml-0.5 rounded-full bg-gold px-1.5 py-0.2 text-[10px] font-bold text-black">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Expandable Filter Panel */}
        {showFilters && (
          <div className="shadow-black/30 shadow-sm rounded-xl border border-white/10 bg-white/[0.02] p-3 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground/50">{isEn ? 'Category:' : 'Catégorie:'}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={cx(
                    'rounded-lg px-2.5 py-1 text-xs transition-colors',
                    selectedCategory === 'all' ? 'bg-white/10 text-foreground font-medium' : 'text-foreground/50 hover:bg-white/5'
                  )}
                >
                  {t('filter_category_all')}
                </button>
                {STATIC_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cx(
                      'rounded-lg px-2.5 py-1 text-xs capitalize transition-colors',
                      selectedCategory === cat ? 'bg-white/10 text-foreground font-medium' : 'text-foreground/50 hover:bg-white/5'
                    )}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setCurrentPage(1);
                }}
                className="text-[11px] text-foreground/40 hover:text-foreground underline ml-auto"
              >
                {t('filter_reset')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="shadow-black/30 shadow-sm rounded-xl border border-white/10 overflow-hidden">
        {loading ? (
          <AdminTableSkeleton columns={8} rows={6} />
        ) : essences.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={48} />}
            title="No essences"
            description="Create your first essence to get started"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                  <th className="pl-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={currentItems.length > 0 && selectedEssences.size === essences.length && essences.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEssences(new Set(essences.map(e => e.slug || String(e.id))));
                        } else {
                          setSelectedEssences(new Set());
                        }
                      }}
                      className="rounded border-white/20 bg-white/5 text-gold focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-3">{t('col_essence')}</th>
                  <th className="px-3 py-3">{t('col_ref')}</th>
                  <th className="px-3 py-3">{t('col_category')}</th>
                  <th className="px-3 py-3">{t('col_characteristics')}</th>
                  <th className="px-3 py-3">Prix / ml</th>
                  <th className="px-3 py-3">{t('col_canal')}</th>
                  <th className="pr-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {currentItems.map(essence => (
                  <tr key={essence.slug || essence.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="pl-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedEssences.has(essence.slug || String(essence.id))}
                        onChange={() => toggleSelectEssence(essence.slug || String(essence.id))}
                        className="rounded border-white/20 bg-white/5 text-gold focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div>
                        <p className="font-medium text-foreground">
                          <InlineCell value={essence.nom || ''} onSave={(v: string) => patchEssence(essence.slug || String(essence.id), 'nom', v)} disabled={!permissions.canUpdate} className="font-medium text-foreground" />
                        </p>
                        <p className="text-[11px] text-foreground/40">
                          <InlineCell value={essence.marque || ''} onSave={(v: string) => patchEssence(essence.slug || String(essence.id), 'marque', v)} disabled={!permissions.canUpdate} className="text-foreground/40" />
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] text-foreground/60">
                      {essence.code_reference}
                    </td>
                    <td className="px-3 py-3">
                      <span className="capitalize text-foreground/80">
                        {essence.categorie?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-foreground/60 space-x-2">
                      <span>Intensité: <strong className="font-medium text-foreground/80 capitalize">{essence.intensite}</strong></span>
                      <span>•</span>
                      <span>Cible: <strong className="font-medium text-foreground/80 capitalize">{essence.genre_cible}</strong></span>
                    </td>
                    <td className="px-3 py-3 font-medium text-foreground tabular-nums">
                      <InlineCell value={String(essence.prix_par_ml ?? '0')} onSave={(v: string) => patchEssence(essence.slug || String(essence.id), 'prix_par_ml', v)} disabled={!permissions.canUpdate} inputType="number" display={<>{Number(essence.prix_par_ml || 0).toLocaleString()} FCFA</>} className="font-medium text-foreground tabular-nums" />
                    </td>
                    <td className="px-3 py-3">
                      {essence.vendu_comme_produit_fini ? (
                        <StatusChip variant="emerald" label={t('canal_boutique')} icon={ShoppingBag} />
                      ) : (
                        <StatusChip variant="neutral" label={t('canal_labo')} />
                      )}
                    </td>
                    <td className="pr-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {permissions.canUpdate && (
                          <IconButton 
                            icon={Edit2} 
                            onClick={() => openEdit(essence)} 
                            title="Modifier"
                            tint="gold"
                          />
                        )}
                        {permissions.canDelete && (
                          <IconButton 
                            icon={Trash2} 
                            onClick={() => handleDelete(essence.slug || essence.id)} 
                            title="Supprimer"
                            tint="red"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {currentItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-sm italic text-foreground/30">
                      {t('no_results')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-foreground/40">
            Page <b className="text-foreground/80">{currentPage}</b> sur <b className="text-foreground/80">{totalPages}</b>
          </span>
          <div className="flex items-center gap-1">
            <IconButton 
              icon={ChevronLeft}
              onClick={() => setCurrentPage(p => p - 1)}
              tint="neutral"
            />
            <IconButton 
              icon={ChevronRight}
              onClick={() => setCurrentPage(p => p + 1)}
              tint="neutral"
            />
          </div>
        </div>
      )}

      {/* Modale d'Ajout / Modification (verbatim off-limits form logic) */}
      <SlideOver
        key={editingEssence ? `edit-${editingEssence.id}` : 'new'}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingEssence ? t('modal_edit') : t('modal_new')}
        description={isEn ? "Enter the technical and commercial specifications of the essence." : "Renseignez les spécifications techniques et commerciales de l'essence."}
        size="xl"
      >
        <div className="space-y-6 pt-2">
          {formError && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Information Générale */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-gold uppercase tracking-wider">{t('section_general')}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FloatInput
                  data-field="nom"
                  label="Nom de l'essence *"
                  value={form.nom}
                  onChange={e => updateForm('nom', e.target.value)}
                  error={formErrors.nom}
                />
              </div>
              <div>
                <FloatInput
                  data-field="codeReference"
                  label="Code Référence *"
                  value={form.codeReference}
                  onChange={e => updateForm('codeReference', e.target.value)}
                  error={formErrors.codeReference}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FloatInput
                data-field="marque"
                label="Marque / Fournisseur *"
                value={form.marque}
                onChange={e => updateForm('marque', e.target.value)}
                error={formErrors.marque}
              />
              <div>
                <label className="text-[11px] font-bold text-foreground/50 uppercase block mb-1.5">Catégorie *</label>
                <CustomSelect
                  data-field="categorie"
                  value={form.categorie}
                  onChange={(value: string) => updateForm('categorie', value)}
                  options={STATIC_CATEGORIES.map(cat => ({
                    value: cat,
                    label: cat === 'super_premium' ? 'Super Premium' : cat === 'premium' ? 'Premium' : 'High',
                  }))}
                  placeholder="Catégorie"
                  error={!!formErrors.categorie}
                />
                {formErrors.categorie && <p className="mt-1 text-xs text-red-500">{formErrors.categorie}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Profil & Prix */}
          <div className="space-y-4 pt-2 border-t border-white/10">
            <p className="text-xs font-bold text-gold uppercase tracking-wider">{isEn ? 'Olfactive Profile & Pricing' : 'Profil Olfactif & Tarification'}</p>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-foreground/50 uppercase block mb-1.5">Intensité *</label>
                <CustomSelect
                  value={form.intensite}
                  onChange={(value: string) => updateForm('intensite', value)}
                  options={[
                    { value: 'légère', label: isEn ? 'Light' : 'Légère' },
                    { value: 'moyenne', label: isEn ? 'Medium' : 'Moyenne' },
                    { value: 'forte', label: isEn ? 'Strong' : 'Forte' },
                    { value: 'très forte', label: isEn ? 'Very strong' : 'Très forte' },
                  ]}
                  placeholder={isEn ? 'Select intensity...' : 'Sélectionner l\'intensité...'}
                  data-field="intensite"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-foreground/50 uppercase block mb-1.5">Cible *</label>
                <CustomSelect
                  value={form.genreCible}
                  onChange={(value: string) => updateForm('genreCible', value)}
                  options={[
                    { value: 'mixte', label: isEn ? 'Unisex' : 'Mixte' },
                    { value: 'homme', label: isEn ? 'Men' : 'Homme' },
                    { value: 'femme', label: isEn ? 'Women' : 'Femme' },
                  ]}
                  placeholder={isEn ? 'Select target...' : 'Sélectionner la cible...'}
                  data-field="genreCible"
                />
              </div>
              <div>
                <FloatInput
                  data-field="prixParMl"
                  label="Prix / ml (FCFA) *"
                  type="number"
                  value={form.prixParMl}
                  onChange={e => updateForm('prixParMl', e.target.value)}
                  error={formErrors.prixParMl}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-foreground/50 uppercase tracking-wider mb-1.5">
                Description / Notes Olfactives
              </label>
              <textarea
                data-field="description"
                value={form.description}
                onChange={e => updateForm('description', e.target.value)}
                placeholder="Ex: Notes de tête bergamote, cœur jasmin, fond bois de santal..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-foreground outline-none focus:border-gold/50 resize-none placeholder:text-foreground/30"
              />
              {formErrors.description && <p className="mt-1 text-xs text-red-500">{formErrors.description}</p>}
            </div>
          </div>

          {/* Section 3: Stock Initial (à la création uniquement) */}
          {/* Error Banner */}
          {formError && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400">Erreur lors de la sauvegarde</p>
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

          {/* Form Content */}
          {!editingEssence && (
            <div className="space-y-4 pt-2 border-t border-white/10">
              <p className="text-xs font-bold text-gold uppercase tracking-wider">{t('section_lot')}</p>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FloatInput
                    data-field="lotStockMl"
                    label="Stock ML *"
                    type="number"
                    value={form.lotStockMl}
                    onChange={e => updateForm('lotStockMl', e.target.value)}
                    error={formErrors.lotStockMl}
                  />
                  <FloatInput
                    data-field="lotSeuilAlerteMl"
                    label="Seuil d'alerte ML *"
                    type="number"
                    value={form.lotSeuilAlerteMl}
                    onChange={e => updateForm('lotSeuilAlerteMl', e.target.value)}
                    error={formErrors.lotSeuilAlerteMl}
                  />
                </div>
                <FloatInput
                  data-field="lotReferenceFournisseur"
                  label="Réf. Fournisseur (Optionnel)"
                  value={form.lotReferenceFournisseur}
                  onChange={e => updateForm('lotReferenceFournisseur', e.target.value)}
                  error={formErrors.lotReferenceFournisseur}
                />
              </div>

              {/* Section 4: Format Boutique */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.includeProduitsFinis}
                    onChange={e => updateForm('includeProduitsFinis', e.target.checked)}
                    className="mt-1 rounded border-white/20 bg-white/5 text-gold focus:ring-gold cursor-pointer"
                  />
                  <div>
                    <p className="font-semibold text-sm text-foreground">{isEn ? 'Enable shop format (Finished Product)' : 'Activer le format boutique (Produit Fini)'}</p>
                    <p className="text-xs text-foreground/50 mt-0.5">{isEn ? 'Makes this product immediately available for purchase in the shop.' : "Permet de rendre ce produit immédiatement disponible à l'achat dans la boutique."}</p>
                  </div>
                </label>

                {form.includeProduitsFinis && (
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10">
                    <FloatInput
                      data-field="produitFini.taille_ml"
                      label="Flacon (ml) *"
                      type="number"
                      value={form.produitFini.taille_ml}
                      onChange={e => updateForm('produitFini.taille_ml', e.target.value)}
                      error={formErrors['produitFini.taille_ml']}
                    />
                    <FloatInput
                      data-field="produitFini.prix"
                      label="Prix Boutique *"
                      type="number"
                      value={form.produitFini.prix}
                      onChange={e => updateForm('produitFini.prix', e.target.value)}
                      error={formErrors['produitFini.prix']}
                    />
                    <FloatInput
                      data-field="produitFini.prix_promotionnel"
                      label="Prix Promo (Optionnel)"
                      type="number"
                      value={form.produitFini.prix_promotionnel}
                      onChange={e => updateForm('produitFini.prix_promotionnel', e.target.value)}
                      error={formErrors['produitFini.prix_promotionnel']}
                    />
                    <FloatInput
                      data-field="produitFini.stock_disponible"
                      label="Stock Flacons *"
                      type="number"
                      value={form.produitFini.stock_disponible}
                      onChange={e => updateForm('produitFini.stock_disponible', e.target.value)}
                      error={formErrors['produitFini.stock_disponible']}
                    />
                    
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">
                        Image Principale
                      </label>
                      <input
                        data-field="produitFiniImageFile"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          updateForm('produitFiniImageFile', file);
                          setProduitFiniImageFile(file);
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground/70 outline-none file:bg-gold file:text-black file:border-0 file:rounded-lg file:px-3 file:py-1.5 file:mr-3 file:text-xs file:font-bold file:cursor-pointer cursor-pointer"
                      />
                      {formErrors.produitFiniImageFile && (
                        <p className="mt-1 text-xs text-red-500">{formErrors.produitFiniImageFile}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions Modale */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button 
              type="button"
              onClick={() => setShowModal(false)} 
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-foreground font-semibold text-sm transition-all border border-white/10"
            >
              {isEn ? 'Cancel' : 'Annuler'}
            </button>
            <button 
              type="button"
              onClick={handleSave} 
              disabled={saving}
              className="flex-1 px-4 py-3 rounded-xl bg-gold hover:bg-gold/90 text-black font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gold/10"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving 
                ? (isEn ? 'Saving...' : 'Enregistrement...')
                : editingEssence 
                  ? (isEn ? 'Update' : 'Mettre à jour') 
                  : (isEn ? "Save essence" : "Enregistrer l'essence")
              }
            </button>
          </div>
        </div>
      </SlideOver>
    </div>
  );
}
