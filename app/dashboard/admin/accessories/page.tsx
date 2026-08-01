'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Loader2, SlidersHorizontal, X } from 'lucide-react';
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

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export default function AccessoriesPage() {
  const permissions = useCatalogPermissions('accessoires');
  const { user } = useAuthStore();
  const isAdmin = Boolean(user?.is_staff || user?.is_superuser || user?.role === 'superadmin');
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
    addToast('Type d\'accessoire ajouté avec succès', 'success');
  };

  const handleSave = async () => {
    if (!permissions.canCreate && !permissions.canUpdate) return;

    const errors: Record<string, string> = {};
    if (!form.marque) errors.marque = 'La marque est requise';
    if (!form.nom) errors.nom = 'Le nom est requis';
    if (!form.prix_unitaire) errors.prix_unitaire = 'Le prix unitaire est requis';
    if (!form.type_accessoire) errors.type_accessoire = "Le type d'accessoire est requis";
    if (!form.stock_quantite) errors.stock_quantite = 'La quantité en stock est requise';

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      setTimeout(() => {
        const firstError = document.querySelector('[data-field="marque"], [data-field="nom"], [data-field="prix_unitaire"], [data-field="type_accessoire"], [data-field="stock_quantite"]') as HTMLElement | null;
        if (firstError) firstError.focus();
      }, 50);
      return;
    }

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

  const activeFilterCount = [marqueFilter, matiereFilter, couleurFilter, enStockFilter].filter(Boolean).length;

  return (
    <div className="space-y-6">

      {/* Header --------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Accessoires</h1>
          <p className="mt-0.5 text-sm text-foreground/40">Bijoux, montres et autres accessoires</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedAccessories.size > 0 && permissions.canDelete && (
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-2 rounded-lg bg-red-500/90 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
            >
              <Trash2 size={14} />
              Supprimer ({selectedAccessories.size})
            </button>
          )}
          {permissions.canCreate && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-3.5 py-2 text-sm font-semibold text-black transition-colors hover:bg-gold/85"
            >
              <Plus size={14} />
              Ajouter
            </button>
          )}
        </div>
      </div>

      <CatalogAccessNotice permissions={permissions} resourceLabel="les accessoires" />

      {/* Toolbar ---------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
            <Search size={14} className="shrink-0 text-foreground/35" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom…"
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
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-foreground/35">Marque</p>
              <input
                value={marqueFilter}
                onChange={e => setMarqueFilter(e.target.value)}
                placeholder="Toutes"
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/35 focus:border-gold/50"
              />
            </div>
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-foreground/35">Matière</p>
              <input
                value={matiereFilter}
                onChange={e => setMatiereFilter(e.target.value)}
                placeholder="Toutes"
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/35 focus:border-gold/50"
              />
            </div>
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-foreground/35">Couleur</p>
              <input
                value={couleurFilter}
                onChange={e => setCouleurFilter(e.target.value)}
                placeholder="Toutes"
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/35 focus:border-gold/50"
              />
            </div>
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-foreground/35">Stock</p>
              <select
                value={enStockFilter}
                onChange={e => setEnStockFilter(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-gold/50"
              >
                <option value="" className="bg-background">Tous</option>
                <option value="true" className="bg-background">En stock</option>
                <option value="false" className="bg-background">Stock faible</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table -------------------------------------------------------------- */}
      <div className="min-h-[300px] overflow-hidden rounded-xl border border-white/10">
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
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Accessoire</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Type</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Prix vente</th>
                  {isAdmin && (
                    <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Bénéfice unitaire</th>
                  )}
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Stock</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Actions</th>
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
                            <p className="truncate text-xs font-medium text-foreground">{aName}</p>
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
                        {Number(aPrice).toLocaleString()} FCFA
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
                            <span className="text-xs italic text-foreground/30">Non défini</span>
                          )}
                        </td>
                      )}
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-foreground/55">{aStock} unités</td>
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
                    <td colSpan={7} className="py-16 text-center text-sm italic text-foreground/30">Aucun accessoire trouvé.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Form modal — untouched, same open system ─────────────────────── */}
      <SlideOver
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingAccessory ? "Modifier l'accessoire" : "Ajouter un accessoire"}
        description="Formulaire complet, sans popup ni défilement gênant."
        size="xl"
        footer={
          <div className="flex gap-3">
            <button onClick={handleSave} className="flex-1 bg-gold text-black rounded-xl py-3 text-sm font-bold hover:bg-gold/80 transition-all">Enregistrer</button>
            <button onClick={() => setShowModal(false)} className="px-5 border border-white/10 rounded-xl py-3 text-sm text-foreground/60 hover:bg-white/5 transition-all">Annuler</button>
          </div>
        }
      >
        <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_0.9fr] gap-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Marque *</label>
                  <input
                    data-field="marque"
                    value={form.marque}
                    onChange={e => updateForm('marque', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                  />
                  {formErrors.marque && <p className="mt-1 text-xs text-red-500">{formErrors.marque}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Nom de l'accessoire *</label>
                  <input
                    data-field="nom"
                    value={form.nom}
                    onChange={e => updateForm('nom', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                  />
                  {formErrors.nom && <p className="mt-1 text-xs text-red-500">{formErrors.nom}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Type d'accessoire *</label>
                  <select
                    data-field="type_accessoire"
                    value={form.type_accessoire}
                    onChange={e => updateForm('type_accessoire', e.target.value)}
                    className="flex-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                  >
                    <option value="" disabled className="bg-neutral-900">Type d'accessoire</option>
                    {accessoryTypes.map(t => (
                      <option key={t.id} value={t.id} className="bg-neutral-900">{t.nom}</option>
                    ))}
                  </select>
                  {formErrors.type_accessoire && <p className="mt-1 text-xs text-red-500">{formErrors.type_accessoire}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Slug (optionnel)</label>
                  <input
                    data-field="slug"
                    value={form.slug}
                    onChange={e => updateForm('slug', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                  />
                  {formErrors.slug && <p className="mt-1 text-xs text-red-500">{formErrors.slug}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Référence SKU (optionnel)</label>
                  <input
                    data-field="reference_sku"
                    value={form.reference_sku}
                    onChange={e => updateForm('reference_sku', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                  />
                  {formErrors.reference_sku && <p className="mt-1 text-xs text-red-500">{formErrors.reference_sku}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Description courte</label>
                  <textarea
                    data-field="description_courte"
                    value={form.description_courte}
                    onChange={e => updateForm('description_courte', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                    rows={2}
                  />
                  {formErrors.description_courte && <p className="mt-1 text-xs text-red-500">{formErrors.description_courte}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Description longue</label>
                  <textarea
                    data-field="description_longue"
                    value={form.description_longue}
                    onChange={e => updateForm('description_longue', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                    rows={3}
                  />
                  {formErrors.description_longue && <p className="mt-1 text-xs text-red-500">{formErrors.description_longue}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Description IA</label>
                  <textarea
                    data-field="description_ia"
                    value={form.description_ia}
                    onChange={e => updateForm('description_ia', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                    rows={2}
                  />
                  {formErrors.description_ia && <p className="mt-1 text-xs text-red-500">{formErrors.description_ia}</p>}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Matière</label>
                    <input
                      data-field="matiere"
                      value={form.matiere}
                      onChange={e => updateForm('matiere', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                    />
                    {formErrors.matiere && <p className="mt-1 text-xs text-red-500">{formErrors.matiere}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Couleur</label>
                    <input
                      data-field="couleur"
                      value={form.couleur}
                      onChange={e => updateForm('couleur', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                    />
                    {formErrors.couleur && <p className="mt-1 text-xs text-red-500">{formErrors.couleur}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Taille</label>
                    <input
                      data-field="taille"
                      value={form.taille}
                      onChange={e => updateForm('taille', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                    />
                    {formErrors.taille && <p className="mt-1 text-xs text-red-500">{formErrors.taille}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Prix unitaire (FCFA) *</label>
                    <input
                      data-field="prix_unitaire"
                      type="number"
                      value={form.prix_unitaire}
                      onChange={e => updateForm('prix_unitaire', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                    />
                    {formErrors.prix_unitaire && <p className="mt-1 text-xs text-red-500">{formErrors.prix_unitaire}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Prix promo (optionnel)</label>
                    <input
                      data-field="prix_promotionnel"
                      type="number"
                      value={form.prix_promotionnel}
                      onChange={e => updateForm('prix_promotionnel', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                    />
                    {formErrors.prix_promotionnel && <p className="mt-1 text-xs text-red-500">{formErrors.prix_promotionnel}</p>}
                  </div>
                </div>
                {isAdmin && (
                  <div>
                    <label className="block text-xs font-bold text-amber-400/80 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      Prix d'achat (FCFA) <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1 rounded">(Admin)</span>
                    </label>
                    <input
                      data-field="prix_achat"
                      type="number"
                      placeholder="ex: 3000"
                      value={form.prix_achat}
                      onChange={e => updateForm('prix_achat', e.target.value)}
                      className="w-full bg-white/5 border border-amber-500/20 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                    />
                    {form.prix_unitaire && form.prix_achat && (
                      <p className="text-xs text-emerald-400 mt-1">
                        Bénéfice estimé : +{(parseFloat(form.prix_unitaire) - parseFloat(form.prix_achat)).toLocaleString()} FCFA
                      </p>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Quantité en stock *</label>
                    <input
                      data-field="stock_quantite"
                      type="number"
                      value={form.stock_quantite}
                      onChange={e => updateForm('stock_quantite', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                    />
                    {formErrors.stock_quantite && <p className="mt-1 text-xs text-red-500">{formErrors.stock_quantite}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Seuil d'alerte</label>
                    <input
                      data-field="seuil_alerte_stock"
                      type="number"
                      value={form.seuil_alerte_stock}
                      onChange={e => updateForm('seuil_alerte_stock', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                    />
                    {formErrors.seuil_alerte_stock && <p className="mt-1 text-xs text-red-500">{formErrors.seuil_alerte_stock}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Poids (grammes)</label>
                  <input
                    data-field="poids_grammes"
                    type="number"
                    value={form.poids_grammes}
                    onChange={e => updateForm('poids_grammes', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                  />
                  {formErrors.poids_grammes && <p className="mt-1 text-xs text-red-500">{formErrors.poids_grammes}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 xl:sticky xl:top-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Images</h3>
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