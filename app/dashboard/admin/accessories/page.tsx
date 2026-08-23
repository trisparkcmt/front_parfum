'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Loader2, SlidersHorizontal, X, Tag, Layers, Palette, DollarSign, Boxes } from 'lucide-react';
import { shopService, adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { useCatalogPermissions } from '@/hooks/useCatalogPermissions';
import CatalogAccessNotice from '@/components/catalog/CatalogAccessNotice';
import { extractCatalogList } from '@/lib/catalogUtils';
import { MultiImageUpload } from '@/components/MultiImageUpload';
import { CreateCategoryModal } from '@/components/CreateCategoryModal';
import { useAuthStore } from '@/store/useAuthStore';
import AppImage from '@/components/ui/AppImage';
import { SlideOver } from '@/components/ui/SlideOver';
import { InlineCell } from '@/components/admin/InlineCell';
import { useTranslation } from 'react-i18next';

/* ── Inline translations ─────────────────────────────────────────────────── */
const T = {
  fr: {
    title: 'Accessoires',
    subtitle: 'Bijoux, montres et autres accessoires',
    add: 'Ajouter',
    all: 'Tous',
    delete_selected: 'Supprimer',
    search_placeholder: 'Rechercher par nom…',
    filter_brand: 'Marque',
    filter_all: 'Toutes',
    filter_material: 'Matière',
    filter_color: 'Couleur',
    filter_stock: 'Stock',
    filter_in_stock: 'En stock',
    filter_low_stock: 'Stock faible',
    col_accessory: 'Accessoire',
    col_type: 'Type',
    col_price: 'Prix vente',
    col_margin: 'Bénéfice unitaire',
    col_stock: 'Stock',
    col_actions: 'Actions',
    no_results: 'Aucun accessoire trouvé.',
    loading: 'Chargement des accessoires…',
    not_defined: 'Non défini',
    units: 'unités',
    modal_title_edit: "Modifier l'accessoire",
    modal_title_new: 'Ajouter un accessoire',
    section_id: 'Identification',
    section_pricing: 'Tarification & réduction',
    section_stock: 'Stock & logistique',
    section_media: 'Visuels',
    section_desc: 'Descriptions',
    field_brand: 'Marque *',
    field_name: 'Nom *',
    field_sku: 'SKU / Référence',
    field_type: "Type d'accessoire *",
    field_price: 'Prix unitaire (FCFA) *',
    field_purchase: "Prix d'achat (FCFA)",
    field_promo: 'Prix promotionnel (FCFA)',
    field_stock: 'Quantité en stock *',
    field_alert: "Seuil d'alerte",
    field_weight: 'Poids (g)',
    field_material: 'Matière',
    field_color: 'Couleur',
    field_size: 'Taille',
    field_desc_short: 'Description courte',
    field_desc_long: 'Description longue',
    field_desc_ai: 'Description IA',
    margin_label: 'Bénéfice estimé :',
    confirm_delete: 'Voulez-vous vraiment supprimer cet accessoire ?',
    confirm_bulk: 'Supprimer',
    accessory: 'accessoire(s)',
    toast_load_error: 'Erreur lors du chargement des accessoires',
    toast_types_error: "Erreur lors du chargement des types d'accessoires",
    toast_create_ok: 'Accessoire créé avec succès',
    toast_update_ok: 'Accessoire mis à jour avec succès',
    toast_save_error: 'Erreur lors de la sauvegarde',
    toast_delete_ok: 'Accessoire supprimé avec succès',
    toast_delete_error: 'Erreur lors de la suppression',
    toast_patch_error: 'Erreur lors de la mise à jour',
    toast_bulk_ok: 'supprimé(s)',
    toast_bulk_error: 'Erreur lors de la suppression en masse',
    toast_type_added: "Type d'accessoire ajouté avec succès",
    err_brand: 'La marque est requise',
    err_name: 'Le nom est requis',
    err_price: 'Le prix unitaire est requis',
    err_type: "Le type d'accessoire est requis",
    err_stock: 'La quantité en stock est requise',
    new_type: 'Nouveau type…',
    manage_types: 'Gérer les types',
    admin_badge: 'Admin',
  },
  en: {
    title: 'Accessories',
    subtitle: 'Jewellery, watches and other accessories',
    add: 'Add',
    all: 'All',
    delete_selected: 'Delete',
    search_placeholder: 'Search by name…',
    filter_brand: 'Brand',
    filter_all: 'All',
    filter_material: 'Material',
    filter_color: 'Color',
    filter_stock: 'Stock',
    filter_in_stock: 'In stock',
    filter_low_stock: 'Low stock',
    col_accessory: 'Accessory',
    col_type: 'Type',
    col_price: 'Sale price',
    col_margin: 'Unit margin',
    col_stock: 'Stock',
    col_actions: 'Actions',
    no_results: 'No accessories found.',
    loading: 'Loading accessories…',
    not_defined: 'Not defined',
    units: 'units',
    modal_title_edit: 'Edit accessory',
    modal_title_new: 'Add accessory',
    section_id: 'Identification',
    section_pricing: 'Pricing & discount',
    section_stock: 'Stock & logistics',
    section_media: 'Visuals',
    section_desc: 'Descriptions',
    field_brand: 'Brand *',
    field_name: 'Name *',
    field_sku: 'SKU / Reference',
    field_type: 'Accessory type *',
    field_price: 'Unit price (FCFA) *',
    field_purchase: 'Purchase price (FCFA)',
    field_promo: 'Promotional price (FCFA)',
    field_stock: 'Stock quantity *',
    field_alert: 'Alert threshold',
    field_weight: 'Weight (g)',
    field_material: 'Material',
    field_color: 'Color',
    field_size: 'Size',
    field_desc_short: 'Short description',
    field_desc_long: 'Long description',
    field_desc_ai: 'AI description',
    margin_label: 'Estimated margin:',
    confirm_delete: 'Are you sure you want to delete this accessory?',
    confirm_bulk: 'Delete',
    accessory: 'accessory(ies)',
    toast_load_error: 'Error loading accessories',
    toast_types_error: 'Error loading accessory types',
    toast_create_ok: 'Accessory created successfully',
    toast_update_ok: 'Accessory updated successfully',
    toast_save_error: 'Error saving',
    toast_delete_ok: 'Accessory deleted successfully',
    toast_delete_error: 'Error deleting',
    toast_patch_error: 'Error updating',
    toast_bulk_ok: 'deleted',
    toast_bulk_error: 'Error during bulk delete',
    toast_type_added: 'Accessory type added successfully',
    err_brand: 'Brand is required',
    err_name: 'Name is required',
    err_price: 'Unit price is required',
    err_type: 'Accessory type is required',
    err_stock: 'Stock quantity is required',
    new_type: 'New type…',
    manage_types: 'Manage types',
    admin_badge: 'Admin',
  },
} as const;
type TKey = keyof typeof T.fr;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

// ─────────────────────────────────────────────────────────────────────────
// Form primitives — shared visual language for every field in the modal
// ─────────────────────────────────────────────────────────────────────────

function FormSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-foreground/40">
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

export default function AccessoriesPage() {
  const permissions = useCatalogPermissions('accessoires');
  const { user } = useAuthStore();
  const isAdmin = Boolean(user?.is_staff || user?.is_superuser || user?.role === 'superadmin');
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en') ?? false;
  const t = (k: TKey) => isEn ? T.en[k] : T.fr[k];
  const [accessories, setAccessories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [marqueFilter, setMarqueFilter] = useState('');
  const [matiereFilter, setMatiereFilter] = useState('');
  const [couleurFilter, setCouleurFilter] = useState('');
  const [enStockFilter, setEnStockFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<any | null>(null);
  const [selectedAccessories, setSelectedAccessories] = useState<Set<string>>(new Set());
  const [imageFiles, setImageFiles] = useState<{ [key: string]: File | null }>({
    image_principale: null,
    image_supp_1: null,
    image_supp_2: null,
    image_supp_3: null,
    image_supp_4: null,
  });
  const [accessoryTypes, setAccessoryTypes] = useState<any[]>([]);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

  // Consolidate form state into a single object based on requested schema
  const [form, setForm] = useState({
    marque: '',
    nom: '',
    slug: '',
    reference_sku: '',
    type_accessoire: '',
    description_courte: '',
    description_longue: '',
    description_ia: '',
    matiere: '',
    couleur: '',
    taille: '',
    prix_unitaire: '',
    prix_achat: '',
    prix_promotionnel: '',
    stock_quantite: '',
    seuil_alerte_stock: '',
    poids_grammes: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { addToast } = useToastStore();

  const fetchAccessories = useCallback(async () => {
    if (!permissions.canRead) return;
    try {
      setLoading(true);
      const params: Record<string, unknown> = {};
      if (search) params.search = search;
      if (filter !== 'all') params.type_accessoire = Number(filter);
      if (marqueFilter) params.marque = marqueFilter;
      if (matiereFilter) params.matiere = matiereFilter;
      if (couleurFilter) params.couleur = couleurFilter;
      if (enStockFilter === 'true') params.en_stock = true;
      if (enStockFilter === 'false') params.en_stock = false;
      const data = await shopService.getAccessories(params);
      setAccessories(extractCatalogList(data));
    } catch {
      addToast(t('toast_load_error'), 'error');
    } finally {
      setLoading(false);
    }
  }, [search, filter, marqueFilter, matiereFilter, couleurFilter, enStockFilter, addToast, permissions.canRead]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAccessories();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchAccessories]);

  // Load accessory types for dropdowns and filtering
  useEffect(() => {
    shopService.getAccessoryTypes()
      .then(data => {
        const list = data.results || data.resultats || (Array.isArray(data) ? data : []);
        setAccessoryTypes(list);
      })
      .catch(() => addToast('Erreur lors du chargement des types d\'accessoires', 'error'));
  }, [addToast]);

  const handleOpenAdd = () => {
    if (!permissions.canCreate) return;
    setEditingAccessory(null);
    setFormErrors({});
    setForm({
      marque: '',
      nom: '',
      slug: '',
      reference_sku: '',
      type_accessoire: accessoryTypes[0]?.id ? String(accessoryTypes[0].id) : '',
      description_courte: '',
      description_longue: '',
      description_ia: '',
      matiere: '',
      couleur: '',
      taille: '',
      prix_unitaire: '',
      prix_achat: '',
      prix_promotionnel: '',
      stock_quantite: '',
      seuil_alerte_stock: '',
      poids_grammes: '',
    });
    setImageFiles({
      image_principale: null,
      image_supp_1: null,
      image_supp_2: null,
      image_supp_3: null,
      image_supp_4: null,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (acc: any) => {
    if (!permissions.canUpdate) return;
    setEditingAccessory(acc);
    setFormErrors({});
    setForm({
      marque: acc.marque || 'Accessoire Exclusif',
      nom: acc.nom || '',
      slug: acc.slug || '',
      reference_sku: acc.reference_sku || '',
      type_accessoire: String(acc.type_accessoire?.id || acc.type_accessoire || ''),
      description_courte: acc.description_courte || '',
      description_longue: acc.description_longue || '',
      description_ia: acc.description_ia || '',
      matiere: acc.matiere || '',
      couleur: acc.couleur || '',
      taille: acc.taille || '',
      prix_unitaire: String(acc.prix_unitaire || ''),
      prix_achat: acc.prix_achat ? String(acc.prix_achat) : '',
      prix_promotionnel: acc.prix_promotionnel ? String(acc.prix_promotionnel) : '',
      stock_quantite: String(acc.stock_quantite || ''),
      seuil_alerte_stock: String(acc.seuil_alerte_stock || '3'),
      poids_grammes: String(acc.poids_grammes || ''),
    });
    setImageFiles({
      image_principale: null,
      image_supp_1: null,
      image_supp_2: null,
      image_supp_3: null,
      image_supp_4: null,
    });
    setShowModal(true);
  };

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddType = async (name: string) => {
    const newType = await shopService.createAccessoryType({ nom: name });
    setAccessoryTypes(prev => [...prev, newType]);
    updateForm('type_accessoire', String(newType.id));
    addToast(t('toast_type_added'), 'success');
  };

  const handleSave = async () => {
    if (!permissions.canCreate && !permissions.canUpdate) return;

    const errors: Record<string, string> = {};
    if (!form.marque) errors.marque = t('err_brand');
    if (!form.nom) errors.nom = t('err_name');
    if (!form.prix_unitaire) errors.prix_unitaire = t('err_price');
    if (!form.type_accessoire) errors.type_accessoire = t('err_type');
    if (!form.stock_quantite) errors.stock_quantite = t('err_stock');

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      setTimeout(() => {
        const firstError = document.querySelector('[data-field="marque"], [data-field="nom"], [data-field="prix_unitaire"], [data-field="type_accessoire"], [data-field="stock_quantite"]') as HTMLElement | null;
        if (firstError) firstError.focus();
      }, 50);
      return;
    }

    setSaving(true);

    const formData = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      // On s'assure d'envoyer les valeurs, y compris les booleans (actif)
      if (val !== undefined && val !== null && (val !== '' || typeof val === 'boolean')) {
        formData.append(key, String(val));
      }
    });

    Object.entries(imageFiles).forEach(([key, file]) => {
      if (file instanceof File) {
        formData.append(key, file);
      }
    });

    try {
      if (editingAccessory) {
        // Optimistic: update in state immediately
        setAccessories(prev => prev.map(a =>
          (a.slug || a.id) === (editingAccessory.slug || editingAccessory.id)
            ? { ...a, ...Object.fromEntries(formData.entries()) }
            : a
        ));
        setShowModal(false);
        await adminService.patchFormData(`shop/accessoires/${editingAccessory.slug}/`, formData);
        addToast(t('toast_update_ok'), 'success');
        fetchAccessories(); // sync to get server-normalised data
      } else {
        setShowModal(false);
        await adminService.postFormData('shop/accessoires/', formData);
        addToast(t('toast_create_ok'), 'success');
        fetchAccessories(); // add new item
      }
    } catch (error: any) {
      addToast(error.response?.data?.detail || t('toast_save_error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const patchAccessory = async (slugOrId: string, field: string, value: string) => {
    if (!permissions.canUpdate) return;
    setAccessories(prev => prev.map(a =>
      (a.slug || a.id) === slugOrId ? { ...a, [field]: value } : a
    ));
    try {
      const fd = new FormData();
      fd.append(field, value);
      await adminService.patchFormData(`shop/accessoires/${slugOrId}/`, fd);
    } catch {
      addToast(t('toast_patch_error'), 'error');
      fetchAccessories();
    }
  };

  const handleDelete = async (slug: string) => {
    if (!permissions.canDelete) return;
    if (!confirm(t('confirm_delete'))) return;
    // Optimistic: remove immediately
    const snapshot = accessories.find(a => (a.slug || a.id) === slug);
    setAccessories(prev => prev.filter(a => (a.slug || a.id) !== slug));
    try {
      await shopService.deleteAccessory(slug);
      addToast(t('toast_delete_ok'), 'success');
    } catch (error) {
      if (snapshot) setAccessories(prev => [snapshot, ...prev]);
      addToast(t('toast_delete_error'), 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (!permissions.canDelete || selectedAccessories.size === 0) return;
    if (!confirm(`${t('confirm_bulk')} ${selectedAccessories.size} ${t('accessory')} ?`)) return;
    const slugs = Array.from(selectedAccessories);
    const snapshots = accessories.filter(a => slugs.includes(a.slug || a.id));
    setAccessories(prev => prev.filter(a => !slugs.includes(a.slug || a.id)));
    setSelectedAccessories(new Set());
    try {
      for (const slug of slugs) {
        try { await shopService.deleteAccessory(slug); } catch (e) { console.error(`Failed to delete ${slug}:`, e); }
      }
      addToast(`${slugs.length} ${t('accessory')} ${t('toast_bulk_ok')}`, 'success');
    } catch (error) {
      setAccessories(prev => [...snapshots, ...prev]);
      addToast(t('toast_bulk_error'), 'error');
    }
  };

  const toggleSelectAccessory = (slug: string) => {
    setSelectedAccessories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(slug)) {
        newSet.delete(slug);
      } else {
        newSet.add(slug);
      }
      return newSet;
    });
  };

  if (!permissions.canRead) {
    return (
      <div className="space-y-6">
        <CatalogAccessNotice permissions={permissions} resourceLabel="les accessoires" />
      </div>
    );
  }

  const activeFilterCount = [marqueFilter, matiereFilter, couleurFilter, enStockFilter].filter(Boolean).length;

  const profitPreview = form.prix_unitaire && form.prix_achat
    ? (parseFloat(form.prix_unitaire) - parseFloat(form.prix_achat))
    : null;

  return (
    <div className="space-y-6">

      {/* Header --------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
          <p className="mt-0.5 text-sm text-foreground/40">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedAccessories.size > 0 && permissions.canDelete && (
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-2 rounded-lg bg-red-500/90 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
            >
              <Trash2 size={14} />
              {t('delete_selected')} ({selectedAccessories.size})
            </button>
          )}
          {permissions.canCreate && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-3.5 py-2 text-sm font-semibold text-black transition-colors hover:bg-gold/85"
            >
              <Plus size={14} />
              {t('add')}
            </button>
          )}
        </div>
      </div>

      <CatalogAccessNotice permissions={permissions} resourceLabel="les accessoires" />

      {/* Toolbar ---------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="shadow-black/30 shadow-sm flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
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

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={cx(
                'rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                filter === 'all' ? 'border-gold/40 bg-gold/15 text-gold' : 'border-white/10 text-foreground/50 hover:border-white/20 hover:text-foreground/80'
              )}
            >
              Tous
            </button>
            {accessoryTypes.map(t => (
              <button
                key={t.id}
                onClick={() => setFilter(String(t.id))}
                className={cx(
                  'rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                  filter === String(t.id) ? 'border-gold/40 bg-gold/15 text-gold' : 'border-white/10 text-foreground/50 hover:border-white/20 hover:text-foreground/80'
                )}
              >
                {t.nom}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowFilters(s => !s)}
            className={cx(
              'ml-auto inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors',
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
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:grid-cols-4">
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-foreground/35">{t('filter_brand')}</p>
              <input
                value={marqueFilter}
                onChange={e => setMarqueFilter(e.target.value)}
                placeholder={t('filter_all')}
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-gold/50"
              />
            </div>
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-foreground/35">{t('filter_material')}</p>
              <input
                value={matiereFilter}
                onChange={e => setMatiereFilter(e.target.value)}
                placeholder={t('filter_all')}
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-gold/50"
              />
            </div>
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-foreground/35">{t('filter_color')}</p>
              <input
                value={couleurFilter}
                onChange={e => setCouleurFilter(e.target.value)}
                placeholder={t('filter_all')}
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-gold/50"
              />
            </div>
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-foreground/35">Stock</p>
              <select
                value={enStockFilter}
                onChange={e => setEnStockFilter(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-gold/50"
              >
                <option value="" className="bg-background">{t('all')}</option>
                <option value="true" className="bg-background">{t('filter_in_stock')}</option>
                <option value="false" className="bg-background">{t('filter_low_stock')}</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table -------------------------------------------------------------- */}
      <div className="shadow-black/30 shadow-sm min-h-[300px] overflow-hidden rounded-xl border border-white/10">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2.5 py-20 text-foreground/40">
            <Loader2 className="animate-spin text-gold" size={28} />
            <p className="text-xs">Chargement des accessoires…</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="w-12 px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={accessories.length > 0 && selectedAccessories.size === accessories.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAccessories(new Set(accessories.map(a => a.slug || a.id)));
                        } else {
                          setSelectedAccessories(new Set());
                        }
                      }}
                      className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold"
                    />
                  </th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('col_accessory')}</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('col_type')}</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('col_price')}</th>
                  {isAdmin && (
                    <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('col_margin')}</th>
                  )}
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('col_stock')}</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-foreground/35">{t('col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {accessories.map(a => {
                  const aName = a.nom || 'Accessoire';
                  const aPrice = a.prix_unitaire || 0;
                  const aStock = a.stock_quantite || 0;
                  const typeName = typeof a.type_accessoire === 'object'
                    ? a.type_accessoire?.nom
                    : (accessoryTypes.find(t => t.id === a.type_accessoire)?.nom || '—');

                  const prixVenteNum = parseFloat(String(aPrice));
                  const prixAchatNum = parseFloat(String(a.prix_achat || 0));
                  const beneficeCalc = a.benefice_unitaire !== undefined
                    ? parseFloat(String(a.benefice_unitaire))
                    : (a.prix_unitaire && a.prix_achat ? prixVenteNum - prixAchatNum : null);

                  return (
                    <tr key={a.slug || a.id} className="group transition-colors hover:bg-white/[0.02]">
                      <td className="w-12 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedAccessories.has(a.slug || a.id)}
                          onChange={() => toggleSelectAccessory(a.slug || a.id)}
                          className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/8 bg-white/[0.03]">
                            {a.image_principale ? (
                              <AppImage src={a.image_principale} alt={aName} fill className="object-cover" />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-base">👜</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-foreground">
                              <InlineCell
                                value={aName}
                                onSave={v => patchAccessory(a.slug || a.id, 'nom', v)}
                                disabled={!permissions.canUpdate}
                                className="font-medium text-foreground"
                              />
                            </p>
                            <p className="mt-0.5 font-mono text-[10px] uppercase text-foreground/30">{a.reference_sku || a.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-white/6 px-2.5 py-1 text-[11px] font-medium text-foreground/60">
                          {typeName}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-foreground">
                        <InlineCell
                          value={String(aPrice)}
                          onSave={v => patchAccessory(a.slug || a.id, 'prix_unitaire', v)}
                          disabled={!permissions.canUpdate}
                          inputType="number"
                          display={<>{Number(aPrice).toLocaleString()} FCFA</>}
                          className="font-semibold text-foreground tabular-nums"
                        />
                      </td>
                      {isAdmin && (
                        <td className="whitespace-nowrap px-4 py-3">
                          {beneficeCalc !== null ? (
                            <span className={cx(
                              'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                              beneficeCalc >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                            )}>
                              +{beneficeCalc.toLocaleString()} FCFA
                            </span>
                          ) : (
                      <span className="text-xs italic text-foreground/30">{t('not_defined')}</span>
                          )}
                        </td>
                      )}
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-foreground/55">
                        <InlineCell
                          value={String(aStock)}
                          onSave={v => patchAccessory(a.slug || a.id, 'stock_quantite', v)}
                          disabled={!permissions.canUpdate}
                          inputType="number"
                          display={<>{aStock} {t('units')}</>}
                          className="text-foreground/55 tabular-nums"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {permissions.canUpdate && (
                            <button onClick={() => handleOpenEdit(a)} title="Modifier" className="rounded-md p-1.5 text-foreground/45 transition-colors hover:bg-gold/10 hover:text-gold">
                              <Edit2 size={14} />
                            </button>
                          )}
                          {permissions.canDelete && (
                            <button onClick={() => handleDelete(a.slug)} title="Supprimer" className="rounded-md p-1.5 text-foreground/45 transition-colors hover:bg-red-500/10 hover:text-red-400">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {accessories.length === 0 && (
                  <tr>
                      <td colSpan={7} className="py-16 text-center text-sm italic text-foreground/30">{t('no_results')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Form modal — now restyled inside too ──────────────────────────── */}
      <SlideOver
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingAccessory ? t('modal_title_edit') : t('modal_title_new')}
        description={editingAccessory ? editingAccessory.nom : isEn ? 'New catalogue accessory' : 'Nouvel accessoire du catalogue'}
        size="xl"
        footer={
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="flex-1 rounded-lg bg-gold py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gold/85 disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {saving ? (isEn ? 'Saving…' : 'Enregistrement…') : (isEn ? 'Save' : 'Enregistrer')}
            </button>
            <button onClick={() => setShowModal(false)} className="rounded-lg border border-white/10 px-5 py-2.5 text-sm text-foreground/60 transition-colors hover:bg-white/6">
              {isEn ? 'Cancel' : 'Annuler'}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-4">

            <FormSection title={t('section_id')} icon={<Tag size={11} />}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('field_brand')} required error={formErrors.marque}>
                  <input
                    data-field="marque"
                    value={form.marque}
                    onChange={e => updateForm('marque', e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Nom de l'accessoire" required error={formErrors.nom}>
                  <input
                    data-field="nom"
                    value={form.nom}
                    onChange={e => updateForm('nom', e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Type d'accessoire" required error={formErrors.type_accessoire}>
                  <select
                    data-field="type_accessoire"
                    value={form.type_accessoire}
                    onChange={e => updateForm('type_accessoire', e.target.value)}
                    className={inputCls}
                  >
                    <option value="" disabled className="bg-background">Choisir un type</option>
                    {accessoryTypes.map(t => (
                      <option key={t.id} value={t.id} className="bg-background">{t.nom}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Référence SKU" error={formErrors.reference_sku}>
                  <input
                    data-field="reference_sku"
                    value={form.reference_sku}
                    onChange={e => updateForm('reference_sku', e.target.value)}
                    placeholder="Optionnel"
                    className={inputCls}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Slug" error={formErrors.slug}>
                    <input
                      data-field="slug"
                      value={form.slug}
                      onChange={e => updateForm('slug', e.target.value)}
                      placeholder="Généré automatiquement si vide"
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>
            </FormSection>

            <FormSection title="Descriptions" icon={<Layers size={11} />}>
              <div className="space-y-4">
                <Field label="Description courte" error={formErrors.description_courte}>
                  <textarea
                    data-field="description_courte"
                    value={form.description_courte}
                    onChange={e => updateForm('description_courte', e.target.value)}
                    rows={2}
                    className={cx(inputCls, 'resize-none')}
                  />
                </Field>
                <Field label="Description longue" error={formErrors.description_longue}>
                  <textarea
                    data-field="description_longue"
                    value={form.description_longue}
                    onChange={e => updateForm('description_longue', e.target.value)}
                    rows={3}
                    className={cx(inputCls, 'resize-none')}
                  />
                </Field>
                <Field label="Description IA" error={formErrors.description_ia}>
                  <textarea
                    data-field="description_ia"
                    value={form.description_ia}
                    onChange={e => updateForm('description_ia', e.target.value)}
                    rows={2}
                    className={cx(inputCls, 'resize-none')}
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection title="Caractéristiques" icon={<Palette size={11} />}>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Matière" error={formErrors.matiere}>
                  <input data-field="matiere" value={form.matiere} onChange={e => updateForm('matiere', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Couleur" error={formErrors.couleur}>
                  <input data-field="couleur" value={form.couleur} onChange={e => updateForm('couleur', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Taille" error={formErrors.taille}>
                  <input data-field="taille" value={form.taille} onChange={e => updateForm('taille', e.target.value)} className={inputCls} />
                </Field>
              </div>
            </FormSection>

            <FormSection title="Tarification" icon={<DollarSign size={11} />}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Prix unitaire (FCFA)" required error={formErrors.prix_unitaire}>
                    <input
                      data-field="prix_unitaire"
                      type="number"
                      value={form.prix_unitaire}
                      onChange={e => updateForm('prix_unitaire', e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Prix promo (FCFA)" error={formErrors.prix_promotionnel}>
                    <input
                      data-field="prix_promotionnel"
                      type="number"
                      value={form.prix_promotionnel}
                      onChange={e => updateForm('prix_promotionnel', e.target.value)}
                      placeholder="Optionnel"
                      className={inputCls}
                    />
                  </Field>
                </div>
                {isAdmin && (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                    <Field
                      label={
                        <span className="flex items-center gap-1.5 text-amber-400/90">
                          Prix d'achat (FCFA)
                          <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400">Admin</span>
                        </span>
                      }
                      error={formErrors.prix_achat}
                    >
                      <input
                        data-field="prix_achat"
                        type="number"
                        placeholder="ex : 3000"
                        value={form.prix_achat}
                        onChange={e => updateForm('prix_achat', e.target.value)}
                        className={cx(inputCls, 'border-amber-500/20')}
                      />
                    </Field>
                    {profitPreview !== null && (
                      <p className={cx('mt-2 text-xs font-medium', profitPreview >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                        Bénéfice estimé : {profitPreview >= 0 ? '+' : ''}{profitPreview.toLocaleString()} FCFA
                      </p>
                    )}
                  </div>
                )}
              </div>
            </FormSection>

            <FormSection title="Stock & logistique" icon={<Boxes size={11} />}>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Quantité en stock" required error={formErrors.stock_quantite}>
                  <input
                    data-field="stock_quantite"
                    type="number"
                    value={form.stock_quantite}
                    onChange={e => updateForm('stock_quantite', e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Seuil d'alerte" error={formErrors.seuil_alerte_stock}>
                  <input
                    data-field="seuil_alerte_stock"
                    type="number"
                    value={form.seuil_alerte_stock}
                    onChange={e => updateForm('seuil_alerte_stock', e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Poids (g)" error={formErrors.poids_grammes}>
                  <input
                    data-field="poids_grammes"
                    type="number"
                    value={form.poids_grammes}
                    onChange={e => updateForm('poids_grammes', e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
            </FormSection>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 xl:sticky xl:top-0">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-foreground/40">
              Images
            </p>
            <MultiImageUpload onImagesChange={(images) => setImageFiles(images)} />
          </div>
        </div>
      </SlideOver>

      <CreateCategoryModal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        onSubmit={handleAddType}
        title="Nouveau type d'accessoire"
        categoryType="Type"
      />
    </div>
  );
}
