'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Edit2, Trash2, Plus, Search, Gem, FlaskConical, Tag, Calendar, Image as ImageIcon, CheckCircle2, XCircle } from 'lucide-react';
import { PerfumeIcon } from '@/components/icons/CustomIcons';
import { shopService, adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import AppImage from '@/components/ui/AppImage';
import CompactIconUpload from '@/components/admin/CompactIconUpload';
import { SlideOver } from '@/components/ui/SlideOver';
import { fromDatetimeLocalValue, formatPromotionPeriod, toDatetimeLocalValue } from '@/lib/promotionUtils';
import { extractApiError } from '@/lib/apiError';

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

function StatusChip({ active }: { active: boolean }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset',
        active
          ? 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20'
          : 'text-foreground/40 bg-white/[0.03] ring-white/10'
      )}
    >
      <span
        className={cx(
          'h-1.5 w-1.5 rounded-full',
          active ? 'bg-emerald-400' : 'bg-foreground/40'
        )}
      />
      {active ? 'Actif' : 'Inactif'}
    </span>
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
      addToast('Erreur lors du chargement des données', 'error');
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
    // Validate all fields
    const errors: Record<string, string> = {};

    // Validate based on active tab
    if (activeTab === 'perfume_categories' || activeTab === 'accessory_categories') {
      if (!form.nom.trim()) errors.nom = 'Le nom est requis';
      if (!form.slug.trim()) errors.slug = 'Le slug est requis';
      if (form.ordre_affichage === undefined || form.ordre_affichage === null)
        errors.ordre_affichage = "L'ordre d'affichage est requis";
      else if (isNaN(Number(form.ordre_affichage)) || Number(form.ordre_affichage) < 0)
        errors.ordre_affichage = "L'ordre d'affichage doit être un nombre positif";
      if (!form.taux_reduction) errors.taux_reduction = 'Le taux de réduction est requis';
      else if (
        isNaN(Number(form.taux_reduction)) ||
        Number(form.taux_reduction) < 0 ||
        Number(form.taux_reduction) > 100
      )
        errors.taux_reduction = 'Le taux de réduction doit être entre 0 et 100';
      if (!form.message_promotion) errors.message_promotion = 'Le message de promotion est requis';
    }

    // Date validation (only for perfume and accessory categories)
    if (activeTab === 'perfume_categories' || activeTab === 'accessory_categories') {
      if (!form.date_debut) errors.date_debut = 'La date de début est requise';
      if (!form.date_fin) errors.date_fin = 'La date de fin est requise';
      else if (form.date_debut && form.date_fin && new Date(form.date_fin) < new Date(form.date_debut)) {
        errors.date_fin = 'La date de fin doit être après la date de début';
      }
    }

    // Description validation (only for accessory and bottle types)
    if (activeTab === 'accessory_categories' || activeTab === 'bottle_types') {
      if (!form.description.trim()) errors.description = 'La description est requise';
    }

    // Set errors and focus first invalid field if any
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

    // No errors, proceed with save
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
          addToast('Catégorie parfum mise à jour', 'success');
        } else {
          await adminService.postFormData('shop/categories-parfum/', formData);
          addToast('Catégorie parfum créée', 'success');
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
          addToast('Type accessoire mis à jour', 'success');
        } else {
          await adminService.postFormData('shop/types-accessoire/', formData);
          addToast('Type accessoire créé', 'success');
        }
      } else if (activeTab === 'bottle_types') {
        const payload = { nom: form.nom, description: form.description };
        if (editingItem) {
          await shopService.updateBottleType(editingItem.id, payload);
          addToast('Type flacon mis à jour', 'success');
        } else {
          await shopService.createBottleType(payload);
          addToast('Type flacon créé', 'success');
        }
      }

      setShowModal(false);
      fetchItems();
    } catch (error: any) {
      setFormError(extractApiError(error, 'Erreur lors de la sauvegarde'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;
    try {
      if (activeTab === 'perfume_categories') {
        await shopService.deletePerfumeCategory(id);
      } else if (activeTab === 'accessory_categories') {
        await shopService.deleteAccessoryType(id);
      } else if (activeTab === 'bottle_types') {
        await shopService.deleteBottleType(id);
      }
      addToast('Élément supprimé', 'success');
      fetchItems();
    } catch {
      addToast('Erreur lors de la suppression', 'error');
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
      ? 'Modifier la catégorie'
      : activeTab === 'accessory_categories'
      ? 'Modifier le type'
      : 'Modifier le flacon'
    : activeTab === 'perfume_categories'
    ? 'Nouvelle catégorie parfum'
    : activeTab === 'accessory_categories'
    ? 'Nouveau type accessoire'
    : 'Nouveau type flacon';

  return (
    <>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Classifications & catégories</h1>
            <p className="mt-0.5 text-sm text-foreground/40">
              Types d'accessoires, flacons et catégories de parfums
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-3.5 py-2 text-xs font-semibold text-black transition-colors hover:bg-gold/85 sm:w-auto"
          >
            <Plus size={14} />
            <span>Ajouter</span>
          </button>
        </div>

        {/* Tabs & Content Wrapper */}
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
          {/* Section Navigation Tabs */}
          <div className="flex overflow-x-auto border-b border-white/10 bg-white/[0.02]">
            <TabButton
              active={activeTab === 'perfume_categories'}
              onClick={() => setActiveTab('perfume_categories')}
              icon={<PerfumeIcon size={14} />}
              label="Catégories parfums"
            />
            <TabButton
              active={activeTab === 'accessory_categories'}
              onClick={() => setActiveTab('accessory_categories')}
              icon={<Gem size={14} />}
              label="Catégories accessoires"
            />
            <TabButton
              active={activeTab === 'bottle_types'}
              onClick={() => setActiveTab('bottle_types')}
              icon={<FlaskConical size={14} />}
              label="Types flacons"
            />
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            {/* Toolbar / Search */}
            <div className="flex w-full sm:max-w-xs items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
              <Search size={14} className="shrink-0 text-foreground/35" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-foreground/35"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-foreground/40">
                <Loader2 className="animate-spin text-gold" size={18} />
                <span className="text-xs">Chargement…</span>
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
                              Icône
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              Nom
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              Slug
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              Ordre
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              Réduction
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              Période promo
                            </th>
                          </>
                        )}
                        {activeTab === 'accessory_categories' && (
                          <>
                            <th className="w-14 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              Icône
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              Nom
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              Description
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              Réduction
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              Période promo
                            </th>
                          </>
                        )}
                        {activeTab === 'bottle_types' && (
                          <>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              Nom
                            </th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                              Description
                            </th>
                          </>
                        )}
                        <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                          Actions
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
                                    <AppImage src={c.image || c.icone} alt={c.nom || 'Icône'} fill className="object-cover" />
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
                                    <AppImage src={c.icone} alt={c.nom || 'Icône'} fill className="object-cover" />
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
                                title="Modifier"
                                className="rounded-md p-1.5 text-foreground/45 transition-colors hover:text-gold"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(c.id)}
                                title="Supprimer"
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
                            Aucun résultat
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
                                <AppImage src={c.image || c.icone} alt={c.nom || 'Icône'} fill className="object-cover" />
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
                            <span className="text-foreground/40">Ordre d'affichage:</span>
                            <span className="font-medium text-foreground tabular-nums">{c.ordre_affichage}</span>
                          </div>
                        )}
                        {(activeTab === 'accessory_categories' || activeTab === 'bottle_types') && c.description && (
                          <div className="text-foreground/60">
                            <span className="block text-[10px] font-semibold uppercase text-foreground/40">Description:</span>
                            <p className="line-clamp-2 text-foreground/70">{c.description}</p>
                          </div>
                        )}
                        {activeTab !== 'bottle_types' && formatPromotionPeriod(c.date_debut, c.date_fin) && (
                          <div className="flex justify-between text-foreground/60">
                            <span className="text-foreground/40">Promotion:</span>
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
                          <span>Modifier</span>
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={12} />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {filtered.length === 0 && (
                    <div className="py-12 text-center text-sm italic text-foreground/30">
                      Aucun résultat
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
        description="Renseignez les informations requises pour cette classification."
        size="xl"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-foreground/60 transition-colors hover:bg-white/5"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="flex-1 rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-gold/85"
            >
              Enregistrer
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormSection title="Informations générales" icon={Tag}>
            <Field label="Nom" required error={formErrors.nom}>
              <input
                data-field="nom"
                value={form.nom}
                onChange={e => updateForm('nom', e.target.value)}
                className={inputClassName}
              />
            </Field>

            {activeTab === 'perfume_categories' && (
              <>
                <Field label="Slug" required error={formErrors.slug}>
                  <input
                    data-field="slug"
                    value={form.slug}
                    onChange={e => updateForm('slug', e.target.value)}
                    className={inputClassName}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Ordre d'affichage" required error={formErrors.ordre_affichage}>
                    <input
                      data-field="ordre_affichage"
                      type="number"
                      value={form.ordre_affichage}
                      onChange={e => updateForm('ordre_affichage', Number(e.target.value))}
                      className={inputClassName}
                    />
                  </Field>
                  <Field label="Réduction (%)" required error={formErrors.taux_reduction}>
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
                label="Description"
                required={activeTab === 'accessory_categories' || activeTab === 'bottle_types'}
                error={formErrors.description}
              >
                <textarea
                  data-field="description"
                  value={form.description}
                  onChange={e => updateForm('description', e.target.value)}
                  placeholder="Description..."
                  rows={2}
                  className={cx(inputClassName, 'resize-none')}
                />
              </Field>
            )}

            {activeTab === 'accessory_categories' && (
              <Field label="Taux réduction (%)" required error={formErrors.taux_reduction}>
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
            <FormSection title="Configuration promotion" icon={Calendar}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Date début" required error={formErrors.date_debut}>
                  <input
                    data-field="date_debut"
                    type="datetime-local"
                    value={form.date_debut}
                    onChange={e => updateForm('date_debut', e.target.value)}
                    className={inputClassName}
                  />
                </Field>
                <Field label="Date fin" required error={formErrors.date_fin}>
                  <input
                    data-field="date_fin"
                    type="datetime-local"
                    value={form.date_fin}
                    onChange={e => updateForm('date_fin', e.target.value)}
                    className={inputClassName}
                  />
                </Field>
              </div>
              <Field label="Message promotion" required error={formErrors.message_promotion}>
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
            <FormSection title="Visuel & Statut" icon={ImageIcon}>
              <CompactIconUpload
                onFileSelect={setIconFile}
                initialImage={editingItem?.icone}
                label={
                  activeTab === 'perfume_categories'
                    ? 'Image / Icône de la catégorie'
                    : 'Icône du type'
                }
              />
              <label className="flex items-center gap-2.5 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={form.actif}
                  onChange={e => updateForm('actif', e.target.checked)}
                  className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold h-4 w-4"
                />
                <span className="text-xs text-foreground/70 font-medium">Actif</span>
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