'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { shopService, adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { useCatalogPermissions } from '@/hooks/useCatalogPermissions';
import CatalogAccessNotice from '@/components/catalog/CatalogAccessNotice';
import { extractCatalogList } from '@/lib/catalogUtils';
import { fromDatetimeLocalValue, toDatetimeLocalValue } from '@/lib/promotionUtils';
import { MultiImageUpload } from '@/components/MultiImageUpload';
import { CreateCategoryModal } from '@/components/CreateCategoryModal';

export default function AccessoriesPage() {
  const permissions = useCatalogPermissions('accessoires');
  const [accessories, setAccessories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [marqueFilter, setMarqueFilter] = useState('');
  const [matiereFilter, setMatiereFilter] = useState('');
  const [couleurFilter, setCouleurFilter] = useState('');
  const [enStockFilter, setEnStockFilter] = useState('');
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
    marque: 'Accessoire Exclusif',
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
    prix_promotionnel: '',
    date_debut: '',
    date_fin: '',
    stock_quantite: '',
    seuil_alerte_stock: '3',
    poids_grammes: '',
    message_promotion: '',
  });

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
      addToast('Erreur lors du chargement des accessoires', 'error');
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
    setForm({
      marque: 'Accessoire Exclusif',
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
      prix_promotionnel: '',
      date_debut: '',
      date_fin: '',
      stock_quantite: '',
      seuil_alerte_stock: '3',
      poids_grammes: '',
      message_promotion: '',
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
      prix_promotionnel: acc.prix_promotionnel ? String(acc.prix_promotionnel) : '',
      date_debut: toDatetimeLocalValue(acc.date_debut),
      date_fin: toDatetimeLocalValue(acc.date_fin),
      stock_quantite: String(acc.stock_quantite || ''),
      seuil_alerte_stock: String(acc.seuil_alerte_stock || '3'),
      poids_grammes: String(acc.poids_grammes || ''),
      message_promotion: acc.message_promotion || '',
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
    addToast('Type d\'accessoire ajouté avec succès', 'success');
  };

  const handleSave = async () => {
    if (!permissions.canCreate && !permissions.canUpdate) return;
    if (!form.marque || !form.nom || !form.prix_unitaire || !form.type_accessoire || !form.stock_quantite) {
      addToast('Champs requis manquants: Nom, Prix, Type, Stock', 'error');
      return;
    }

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
      if (editingAccessory) {
        // Utilisation de PATCH pour la mise à jour
        await adminService.patchFormData(`shop/accessoires/${editingAccessory.slug}/`, formData);
        addToast('Accessoire mis à jour avec succès', 'success');
      } else {
        await adminService.postFormData('shop/accessoires/', formData);
        addToast('Accessoire créé avec succès', 'success');
      }
      setShowModal(false);
      fetchAccessories();
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Erreur lors de la sauvegarde', 'error');
    }
  };

  const handleDelete = async (slug: string) => {
    if (!permissions.canDelete) return;
    if (!confirm('Voulez-vous vraiment supprimer cet accessoire ?')) return;
    try {
      await shopService.deleteAccessory(slug);
      addToast('Accessoire supprimé avec succès', 'success');
      fetchAccessories();
    } catch (error) {
      addToast('Erreur lors de la suppression', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (!permissions.canDelete || selectedAccessories.size === 0) return;
    if (!confirm(`Supprimer ${selectedAccessories.size} accessoire(s) ?`)) return;
    try {
      for (const slug of selectedAccessories) {
        try {
          await shopService.deleteAccessory(slug);
        } catch (e) {
          console.error(`Failed to delete ${slug}:`, e);
        }
      }
      addToast(`${selectedAccessories.size} accessoire(s) supprimé(s)`, 'success');
      setSelectedAccessories(new Set());
      fetchAccessories();
    } catch (error) {
      addToast('Erreur lors de la suppression en masse', 'error');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Accessoires</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Bijoux, montres et autres accessoires</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedAccessories.size > 0 && permissions.canDelete && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-600 transition-all shadow-lg"
            >
              <Trash2 size={16} />
              Supprimer ({selectedAccessories.size})
            </button>
          )}
          {permissions.canCreate && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 bg-gold text-black px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gold/80 transition-all shadow-lg"
            >
              <Plus size={16} />
              Ajouter
            </button>
          )}
        </div>
      </div>

      <CatalogAccessNotice permissions={permissions} resourceLabel="les accessoires" />

      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-2xl flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 border border-white/10 rounded-lg px-3 py-2 flex-1 min-w-48">
          <Search size={15} className="text-foreground/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom..."
            className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-foreground/40"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${filter === 'all' ? 'bg-gold text-black' : 'border border-white/10 text-foreground/40 hover:bg-white/5'}`}
          >
            Tous
          </button>
          {accessoryTypes.map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(String(t.id))}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${filter === String(t.id) ? 'bg-gold text-black' : 'border border-white/10 text-foreground/40 hover:bg-white/5'}`}
            >
              {t.nom}
            </button>
          ))}
        </div>
        <input
          value={marqueFilter}
          onChange={e => setMarqueFilter(e.target.value)}
          placeholder="Marque"
          className="text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground placeholder:text-foreground/40 outline-none focus:border-gold"
        />
        <input
          value={matiereFilter}
          onChange={e => setMatiereFilter(e.target.value)}
          placeholder="Matière"
          className="text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground placeholder:text-foreground/40 outline-none focus:border-gold"
        />
        <input
          value={couleurFilter}
          onChange={e => setCouleurFilter(e.target.value)}
          placeholder="Couleur"
          className="text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground placeholder:text-foreground/40 outline-none focus:border-gold"
        />
        <select
          value={enStockFilter}
          onChange={e => setEnStockFilter(e.target.value)}
          className="text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground outline-none focus:border-gold"
        >
          <option value="">Stock (tous)</option>
          <option value="true">En stock</option>
          <option value="false">Stock faible</option>
        </select>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm font-medium">Chargement des accessoires...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 w-12">
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
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Accessoire</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Prix</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider text-right">Actions</th>
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

                  return (
                    <tr key={a.slug || a.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 w-12">
                        <input
                          type="checkbox"
                          checked={selectedAccessories.has(a.slug || a.id)}
                          onChange={() => toggleSelectAccessory(a.slug || a.id)}
                          className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform overflow-hidden border border-white/5">
                            {a.image_principale ? (
                              <img src={a.image_principale} alt={aName} className="w-full h-full object-cover" />
                            ) : (
                              '👜'
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{aName}</p>
                            <p className="text-[10px] text-foreground/30 font-mono mt-1 uppercase">{a.reference_sku || a.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tight text-slate-400 bg-slate-500/10">
                          {typeName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-foreground text-sm">{Number(aPrice).toLocaleString()} FCFA</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-foreground/60">{aStock} unités</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {permissions.canUpdate && (
                            <button onClick={() => handleOpenEdit(a)} className="p-2 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors">
                              <Edit2 size={16} />
                            </button>
                          )}
                          {permissions.canDelete && (
                            <button onClick={() => handleDelete(a.slug)} className="p-2 rounded-lg hover:bg-red-500/10 text-foreground/40 hover:text-red-400 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {accessories.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-20 text-foreground/40 italic">Aucun accessoire trouvé.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex p-4 overflow-y-auto"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-background rounded-2xl p-6 w-full max-w-6xl shadow-2xl border border-white/10 overflow-y-auto max-h-fit my-auto mx-auto"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-bold text-foreground mb-4">
              {editingAccessory ? 'Modifier l\'accessoire' : 'Ajouter un accessoire'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-4">
                <input
                  placeholder="Marque *"
                  value={form.marque}
                  onChange={e => updateForm('marque', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                />
                <input
                  placeholder="Nom de l'accessoire"
                  value={form.nom}
                  onChange={e => updateForm('nom', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                />
                <div className="flex gap-2">
                  <select
                    value={form.type_accessoire}
                    onChange={e => updateForm('type_accessoire', e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  >
                    <option value="" disabled className="bg-neutral-900">Type d'accessoire</option>
                    {accessoryTypes.map(t => (
                      <option key={t.id} value={t.id} className="bg-neutral-900">{t.nom}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setIsTypeModalOpen(true)} className="px-3 py-2 bg-gold text-neutral-900 rounded-lg hover:bg-gold/80 font-medium">
                    +
                  </button>
                </div>
                <input
                  placeholder="Slug (optionnel)"
                  value={form.slug}
                  onChange={e => updateForm('slug', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                />
                <input
                  placeholder="Référence SKU (optionnel)"
                  value={form.reference_sku}
                  onChange={e => updateForm('reference_sku', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                />
                <textarea
                  placeholder="Description courte"
                  value={form.description_courte}
                  onChange={e => updateForm('description_courte', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  rows={2}
                />
              </div>

              {/* Right column */}
              <div className="space-y-4">
                <textarea
                  placeholder="Description longue"
                  value={form.description_longue}
                  onChange={e => updateForm('description_longue', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  rows={3}
                />
                <textarea
                  placeholder="Description IA"
                  value={form.description_ia}
                  onChange={e => updateForm('description_ia', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  rows={2}
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    placeholder="Matière"
                    value={form.matiere}
                    onChange={e => updateForm('matiere', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:border-gold"
                  />
                  <input
                    placeholder="Couleur"
                    value={form.couleur}
                    onChange={e => updateForm('couleur', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:border-gold"
                  />
                  <input
                    placeholder="Taille"
                    value={form.taille}
                    onChange={e => updateForm('taille', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:border-gold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Prix unitaire (FCFA)"
                    type="number"
                    value={form.prix_unitaire}
                    onChange={e => updateForm('prix_unitaire', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  />
                  <input
                    placeholder="Prix promo (optionnel)"
                    type="number"
                    value={form.prix_promotionnel}
                    onChange={e => updateForm('prix_promotionnel', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  />
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3 space-y-3">
                  <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">Période promotion</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-foreground/40">Date début</label>
                      <input
                        type="datetime-local"
                        value={form.date_debut}
                        onChange={e => updateForm('date_debut', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:border-gold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-foreground/40">Date fin</label>
                      <input
                        type="datetime-local"
                        value={form.date_fin}
                        onChange={e => updateForm('date_fin', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Quantité en stock"
                    type="number"
                    value={form.stock_quantite}
                    onChange={e => updateForm('stock_quantite', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  />
                  <input
                    placeholder="Seuil d'alerte"
                    type="number"
                    value={form.seuil_alerte_stock}
                     onChange={e => updateForm('seuil_alerte_stock', e.target.value)}
                     className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  />
                </div>
                <input
                  placeholder="Poids (grammes)"
                  type="number"
                  value={form.poids_grammes}
                  onChange={e => updateForm('poids_grammes', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                />
                <div className="space-y-1">
                  <label className="text-xs text-foreground/40">Message promo (optionnel)</label>
                  <textarea
                    placeholder="ex: Soldes — -30% ce week-end uniquement !"
                    value={form.message_promotion}
                    onChange={e => updateForm('message_promotion', e.target.value)}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:border-gold resize-none"
                  />
                  <p className="text-[10px] text-foreground/30">Affiché dans le carousel promotionnel de la page d'accueil.</p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <MultiImageUpload onImagesChange={(images) => setImageFiles(images)} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">Annuler</button>
              <button onClick={handleSave} className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-bold hover:bg-gold/80 transition-colors">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

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
