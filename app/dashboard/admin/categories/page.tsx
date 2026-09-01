'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Edit2, Trash2, Plus, Search, Gem, FlaskConical, Tag, Calendar, Image as ImageIcon } from 'lucide-react';
import { PerfumeIcon } from '@/components/icons/CustomIcons';
import { shopService, adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import AppImage from '@/components/ui/AppImage';
import CompactIconUpload from '@/components/admin/CompactIconUpload';
import { SlideOver } from '@/components/ui/SlideOver';
import { fromDatetimeLocalValue, formatPromotionPeriod, toDatetimeLocalValue } from '@/lib/promotionUtils';
import { extractApiError } from '@/lib/apiError';
import { useTranslation } from 'react-i18next';

/* -------------------------------------------------------------------------- */
/* Inline Translations Dictionary                                              */
/* -------------------------------------------------------------------------- */

const T = {
  fr: {
    title: 'Classifications & catégories',
    subtitle: "Types d'accessoires, flacons et catégories de parfums",
    search_placeholder: 'Rechercher…',
    no_results: 'Aucun résultat',
    tab_perfume: 'Catégories parfums',
    tab_accessory: 'Catégories accessoires',
    tab_bottle: 'Types flacons',
    col_icon: 'Icône',
    col_name: 'Nom',
    col_slug: 'Slug',
    col_order: 'Ordre',
    col_discount: 'Réduction',
    col_description: 'Description',
    col_promo_period: 'Période promo',
    col_actions: 'Actions',
    section_general: 'Informations générales',
    section_promotion: 'Configuration promotion',
    section_visual: 'Visuel & Statut',
    field_name: 'Nom',
    field_slug: 'Slug',
    field_order: "Ordre d'affichage",
    field_discount: 'Réduction (%)',
    field_description: 'Description',
    field_start_date: 'Date début',
    field_end_date: 'Date fin',
    field_promo_msg: 'Message promotion',
    btn_reset_dates: 'Réinitialiser les dates',
    field_category_icon: "Image / Icône de la catégorie",
    field_type_icon: 'Icône du type',
    field_active: 'Actif',
    placeholder_description: 'Description...',
    err_name: 'Le nom est requis',
    err_slug: 'Le slug est requis',
    err_order_required: "L'ordre d'affichage est requis",
    err_order_positive: "L'ordre d'affichage doit être un nombre positif",
    err_discount_range: 'Le taux de réduction doit être entre 0 et 100',
    err_promo_msg: 'Le message de promotion est requis',
    err_start_date: 'La date de début est requise',
    err_end_date: 'La date de fin est requise',
    err_end_after_start: 'La date de fin doit être après la date de début',
    err_description: 'La description est requise',
    toast_load_error: 'Erreur lors du chargement des données',
    toast_perfume_created: 'Catégorie parfum créée',
    toast_perfume_updated: 'Catégorie parfum mise à jour',
    toast_accessory_created: 'Type accessoire créé',
    toast_accessory_updated: 'Type accessoire mis à jour',
    toast_bottle_created: 'Type flacon créé',
    toast_bottle_updated: 'Type flacon mis à jour',
    toast_save_error: 'Erreur lors de la sauvegarde',
    toast_delete_success: 'Élément supprimé',
    toast_delete_error: 'Erreur lors de la suppression',
    confirm_delete: 'Êtes-vous sûr de vouloir supprimer cet élément ?',
    modal_description: 'Renseignez les informations requises pour cette classification.',
    modal_add_perfume: 'Nouvelle catégorie parfum',
    modal_edit_perfume: 'Modifier la catégorie',
    modal_add_accessory: 'Nouveau type accessoire',
    modal_edit_accessory: 'Modifier le type',
    modal_add_bottle: 'Nouveau type flacon',
    modal_edit_bottle: 'Modifier le flacon',
    add: 'Ajouter',
    edit: 'Modifier',
    delete: 'Supprimer',
    save: 'Enregistrer',
    saving: 'Enregistrement…',
    cancel: 'Annuler',
    loading: 'Chargement…',
    click_to_edit: 'Cliquer pour modifier',
  },
  en: {
    title: 'Classifications & Categories',
    subtitle: 'Accessory types, bottles, and perfume categories',
    search_placeholder: 'Search…',
    no_results: 'No results found',
    tab_perfume: 'Perfume Categories',
    tab_accessory: 'Accessory Categories',
    tab_bottle: 'Bottle Types',
    col_icon: 'Icon',
    col_name: 'Name',
    col_slug: 'Slug',
    col_order: 'Order',
    col_discount: 'Discount',
    col_description: 'Description',
    col_promo_period: 'Promo Period',
    col_actions: 'Actions',
    section_general: 'General Information',
    section_promotion: 'Promotion Setup',
    section_visual: 'Visual & Status',
    field_name: 'Name',
    field_slug: 'Slug',
    field_order: 'Display Order',
    field_discount: 'Discount Rate (%)',
    field_description: 'Description',
    field_start_date: 'Start Date',
    field_end_date: 'End Date',
    field_promo_msg: 'Promo Message',
    btn_reset_dates: 'Reset Dates',
    field_category_icon: 'Category Image / Icon',
    field_type_icon: 'Type Icon',
    field_active: 'Active',
    placeholder_description: 'Description...',
    err_name: 'Name is required',
    err_slug: 'Slug is required',
    err_order_required: 'Display order is required',
    err_order_positive: 'Display order must be a positive number',
    err_discount_range: 'Discount rate must be between 0 and 100',
    err_promo_msg: 'Promo message is required',
    err_start_date: 'Start date is required',
    err_end_date: 'End date is required',
    err_end_after_start: 'End date must be after start date',
    err_description: 'Description is required',
    toast_load_error: 'Error loading data',
    toast_perfume_created: 'Perfume category created',
    toast_perfume_updated: 'Perfume category updated',
    toast_accessory_created: 'Accessory type created',
    toast_accessory_updated: 'Accessory type updated',
    toast_bottle_created: 'Bottle type created',
    toast_bottle_updated: 'Bottle type updated',
    toast_save_error: 'Error saving item',
    toast_delete_success: 'Item deleted',
    toast_delete_error: 'Error deleting item',
    confirm_delete: 'Are you sure you want to delete this item?',
    modal_description: 'Provide the required information for this classification.',
    modal_add_perfume: 'New Perfume Category',
    modal_edit_perfume: 'Edit Category',
    modal_add_accessory: 'New Accessory Type',
    modal_edit_accessory: 'Edit Type',
    modal_add_bottle: 'New Bottle Type',
    modal_edit_bottle: 'Edit Bottle Type',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    saving: 'Saving…',
    cancel: 'Cancel',
    loading: 'Loading…',
    click_to_edit: 'Click to edit',
  },
} as const;

type TKey = keyof typeof T.fr;

type TabKey = 'perfume_categories' | 'accessory_categories' | 'bottle_types';

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

/* -------------------------------------------------------------------------- */
/* Shared Design System Primitives                                            */
/* -------------------------------------------------------------------------- */

const inputClassName =
  'w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-foreground outline-none transition-colors focus:border-gold/50 focus:bg-white/[0.05] placeholder:text-foreground/35 disabled:opacity-50';

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
        {label} {required && <span className="text-gold">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

function FormSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-foreground/40">
        {Icon && <Icon size={12} className="text-gold" />}
        <span>{title}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-medium transition-colors',
        active
          ? 'border-gold text-gold'
          : 'border-transparent text-foreground/45 hover:text-foreground/75'
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* InlineCell — click to edit, blur to save                                  */
/* -------------------------------------------------------------------------- */

function InlineCell({
  id,
  field,
  value,
  display,
  inputType = 'text',
  className = '',
  inlineEdit,
  setInlineEdit,
  onSave,
}: {
  id: number;
  field: string;
  value: string;
  display?: React.ReactNode;
  inputType?: string;
  className?: string;
  inlineEdit: { id: number; field: string; value: string } | null;
  setInlineEdit: (v: { id: number; field: string; value: string } | null) => void;
  onSave: (id: number, field: string, value: string) => void;
}) {
  const isActive = inlineEdit?.id === id && inlineEdit?.field === field;
  const inputRef = useRef<HTMLInputElement>(null);
  const originalRef = useRef(value);

  useEffect(() => {
    if (isActive) {
      inputRef.current?.focus();
      inputRef.current?.select();
      originalRef.current = value;
    }
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = () => {
    const val = inlineEdit?.value ?? value;
    if (val.trim() !== '' && val !== originalRef.current) {
      onSave(id, field, val.trim());
    } else {
      setInlineEdit(null);
    }
  };

  if (isActive) {
    return (
      <input
        ref={inputRef}
        type={inputType}
        value={inlineEdit!.value}
        onChange={e => setInlineEdit({ id, field, value: e.target.value })}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); inputRef.current?.blur(); }
          if (e.key === 'Escape') { setInlineEdit(null); }
        }}
        className={`min-w-0 w-full rounded border border-gold/50 bg-white/[0.06] px-2 py-1 text-xs text-foreground outline-none ring-1 ring-gold/30 ${className}`}
      />
    );
  }

  return (
    <span
      onClick={() => setInlineEdit({ id, field, value })}
      title="Cliquer pour modifier"      className={`cursor-text rounded px-1 -mx-1 py-0.5 transition-colors hover:bg-white/[0.06] hover:ring-1 hover:ring-white/10 group inline-flex items-center gap-1.5 ${className}`}
    >
      {display ?? value}
      <Edit2 size={10} className="opacity-0 group-hover:opacity-40 transition-opacity flex-shrink-0" />
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

export default function CategoriesAdminPage() {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en') ?? false;
  const t = (k: TKey) => isEn ? T.en[k] : T.fr[k];

  const [activeTab, setActiveTab] = useState<TabKey>('perfume_categories');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    nom: '',
    slug: '',
    description: '',
    ordre_affichage: 0,
    actif: true,
    taux_reduction: '0.00',
    date_debut: '',
    date_fin: '',
    message_promotion: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  // Inline editing: { id, field, value }
  const [inlineEdit, setInlineEdit] = useState<{ id: number; field: string; value: string } | null>(null);

  const { addToast } = useToastStore();

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      let data: any;
      if (activeTab === 'perfume_categories') {
        data = await shopService.getPerfumeCategories();
      } else if (activeTab === 'accessory_categories') {
        data = await shopService.getAccessoryTypes();
      } else if (activeTab === 'bottle_types') {
        data = await shopService.getBottleTypes();
      }
      const list = data?.results || data?.resultats || (Array.isArray(data) ? data : []);
      setItems(list);
    } catch {
      addToast(t('toast_load_error'), 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, addToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const updateForm = (field: keyof typeof form, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      nom: '',
      slug: '',
      description: '',
      ordre_affichage: 0,
      actif: true,
      taux_reduction: '0.00',
      date_debut: '',
      date_fin: '',
      message_promotion: '',
    });
    setIconFile(null);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    resetForm();
    setFormErrors({});
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setForm({
      nom: item.nom || '',
      slug: item.slug || '',
      description: item.description || '',
      ordre_affichage: item.ordre_affichage || 0,
      actif: item.actif !== undefined ? item.actif : true,
      taux_reduction: item.taux_reduction || '0.00',
      date_debut: toDatetimeLocalValue(item.date_debut),
      date_fin: toDatetimeLocalValue(item.date_fin),
      message_promotion: item.message_promotion || '',
    });
    setIconFile(null);
    setFormErrors({});
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    const errors: Record<string, string> = {};
    if (activeTab === 'perfume_categories' || activeTab === 'accessory_categories') {
      if (!form.nom.trim()) errors.nom = t('err_name');
      if (!form.slug.trim()) errors.slug = t('err_slug');
      if (form.ordre_affichage === undefined || form.ordre_affichage === null)
        errors.ordre_affichage = t('err_order_required');
      else if (isNaN(Number(form.ordre_affichage)) || Number(form.ordre_affichage) < 0)
        errors.ordre_affichage = t('err_order_positive');

      if (form.taux_reduction && form.taux_reduction !== '0' && form.taux_reduction !== '0.00') {
        if (
          isNaN(Number(form.taux_reduction)) ||
          Number(form.taux_reduction) < 0 ||
          Number(form.taux_reduction) > 100
        )
          errors.taux_reduction = t('err_discount_range');

        if (!form.message_promotion.trim())
          errors.message_promotion = t('err_promo_msg');
      }
      // Allow empty dates, but validate date order if both are provided
      if (form.date_debut && form.date_fin && new Date(form.date_fin) < new Date(form.date_debut))
        errors.date_fin = t('err_end_after_start');
    }

    if (activeTab === 'accessory_categories' || activeTab === 'bottle_types') {
      if (!form.description.trim()) errors.description = t('err_description');
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setTimeout(() => {
        const firstField = Object.keys(errors)[0];
        const el = document.querySelector(`[data-field="${firstField}"]`);
        if (
          el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement ||
          el instanceof HTMLSelectElement
        ) {
          el.focus();
        }
      }, 0);
      return;
    }

    setIsSaving(true);
    try {
      if (activeTab === 'perfume_categories') {
        const formData = new FormData();
        formData.append('nom', form.nom);
        if (form.slug) formData.append('slug', form.slug);
        formData.append('ordre_affichage', String(Number(form.ordre_affichage)));
        formData.append('actif', String(form.actif));
        formData.append('taux_reduction', form.taux_reduction);
        formData.append('message_promotion', form.message_promotion || '');
        const dateDebut = fromDatetimeLocalValue(form.date_debut);
        const dateFin = fromDatetimeLocalValue(form.date_fin);
        if (dateDebut) formData.append('date_debut', dateDebut);
        if (dateFin) formData.append('date_fin', dateFin);
        if (iconFile instanceof File) {
          formData.append('icone', iconFile);
          formData.append('image', iconFile);
        }
        if (editingItem) {
          await adminService.patchFormData(`shop/categories-parfum/${editingItem.id}/`, formData);
          addToast(t('toast_perfume_updated'), 'success');
        } else {
          await adminService.postFormData('shop/categories-parfum/', formData);
          addToast(t('toast_perfume_created'), 'success');
        }
      } else if (activeTab === 'accessory_categories') {
        const formData = new FormData();
        formData.append('nom', form.nom);
        formData.append('description', form.description);
        formData.append('taux_reduction', form.taux_reduction);
        formData.append('actif', String(form.actif));
        const dateDebut = fromDatetimeLocalValue(form.date_debut);
        const dateFin = fromDatetimeLocalValue(form.date_fin);
        if (dateDebut) formData.append('date_depart', dateDebut);
        if (dateFin) formData.append('date_fin', dateFin);
        if (form.message_promotion) formData.append('message_promotion', form.message_promotion);
        if (iconFile instanceof File) {
          formData.append('icone', iconFile);
          formData.append('image', iconFile);
        }
        if (editingItem) {
          await adminService.patchFormData(`shop/types-accessoire/${editingItem.id}/`, formData);
          addToast(t('toast_accessory_updated'), 'success');
        } else {
          await adminService.postFormData('shop/types-accessoire/', formData);
          addToast(t('toast_accessory_created'), 'success');
        }
      } else if (activeTab === 'bottle_types') {
        const payload = { nom: form.nom, description: form.description };
        if (editingItem) {
          await shopService.updateBottleType(editingItem.id, payload);
          addToast(t('toast_bottle_updated'), 'success');
        } else {
          await shopService.createBottleType(payload);
          addToast(t('toast_bottle_created'), 'success');
        }
      }

      setShowModal(false);
      fetchItems();
    } catch (error: any) {
      setFormError(extractApiError(error, t('toast_save_error')));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirm_delete'))) return;
    const snapshot = items.find(i => i.id === id);
    setItems(prev => prev.filter(i => i.id !== id));
    try {
      if (activeTab === 'perfume_categories') {
        await shopService.deletePerfumeCategory(id);
      } else if (activeTab === 'accessory_categories') {
        await shopService.deleteAccessoryType(id);
      } else if (activeTab === 'bottle_types') {
        await shopService.deleteBottleType(id);
      }
      addToast(t('toast_delete_success'), 'success');
    } catch {
      if (snapshot) setItems(prev => [snapshot, ...prev]);
      addToast(t('toast_delete_error'), 'error');
    }
  };

  // ── Inline edit: patch a single field on blur ──────────────────────────
  const handleInlineSave = async (id: number, field: string, value: string) => {
    // Optimistically update local state first
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    setInlineEdit(null);

    try {
      const formData = new FormData();
      formData.append(field, value);

      if (activeTab === 'perfume_categories') {
        await adminService.patchFormData(`shop/categories-parfum/${id}/`, formData);
      } else if (activeTab === 'accessory_categories') {
        await adminService.patchFormData(`shop/types-accessoire/${id}/`, formData);
      } else if (activeTab === 'bottle_types') {
        await shopService.updateBottleType(id, { [field]: value });
      }
    } catch {
      // Roll back on failure
      addToast(t('toast_save_error'), 'error');
      fetchItems();
    }
  };

  const filtered = items.filter(
    c =>
      (c.nom || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.slug || '').toLowerCase().includes(search.toLowerCase())
  );

  const colSpan = activeTab === 'perfume_categories' ? 7 : activeTab === 'accessory_categories' ? 6 : 3;

  const modalTitle = editingItem
    ? activeTab === 'perfume_categories'
      ? t('modal_edit_perfume')
      : activeTab === 'accessory_categories'
      ? t('modal_edit_accessory')
      : t('modal_edit_bottle')
    : activeTab === 'perfume_categories'
    ? t('modal_add_perfume')
    : activeTab === 'accessory_categories'
    ? t('modal_add_accessory')
    : t('modal_add_bottle');

  return (
    <>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
            <p className="mt-0.5 text-sm text-foreground/40">
              {t('subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAdd}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-3.5 py-2 text-xs font-semibold text-black transition-colors hover:bg-gold/85 sm:w-auto"
            >
              <Plus size={14} />
              <span>{t('add')}</span>
            </button>
          </div>
        </div>

        {/* Tabs & Content Wrapper */}
        <div className="shadow-black/30 shadow-sm overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
          {/* Section Navigation Tabs */}
          <div className="flex overflow-x-auto border-b border-white/10 bg-white/[0.02]">
            <TabButton
              active={activeTab === 'perfume_categories'}
              onClick={() => setActiveTab('perfume_categories')}
              icon={<PerfumeIcon size={14} />}
              label={t('tab_perfume')}
            />
            <TabButton
              active={activeTab === 'accessory_categories'}
              onClick={() => setActiveTab('accessory_categories')}
              icon={<Gem size={14} />}
              label={t('tab_accessory')}
            />
            <TabButton
              active={activeTab === 'bottle_types'}
              onClick={() => setActiveTab('bottle_types')}
              icon={<FlaskConical size={14} />}
              label={t('tab_bottle')}
            />
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            {/* Toolbar / Search */}
            <div className="flex w-full sm:max-w-xs items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
              <Search size={14} className="shrink-0 text-foreground/35" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-foreground/35"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-foreground/40">
                <Loader2 className="animate-spin text-gold" size={18} />
                <span className="text-xs">{t('loading')}</span>
              </div>
            ) : (
              <>
                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-hidden rounded-xl border border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02]">
                        {activeTab === 'perfume_categories' && (
                          <>
                            <th className="w-14 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              {t('col_icon')}
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              {t('col_name')}
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              {t('col_slug')}
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              {t('col_order')}
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              {t('col_discount')}
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              {t('col_promo_period')}
                            </th>
                          </>
                        )}
                        {activeTab === 'accessory_categories' && (
                          <>
                            <th className="w-14 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              {t('col_icon')}
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              {t('col_name')}
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              {t('col_description')}
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              {t('col_discount')}
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              {t('col_promo_period')}
                            </th>
                          </>
                        )}
                        {activeTab === 'bottle_types' && (
                          <>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              {t('col_name')}
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              {t('col_description')}
                            </th>
                          </>
                        )}
                        <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                          {t('col_actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filtered.map(c => (
                        <tr key={c.id} className="transition-colors hover:bg-white/[0.02]">
                          {activeTab === 'perfume_categories' && (
                            <>
                              <td className="whitespace-nowrap px-4 py-2.5">
                                <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
                                  {c.image || c.icone ? (
                                    <AppImage src={c.image || c.icone} alt={c.nom || t('col_icon')} fill className="object-cover" />
                                  ) : (
                                    <PerfumeIcon size={14} className="text-foreground/25" />
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2.5 font-medium text-foreground">
                                <InlineCell id={c.id} field="nom" value={c.nom || ''} inlineEdit={inlineEdit} setInlineEdit={setInlineEdit} onSave={handleInlineSave} className="font-medium text-foreground" />
                              </td>
                              <td className="px-4 py-2.5 text-foreground/50">
                                <InlineCell id={c.id} field="slug" value={c.slug || ''} inlineEdit={inlineEdit} setInlineEdit={setInlineEdit} onSave={handleInlineSave} className="text-foreground/50 font-mono text-[11px]" />
                              </td>
                              <td className="px-4 py-2.5 text-foreground/50 tabular-nums">
                                <InlineCell id={c.id} field="ordre_affichage" value={String(c.ordre_affichage ?? 0)} inputType="number" inlineEdit={inlineEdit} setInlineEdit={setInlineEdit} onSave={handleInlineSave} className="text-foreground/50 tabular-nums w-16" />
                              </td>
                              <td className="px-4 py-2.5">
                                <InlineCell
                                  id={c.id}
                                  field="taux_reduction"
                                  value={c.taux_reduction || '0'}
                                  inputType="number"
                                  inlineEdit={inlineEdit}
                                  setInlineEdit={setInlineEdit}
                                  onSave={handleInlineSave}
                                  display={
                                    c.taux_reduction && parseFloat(c.taux_reduction) > 0 ? (
                                      <span className="inline-flex items-center rounded-full bg-gold/10 px-2 py-0.5 text-[11px] font-semibold text-gold ring-1 ring-inset ring-gold/20 tabular-nums">
                                        -{c.taux_reduction}%
                                      </span>
                                    ) : (
                                      <span className="text-foreground/25">—</span>
                                    )
                                  }
                                />
                              </td>
                              <td className="max-w-[180px] px-4 py-2.5 text-[11px] text-foreground/45">
                                {formatPromotionPeriod(c.date_debut, c.date_fin) || '—'}
                              </td>
                            </>
                          )}
                          {activeTab === 'accessory_categories' && (
                            <>
                              <td className="whitespace-nowrap px-4 py-2.5">
                                <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
                                  {c.icone ? (
                                    <AppImage src={c.icone} alt={c.nom || t('col_icon')} fill className="object-cover" />
                                  ) : (
                                    <Gem size={14} className="text-foreground/25" />
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2.5 font-medium text-foreground">
                                <InlineCell id={c.id} field="nom" value={c.nom || ''} inlineEdit={inlineEdit} setInlineEdit={setInlineEdit} onSave={handleInlineSave} className="font-medium text-foreground" />
                              </td>
                              <td className="max-w-[200px] truncate px-4 py-2.5 text-foreground/50">
                                <InlineCell id={c.id} field="description" value={c.description || ''} inlineEdit={inlineEdit} setInlineEdit={setInlineEdit} onSave={handleInlineSave} className="text-foreground/50" />
                              </td>
                              <td className="px-4 py-2.5">
                                <InlineCell
                                  id={c.id}
                                  field="taux_reduction"
                                  value={c.taux_reduction || '0'}
                                  inputType="number"
                                  inlineEdit={inlineEdit}
                                  setInlineEdit={setInlineEdit}
                                  onSave={handleInlineSave}
                                  display={
                                    c.taux_reduction && parseFloat(c.taux_reduction) > 0 ? (
                                      <span className="inline-flex items-center rounded-full bg-gold/10 px-2 py-0.5 text-[11px] font-semibold text-gold ring-1 ring-inset ring-gold/20 tabular-nums">
                                        -{c.taux_reduction}%
                                      </span>
                                    ) : (
                                      <span className="text-foreground/25">—</span>
                                    )
                                  }
                                />
                              </td>
                              <td className="max-w-[180px] px-4 py-2.5 text-[11px] text-foreground/45">
                                {formatPromotionPeriod(c.date_debut, c.date_fin) || '—'}
                              </td>
                            </>
                          )}
                          {activeTab === 'bottle_types' && (
                            <>
                              <td className="px-4 py-2.5 font-medium text-foreground">
                                <InlineCell id={c.id} field="nom" value={c.nom || ''} inlineEdit={inlineEdit} setInlineEdit={setInlineEdit} onSave={handleInlineSave} className="font-medium text-foreground" />
                              </td>
                              <td className="px-4 py-2.5 text-foreground/50">
                                <InlineCell id={c.id} field="description" value={c.description || ''} inlineEdit={inlineEdit} setInlineEdit={setInlineEdit} onSave={handleInlineSave} className="text-foreground/50" />
                              </td>
                            </>
                          )}
                          <td className="px-4 py-2.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(c)}
                                title={t('edit')}
                                className="rounded-md p-1.5 text-foreground/45 transition-colors hover:text-gold"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(c.id)}
                                title={t('delete')}
                                className="rounded-md p-1.5 text-foreground/45 transition-colors hover:text-red-400"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={colSpan} className="py-12 text-center text-sm italic text-foreground/30">
                            {t('no_results')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View: Cards */}
                <div className="grid grid-cols-1 gap-3 md:hidden">
                  {filtered.map(c => (
                    <div key={c.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {activeTab !== 'bottle_types' && (
                            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
                              {c.image || c.icone ? (
                                <AppImage src={c.image || c.icone} alt={c.nom || t('col_icon')} fill className="object-cover" />
                              ) : activeTab === 'perfume_categories' ? (
                                <PerfumeIcon size={15} className="text-foreground/25" />
                              ) : (
                                <Gem size={15} className="text-foreground/25" />
                              )}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="text-xs font-semibold text-foreground truncate">
                              <InlineCell id={c.id} field="nom" value={c.nom || ''} inlineEdit={inlineEdit} setInlineEdit={setInlineEdit} onSave={handleInlineSave} className="font-semibold text-foreground" />
                            </h3>
                            {c.slug && (
                              <p className="text-[11px] text-foreground/40 truncate">
                                <InlineCell id={c.id} field="slug" value={c.slug || ''} inlineEdit={inlineEdit} setInlineEdit={setInlineEdit} onSave={handleInlineSave} className="text-foreground/40 font-mono text-[11px]" />
                              </p>
                            )}
                          </div>
                        </div>

                        {c.taux_reduction && parseFloat(c.taux_reduction) > 0 && (
                          <span className="shrink-0 inline-flex items-center rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold ring-1 ring-inset ring-gold/20 tabular-nums">
                            -{c.taux_reduction}%
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 border-t border-white/5 pt-2 text-[11px]">
                        {activeTab === 'perfume_categories' && (
                          <div className="flex justify-between text-foreground/60">
                            <span className="text-foreground/40">{t('col_order')}:</span>
                            <InlineCell id={c.id} field="ordre_affichage" value={String(c.ordre_affichage ?? 0)} inputType="number" inlineEdit={inlineEdit} setInlineEdit={setInlineEdit} onSave={handleInlineSave} className="font-medium text-foreground tabular-nums" />
                          </div>
                        )}
                        {(activeTab === 'accessory_categories' || activeTab === 'bottle_types') && (
                          <div className="text-foreground/60">
                            <span className="block text-[10px] font-semibold uppercase text-foreground/40">{t('col_description')}:</span>
                            <InlineCell id={c.id} field="description" value={c.description || ''} inlineEdit={inlineEdit} setInlineEdit={setInlineEdit} onSave={handleInlineSave} className="text-foreground/70 line-clamp-2" />
                          </div>
                        )}
                        {activeTab !== 'bottle_types' && formatPromotionPeriod(c.date_debut, c.date_fin) && (
                          <div className="flex justify-between text-foreground/60">
                            <span className="text-foreground/40">{t('col_promo_period')}:</span>
                            <span className="text-foreground/70">{formatPromotionPeriod(c.date_debut, c.date_fin)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-2">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-foreground/70 hover:text-gold transition-colors"
                        >
                          <Edit2 size={12} />
                          <span>{t('edit')}</span>
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={12} />
                          <span>{t('delete')}</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {filtered.length === 0 && (
                    <div className="py-12 text-center text-sm italic text-foreground/30">
                      {t('no_results')}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      <SlideOver
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalTitle}
        description={t('modal_description')}
        size="xl"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-foreground/60 transition-colors hover:bg-white/5"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-gold/85 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 size={13} className="animate-spin" /> : null}
              {isSaving ? t('saving') : t('save')}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormSection title={t('section_general')} icon={Tag}>
            <Field label={t('field_name')} required error={formErrors.nom}>
              <input
                data-field="nom"
                value={form.nom}
                onChange={e => updateForm('nom', e.target.value)}
                className={inputClassName}
              />
            </Field>

            {activeTab === 'perfume_categories' && (
              <>
                <Field label={t('field_slug')} required error={formErrors.slug}>
                  <input
                    data-field="slug"
                    value={form.slug}
                    onChange={e => updateForm('slug', e.target.value)}
                    className={inputClassName}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label={t('field_order')} required error={formErrors.ordre_affichage}>
                    <input
                      data-field="ordre_affichage"
                      type="number"
                      value={form.ordre_affichage}
                      onChange={e => updateForm('ordre_affichage', Number(e.target.value))}
                      className={inputClassName}
                    />
                  </Field>
                  <Field label={t('field_discount')} error={formErrors.taux_reduction}>
                    <input
                      data-field="taux_reduction"
                      value={form.taux_reduction}
                      onChange={e => updateForm('taux_reduction', e.target.value)}
                      className={inputClassName}
                    />
                  </Field>
                </div>
              </>
            )}

            {(activeTab === 'accessory_categories' || activeTab === 'bottle_types') && (
              <Field
                label={t('field_description')}
                required={activeTab === 'accessory_categories' || activeTab === 'bottle_types'}
                error={formErrors.description}
              >
                <textarea
                  data-field="description"
                  value={form.description}
                  onChange={e => updateForm('description', e.target.value)}
                  placeholder={t('placeholder_description')}
                  rows={2}
                  className={cx(inputClassName, 'resize-none')}
                />
              </Field>
            )}

            {activeTab === 'accessory_categories' && (
              <Field label={t('field_discount')} error={formErrors.taux_reduction}>
                <input
                  data-field="taux_reduction"
                  value={form.taux_reduction}
                  onChange={e => updateForm('taux_reduction', e.target.value)}
                  className={inputClassName}
                />
              </Field>
            )}
          </FormSection>

          {(activeTab === 'perfume_categories' || activeTab === 'accessory_categories') && (
            <FormSection title={t('section_promotion')} icon={Calendar}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={t('field_start_date')} error={formErrors.date_debut}>
                  <input
                    data-field="date_debut"
                    type="datetime-local"
                    value={form.date_debut}
                    onChange={e => updateForm('date_debut', e.target.value)}
                    className={inputClassName}
                  />
                </Field>
                <Field label={t('field_end_date')} error={formErrors.date_fin}>
                  <input
                    data-field="date_fin"
                    type="datetime-local"
                    value={form.date_fin}
                    onChange={e => updateForm('date_fin', e.target.value)}
                    className={inputClassName}
                  />
                </Field>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    updateForm('date_debut', '');
                    updateForm('date_fin', '');
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/60 transition-colors hover:border-white/20 hover:bg-white/[0.05] hover:text-foreground/80"
                >
                  {t('btn_reset_dates')}
                </button>
              </div>
              <Field label={t('field_promo_msg')} error={formErrors.message_promotion}>
                <input
                  data-field="message_promotion"
                  value={form.message_promotion}
                  onChange={e => updateForm('message_promotion', e.target.value)}
                  className={inputClassName}
                />
              </Field>
            </FormSection>
          )}

          {activeTab !== 'bottle_types' && (
            <FormSection title={t('section_visual')} icon={ImageIcon}>
              <CompactIconUpload
                onFileSelect={setIconFile}
                initialImage={editingItem?.icone}
                label={
                  activeTab === 'perfume_categories'
                    ? t('field_category_icon')
                    : t('field_type_icon')
                }
              />
              <label className="flex items-center gap-2.5 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={form.actif}
                  onChange={e => updateForm('actif', e.target.checked)}
                  className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold h-4 w-4"
                />
                <span className="text-xs text-foreground/70 font-medium">{t('field_active')}</span>
              </label>
            </FormSection>
          )}

          {formError && (
            <p className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-lg text-center mt-4">
              {formError}
            </p>
          )}
        </div>
      </SlideOver>
    </>
  );
}