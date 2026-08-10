'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Edit2, Trash2, Plus, Search, Gem, FlaskConical, Tag, Calendar, Image as ImageIcon } from 'lucide-react';
import { PerfumeIcon } from '@/components/icons/CustomIcons';
import { shopService, adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import AppImage from '@/components/ui/AppImage';
import CompactIconUpload from '@/components/admin/CompactIconUpload';
import { SlideOver } from '@/components/ui/SlideOver';
import { fromDatetimeLocalValue, formatPromotionPeriod, toDatetimeLocalValue } from '@/lib/promotionUtils';
import { extractApiError } from '@/lib/apiError';

/* -------------------------------------------------------------------------- */
/* Inline Translations Dictionary                                              */
/* -------------------------------------------------------------------------- */

type Language = 'fr' | 'en';

const dictionary = {
  fr: {
    common: {
      add: 'Ajouter',
      edit: 'Modifier',
      delete: 'Supprimer',
      save: 'Enregistrer',
      cancel: 'Annuler',
      loading: 'Chargement…',
    },
    categories: {
      title: 'Classifications & catégories',
      subtitle: "Types d'accessoires, flacons et catégories de parfums",
      search_placeholder: 'Rechercher…',
      no_results: 'Aucun résultat',
      tabs: {
        perfume_categories: 'Catégories parfums',
        accessory_categories: 'Catégories accessoires',
        bottle_types: 'Types flacons',
      },
      table: {
        icon: 'Icône',
        name: 'Nom',
        slug: 'Slug',
        display_order: 'Ordre',
        discount: 'Réduction',
        description: 'Description',
        promo_period: 'Période promo',
        actions: 'Actions',
      },
      sections: {
        general: 'Informations générales',
        promotion: 'Configuration promotion',
        visual_status: 'Visuel & Statut',
      },
      form: {
        name: 'Nom',
        slug: 'Slug',
        display_order: "Ordre d'affichage",
        discount_rate: 'Réduction (%)',
        description: 'Description',
        start_date: 'Date début',
        end_date: 'Date fin',
        promo_message: 'Message promotion',
        category_icon: "Image / Icône de la catégorie",
        type_icon: 'Icône du type',
        active: 'Actif',
      },
      placeholders: {
        description: 'Description...',
      },
      errors: {
        name_required: 'Le nom est requis',
        slug_required: 'Le slug est requis',
        display_order_required: "L'ordre d'affichage est requis",
        display_order_positive: "L'ordre d'affichage doit être un nombre positif",
        discount_rate_required: 'Le taux de réduction est requis',
        discount_rate_range: 'Le taux de réduction doit être entre 0 et 100',
        promo_message_required: 'Le message de promotion est requis',
        start_date_required: 'La date de début est requise',
        end_date_required: 'La date de fin est requise',
        end_date_after_start: 'La date de fin doit être après la date de début',
        description_required: 'La description est requise',
      },
      toasts: {
        load_error: 'Erreur lors du chargement des données',
        perfume_category_created: 'Catégorie parfum créée',
        perfume_category_updated: 'Catégorie parfum mise à jour',
        accessory_type_created: 'Type accessoire créé',
        accessory_type_updated: 'Type accessoire mis à jour',
        bottle_type_created: 'Type flacon créé',
        bottle_type_updated: 'Type flacon mis à jour',
        save_error: 'Erreur lors de la sauvegarde',
        delete_success: 'Élément supprimé',
        delete_error: 'Erreur lors de la suppression',
      },
      confirmations: {
        delete_item: 'Êtes-vous sûr de vouloir supprimer cet élément ?',
      },
      modal: {
        description: 'Renseignez les informations requises pour cette classification.',
        add_perfume_category: 'Nouvelle catégorie parfum',
        edit_perfume_category: 'Modifier la catégorie',
        add_accessory_type: 'Nouveau type accessoire',
        edit_accessory_type: 'Modifier le type',
        add_bottle_type: 'Nouveau type flacon',
        edit_bottle_type: 'Modifier le flacon',
      },
    },
  },
  en: {
    common: {
      add: 'Add',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      loading: 'Loading…',
    },
    categories: {
      title: 'Classifications & Categories',
      subtitle: 'Accessory types, bottles, and perfume categories',
      search_placeholder: 'Search…',
      no_results: 'No results found',
      tabs: {
        perfume_categories: 'Perfume Categories',
        accessory_categories: 'Accessory Categories',
        bottle_types: 'Bottle Types',
      },
      table: {
        icon: 'Icon',
        name: 'Name',
        slug: 'Slug',
        display_order: 'Order',
        discount: 'Discount',
        description: 'Description',
        promo_period: 'Promo Period',
        actions: 'Actions',
      },
      sections: {
        general: 'General Information',
        promotion: 'Promotion Setup',
        visual_status: 'Visual & Status',
      },
      form: {
        name: 'Name',
        slug: 'Slug',
        display_order: 'Display Order',
        discount_rate: 'Discount Rate (%)',
        description: 'Description',
        start_date: 'Start Date',
        end_date: 'End Date',
        promo_message: 'Promo Message',
        category_icon: 'Category Image / Icon',
        type_icon: 'Type Icon',
        active: 'Active',
      },
      placeholders: {
        description: 'Description...',
      },
      errors: {
        name_required: 'Name is required',
        slug_required: 'Slug is required',
        display_order_required: 'Display order is required',
        display_order_positive: 'Display order must be a positive number',
        discount_rate_required: 'Discount rate is required',
        discount_rate_range: 'Discount rate must be between 0 and 100',
        promo_message_required: 'Promo message is required',
        start_date_required: 'Start date is required',
        end_date_required: 'End date is required',
        end_date_after_start: 'End date must be after start date',
        description_required: 'Description is required',
      },
      toasts: {
        load_error: 'Error loading data',
        perfume_category_created: 'Perfume category created',
        perfume_category_updated: 'Perfume category updated',
        accessory_type_created: 'Accessory type created',
        accessory_type_updated: 'Accessory type updated',
        bottle_type_created: 'Bottle type created',
        bottle_type_updated: 'Bottle type updated',
        save_error: 'Error saving item',
        delete_success: 'Item deleted',
        delete_error: 'Error deleting item',
      },
      confirmations: {
        delete_item: 'Are you sure you want to delete this item?',
      },
      modal: {
        description: 'Provide the required information for this classification.',
        add_perfume_category: 'New Perfume Category',
        edit_perfume_category: 'Edit Category',
        add_accessory_type: 'New Accessory Type',
        edit_accessory_type: 'Edit Type',
        add_bottle_type: 'New Bottle Type',
        edit_bottle_type: 'Edit Bottle Type',
      },
    },
  },
};

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
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

export default function CategoriesAdminPage() {
  const [lang, setLang] = useState<Language>('fr');
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

  const { addToast } = useToastStore();

  const t = useCallback((path: string): string => {
    const keys = path.split('.');
    let current: any = dictionary[lang];
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        return path;
      }
    }
    return typeof current === 'string' ? current : path;
  }, [lang]);

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
      addToast(t('categories.toasts.load_error'), 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, addToast, t]);

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
      if (!form.nom.trim()) errors.nom = t('categories.errors.name_required');
      if (!form.slug.trim()) errors.slug = t('categories.errors.slug_required');
      if (form.ordre_affichage === undefined || form.ordre_affichage === null)
        errors.ordre_affichage = t('categories.errors.display_order_required');
      else if (isNaN(Number(form.ordre_affichage)) || Number(form.ordre_affichage) < 0)
        errors.ordre_affichage = t('categories.errors.display_order_positive');
      if (!form.taux_reduction) errors.taux_reduction = t('categories.errors.discount_rate_required');
      else if (
        isNaN(Number(form.taux_reduction)) ||
        Number(form.taux_reduction) < 0 ||
        Number(form.taux_reduction) > 100
      )
        errors.taux_reduction = t('categories.errors.discount_rate_range');
      if (!form.message_promotion) errors.message_promotion = t('categories.errors.promo_message_required');
    }

    if (activeTab === 'perfume_categories' || activeTab === 'accessory_categories') {
      if (!form.date_debut) errors.date_debut = t('categories.errors.start_date_required');
      if (!form.date_fin) errors.date_fin = t('categories.errors.end_date_required');
      else if (form.date_debut && form.date_fin && new Date(form.date_fin) < new Date(form.date_debut)) {
        errors.date_fin = t('categories.errors.end_date_after_start');
      }
    }

    if (activeTab === 'accessory_categories' || activeTab === 'bottle_types') {
      if (!form.description.trim()) errors.description = t('categories.errors.description_required');
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
          addToast(t('categories.toasts.perfume_category_updated'), 'success');
        } else {
          await adminService.postFormData('shop/categories-parfum/', formData);
          addToast(t('categories.toasts.perfume_category_created'), 'success');
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
          addToast(t('categories.toasts.accessory_type_updated'), 'success');
        } else {
          await adminService.postFormData('shop/types-accessoire/', formData);
          addToast(t('categories.toasts.accessory_type_created'), 'success');
        }
      } else if (activeTab === 'bottle_types') {
        const payload = { nom: form.nom, description: form.description };
        if (editingItem) {
          await shopService.updateBottleType(editingItem.id, payload);
          addToast(t('categories.toasts.bottle_type_updated'), 'success');
        } else {
          await shopService.createBottleType(payload);
          addToast(t('categories.toasts.bottle_type_created'), 'success');
        }
      }

      setShowModal(false);
      fetchItems();
    } catch (error: any) {
      setFormError(extractApiError(error, t('categories.toasts.save_error')));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('categories.confirmations.delete_item'))) return;
    try {
      if (activeTab === 'perfume_categories') {
        await shopService.deletePerfumeCategory(id);
      } else if (activeTab === 'accessory_categories') {
        await shopService.deleteAccessoryType(id);
      } else if (activeTab === 'bottle_types') {
        await shopService.deleteBottleType(id);
      }
      addToast(t('categories.toasts.delete_success'), 'success');
      fetchItems();
    } catch {
      addToast(t('categories.toasts.delete_error'), 'error');
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
      ? t('categories.modal.edit_perfume_category')
      : activeTab === 'accessory_categories'
      ? t('categories.modal.edit_accessory_type')
      : t('categories.modal.edit_bottle_type')
    : activeTab === 'perfume_categories'
    ? t('categories.modal.add_perfume_category')
    : activeTab === 'accessory_categories'
    ? t('categories.modal.add_accessory_type')
    : t('categories.modal.add_bottle_type');

  return (
    <>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t('categories.title')}</h1>
            <p className="mt-0.5 text-sm text-foreground/40">
              {t('categories.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(l => (l === 'fr' ? 'en' : 'fr'))}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold uppercase text-gold transition-colors hover:bg-white/10"
            >
              {lang === 'fr' ? 'EN' : 'FR'}
            </button>
            <button
              onClick={handleOpenAdd}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-3.5 py-2 text-xs font-semibold text-black transition-colors hover:bg-gold/85 sm:w-auto"
            >
              <Plus size={14} />
              <span>{t('common.add')}</span>
            </button>
          </div>
        </div>

        {/* Tabs & Content Wrapper */}
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
          {/* Section Navigation Tabs */}
          <div className="flex overflow-x-auto border-b border-white/10 bg-white/[0.02]">
            <TabButton
              active={activeTab === 'perfume_categories'}
              onClick={() => setActiveTab('perfume_categories')}
              icon={<PerfumeIcon size={14} />}
              label={t('categories.tabs.perfume_categories')}
            />
            <TabButton
              active={activeTab === 'accessory_categories'}
              onClick={() => setActiveTab('accessory_categories')}
              icon={<Gem size={14} />}
              label={t('categories.tabs.accessory_categories')}
            />
            <TabButton
              active={activeTab === 'bottle_types'}
              onClick={() => setActiveTab('bottle_types')}
              icon={<FlaskConical size={14} />}
              label={t('categories.tabs.bottle_types')}
            />
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            {/* Toolbar / Search */}
            <div className="flex w-full sm:max-w-xs items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
              <Search size={14} className="shrink-0 text-foreground/35" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('categories.search_placeholder')}
                className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-foreground/35"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-foreground/40">
                <Loader2 className="animate-spin text-gold" size={18} />
                <span className="text-xs">{t('common.loading')}</span>
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
                              {t('categories.table.icon')}
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              {t('categories.table.name')}
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              {t('categories.table.slug')}
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              {t('categories.table.display_order')}
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              {t('categories.table.discount')}
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              {t('categories.table.promo_period')}
                            </th>
                          </>
                        )}
                        {activeTab === 'accessory_categories' && (
                          <>
                            <th className="w-14 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              {t('categories.table.icon')}
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              {t('categories.table.name')}
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              {t('categories.table.description')}
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              {t('categories.table.discount')}
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              {t('categories.table.promo_period')}
                            </th>
                          </>
                        )}
                        {activeTab === 'bottle_types' && (
                          <>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              {t('categories.table.name')}
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              {t('categories.table.description')}
                            </th>
                          </>
                        )}
                        <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                          {t('categories.table.actions')}
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
                                    <AppImage src={c.image || c.icone} alt={c.nom || t('categories.table.icon')} fill className="object-cover" />
                                  ) : (
                                    <PerfumeIcon size={14} className="text-foreground/25" />
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2.5 font-medium text-foreground">{c.nom}</td>
                              <td className="px-4 py-2.5 text-foreground/50">{c.slug}</td>
                              <td className="px-4 py-2.5 text-foreground/50 tabular-nums">{c.ordre_affichage}</td>
                              <td className="px-4 py-2.5">
                                {c.taux_reduction && parseFloat(c.taux_reduction) > 0 ? (
                                  <span className="inline-flex items-center rounded-full bg-gold/10 px-2 py-0.5 text-[11px] font-semibold text-gold ring-1 ring-inset ring-gold/20 tabular-nums">
                                    -{c.taux_reduction}%
                                  </span>
                                ) : (
                                  <span className="text-foreground/25">—</span>
                                )}
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
                                    <AppImage src={c.icone} alt={c.nom || t('categories.table.icon')} fill className="object-cover" />
                                  ) : (
                                    <Gem size={14} className="text-foreground/25" />
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2.5 font-medium text-foreground">{c.nom}</td>
                              <td className="max-w-[200px] truncate px-4 py-2.5 text-foreground/50">{c.description || '—'}</td>
                              <td className="px-4 py-2.5">
                                {c.taux_reduction && parseFloat(c.taux_reduction) > 0 ? (
                                  <span className="inline-flex items-center rounded-full bg-gold/10 px-2 py-0.5 text-[11px] font-semibold text-gold ring-1 ring-inset ring-gold/20 tabular-nums">
                                    -{c.taux_reduction}%
                                  </span>
                                ) : (
                                  <span className="text-foreground/25">—</span>
                                )}
                              </td>
                              <td className="max-w-[180px] px-4 py-2.5 text-[11px] text-foreground/45">
                                {formatPromotionPeriod(c.date_debut, c.date_fin) || '—'}
                              </td>
                            </>
                          )}
                          {activeTab === 'bottle_types' && (
                            <>
                              <td className="px-4 py-2.5 font-medium text-foreground">{c.nom}</td>
                              <td className="px-4 py-2.5 text-foreground/50">{c.description || '—'}</td>
                            </>
                          )}
                          <td className="px-4 py-2.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(c)}
                                title={t('common.edit')}
                                className="rounded-md p-1.5 text-foreground/45 transition-colors hover:text-gold"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(c.id)}
                                title={t('common.delete')}
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
                            {t('categories.no_results')}
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
                                <AppImage src={c.image || c.icone} alt={c.nom || t('categories.table.icon')} fill className="object-cover" />
                              ) : activeTab === 'perfume_categories' ? (
                                <PerfumeIcon size={15} className="text-foreground/25" />
                              ) : (
                                <Gem size={15} className="text-foreground/25" />
                              )}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="text-xs font-semibold text-foreground truncate">{c.nom}</h3>
                            {c.slug && <p className="text-[11px] text-foreground/40 truncate">{c.slug}</p>}
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
                            <span className="text-foreground/40">{t('categories.table.display_order')}:</span>
                            <span className="font-medium text-foreground tabular-nums">{c.ordre_affichage}</span>
                          </div>
                        )}
                        {(activeTab === 'accessory_categories' || activeTab === 'bottle_types') && c.description && (
                          <div className="text-foreground/60">
                            <span className="block text-[10px] font-semibold uppercase text-foreground/40">{t('categories.table.description')}:</span>
                            <p className="line-clamp-2 text-foreground/70">{c.description}</p>
                          </div>
                        )}
                        {activeTab !== 'bottle_types' && formatPromotionPeriod(c.date_debut, c.date_fin) && (
                          <div className="flex justify-between text-foreground/60">
                            <span className="text-foreground/40">{t('categories.table.promo_period')}:</span>
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
                          <span>{t('common.edit')}</span>
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={12} />
                          <span>{t('common.delete')}</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {filtered.length === 0 && (
                    <div className="py-12 text-center text-sm italic text-foreground/30">
                      {t('categories.no_results')}
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
        description={t('categories.modal.description')}
        size="xl"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-foreground/60 transition-colors hover:bg-white/5"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-gold/85"
            >
              {t('common.save')}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormSection title={t('categories.sections.general')} icon={Tag}>
            <Field label={t('categories.form.name')} required error={formErrors.nom}>
              <input
                data-field="nom"
                value={form.nom}
                onChange={e => updateForm('nom', e.target.value)}
                className={inputClassName}
              />
            </Field>

            {activeTab === 'perfume_categories' && (
              <>
                <Field label={t('categories.form.slug')} required error={formErrors.slug}>
                  <input
                    data-field="slug"
                    value={form.slug}
                    onChange={e => updateForm('slug', e.target.value)}
                    className={inputClassName}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label={t('categories.form.display_order')} required error={formErrors.ordre_affichage}>
                    <input
                      data-field="ordre_affichage"
                      type="number"
                      value={form.ordre_affichage}
                      onChange={e => updateForm('ordre_affichage', Number(e.target.value))}
                      className={inputClassName}
                    />
                  </Field>
                  <Field label={t('categories.form.discount_rate')} required error={formErrors.taux_reduction}>
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
                label={t('categories.form.description')}
                required={activeTab === 'accessory_categories' || activeTab === 'bottle_types'}
                error={formErrors.description}
              >
                <textarea
                  data-field="description"
                  value={form.description}
                  onChange={e => updateForm('description', e.target.value)}
                  placeholder={t('categories.placeholders.description')}
                  rows={2}
                  className={cx(inputClassName, 'resize-none')}
                />
              </Field>
            )}

            {activeTab === 'accessory_categories' && (
              <Field label={t('categories.form.discount_rate')} required error={formErrors.taux_reduction}>
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
            <FormSection title={t('categories.sections.promotion')} icon={Calendar}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={t('categories.form.start_date')} required error={formErrors.date_debut}>
                  <input
                    data-field="date_debut"
                    type="datetime-local"
                    value={form.date_debut}
                    onChange={e => updateForm('date_debut', e.target.value)}
                    className={inputClassName}
                  />
                </Field>
                <Field label={t('categories.form.end_date')} required error={formErrors.date_fin}>
                  <input
                    data-field="date_fin"
                    type="datetime-local"
                    value={form.date_fin}
                    onChange={e => updateForm('date_fin', e.target.value)}
                    className={inputClassName}
                  />
                </Field>
              </div>
              <Field label={t('categories.form.promo_message')} required error={formErrors.message_promotion}>
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
            <FormSection title={t('categories.sections.visual_status')} icon={ImageIcon}>
              <CompactIconUpload
                onFileSelect={setIconFile}
                initialImage={editingItem?.icone}
                label={
                  activeTab === 'perfume_categories'
                    ? t('categories.form.category_icon')
                    : t('categories.form.type_icon')
                }
              />
              <label className="flex items-center gap-2.5 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={form.actif}
                  onChange={e => updateForm('actif', e.target.checked)}
                  className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold h-4 w-4"
                />
                <span className="text-xs text-foreground/70 font-medium">{t('categories.form.active')}</span>
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