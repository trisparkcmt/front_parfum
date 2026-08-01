'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Edit2, Trash2, Plus, Search, Image as ImageIcon, SlidersHorizontal } from 'lucide-react';
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
import { useAuthStore } from '@/store/useAuthStore';
import { FormModal } from '@/components/ui/FormModal';

/* -------------------------------------------------------------------------- */
/*                               SHARED PRIMITIVES                            */
/* -------------------------------------------------------------------------- */

function cx(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

type StatusType = 'emerald' | 'blue' | 'amber' | 'red' | 'purple' | 'gold' | 'neutral';

interface StatusChipProps {
  label: string;
  type?: StatusType;
}

function StatusChip({ label, type = 'neutral' }: StatusChipProps) {
  const styles: Record<StatusType, { bg: string; text: string; ring: string; dot: string }> = {
    emerald: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      ring: 'ring-emerald-500/20',
      dot: 'bg-emerald-400',
    },
    blue: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      ring: 'ring-blue-500/20',
      dot: 'bg-blue-400',
    },
    amber: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      ring: 'ring-amber-500/20',
      dot: 'bg-amber-400',
    },
    red: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      ring: 'ring-red-500/20',
      dot: 'bg-red-400',
    },
    purple: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      ring: 'ring-purple-500/20',
      dot: 'bg-purple-400',
    },
    gold: {
      bg: 'bg-gold/10',
      text: 'text-gold',
      ring: 'ring-gold/20',
      dot: 'bg-gold',
    },
    neutral: {
      bg: 'bg-white/5',
      text: 'text-foreground/60',
      ring: 'ring-white/10',
      dot: 'bg-foreground/40',
    },
  };

  const style = styles[type] || styles.neutral;

  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset',
        style.bg,
        style.text,
        style.ring
      )}
    >
      <span className={cx('h-1.5 w-1.5 rounded-full', style.dot)} />
      {label}
    </span>
  );
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'red' | 'blue' | 'neutral';
  children: React.ReactNode;
}

