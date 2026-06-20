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
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!permissions.canCreate && !permissions.canUpdate) return;
    if (!form.marque || !form.nom || !form.contenance_ml || !form.prix_unitaire || !form.categorie || !form.stock_quantite) {
      addToast('Champs requis : Marque, Nom, Contenance, Prix, Catégorie, Stock', 'error');
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
      addToast(error.response?.data?.detail || 'Erreur lors de la sauvegarde', 'error');
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
        {permissions.canCreate && (
          <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-gold text-black px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gold/80 transition-all shadow-lg">
            <Plus size={16} /> Ajouter
          </button>
        )}
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
                    <td colSpan={6} className="text-center py-20 text-foreground/40 italic">Aucun parfum trouvé.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (permissions.canCreate || permissions.canUpdate) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            key={editingPerfume?.slug ?? 'new'}
            className="bg-background rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="font-bold text-foreground mb-4">{editingPerfume ? 'Modifier le parfum' : 'Ajouter un parfum'}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left column */}
              <div className="space-y-4">
                <input placeholder="Marque" value={form.marque} onChange={e => updateForm('marque', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
                <input placeholder="Nom" value={form.nom} onChange={e => updateForm('nom', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
                <input placeholder="Slug (optionnel)" value={form.slug} onChange={e => updateForm('slug', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
                <input placeholder="Référence SKU (optionnel)" value={form.reference_sku} onChange={e => updateForm('reference_sku', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
                <div className="flex gap-2">
                  <select value={form.categorie} onChange={e => updateForm('categorie', e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold">
                    <option value="" disabled className="bg-neutral-900">Catégorie</option>
                    {categories.map(c => <option key={c.id} value={c.id} className="bg-neutral-900">{c.nom}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="px-3 py-2 bg-gold text-neutral-900 rounded-lg hover:bg-gold/80 font-medium"
                    title="Créer une nouvelle catégorie"
                  >
                    +
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.genre_cible} onChange={e => updateForm('genre_cible', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold">
                    <option value="homme">Homme</option>
                    <option value="femme">Femme</option>
                    <option value="mixte">Mixte</option>
                  </select>
                  <select value={form.intensite} onChange={e => updateForm('intensite', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold">
                    <option value="légère">Légère</option>
                    <option value="moyenne">Moyenne</option>
                    <option value="forte">Forte</option>
                    <option value="très forte">Très forte</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input placeholder="Notes tête" value={form.notes_tete} onChange={e => updateForm('notes_tete', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:border-gold" />
                  <input placeholder="Notes cœur" value={form.notes_coeur} onChange={e => updateForm('notes_coeur', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:border-gold" />
                  <input placeholder="Notes fond" value={form.notes_fond} onChange={e => updateForm('notes_fond', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:border-gold" />
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                <textarea placeholder="Description courte" value={form.description_courte} onChange={e => updateForm('description_courte', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" rows={2} />
                <textarea placeholder="Description longue" value={form.description_longue} onChange={e => updateForm('description_longue', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" rows={2} />
                <textarea placeholder="Description IA" value={form.description_ia} onChange={e => updateForm('description_ia', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" rows={2} />

                {/* Prix & Contenance */}
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Contenance (ml)" type="number" value={form.contenance_ml} onChange={e => updateForm('contenance_ml', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
                  <input placeholder="Prix (FCFA)" type="number" value={form.prix_unitaire} onChange={e => updateForm('prix_unitaire', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
                </div>

                {/* Stock */}
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Stock" type="number" value={form.stock_quantite} onChange={e => updateForm('stock_quantite', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:border-gold" />
                  <input placeholder="Seuil alerte" type="number" value={form.seuil_alerte_stock} onChange={e => updateForm('seuil_alerte_stock', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:border-gold" />
                </div>

                {/* Promotion block */}
                <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3 space-y-3">
                  <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">Promotion</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-foreground/40">Prix promo (FCFA)</label>
                      <input
                        placeholder="ex: 19000"
                        type="number"
                        value={form.prix_promotionnel}
                        onChange={e => updateForm('prix_promotionnel', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:border-gold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-foreground/40">Taux réduction (%)</label>
                      <input
                        placeholder="ex: 20"
                        type="number"
                        min="0"
                        max="100"
                        value={form.taux_reduction}
                        onChange={e => updateForm('taux_reduction', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:border-gold"
                      />
                    </div>
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