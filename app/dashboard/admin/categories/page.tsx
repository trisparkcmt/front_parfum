'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Edit2, Trash2, Plus, Search, Gem, FlaskConical } from 'lucide-react';
import { PerfumeIcon } from '@/components/icons/CustomIcons';
import { shopService } from '@/services/apiService';
import { adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import AppImage from '@/components/ui/AppImage';
import CompactIconUpload from '@/components/admin/CompactIconUpload';
import { FloatInput } from '@/components/ui/Input';
import { SlideOver } from '@/components/ui/SlideOver';
import { fromDatetimeLocalValue, formatPromotionPeriod, toDatetimeLocalValue } from '@/lib/promotionUtils';
import { extractApiError } from '@/lib/apiError';

type TabKey = 'perfume_categories' | 'accessory_categories' | 'bottle_types';

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function TabButton({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void;
  icon: React.ReactNode; label: string;
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
    </button>
  );
}

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
      if (form.ordre_affichage === undefined || form.ordre_affichage === null) errors.ordre_affichage = "L'ordre d'affichage est requis";
      else if (isNaN(Number(form.ordre_affichage)) || Number(form.ordre_affichage) < 0) errors.ordre_affichage = "L'ordre d'affichage doit être un nombre positif";
      if (!form.taux_reduction) errors.taux_reduction = 'Le taux de réduction est requis';
      else if (isNaN(Number(form.taux_reduction)) || Number(form.taux_reduction) < 0 || Number(form.taux_reduction) > 100) 
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
      // Focus first invalid field
      setTimeout(() => {
        const firstField = Object.keys(errors)[0];
        const el = document.querySelector(`[data-field="${firstField}"]`);
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
          el.focus();
        }
      }, 0);
      return;
    }
    
    // No errors, proceed with save
    try {
      if (activeTab === 'perfume_categories') {
        // Use FormData to support icon image upload
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
        // Use FormData to support icon upload
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

  const filtered = items.filter(c =>
    (c.nom || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.slug || '').toLowerCase().includes(search.toLowerCase())
  );

  // Shared column count for empty state colspan
  const colSpan = activeTab === 'perfume_categories' ? 7 : activeTab === 'accessory_categories' ? 6 : 3;

  const modalTitle = editingItem
    ? (activeTab === 'perfume_categories' ? 'Modifier la catégorie' : activeTab === 'accessory_categories' ? 'Modifier le type' : 'Modifier le flacon')
    : (activeTab === 'perfume_categories' ? 'Nouvelle catégorie parfum' : activeTab === 'accessory_categories' ? 'Nouveau type accessoire' : 'Nouveau type flacon');

  return (
    <>
    <div className="space-y-6">

      {/* Header --------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Classifications & catégories</h1>
          <p className="mt-0.5 text-sm text-foreground/40">Types d'accessoires, flacons et catégories de parfums</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-gold px-3.5 py-2 text-sm font-semibold text-black transition-colors hover:bg-gold/85"
        >
          <Plus size={14} />
          Ajouter
        </button>
      </div>

      {/* Tabs + content ----------------------------------------------------- */}
      <div className="overflow-hidden rounded-xl border border-white/10">
        <div className="flex overflow-x-auto border-b border-white/10 bg-white/[0.02]">
          <TabButton active={activeTab === 'perfume_categories'} onClick={() => setActiveTab('perfume_categories')} icon={<PerfumeIcon size={14} />} label="Catégories parfums" />
          <TabButton active={activeTab === 'accessory_categories'} onClick={() => setActiveTab('accessory_categories')} icon={<Gem size={14} />} label="Catégories accessoires" />
          <TabButton active={activeTab === 'bottle_types'} onClick={() => setActiveTab('bottle_types')} icon={<FlaskConical size={14} />} label="Types flacons" />
        </div>

        <div className="p-5">
          <div className="mb-5 flex max-w-sm items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
            <Search size={14} className="shrink-0 text-foreground/35" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/35"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2.5 py-16 text-foreground/40">
              <Loader2 className="animate-spin text-gold" size={22} />
              <span className="text-xs">Chargement…</span>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    {activeTab === 'perfume_categories' && (
                      <>
                        <th className="w-16 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Icône</th>
                        <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Nom</th>
                        <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Slug</th>
                        <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Ordre</th>
                        <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Réduction</th>
                        <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Période promo</th>
                      </>
                    )}
                    {activeTab === 'accessory_categories' && (
                      <>
                        <th className="w-16 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Icône</th>
                        <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Nom</th>
                        <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Description</th>
                        <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Réduction</th>
                        <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Période promo</th>
                      </>
                    )}
                    {activeTab === 'bottle_types' && (
                      <>
                        <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Nom</th>
                        <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Description</th>
                      </>
                    )}
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map(c => (
                    <tr key={c.id} className="group transition-colors hover:bg-white/[0.02]">
                      {activeTab === 'perfume_categories' && (
                        <>
                          <td className="whitespace-nowrap px-4 py-2.5">
                            <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-white/8 bg-white/[0.03]">
                              {(c.image || c.icone) ? (
                                <AppImage src={c.image || c.icone} alt={c.nom || 'Icône'} fill className="object-cover" />
                              ) : (
                                <PerfumeIcon size={15} className="text-foreground/25" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs font-medium text-foreground">{c.nom}</td>
                          <td className="px-4 py-3 text-xs text-foreground/50">{c.slug}</td>
                          <td className="px-4 py-3 text-xs text-foreground/50">{c.ordre_affichage}</td>
                          <td className="px-4 py-3">
                            {c.taux_reduction && parseFloat(c.taux_reduction) > 0 ? (
                              <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[11px] font-semibold text-gold">-{c.taux_reduction}%</span>
                            ) : (
                              <span className="text-xs text-foreground/25">—</span>
                            )}
                          </td>
                          <td className="max-w-[180px] px-4 py-3 text-[11px] text-foreground/45">
                            {formatPromotionPeriod(c.date_debut, c.date_fin) || '—'}
                          </td>
                        </>
                      )}
                      {activeTab === 'accessory_categories' && (
                        <>
                          <td className="whitespace-nowrap px-4 py-2.5">
                            <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-white/8 bg-white/[0.03]">
                              {c.icone ? (
                                <AppImage src={c.icone} alt={c.nom || 'Icône'} fill className="object-cover" />
                              ) : (
                                <Gem size={15} className="text-foreground/25" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs font-medium text-foreground">{c.nom}</td>
                          <td className="max-w-[200px] truncate px-4 py-3 text-xs text-foreground/50">{c.description || '—'}</td>
                          <td className="px-4 py-3">
                            {c.taux_reduction && parseFloat(c.taux_reduction) > 0 ? (
                              <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[11px] font-semibold text-gold">-{c.taux_reduction}%</span>
                            ) : (
                              <span className="text-xs text-foreground/25">—</span>
                            )}
                          </td>
                          <td className="max-w-[180px] px-4 py-3 text-[11px] text-foreground/45">
                            {formatPromotionPeriod(c.date_debut, c.date_fin) || '—'}
                          </td>
                        </>
                      )}
                      {activeTab === 'bottle_types' && (
                        <>
                          <td className="px-4 py-3 text-xs font-medium text-foreground">{c.nom}</td>
                          <td className="px-4 py-3 text-xs text-foreground/50">{c.description || '—'}</td>
                        </>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleOpenEdit(c)} title="Modifier" className="rounded-md p-1.5 text-foreground/45 transition-colors hover:bg-gold/10 hover:text-gold">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDelete(c.id)} title="Supprimer" className="rounded-md p-1.5 text-foreground/45 transition-colors hover:bg-red-500/10 hover:text-red-400">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={colSpan} className="py-16 text-center text-sm italic text-foreground/30">
                        Aucun résultat
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Add/Edit Modal — untouched, same open system */}
      <SlideOver
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalTitle}
        description="Formulaire complet, sans popup ni défilement gênant."
        size="xl"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-bold hover:bg-gold/80 transition-colors"
            >
              Enregistrer
            </button>
          </div>
        }
      >
        <div className="space-y-4">
<div>
                <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Nom *</label>
                <input
                    data-field="nom"
                    value={form.nom}
                    onChange={e => updateForm('nom', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                />
                {formErrors.nom && <p className="mt-1 text-xs text-red-500">{formErrors.nom}</p>}
            </div>

{activeTab === 'perfume_categories' && (
                    <>
                        <div>
                            <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Slug</label>
                            <input
                                data-field="slug"
                                value={form.slug}
                                onChange={e => updateForm('slug', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Ordre</label>
                                <input
                                    data-field="ordre_affichage"
                                    type="number"
                                    value={form.ordre_affichage}
                                    onChange={e => updateForm('ordre_affichage', Number(e.target.value))}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Réduction (%)</label>
                                <input
                                    data-field="taux_reduction"
                                    value={form.taux_reduction}
                                    onChange={e => updateForm('taux_reduction', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                                />
                            </div>
                        </div>
                        <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 space-y-3">
                            <p className="text-xs font-bold text-gold uppercase tracking-wider">Promotion catégorie</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Date début</label>
                                    <input
                                        data-field="date_debut"
                                        type="datetime-local"
                                        value={form.date_debut}
                                        onChange={e => updateForm('date_debut', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Date fin</label>
                                    <input
                                        data-field="date_fin"
                                        type="datetime-local"
                                        value={form.date_fin}
                                        onChange={e => updateForm('date_fin', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Message promotion</label>
                            <input
                                data-field="message_promotion"
                                value={form.message_promotion}
                                onChange={e => updateForm('message_promotion', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                            />
                        </div>

                  {/* Image/icon upload for perfume category */}
                  <CompactIconUpload
                    onFileSelect={setIconFile}
                    initialImage={editingItem?.icone}
                    label="Image / Icône de la catégorie"
                  />
                </>
              )}

              {(activeTab === 'accessory_categories' || activeTab === 'bottle_types') && (
                <div className="space-y-1.5">
<label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Description</label>
                   <textarea
                     data-field="description"
                     value={form.description}
                     onChange={e => updateForm('description', e.target.value)}
                     placeholder="Description (optionnel)"
                     rows={2}
                     className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-base text-foreground outline-none focus:border-gold resize-none"
                   />
                   {formErrors.description && <p className="mt-1 text-xs text-red-500">{formErrors.description}</p>}
                </div>
              )}

              {activeTab === 'accessory_categories' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Taux réduction (%)</label>
                    <input
                        data-field="taux_reduction"
                        value={form.taux_reduction}
                        onChange={e => updateForm('taux_reduction', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                    />
                    {formErrors.taux_reduction && <p className="mt-1 text-xs text-red-500">{formErrors.taux_reduction}</p>}
                  </div>
                  <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 space-y-3">
                    <p className="text-xs font-bold text-gold uppercase tracking-wider">Promotion type accessoire</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Date début</label>
                        <input
                          type="datetime-local"
                          value={form.date_debut}
                          onChange={e => updateForm('date_debut', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Date fin</label>
                        <input
                          type="datetime-local"
                          value={form.date_fin}
                          onChange={e => updateForm('date_fin', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                        />
                      </div>
                    </div>
<div>
                                    <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Message promotion</label>
                                    <input
                                        data-field="message_promotion"
                                        value={form.message_promotion}
                                        onChange={e => updateForm('message_promotion', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                                    />
                                    {formErrors.message_promotion && <p className="mt-1 text-xs text-red-500">{formErrors.message_promotion}</p>}
                                </div>
                  </div>
                  <CompactIconUpload
                    onFileSelect={setIconFile}
                    initialImage={editingItem?.icone}
                    label="Icône du type"
                  />
                </>
              )}

              {activeTab !== 'bottle_types' && (
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={form.actif}
                    onChange={e => updateForm('actif', e.target.checked)}
                    className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold"
                  />
                  <span className="text-sm text-foreground/60">Actif</span>
                </label>
              )}
            </div>

            {formError && (
              <p className="text-sm font-semibold text-red-500 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl text-center mt-4">
                {formError}
              </p>
            )}

      </SlideOver>
    </>
  );
}