function IconButton({ variant = 'neutral', children, className, ...props }: IconButtonProps) {
  const variants = {
    gold: 'hover:text-gold hover:bg-gold/10',
    red: 'hover:text-red-400 hover:bg-red-500/10',
    blue: 'hover:text-blue-400 hover:bg-blue-500/10',
    neutral: 'hover:text-foreground hover:bg-white/5',
  };

  return (
    <button
      {...props}
      className={cx(
        'rounded-md p-1.5 text-foreground/45 transition-colors focus:outline-none',
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                                MAIN COMPONENT                              */
/* -------------------------------------------------------------------------- */

export default function PerfumeAdminPage() {
  const permissions = useCatalogPermissions('parfums');
  const { user } = useAuthStore();
  const isAdmin = Boolean(user?.is_staff || user?.is_superuser || user?.role === 'superadmin');
  const [perfumes, setPerfumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [estBestsellerFilter, setEstBestsellerFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
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
    prix_achat: '',
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
    if (Object.keys(errors).length > 0) {
      setTimeout(() => {
        const firstField = Object.keys(errors)[0];
        const el = document.querySelector(`[data-field="${firstField}"]`);
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
          el.focus();
        }
      }, 0);
    }
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
      marque: '',
      nom: '',
      slug: '',
      reference_sku: '',
      description_courte: '',
      description_longue: '',
      description_ia: '',
      contenance_ml: '',
      prix_unitaire: '',
      prix_achat: '',
      prix_promotionnel: '',
      taux_reduction: '',
      date_debut: '',
      date_fin: '',
      genre_cible: '',
      intensite: '',
      notes_tete: '',
      notes_coeur: '',
      notes_fond: '',
      est_nouveau: false,
      est_bestseller: false,
      stock_quantite: '',
      seuil_alerte_stock: '',
      categorie: '',
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
      prix_achat: perf.prix_achat ? String(perf.prix_achat) : '',
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
  const activeFiltersCount = (genreFilter ? 1 : 0) + (estBestsellerFilter ? 1 : 0);

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
          <h1 className="text-xl font-semibold text-foreground">Parfums</h1>
          <p className="text-sm text-foreground/40">Gestion du catalogue de parfums</p>
        </div>
        {permissions.canCreate && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 rounded-lg bg-gold px-3.5 py-2 text-xs font-semibold text-black transition-opacity hover:opacity-90"
          >
            <Plus size={15} />
            <span>Ajouter</span>
          </button>
        )}
      </div>

      <CatalogAccessNotice permissions={permissions} resourceLabel="les parfums" />

      {/* KPI Summary Strip */}
      <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.02] divide-x divide-white/10 overflow-x-auto">
        <div className="flex-1 min-w-[120px] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Total Parfums</p>
          <p className="text-xl font-semibold tabular-nums text-foreground mt-0.5">{perfumes.length}</p>
        </div>
        <div className="flex-1 min-w-[120px] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Bestsellers</p>
          <p className="text-xl font-semibold tabular-nums text-foreground mt-0.5">
            {perfumes.filter(p => p.est_bestseller).length}
          </p>
        </div>
        <div className="flex-1 min-w-[120px] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">En Rupture</p>
          <p className="text-xl font-semibold tabular-nums text-foreground mt-0.5">
            {perfumes.filter(p => Number(p.stock_quantite ?? p.stock ?? 0) === 0).length}
          </p>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un parfum..."
              className="w-full rounded-lg border border-white/10 bg-white/[0.02] pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-foreground/40 outline-none focus:border-white/20"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cx(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
              showFilters || activeFiltersCount > 0
                ? 'border-gold/40 text-gold bg-gold/5'
                : 'border-white/10 text-foreground/60 hover:bg-white/[0.03]'
            )}
          >
            <SlidersHorizontal size={14} />
            <span>Filtres</span>
            {activeFiltersCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-black">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Expanded Filters Panel */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Genre:</span>
              <select
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className="rounded-lg border border-white/10 bg-background px-2.5 py-1.5 text-xs text-foreground outline-none"
              >
                <option value="">Tous les genres</option>
                <option value="homme">Homme</option>
                <option value="femme">Femme</option>
                <option value="mixte">Mixte</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Bestseller:</span>
              <select
                value={estBestsellerFilter}
                onChange={(e) => setEstBestsellerFilter(e.target.value)}
                className="rounded-lg border border-white/10 bg-background px-2.5 py-1.5 text-xs text-foreground outline-none"
              >
                <option value="">Tous</option>
                <option value="true">Bestsellers uniquement</option>
                <option value="false">Non bestsellers</option>
              </select>
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setGenreFilter('');
                  setEstBestsellerFilter('');
                }}
                className="ml-auto text-[11px] text-foreground/45 hover:text-foreground"
              >
                Réinitialiser
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden min-h-[300px]">
        {/* Selection Bar */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 bg-white/[0.01]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
            {selectedSlugs.length > 0 ? `${selectedSlugs.length} sélectionné(s)` : 'Catalogue'}
          </p>
          {selectedSlugs.length > 0 && permissions.canDelete && (
            <button
              onClick={handleBulkDelete}
              className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
            >
              Supprimer la sélection
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-foreground/40 gap-2">
            <Loader2 className="animate-spin text-gold" size={20} />
            <p className="text-xs">Chargement des parfums...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35 w-10">
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
                      className="rounded border-white/10 bg-white/5 text-gold focus:ring-0 focus:ring-offset-0"
                    />
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35 w-14">Image</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Nom</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Statut</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Stock</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Contenance</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Prix Vente</th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">Marge</th>
                  )}
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/35 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(p => {
                  const productImg = p.image_principale || p.image;
                  const slugKey = p.slug || String(p.id);
                  const isSelected = selectedSlugs.includes(slugKey);
                  const prixVenteNum = parseFloat(String(p.prix_unitaire || 0));
                  const prixAchatNum = parseFloat(String(p.prix_achat || 0));
                  const beneficeCalc = p.benefice_unitaire !== undefined 
                    ? parseFloat(String(p.benefice_unitaire))
                    : (p.prix_unitaire && p.prix_achat ? prixVenteNum - prixAchatNum : null);
                  const stockQty = Number(p.stock_quantite ?? p.stock ?? 0);

                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectedSlug(slugKey)}
                          className="rounded border-white/10 bg-white/5 text-gold focus:ring-0 focus:ring-offset-0"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="relative w-9 h-9 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                          {productImg ? (
                            <AppImage
                              src={productImg}
                              alt={p.nom || 'Parfum'}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <ImageIcon size={14} className="text-foreground/20" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-foreground whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{p.nom || p.name}</span>
                          {p.marque && <span className="text-[10px] text-foreground/40">{p.marque}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {stockQty === 0 ? (
                            <StatusChip label="Rupture" type="red" />
                          ) : stockQty <= Number(p.seuil_alerte_stock || 5) ? (
                            <StatusChip label="Stock bas" type="amber" />
                          ) : (
                            <StatusChip label="En stock" type="emerald" />
                          )}
                          {p.est_bestseller && <StatusChip label="Bestseller" type="gold" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs tabular-nums text-foreground/60 whitespace-nowrap">
                        {stockQty}
                      </td>
                      <td className="px-4 py-3 text-xs tabular-nums text-foreground/60 whitespace-nowrap">
                        {p.contenance_ml ? `${p.contenance_ml} ml` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold tabular-nums text-foreground whitespace-nowrap">
                        {p.taux_reduction ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-foreground/40 line-through text-[11px] font-normal">{p.prix_unitaire} FCFA</span>
                            <span className="text-gold">{p.prix_actuel} FCFA</span>
                          </div>
                        ) : (
                          <span>{p.prix_unitaire ? `${p.prix_unitaire} FCFA` : '—'}</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-xs font-medium tabular-nums whitespace-nowrap">
                          {beneficeCalc !== null ? (
                            <span className={beneficeCalc >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                              +{beneficeCalc.toLocaleString()} FCFA
                            </span>
                          ) : (
                            <span className="text-foreground/30 text-[11px] italic">—</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {permissions.canUpdate && (
                            <IconButton variant="gold" onClick={() => handleOpenEdit(p)} title="Modifier">
                              <Edit2 size={14} />
                            </IconButton>
                          )}
                          {permissions.canDelete && (
                            <IconButton variant="red" onClick={() => handleDelete(p.slug)} title="Supprimer">
                              <Trash2 size={14} />
                            </IconButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 9 : 8} className="text-center py-16 text-xs italic text-foreground/30">
                      Aucun parfum trouvé dans le catalogue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal (Verbatim copy of form structure & handlers to prevent broken logic) */}
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
                    <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Marque *</label>
                    <input
                      data-field="marque"
                      value={form.marque}
                      onChange={(e) => updateForm('marque', e.target.value)}
                      className={`w-full bg-white/5 border rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold ${formErrors.marque ? 'border-red-500/50' : 'border-white/10'}`}
                    />
                    {formErrors.marque && <p className="mt-1 text-xs text-red-500">{formErrors.marque}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Nom *</label>
                    <input
                      data-field="nom"
                      value={form.nom}
                      onChange={(e) => updateForm('nom', e.target.value)}
                      className={`w-full bg-white/5 border rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold ${formErrors.nom ? 'border-red-500/50' : 'border-white/10'}`}
                    />
                    {formErrors.nom && <p className="mt-1 text-xs text-red-500">{formErrors.nom}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Slug (optionnel)</label>
                    <input
                      data-field="slug"
                      value={form.slug}
                      onChange={(e) => updateForm('slug', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Référence SKU (optionnel)</label>
                    <input
                      data-field="reference_sku"
                      value={form.reference_sku}
                      onChange={(e) => updateForm('reference_sku', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Catégorie *</label>
                    <div className="flex gap-2">
                      <select
                        data-field="categorie"
                        value={form.categorie}
                        onChange={(e) => updateForm('categorie', e.target.value)}
                        className={`flex-1 bg-white/5 border rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold ${formErrors.categorie ? 'border-red-500/50' : 'border-white/10'}`}
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
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Genre</label>
                      <select
                        data-field="genre_cible"
                        value={form.genre_cible}
                        onChange={(e) => updateForm('genre_cible', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                      >
                        <option value="homme">Homme</option>
                        <option value="femme">Femme</option>
                        <option value="mixte">Mixte</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Intensité</label>
                      <select
                        data-field="intensite"
                        value={form.intensite}
                        onChange={(e) => updateForm('intensite', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                      >
                        <option value="légère">Légère</option>
                        <option value="moyenne">Moyenne</option>
                        <option value="forte">Forte</option>
                        <option value="très forte">Très forte</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Notes tête</label>
                      <input
                        data-field="notes_tete"
                        value={form.notes_tete}
                        onChange={(e) => updateForm('notes_tete', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Notes cœur</label>
                      <input
                        data-field="notes_coeur"
                        value={form.notes_coeur}
                        onChange={(e) => updateForm('notes_coeur', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Notes fond</label>
                      <input
                        data-field="notes_fond"
                        value={form.notes_fond}
                        onChange={(e) => updateForm('notes_fond', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Contenance (ml) *</label>
                    <input
                      data-field="contenance_ml"
                      type="number"
                      placeholder="ex: 100"
                      value={form.contenance_ml}
                      onChange={(e) => updateForm('contenance_ml', e.target.value)}
                      className={`w-full bg-white/5 border rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold ${formErrors.contenance_ml ? 'border-red-500/50' : 'border-white/10'}`}
                    />
                    {formErrors.contenance_ml && <p className="mt-1 text-xs text-red-500">{formErrors.contenance_ml}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Prix unitaire (FCFA) *</label>
                    <input
                      data-field="prix_unitaire"
                      type="number"
                      placeholder="ex: 25000"
                      value={form.prix_unitaire}
                      onChange={(e) => updateForm('prix_unitaire', e.target.value)}
                      className={`w-full bg-white/5 border rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold ${formErrors.prix_unitaire ? 'border-red-500/50' : 'border-white/10'}`}
                    />
                    {formErrors.prix_unitaire && <p className="mt-1 text-xs text-red-500">{formErrors.prix_unitaire}</p>}
                  </div>
                  {isAdmin && (
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-amber-400/80 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        Prix d'achat (FCFA) <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1 rounded">(Admin)</span>
                      </label>
                      <input
                        data-field="prix_achat"
                        type="number"
                        placeholder="ex: 15000"
                        value={form.prix_achat}
                        onChange={(e) => updateForm('prix_achat', e.target.value)}
                        className="w-full bg-white/5 border border-amber-500/20 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                      />
                      {form.prix_unitaire && form.prix_achat && (
                        <p className="text-xs text-emerald-400 mt-1">
                          Bénéfice estimé : +{(parseFloat(form.prix_unitaire) - parseFloat(form.prix_achat)).toLocaleString()} FCFA
                        </p>
                      )}
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Stock *</label>
                    <input
                      data-field="stock_quantite"
                      type="number"
                      value={form.stock_quantite}
                      onChange={(e) => updateForm('stock_quantite', e.target.value)}
                      className={`w-full bg-white/5 border rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold ${formErrors.stock_quantite ? 'border-red-500/50' : 'border-white/10'}`}
                    />
                    {formErrors.stock_quantite && <p className="mt-1 text-xs text-red-500">{formErrors.stock_quantite}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Seuil d’alerte</label>
                    <input
                      data-field="seuil_alerte_stock"
                      type="number"
                      value={form.seuil_alerte_stock}
                      onChange={(e) => updateForm('seuil_alerte_stock', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Prix promo</label>
                      <input
                        data-field="prix_promotionnel"
                        type="number"
                        placeholder="ex: 18000"
                        value={form.prix_promotionnel}
                        onChange={(e) => updateForm('prix_promotionnel', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Taux réduction (%)</label>
                      <input
                        data-field="taux_reduction"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="ex: 20"
                        value={form.taux_reduction}
                        onChange={(e) => updateForm('taux_reduction', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Date début</label>
                      <input
                        data-field="date_debut"
                        type="datetime-local"
                        value={form.date_debut}
                        onChange={(e) => updateForm('date_debut', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Date fin</label>
                      <input
                        data-field="date_fin"
                        type="datetime-local"
                        value={form.date_fin}
                        onChange={(e) => updateForm('date_fin', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Description courte</label>
                  <textarea
                    data-field="description_courte"
                    value={form.description_courte}
                    onChange={(e) => updateForm('description_courte', e.target.value)}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Description longue</label>
                  <textarea
                    data-field="description_longue"
                    value={form.description_longue}
                    onChange={(e) => updateForm('description_longue', e.target.value)}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Description IA</label>
                  <textarea
                    data-field="description_ia"
                    value={form.description_ia}
                    onChange={(e) => updateForm('description_ia', e.target.value)}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Message promo (optionnel)</label>
                  <textarea
                    data-field="message_promotion"
                    value={form.message_promotion}
                    onChange={(e) => updateForm('message_promotion', e.target.value)}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold resize-none"
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