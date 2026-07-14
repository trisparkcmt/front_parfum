'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Edit2, Trash2, Plus, Search, Sparkles, Gem, FlaskConical } from 'lucide-react';
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

function TabButton({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void;
  icon: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-200 whitespace-nowrap
        ${active
          ? 'border-gold text-gold bg-white/5'
          : 'border-transparent text-foreground/40 hover:text-foreground/80 hover:border-white/20'
        }`}
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
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nom) {
      setFormError('Le nom est requis');
      return;
    }

    try {
      setFormError('');
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
        if (dateDebut) formData.append('date_debut', dateDebut);
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
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Classifications & Catégories</h1>
                  <p className="text-sm text-foreground/40 mt-0.5">Gérer les types d'accessoires, flacons et catégories de parfums</p>
                </div>
                <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-gold text-black px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gold/80 transition-all shadow-lg">
                  <Plus size={16} /> Ajouter
                </button>
              </div>

              <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-sm">
                <div className="flex border-b border-white/10 overflow-x-auto">
                  <TabButton active={activeTab === 'perfume_categories'} onClick={() => setActiveTab('perfume_categories')} icon={<Sparkles size={14} />} label="Catégories Parfums" />
                  <TabButton active={activeTab === 'accessory_categories'} onClick={() => setActiveTab('accessory_categories')} icon={<Gem size={14} />} label="Catégories Accessoires" />
                  <TabButton active={activeTab === 'bottle_types'} onClick={() => setActiveTab('bottle_types')} icon={<FlaskConical size={14} />} label="Types Flacons" />
                </div>

                <div className="p-6">
                  <div className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-sm flex items-center gap-2 w-full max-w-md mb-6">
                    <Search size={15} className="text-foreground/40" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Rechercher..."
                      className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-foreground/40"
                    />
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-16 text-gold gap-2">
                      <Loader2 className="animate-spin" size={24} />
                      <span className="text-sm">Chargement...</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5">
                            {activeTab === 'perfume_categories' && (
                              <>
                                <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider w-16">Icône</th>
                                <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Nom</th>
                                <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Slug</th>
                                <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Ordre</th>
                                <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Taux Réduction</th>
                                <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Période promo</th>
                              </>
                            )}
                            {activeTab === 'accessory_categories' && (
                              <>
                                <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider w-16">Icône</th>
                                <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Nom</th>
                                <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Taux Réduction</th>
                                <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Période promo</th>
                              </>
                            )}
                            {activeTab === 'bottle_types' && (
                              <>
                                <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Nom</th>
                                <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Description</th>
                              </>
                            )}
                            <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filtered.map(c => (
                            <tr key={c.id} className="hover:bg-white/5 transition-colors group">
                              {activeTab === 'perfume_categories' && (
                                <>
                                  <td className="px-6 py-3 whitespace-nowrap">
                                    <div className="relative w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                                      {(c.image || c.icone) ? (
                                        <AppImage src={c.image || c.icone} alt={c.nom || 'Icône'} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                      ) : (
                                        <Sparkles size={18} className="text-foreground/20" />
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 font-medium text-foreground">{c.nom}</td>
                                  <td className="px-6 py-4 text-sm text-foreground/60">{c.slug}</td>
                                  <td className="px-6 py-4 text-sm text-foreground/60">{c.ordre_affichage}</td>
                                  <td className="px-6 py-4 text-sm">
                                    {c.taux_reduction && parseFloat(c.taux_reduction) > 0 ? (
                                      <span className="bg-gold/10 text-gold px-2 py-0.5 rounded-md text-xs font-bold">-{c.taux_reduction}%</span>
                                    ) : (
                                      <span className="text-foreground/30 text-xs">—</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-xs text-foreground/50 max-w-[180px]">
                                    {formatPromotionPeriod(c.date_debut, c.date_fin) || '—'}
                                  </td>
                                </>
                              )}
                              {activeTab === 'accessory_categories' && (
                                <>
                                  <td className="px-6 py-3 whitespace-nowrap">
                                    <div className="relative w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                                      {c.icone ? (
                                        <AppImage src={c.icone} alt={c.nom || 'Icône'} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                      ) : (
                                        <Gem size={18} className="text-foreground/20" />
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 font-medium text-foreground">{c.nom}</td>
                                  <td className="px-6 py-4 text-sm text-foreground/60 max-w-[200px] truncate">{c.description || '—'}</td>
                                  <td className="px-6 py-4 text-sm">
                                    {c.taux_reduction && parseFloat(c.taux_reduction) > 0 ? (
                                      <span className="bg-gold/10 text-gold px-2 py-0.5 rounded-md text-xs font-bold">-{c.taux_reduction}%</span>
                                    ) : (
                                      <span className="text-foreground/30 text-xs">—</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-xs text-foreground/50 max-w-[180px]">
                                    {formatPromotionPeriod(c.date_debut, c.date_fin) || '—'}
                                  </td>
                                </>
                              )}
                              {activeTab === 'bottle_types' && (
                                <>
                                  <td className="px-6 py-4 font-medium text-foreground">{c.nom}</td>
                                  <td className="px-6 py-4 text-sm text-foreground/60">{c.description || '—'}</td>
                                </>
                              )}
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => handleOpenEdit(c)} className="p-1.5 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors">
                                    <Edit2 size={14} />
                                  </button>
                                  <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-foreground/40 hover:text-red-400 transition-colors">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filtered.length === 0 && (
                            <tr>
                              <td colSpan={colSpan} className="text-center py-16 text-foreground/40 italic text-sm">
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

      {/* Add/Edit Modal */}
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
              <FloatInput
                label="Nom *"
                placeholder="Nom"
                value={form.nom}
                onChange={e => updateForm('nom', e.target.value)}
              />

              {activeTab === 'perfume_categories' && (
                <>
                  <FloatInput
                    label="Slug"
                    placeholder="slug-auto (optionnel)"
                    value={form.slug}
                    onChange={e => updateForm('slug', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <FloatInput
                      label="Ordre"
                      type="number"
                      value={form.ordre_affichage}
                      onChange={e => updateForm('ordre_affichage', Number(e.target.value))}
                    />
                    <FloatInput
                      label="Réduction (%)"
                      placeholder="0.00"
                      value={form.taux_reduction}
                      onChange={e => updateForm('taux_reduction', e.target.value)}
                    />
                  </div>
                  <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 space-y-3">
                    <p className="text-xs font-bold text-gold uppercase tracking-wider">Promotion catégorie</p>
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
                    <FloatInput
                      label="Message promotion"
                      placeholder="Ex: Offre spéciale Noël"
                      value={form.message_promotion}
                      onChange={e => updateForm('message_promotion', e.target.value)}
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
                  <label className="text-[10px] font-bold text-gold uppercase block mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => updateForm('description', e.target.value)}
                    placeholder="Description (optionnel)"
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold resize-none"
                  />
                </div>
              )}

              {activeTab === 'accessory_categories' && (
                <>
                  <FloatInput
                    label="Taux réduction (%)"
                    placeholder="0.00"
                    value={form.taux_reduction}
                    onChange={e => updateForm('taux_reduction', e.target.value)}
                  />
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
                    <FloatInput
                      label="Message promotion"
                      placeholder="Ex: Semaine accessoires"
                      value={form.message_promotion}
                      onChange={e => updateForm('message_promotion', e.target.value)}
                    />
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