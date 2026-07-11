'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Edit2, Trash2, Plus, Search, Image as ImageIcon } from 'lucide-react';
import { shopService } from '@/services/apiService';
import { adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { useCatalogPermissions } from '@/hooks/useCatalogPermissions';
import CatalogAccessNotice from '@/components/catalog/CatalogAccessNotice';
import { extractCatalogList } from '@/lib/catalogUtils';
import { fromDatetimeLocalValue, toDatetimeLocalValue } from '@/lib/promotionUtils';
import AppImage from '@/components/ui/AppImage';
import { MultiImageUpload } from '@/components/MultiImageUpload';
import { CreateCategoryModal } from '@/components/CreateCategoryModal';
import { FormModal } from '@/components/ui/FormModal';

export default function PerfumeAdminPage() {
  const permissions = useCatalogPermissions('parfums');
  const [perfumes, setPerfumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [estBestsellerFilter, setEstBestsellerFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPerfume, setEditingPerfume] = useState<any | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    date_debut: '',
    date_fin: '',
    genre_cible: 'mixte',
    intensite: 'moyenne',
    notes_tete: '',
    notes_coeur: '',
    notes_fond: '',
    est_nouveau: false,
    est_bestseller: false,
    stock_quantite: '',
    seuil_alerte_stock: '5',
    categorie: '',
    actif: true,
    message_promotion: '',
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
      if (estBestsellerFilter === 'true') params.est_bestseller = true;
      if (estBestsellerFilter === 'false') params.est_bestseller = false;
      const data = await shopService.getPerfumes(params);
      setPerfumes(extractCatalogList(data));
    } catch {
      addToast('Erreur lors du chargement des parfums', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, genreFilter, estBestsellerFilter, addToast, permissions.canRead]);

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
    setFormErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const toggleSelectedSlug = (slug: string) => {
    setSelectedSlugs(prev => prev.includes(slug) ? prev.filter(item => item !== slug) : [...prev, slug]);
  };

  const handleBulkDelete = async () => {
    if (!permissions.canDelete || selectedSlugs.length === 0) return;
    if (!confirm(`Supprimer ${selectedSlugs.length} parfum(s) sélectionné(s) ?`)) return;

    try {
      await Promise.all(selectedSlugs.map((slug) => shopService.deletePerfume(slug)));
      addToast(`${selectedSlugs.length} parfum(s) supprimé(s)`, 'success');
      setSelectedSlugs([]);
      fetchPerfumes();
    } catch {
      addToast('Erreur lors de la suppression en masse', 'error');
    }
  };

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    if (!form.marque.trim()) errors.marque = 'La marque est requise';
    if (!form.nom.trim()) errors.nom = 'Le nom du parfum est requis';
    if (!form.contenance_ml || Number(form.contenance_ml) <= 0) errors.contenance_ml = 'La contenance doit être supérieure à 0';
    if (!form.prix_unitaire || Number(form.prix_unitaire) <= 0) errors.prix_unitaire = 'Le prix doit être supérieur à 0';
    if (!form.categorie) errors.categorie = 'Une catégorie est requise';
    if (!form.stock_quantite || Number(form.stock_quantite) < 0) errors.stock_quantite = 'Le stock est requis';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form.marque, form.nom, form.contenance_ml, form.prix_unitaire, form.categorie, form.stock_quantite]);

  const handleAddCategory = async (name: string) => {
    const newCategory = await shopService.createPerfumeCategory({
      nom: name,
      actif: true,
      ordre_affichage: 0,
      taux_reduction: '0.00',
    });
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
      date_debut: '',
      date_fin: '',
      genre_cible: 'mixte',
      intensite: 'moyenne',
      notes_tete: '',
      notes_coeur: '',
      notes_fond: '',
      est_nouveau: false,
      est_bestseller: false,
      stock_quantite: '',
      seuil_alerte_stock: '5',
      categorie: categories[0]?.id ? String(categories[0].id) : '',
      actif: true,
      message_promotion: '',
    });
    setImageFile(null);
    setImageFiles({
      image_principale: null,
      image_supp_1: null,
      image_supp_2: null,
      image_supp_3: null,
      image_supp_4: null,
    });
    setFormErrors({});
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
      date_debut: toDatetimeLocalValue(perf.date_debut),
      date_fin: toDatetimeLocalValue(perf.date_fin),
      genre_cible: perf.genre_cible || 'mixte',
      intensite: perf.intensite || 'moyenne',
      notes_tete: perf.notes_tete || '',
      notes_coeur: perf.notes_coeur || '',
      notes_fond: perf.notes_fond || '',
      est_nouveau: !!perf.est_nouveau,
      est_bestseller: !!perf.est_bestseller,
      stock_quantite: String(perf.stock_quantite || ''),
      seuil_alerte_stock: String(perf.seuil_alerte_stock || '5'),
      categorie: String(perf.categorie?.id || perf.categorie || ''),
      actif: perf.actif !== undefined ? perf.actif : true,
      message_promotion: perf.message_promotion || '',
    });
    setImageFile(null);
    setImageFiles({
      image_principale: null,
      image_supp_1: null,
      image_supp_2: null,
      image_supp_3: null,
      image_supp_4: null,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!permissions.canCreate && !permissions.canUpdate) return;
    if (!validateForm()) {
      addToast('Veuillez corriger les champs obligatoires.', 'error');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      if (key === 'date_debut' || key === 'date_fin') return;
      if (val !== undefined && val !== null && (val !== '' || typeof val === 'boolean')) {
        formData.append(key, String(val));
      }
    });
    const promoDateDebut = fromDatetimeLocalValue(form.date_debut);
    const promoDateFin = fromDatetimeLocalValue(form.date_fin);
    if (promoDateDebut) formData.append('date_debut', promoDateDebut);
    if (promoDateFin) formData.append('date_fin', promoDateFin);

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

      await fetchPerfumes();
      if (editingPerfume) {
        setShowModal(true);
      } else {
        handleOpenAdd();
      }
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setIsSubmitting(false);
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
        <div className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-sm flex items-center gap-2 w-full max-w-md">
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
      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-sm overflow-hidden min-h-[300px]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-3">
          <p className="text-xs uppercase tracking-wider text-foreground/40">
            {selectedSlugs.length > 0 ? `${selectedSlugs.length} sélectionné(s)` : 'Sélection multiple'}
          </p>
          {selectedSlugs.length > 0 && permissions.canDelete && (
            <button onClick={handleBulkDelete} className="text-xs font-semibold text-red-400 hover:text-red-300">
              Supprimer la sélection
            </button>
          )}
        </div>
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
                  <th className="px-4 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider w-10">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selectedSlugs.length === filtered.length}
                      onChange={() => {
                        if (selectedSlugs.length === filtered.length) {
                          setSelectedSlugs([]);
                        } else {
                          setSelectedSlugs(filtered.map((p: any) => p.slug || String(p.id)));
                        }
                      }}
                      className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold"
                    />
                  </th>
                  <th className="px-4 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider w-16">Image</th>
                  <th className="px-4 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Nom</th>
                  <th className="px-4 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Contenance (ml)</th>
                  <th className="px-4 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Prix</th>
                  <th className="px-4 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(p => {
                  const productImg = p.image_principale || p.image;
                  const slugKey = p.slug || String(p.id);
                  const isSelected = selectedSlugs.includes(slugKey);
                  return (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectedSlug(slugKey)}
                          className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="relative w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                          {productImg ? (
                            <AppImage
                              src={productImg}
                              alt={p.nom || 'Parfum'}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <ImageIcon size={18} className="text-foreground/20" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-medium text-foreground">{p.nom || p.name}</td>
                      <td className="px-4 py-4 text-sm text-foreground/60">{p.stock_quantite ?? p.stock ?? '—'}</td>
                      <td className="px-4 py-4 text-sm text-foreground/60">{p.contenance_ml}</td>
                      <td className="px-4 py-4 text-sm font-bold">
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
                      <td className="px-4 py-4 text-right">
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

      <FormModal
        isOpen={showModal && (permissions.canCreate || permissions.canUpdate)}
        onClose={() => setShowModal(false)}
        title={editingPerfume ? 'Modifier le parfum' : 'Ajouter un parfum'}
        subtitle="Formulaire complet, sans popup ni défilement gênant."
        size="3xl"
      >
        <div className="p-6 lg:p-8">
          <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_0.9fr] gap-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <input
                      placeholder="Marque"
                      value={form.marque}
                      onChange={(e) => updateForm('marque', e.target.value)}
                      className={`w-full bg-white/5 border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold ${formErrors.marque ? 'border-red-500/50' : 'border-white/10'}`}
                    />
                    {formErrors.marque && <p className="mt-1 text-xs text-red-500">{formErrors.marque}</p>}
                  </div>
                  <div>
                    <input
                      placeholder="Nom"
                      value={form.nom}
                      onChange={(e) => updateForm('nom', e.target.value)}
                      className={`w-full bg-white/5 border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold ${formErrors.nom ? 'border-red-500/50' : 'border-white/10'}`}
                    />
                    {formErrors.nom && <p className="mt-1 text-xs text-red-500">{formErrors.nom}</p>}
                  </div>
                  <input
                    placeholder="Slug (optionnel)"
                    value={form.slug}
                    onChange={(e) => updateForm('slug', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold"
                  />
                  <input
                    placeholder="Référence SKU (optionnel)"
                    value={form.reference_sku}
                    onChange={(e) => updateForm('reference_sku', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold"
                  />
                  <div className="flex gap-2">
                    <select
                      value={form.categorie}
                      onChange={(e) => updateForm('categorie', e.target.value)}
                      className={`flex-1 bg-white/5 border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold ${formErrors.categorie ? 'border-red-500/50' : 'border-white/10'}`}
                    >
                      <option value="" disabled className="bg-neutral-900">Catégorie</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id} className="bg-neutral-900">{c.nom}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="px-3 py-2.5 bg-gold text-neutral-900 rounded-lg hover:bg-gold/80 font-medium"
                      title="Créer une nouvelle catégorie"
                    >
                      +
                    </button>
                  </div>
                  {formErrors.categorie && <p className="mt-1 text-xs text-red-500">{formErrors.categorie}</p>}
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={form.genre_cible}
                      onChange={(e) => updateForm('genre_cible', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold"
                    >
                      <option value="homme">Homme</option>
                      <option value="femme">Femme</option>
                      <option value="mixte">Mixte</option>
                    </select>
                    <select
                      value={form.intensite}
                      onChange={(e) => updateForm('intensite', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold"
                    >
                      <option value="légère">Légère</option>
                      <option value="moyenne">Moyenne</option>
                      <option value="forte">Forte</option>
                      <option value="très forte">Très forte</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      placeholder="Notes tête"
                      value={form.notes_tete}
                      onChange={(e) => updateForm('notes_tete', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-foreground outline-none focus:border-gold"
                    />
                    <input
                      placeholder="Notes cœur"
                      value={form.notes_coeur}
                      onChange={(e) => updateForm('notes_coeur', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-foreground outline-none focus:border-gold"
                    />
                    <input
                      placeholder="Notes fond"
                      value={form.notes_fond}
                      onChange={(e) => updateForm('notes_fond', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-foreground outline-none focus:border-gold"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-foreground/40">Contenance (ml)</label>
                    <input
                      type="number"
                      placeholder="ex: 100"
                      value={form.contenance_ml}
                      onChange={(e) => updateForm('contenance_ml', e.target.value)}
                      className={`w-full bg-white/5 border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold ${formErrors.contenance_ml ? 'border-red-500/50' : 'border-white/10'}`}
                    />
                    {formErrors.contenance_ml && <p className="mt-1 text-xs text-red-500">{formErrors.contenance_ml}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-foreground/40">Prix unitaire (FCFA)</label>
                    <input
                      type="number"
                      placeholder="ex: 25000"
                      value={form.prix_unitaire}
                      onChange={(e) => updateForm('prix_unitaire', e.target.value)}
                      className={`w-full bg-white/5 border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold ${formErrors.prix_unitaire ? 'border-red-500/50' : 'border-white/10'}`}
                    />
                    {formErrors.prix_unitaire && <p className="mt-1 text-xs text-red-500">{formErrors.prix_unitaire}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-foreground/40">Stock</label>
                    <input
                      type="number"
                      value={form.stock_quantite}
                      onChange={(e) => updateForm('stock_quantite', e.target.value)}
                      className={`w-full bg-white/5 border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold ${formErrors.stock_quantite ? 'border-red-500/50' : 'border-white/10'}`}
                    />
                    {formErrors.stock_quantite && <p className="mt-1 text-xs text-red-500">{formErrors.stock_quantite}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-foreground/40">Seuil d’alerte</label>
                    <input
                      type="number"
                      value={form.seuil_alerte_stock}
                      onChange={(e) => updateForm('seuil_alerte_stock', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-foreground/40">Prix promo</label>
                      <input
                        type="number"
                        placeholder="ex: 18000"
                        value={form.prix_promotionnel}
                        onChange={(e) => updateForm('prix_promotionnel', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-foreground/40">Taux réduction (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="ex: 20"
                        value={form.taux_reduction}
                        onChange={(e) => updateForm('taux_reduction', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-foreground/40">Date début</label>
                      <input
                        type="datetime-local"
                        value={form.date_debut}
                        onChange={(e) => updateForm('date_debut', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-foreground/40">Date fin</label>
                      <input
                        type="datetime-local"
                        value={form.date_fin}
                        onChange={(e) => updateForm('date_fin', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-foreground/40">Description courte</label>
                  <textarea
                    value={form.description_courte}
                    onChange={(e) => updateForm('description_courte', e.target.value)}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-foreground/40">Description longue</label>
                  <textarea
                    value={form.description_longue}
                    onChange={(e) => updateForm('description_longue', e.target.value)}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-foreground/40">Description IA</label>
                  <textarea
                    value={form.description_ia}
                    onChange={(e) => updateForm('description_ia', e.target.value)}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-foreground/40">Message promo (optionnel)</label>
                  <textarea
                    value={form.message_promotion}
                    onChange={(e) => updateForm('message_promotion', e.target.value)}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold resize-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.est_nouveau} onChange={(e) => updateForm('est_nouveau', e.target.checked)} className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold" />
                  <span className="text-xs text-foreground/60">Nouveau</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.est_bestseller} onChange={(e) => updateForm('est_bestseller', e.target.checked)} className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold" />
                  <span className="text-xs text-foreground/60">Bestseller</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.actif} onChange={(e) => updateForm('actif', e.target.checked)} className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold" />
                  <span className="text-xs text-foreground/60">Actif</span>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 xl:sticky xl:top-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Images</h3>
                <MultiImageUpload onImagesChange={(images) => setImageFiles(images)} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">Annuler</button>
            <button onClick={handleSave} disabled={isSubmitting} className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-bold hover:bg-gold/80 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Envoi…</span>
                </>
              ) : (
                'Enregistrer'
              )}
            </button>
          </div>
        </div>
      </FormModal>

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