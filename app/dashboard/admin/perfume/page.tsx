'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Edit2, Trash2, Plus, Search, Image as ImageIcon } from 'lucide-react';
import { shopService } from '@/services/apiService';
import { adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { useCatalogPermissions } from '@/hooks/useCatalogPermissions';
import CatalogAccessNotice from '@/components/catalog/CatalogAccessNotice';
import { extractCatalogList } from '@/lib/catalogUtils';
import { MultiImageUpload } from '@/components/MultiImageUpload';
import { CreateCategoryModal } from '@/components/CreateCategoryModal';
import { FloatInput } from '@/components/ui/Input';

export default function PerfumeAdminPage() {
  const permissions = useCatalogPermissions('parfums');
  const [perfumes, setPerfumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [categoryLevelFilter, setCategoryLevelFilter] = useState('');
  const [estBestsellerFilter, setEstBestsellerFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPerfume, setEditingPerfume] = useState<any | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedPerfumes, setSelectedPerfumes] = useState<Set<string>>(new Set());
  const [formError, setFormError] = useState('');

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
    prix_promotionnel: '',
    taux_reduction: '',
    genre_cible: 'mixte',
    intensite: 'moyenne',
    notes_tete: '',
    notes_coeur: '',
    notes_fond: '',
    est_nouveau: false,
    stock_quantite: '',
    seuil_alerte_stock: '5',
    categorie: '',
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
      if (categoryLevelFilter) params.categorie_niveau = categoryLevelFilter;
      if (estBestsellerFilter === 'true') params.est_bestseller = true;
      if (estBestsellerFilter === 'false') params.est_bestseller = false;
      const data = await shopService.getPerfumes(params);
      setPerfumes(extractCatalogList(data));
    } catch {
      addToast('Erreur lors du chargement des parfums', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, genreFilter, categoryLevelFilter, estBestsellerFilter, addToast, permissions.canRead]);

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
      .catch(() => addToast('Erreur chargement catégories', 'error'));
  }, [addToast]);

  const updateForm = (field: keyof typeof form, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCategory = async (name: string) => {
    const newCategory = await shopService.createPerfumeCategory({ nom: name, actif: true, ordre_affichage: 0, taux_reduction: '0.00' });
    setCategories(prev => [...prev, newCategory]);
    updateForm('categorie', String(newCategory.id));
    addToast('Catégorie créée avec succès', 'success');
  };

  const handleOpenAdd = () => {
    setEditingPerfume(null);
    setForm({
      marque: 'Accessoire Exclusif',
      nom: '',
      slug: '',
      reference_sku: '',
      description_courte: '',
      description_longue: '',
      description_ia: '',
      contenance_ml: '',
      prix_unitaire: '',
      prix_promotionnel: '',
      taux_reduction: '',
      genre_cible: 'mixte',
      intensite: 'moyenne',
      notes_tete: '',
      notes_coeur: '',
      notes_fond: '',
      est_nouveau: false,
      stock_quantite: '',
      seuil_alerte_stock: '5',
      categorie: categories[0]?.id ? String(categories[0].id) : '',
    });
    setImageFile(null);
    setImageFiles({
      image_principale: null,
      image_supp_1: null,
      image_supp_2: null,
      image_supp_3: null,
      image_supp_4: null,
    });
    setFormError('');
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
      prix_promotionnel: perf.prix_promotionnel ? String(perf.prix_promotionnel) : '',
      taux_reduction: perf.taux_reduction ? String(perf.taux_reduction) : '',
      genre_cible: perf.genre_cible || 'mixte',
      intensite: perf.intensite || 'moyenne',
      notes_tete: perf.notes_tete || '',
      notes_coeur: perf.notes_coeur || '',
      notes_fond: perf.notes_fond || '',
      est_nouveau: !!perf.est_nouveau,
      stock_quantite: String(perf.stock_quantite || ''),
      seuil_alerte_stock: String(perf.seuil_alerte_stock || '5'),
      categorie: String(perf.categorie?.id || perf.categorie || ''),
    });
    setImageFile(null);
    setImageFiles({
      image_principale: null,
      image_supp_1: null,
      image_supp_2: null,
      image_supp_3: null,
      image_supp_4: null,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!permissions.canCreate && !permissions.canUpdate) return;
    if (!form.marque || !form.nom || !form.contenance_ml || !form.prix_unitaire || !form.categorie || !form.stock_quantite) {
      setFormError('Champs requis : Marque, Nom, Contenance, Prix, Catégorie, Stock');
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      if (val !== undefined && val !== null && (val !== '' || typeof val === 'boolean')) {
        formData.append(key, String(val));
      }
    });

    // Append all image files that were uploaded
    Object.entries(imageFiles).forEach(([key, file]) => {
      if (file instanceof File) {
        formData.append(key, file);
      }
    });

    try {
      setFormError('');
      if (editingPerfume) {
        await adminService.patchFormData(`shop/parfums/${editingPerfume.slug}/`, formData);
        addToast('Parfum mis à jour avec succès', 'success');
      } else {
        await adminService.postFormData('shop/parfums/', formData);
        addToast('Parfum créé avec succès', 'success');
      }
      setShowModal(false);
      fetchPerfumes();
    } catch (error: any) {
      setFormError(error.response?.data?.detail || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (slug: string) => {
    if (!permissions.canDelete) return;
    if (!confirm('Êtes‑vous sûr de vouloir supprimer ce parfum ?')) return;
    try {
      await shopService.deletePerfume(slug);
      addToast('Parfum supprimé', 'success');
      fetchPerfumes();
    } catch {
      addToast('Erreur lors du suppression', 'error');
    }
  };

  const toggleSelectPerfume = (slug: string) => {
    setSelectedPerfumes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(slug)) {
        newSet.delete(slug);
      } else {
        newSet.add(slug);
      }
      return newSet;
    });
  };

  const handleBulkDelete = async () => {
    if (!permissions.canDelete || selectedPerfumes.size === 0) return;
    if (!confirm(`Supprimer ${selectedPerfumes.size} parfum(s) ?`)) return;
    try {
      for (const slug of selectedPerfumes) {
        try {
          await shopService.deletePerfume(slug);
        } catch (e) {
          console.error(`Failed to delete ${slug}:`, e);
        }
      }
      addToast(`${selectedPerfumes.size} parfum(s) supprimé(s)`, 'success');
      setSelectedPerfumes(new Set());
      fetchPerfumes();
    } catch (error) {
      addToast('Erreur lors de la suppression en masse', 'error');
    }
  };

  const filtered = perfumes;

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
          <h1 className="text-2xl font-bold text-foreground">Parfums</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Gestion du catalogue de parfums</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedPerfumes.size > 0 && permissions.canDelete && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-600 transition-all shadow-lg"
            >
              <Trash2 size={16} />
              Supprimer ({selectedPerfumes.size})
            </button>
          )}
          {permissions.canCreate && (
            <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-gold text-black px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gold/80 transition-all shadow-lg">
              <Plus size={16} /> Ajouter
            </button>
          )}
        </div>
      </div>

      <CatalogAccessNotice permissions={permissions} resourceLabel="les parfums" />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-2xl flex items-center gap-2 w-full max-w-md">
          <Search size={15} className="text-foreground/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un parfum..."
            className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-foreground/40"
          />
        </div>
        <select
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none"
        >
          <option value="">Tous genres</option>
          <option value="homme">Homme</option>
          <option value="femme">Femme</option>
          <option value="mixte">Mixte</option>
        </select>
        <select
          value={categoryLevelFilter}
          onChange={(e) => setCategoryLevelFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none"
        >
          <option value="">Toutes catégories</option>
          <option value="super_premium">Super Premium</option>
          <option value="premium">Premium</option>
          <option value="high">High</option>
        </select>
        <select
          value={estBestsellerFilter}
          onChange={(e) => setEstBestsellerFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none"
        >
          <option value="">Tous</option>
          <option value="true">Bestsellers</option>
          <option value="false">Non bestsellers</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm font-medium">Chargement des parfums…</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={perfumes.length > 0 && selectedPerfumes.size === perfumes.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPerfumes(new Set(perfumes.map(p => p.slug || p.id)));
                        } else {
                          setSelectedPerfumes(new Set());
                        }
                      }}
                      className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold"
                    />
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider w-16">Image</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Contenance (ml)</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Prix</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(p => {
                  const productImg = p.image_principale || p.image;
                  return (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 w-12">
                        <input
                          type="checkbox"
                          checked={selectedPerfumes.has(p.slug || p.id)}
                          onChange={() => toggleSelectPerfume(p.slug || p.id)}
                          className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold"
                        />
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                          {productImg ? (
                            <img
                              src={productImg}
                              alt={p.nom || 'Parfum'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <ImageIcon size={18} className="text-foreground/20" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">{p.nom || p.name}</td>
                      <td className="px-6 py-4 text-sm text-foreground/60">{p.reference_sku || ''}</td>
                      <td className="px-6 py-4 text-sm text-foreground/60">{p.contenance_ml}</td>
                      <td className="px-6 py-4 text-sm font-bold">
                        <div className="flex items-center gap-2 flex-wrap">
                          {p.taux_reduction ? (
                            <>
                              <span className="text-foreground/40 line-through text-xs">{p.prix_unitaire} FCFA</span>
                              <span className="text-gold">{p.prix_actuel} FCFA</span>
                              <span className="text-xs bg-gold/10 text-gold px-1.5 py-0.5 rounded-md">-{p.taux_reduction}%</span>
                            </>
                          ) : (
                            <span className="text-gold">{p.prix_unitaire ? `${p.prix_unitaire} FCFA` : ''}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {permissions.canUpdate && (
                            <button onClick={() => handleOpenEdit(p)} className="p-2 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors">
                              <Edit2 size={16} />
                            </button>
                          )}
                          {permissions.canDelete && (
                            <button onClick={() => handleDelete(p.slug)} className="p-2 rounded-lg hover:bg-red-500/10 text-foreground/40 hover:text-red-400 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-20 text-foreground/40 italic">Aucun parfum trouvé.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (permissions.canCreate || permissions.canUpdate) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div
            key={editingPerfume?.slug ?? 'new'}
            className="bg-background rounded-2xl p-6 w-80dvh max-w-6xl shadow-2xl border border-white/10 overflow-y-auto max-h-fit my-auto mx-auto"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-bold text-foreground mb-4">{editingPerfume ? 'Modifier le parfum' : 'Ajouter un parfum'}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left column */}
              <div className="space-y-4">
                <FloatInput label="Marque" placeholder="Marque" value={form.marque} onChange={e => updateForm('marque', e.target.value)} />
                <FloatInput label="Nom" placeholder="Nom" value={form.nom} onChange={e => updateForm('nom', e.target.value)} />
                <FloatInput label="Slug (optionnel)" placeholder="Slug (optionnel)" value={form.slug} onChange={e => updateForm('slug', e.target.value)} />
                <FloatInput label="Référence SKU (optionnel)" placeholder="Référence SKU (optionnel)" value={form.reference_sku} onChange={e => updateForm('reference_sku', e.target.value)} />
                
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-gold uppercase block mb-1">Catégorie</label>
                    <select value={form.categorie} onChange={e => updateForm('categorie', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold">
                      <option value="" disabled className="bg-neutral-900">Catégorie</option>
                      {categories.map(c => <option key={c.id} value={c.id} className="bg-neutral-900">{c.nom}</option>)}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="px-3.5 mt-5 bg-gold text-neutral-900 rounded-xl hover:bg-gold/80 font-bold text-lg"
                    title="Créer une nouvelle catégorie"
                  >
                    +
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gold uppercase block mb-1">Genre Cible</label>
                    <select value={form.genre_cible} onChange={e => updateForm('genre_cible', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold">
                      <option value="homme">Homme</option>
                      <option value="femme">Femme</option>
                      <option value="mixte">Mixte</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gold uppercase block mb-1">Intensité</label>
                    <select value={form.intensite} onChange={e => updateForm('intensite', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold">
                      <option value="légère">Légère</option>
                      <option value="moyenne">Moyenne</option>
                      <option value="forte">Forte</option>
                      <option value="très forte">Très forte</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <FloatInput label="Notes tête" placeholder="Notes tête" value={form.notes_tete} onChange={e => updateForm('notes_tete', e.target.value)} className="text-xs" />
                  <FloatInput label="Notes cœur" placeholder="Notes cœur" value={form.notes_coeur} onChange={e => updateForm('notes_coeur', e.target.value)} className="text-xs" />
                  <FloatInput label="Notes fond" placeholder="Notes fond" value={form.notes_fond} onChange={e => updateForm('notes_fond', e.target.value)} className="text-xs" />
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gold uppercase block mb-1">Description courte</label>
                  <textarea placeholder="Description courte" value={form.description_courte} onChange={e => updateForm('description_courte', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold" rows={2} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gold uppercase block mb-1">Description longue</label>
                  <textarea placeholder="Description longue" value={form.description_longue} onChange={e => updateForm('description_longue', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold" rows={2} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gold uppercase block mb-1">Description IA</label>
                  <textarea placeholder="Description IA" value={form.description_ia} onChange={e => updateForm('description_ia', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold" rows={2} />
                </div>

                {/* Prix & Contenance */}
                <div className="grid grid-cols-2 gap-3">
                  <FloatInput label="Contenance (ml)" type="number" value={form.contenance_ml} onChange={e => updateForm('contenance_ml', e.target.value)} />
                  <FloatInput label="Prix (FCFA)" type="number" value={form.prix_unitaire} onChange={e => updateForm('prix_unitaire', e.target.value)} />
                </div>

                {/* Stock */}
                <div className="grid grid-cols-2 gap-3">
                  <FloatInput label="Stock" type="number" value={form.stock_quantite} onChange={e => updateForm('stock_quantite', e.target.value)} className="text-xs" />
                  <FloatInput label="Seuil alerte" type="number" value={form.seuil_alerte_stock} onChange={e => updateForm('seuil_alerte_stock', e.target.value)} className="text-xs" />
                </div>

                {/* Promotion block */}
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3.5 space-y-3">
                  <p className="text-xs font-semibold text-gold uppercase tracking-wider">Promotion</p>
                  <div className="grid grid-cols-2 gap-3">
                    <FloatInput
                      label="Prix promo (FCFA)"
                      placeholder="ex: 19000"
                      type="number"
                      value={form.prix_promotionnel}
                      onChange={e => updateForm('prix_promotionnel', e.target.value)}
                      className="text-xs"
                    />
                    <FloatInput
                      label="Taux réduction (%)"
                      placeholder="ex: 20"
                      type="number"
                      min="0"
                      max="100"
                      value={form.taux_reduction}
                      onChange={e => updateForm('taux_reduction', e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  {/* Live preview */}
                  {(form.prix_promotionnel || form.taux_reduction) && form.prix_unitaire && (
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <span className="text-xs text-foreground/40 line-through">{form.prix_unitaire} FCFA</span>
                      {form.prix_promotionnel && (
                        <span className="text-xs text-gold font-bold">{form.prix_promotionnel} FCFA</span>
                      )}
                      {form.taux_reduction && (
                        <span className="text-xs bg-gold/10 text-gold px-1.5 py-0.5 rounded-md font-medium">-{form.taux_reduction}%</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Checkboxes */}
                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.est_nouveau} onChange={e => updateForm('est_nouveau', e.target.checked)} className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold" />
                    <span className="text-xs text-foreground/60">Nouveau</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Image Uploader - Multiple Images */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <MultiImageUpload
                onImagesChange={(images) => setImageFiles(images)}
              />
            </div>

            {formError && (
              <p className="text-sm font-semibold text-red-500 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl text-center mt-4">
                {formError}
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">Annuler</button>
              <button onClick={handleSave} className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-bold hover:bg-gold/80 transition-colors">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

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