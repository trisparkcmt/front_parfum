'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, Plus, Edit2, Trash2, Droplets, Loader2, 
  ShoppingBag, RefreshCw, ChevronLeft, ChevronRight, X, AlertCircle, Layers, Filter
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { InlineCell } from '@/components/admin/InlineCell';

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
import { labService, adminService } from '@/services/apiService';
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
function StatusChip({ variant, label, icon: Icon }: { variant: 'emerald' | 'blue' | 'amber' | 'red' | 'purple' | 'neutral', label: string, icon?: any }) {
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
function IconButton({ icon: Icon, onClick, title, tint = 'gold' }: { icon: any, onClick?: () => void, title?: string, tint?: 'gold' | 'red' | 'blue' | 'neutral' }) {
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
  const t = (k: TKey) => isEn ? T.en[k] : T.fr[k];
  const [essences, setEssences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEssence, setEditingEssence] = useState<any | null>(null);
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
  const [produitFiniImageFile, setProduitFiniImageFile] = useState<File | null>(null);
  const [selectedEssences, setSelectedEssences] = useState<Set<number>>(new Set());

  const updateForm = (field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }));
    if (formErrors[field]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
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
      const essList = Array.isArray(essencesData) ? essencesData : (essencesData as any)?.results || (essencesData as any)?.resultats || [];
      setEssences(essList);
    } catch {
      addToast(t('toast_load_error'), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Réinitialiser la page quand la recherche change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory]);

  const openAdd = () => {
    if (!permissions.canCreate) return;
    setEditingEssence(null);
    resetForm();
    setShowModal(true);
  };

  const openEdit = (item: any) => {
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
      lotStockMl: item.initial_lot?.stock_ml || '',
      lotSeuilAlerteMl: item.initial_lot?.seuil_alerte_ml || '',
      lotReferenceFournisseur: item.initial_lot?.reference_fournisseur || '',
      includeProduitsFinis: !!item.produits_finis?.length,
      produitFini: item.produits_finis?.[0] ? {
        taille_ml: String(item.produits_finis[0].taille_ml || ''),
        prix: String(item.produits_finis[0].prix || ''),
        prix_promotionnel: item.produits_finis[0].prix_promotionnel || '',
        stock_disponible: String(item.produits_finis[0].stock_disponible || ''),
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
      if (!form.lotStockMl) errors.lotStockMl = 'Le stock ML est requis';
      else if (isNaN(Number(form.lotStockMl)) || Number(form.lotStockMl) <= 0) 
        errors.lotStockMl = 'Le stock ML doit être supérieur à 0';
      
      if (!form.lotSeuilAlerteMl) errors.lotSeuilAlerteMl = 'Le seuil d\'alerte ML est requis';
      else if (isNaN(Number(form.lotSeuilAlerteMl)) || Number(form.lotSeuilAlerteMl) < 0) 
        errors.lotSeuilAlerteMl = 'Le seuil d\'alerte ML doit être supérieur ou égal à 0';
    }
    
    if (!editingEssence && form.includeProduitsFinis) {
      if (!form.produitFini.taille_ml) errors['produitFini.taille_ml'] = 'La taille du format boutique est requise';
      else if (isNaN(Number(form.produitFini.taille_ml)) || Number(form.produitFini.taille_ml) <= 0) 
        errors['produitFini.taille_ml'] = 'La taille doit être supérieure à 0';
      
      if (!form.produitFini.prix) errors['produitFini.prix'] = 'Le prix du format boutique est requis';
      else if (isNaN(Number(form.produitFini.prix)) || Number(form.produitFini.prix) <= 0) 
        errors['produitFini.prix'] = 'Le prix doit être supérieur à 0';
      
      if (form.produitFini.stock_disponible === '') errors['produitFini.stock_disponible'] = 'Le stock est requis';
      else if (isNaN(Number(form.produitFini.stock_disponible)) || Number(form.produitFini.stock_disponible) < 0) 
        errors['produitFini.stock_disponible'] = 'Le stock doit être supérieur ou égal à 0';
      
      if (!produitFiniImageFile) errors.produitFiniImageFile = 'Une image est requise pour le format boutique';
      
      if (form.produitFini.stock_disponible !== '' && form.lotStockMl !== '') {
        const boutiqueStock = Number(form.produitFini.stock_disponible);
        const lotStock = Number(form.lotStockMl);
        if (!isNaN(boutiqueStock) && !isNaN(lotStock) && boutiqueStock > lotStock) {
          errors['produitFini.stock_disponible'] = 'Le stock boutique doit être ≤ au stock initial du lot';
        }
      }
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
        setEssences(prev => prev.map(e => (e.slug || String(e.id)) === (editingEssence.slug || String(editingEssence.id)) ? { ...e, ...payload } : e));
        setShowModal(false);
        await labService.updateEssence(editingEssence.slug || editingEssence.id, payload);
        addToast(t('toast_update_ok'), 'success');
        fetchData();
      } else {
        const formData = new FormData();
        formData.append('nom', form.nom);
        formData.append('marque', form.marque);
        formData.append('code_reference', form.codeReference);
        formData.append('categorie', form.categorie);
        formData.append('description', form.description || '');
        formData.append('intensite', form.intensite);
        formData.append('genre_cible', form.genreCible);
        formData.append('prix_par_ml', form.prixParMl);
        formData.append('initial_lot[stock_ml]', form.lotStockMl);
        formData.append('initial_lot[seuil_alerte_ml]', form.lotSeuilAlerteMl || '0');
        formData.append('initial_lot[reference_fournisseur]', form.lotReferenceFournisseur || '');
        if (form.includeProduitsFinis) {
          formData.append('produits_finis[0][taille_ml]', form.produitFini.taille_ml);
          formData.append('produits_finis[0][prix]', form.produitFini.prix);
          formData.append('produits_finis[0][prix_promotionnel]', form.produitFini.prix_promotionnel || '');
          formData.append('produits_finis[0][stock_disponible]', form.produitFini.stock_disponible);
          if (produitFiniImageFile) {
            formData.append('produits_finis[0][image_principale]', produitFiniImageFile);
          }
        }
        setShowModal(false);
        await adminService.postFormData('lab/essences/', formData);
        addToast(t('toast_create_ok'), 'success');
        fetchData();
      }
    } catch (e: any) {
      const errorMessage = e.response?.data?.detail || e.response?.data?.error || t('toast_save_error');
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

  const handleDelete = async (id: number) => {
    if (!permissions.canDelete) return;
    if (!confirm(t('confirm_delete'))) return;
    const snapshot = essences.find(e => e.id === id);
    setEssences(prev => prev.filter(e => e.id !== id));
    try {
      await labService.deleteEssence(id);
      addToast(t('toast_delete_ok'), 'success');
    } catch {
      if (snapshot) setEssences(prev => [snapshot, ...prev]);
      addToast(t('toast_delete_error'), 'error');
    }
  };

  const toggleSelectEssence = (id: number) => {
    setSelectedEssences(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleBulkDelete = async () => {
    if (!permissions.canDelete || selectedEssences.size === 0) return;
    if (!confirm(`${t('confirm_bulk')} ${selectedEssences.size} ${t('essences_label')} ?`)) return;
    const ids = Array.from(selectedEssences);
    const snapshots = essences.filter(e => ids.includes(e.id));
    setEssences(prev => prev.filter(e => !ids.includes(e.id)));
    setSelectedEssences(new Set());
    try {
      for (const id of ids) {
        try { await labService.deleteEssence(id); } catch (e) { console.error(`Failed to delete essence ${id}:`, e); }
      }
      addToast(`${ids.length} ${t('toast_bulk_ok')}`, 'success');
    } catch (error) {
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
      <div className="rounded-xl border border-white/10 bg-white/[0.02] grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
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
              onChange={e => setSearch(e.target.value)}
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
              'flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium transition-colors',
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
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 flex flex-wrap items-center gap-4">
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
                onClick={() => setSelectedCategory('all')}
                className="text-[11px] text-foreground/40 hover:text-foreground underline ml-auto"
              >
                {t('filter_reset')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-foreground/40 gap-2 text-xs">
            <Loader2 className="animate-spin text-gold" size={16} />
            <span>{t('loading')}</span>
          </div>
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
                          setSelectedEssences(new Set(essences.map(e => e.id)));
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
                  <tr key={essence.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="pl-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedEssences.has(essence.id)}
                        onChange={() => toggleSelectEssence(essence.id)}
                        className="rounded border-white/20 bg-white/5 text-gold focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div>
                        <p className="font-medium text-foreground">
                          <InlineCell value={essence.nom} onSave={(v: string) => patchEssence(essence.slug || String(essence.id), 'nom', v)} disabled={!permissions.canUpdate} className="font-medium text-foreground" />
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
                            onClick={() => handleDelete(essence.id)} 
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
                  label="{t('col_ref')} // Code Référence *"
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
                <select
                  data-field="categorie"
                  value={form.categorie}
                  onChange={e => updateForm('categorie', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold/50 bg-neutral-900 capitalize"
                >
                  {STATIC_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                  ))}
                </select>
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
                <select
                  data-field="intensite"
                  value={form.intensite}
                  onChange={e => updateForm('intensite', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold/50 bg-neutral-900"
                >
                  <option value="légère">{isEn ? 'Light' : 'Légère'}</option>
                  <option value="moyenne">{isEn ? 'Medium' : 'Moyenne'}</option>
                  <option value="forte">{isEn ? 'Strong' : 'Forte'}</option>
                  <option value="très forte">{isEn ? 'Very strong' : 'Très forte'}</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-foreground/50 uppercase block mb-1.5">Cible *</label>
                <select
                  data-field="genreCible"
                  value={form.genreCible}
                  onChange={e => updateForm('genreCible', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold/50 bg-neutral-900"
                >
                  <option value="mixte">{isEn ? 'Unisex' : 'Mixte'}</option>
                  <option value="homme">{isEn ? 'Men' : 'Homme'}</option>
                  <option value="femme">{isEn ? 'Women' : 'Femme'}</option>
                </select>
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
                        Image Principale *
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
              className="flex-1 px-4 py-3 rounded-xl bg-gold hover:bg-gold/90 text-black font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-gold/10"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {editingEssence ? (isEn ? 'Update' : 'Mettre à jour') : (isEn ? "Save essence" : "Enregistrer l'essence")}
            </button>
          </div>
        </div>
      </SlideOver>
    </div>
  );
}
