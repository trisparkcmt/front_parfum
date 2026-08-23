'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Edit2, Trash2, Plus, Search, RefreshCw, Filter } from 'lucide-react';
import { InlineCell } from '@/components/admin/InlineCell';
import { useTranslation } from 'react-i18next';

/* ── Inline translations ─────────────────────────────────────────────────── */
const T = {
  fr: {
    title: 'Produits Essence', subtitle: "Formats prêts à la vente (`/shop/produits-essence/`)",
    add: 'Ajouter', refresh: 'Actualiser',
    col_image: 'Image', col_name: 'Nom', col_essence: 'Essence',
    col_size: 'Taille', col_price: 'Prix actuel', col_stock: 'Stock', col_status: 'Statut', col_actions: 'Actions',
    active: 'Actif', inactive: 'Inactif',
    loading: 'Chargement...', no_results: 'Aucun produit essence trouvé.',
    filter_size_all: 'Toutes tailles', filter_btn: 'Filtres', filter_size_label: 'Taille',
    modal_new: 'Nouveau', modal_edit: 'Modifier',
    modal_desc: 'Formulaire complet, sans popup ni défilement gênant.',
    field_name: 'Nom du produit *', field_brand: 'Marque', field_category: 'Catégorie',
    field_essence: 'Essence *', field_size: 'Taille (ml) *', field_price: 'Prix (FCFA) *',
    field_promo: 'Prix promotionnel (FCFA)', field_stock: 'Stock disponible *',
    field_active: 'Produit actif', field_image: 'Image principale',
    confirm_delete: 'Supprimer ce produit essence ?',
    toast_load_error: 'Erreur lors du chargement des produits essence',
    toast_create_ok: 'Produit essence créé', toast_update_ok: 'Produit essence mis à jour',
    toast_save_error: 'Erreur lors de la sauvegarde', toast_delete_ok: 'Produit supprimé',
    toast_delete_error: 'Erreur lors de la suppression', toast_patch_error: 'Erreur lors de la mise à jour',
    toast_required: 'Veuillez corriger les champs obligatoires.',
    toast_duplicate: 'Un produit fini existe déjà pour cette essence et cette taille.',
  },
  en: {
    title: 'Essence Products', subtitle: 'Ready-to-sell formats (`/shop/produits-essence/`)',
    add: 'Add', refresh: 'Refresh',
    col_image: 'Image', col_name: 'Name', col_essence: 'Essence',
    col_size: 'Size', col_price: 'Current price', col_stock: 'Stock', col_status: 'Status', col_actions: 'Actions',
    active: 'Active', inactive: 'Inactive',
    loading: 'Loading...', no_results: 'No essence products found.',
    filter_size_all: 'All sizes', filter_btn: 'Filters', filter_size_label: 'Size',
    modal_new: 'New', modal_edit: 'Edit',
    modal_desc: 'Full form with no popup or scroll issues.',
    field_name: 'Product name *', field_brand: 'Brand', field_category: 'Category',
    field_essence: 'Essence *', field_size: 'Size (ml) *', field_price: 'Price (FCFA) *',
    field_promo: 'Promotional price (FCFA)', field_stock: 'Available stock *',
    field_active: 'Active product', field_image: 'Main image',
    confirm_delete: 'Delete this essence product?',
    toast_load_error: 'Error loading essence products',
    toast_create_ok: 'Essence product created', toast_update_ok: 'Essence product updated',
    toast_save_error: 'Error saving', toast_delete_ok: 'Product deleted',
    toast_delete_error: 'Error deleting', toast_patch_error: 'Error updating',
    toast_required: 'Please fix the required fields.',
    toast_duplicate: 'A finished product already exists for this essence and size.',
  },
} as const;
type TKey = keyof typeof T.fr;
import { shopService, labService, adminService as adm } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { useCatalogPermissions } from '@/hooks/useCatalogPermissions';
import CatalogAccessNotice from '@/components/catalog/CatalogAccessNotice';
import AppImage from '@/components/ui/AppImage';
import { extractCatalogList } from '@/lib/catalogUtils';
import { extractApiError } from '@/lib/apiError';
import { SlideOver } from '@/components/ui/SlideOver';

// --- Shared UI Primitives ---

function StatusChip({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${
        active
          ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
          : 'bg-red-500/10 text-red-400 ring-red-500/20'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? 'bg-emerald-400' : 'bg-red-400'
        }`}
      />
      {active ? 'Actif' : 'Inactif'}
    </span>
  );
}

function IconButton({
  onClick,
  icon: Icon,
  variant = 'gold',
  title,
}: {
  onClick: () => void;
  icon: any;
  variant?: 'gold' | 'red' | 'blue';
  title?: string;
}) {
  const hoverStyles = {
    gold: 'hover:text-gold hover:bg-gold/10',
    red: 'hover:text-red-400 hover:bg-red-500/10',
    blue: 'hover:text-blue-400 hover:bg-blue-500/10',
  };

  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-md p-1.5 text-foreground/45 transition-colors ${hoverStyles[variant]}`}
    >
      <Icon size={14} />
    </button>
  );
}

export default function FinishedEssenceAdminPage() {
  const permissions = useCatalogPermissions('produits_essence');
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en') ?? false;
  const t = (k: TKey) => isEn ? T.en[k] : T.fr[k];
  const [items, setItems] = useState<any[]>([]);
  const [essences, setEssences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tailleFilter, setTailleFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { addToast } = useToastStore();

  const [form, setForm] = useState({
    essence: '',
    taille_ml: '50',
    prix: '',
    prix_promotionnel: '',
    stock_disponible: '0',
    actif: true,
    nom: '',
    marque: '',
    categorie: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [lotStockMl, setLotStockMl] = useState<number | null>(null);
  const [loadingLotStock, setLoadingLotStock] = useState(false);
  const [essenceSearch, setEssenceSearch] = useState('');
  const [showEssenceDropdown, setShowEssenceDropdown] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!permissions.canRead) return;
    try {
      setLoading(true);
      const params: Record<string, unknown> = {};
      if (search) params.search = search;
      if (tailleFilter) params.taille_ml = Number(tailleFilter);
      const data = await shopService.getFinishedEssences(params);
      setItems(extractCatalogList(data));
    } catch {
    addToast(t('toast_load_error'), 'error');
    } finally {
      setLoading(false);
    }
  }, [search, tailleFilter, addToast, permissions.canRead]);

  useEffect(() => {
    const timer = setTimeout(fetchItems, 300);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  useEffect(() => {
    labService
      .getEssences()
      .then((data) => setEssences(extractCatalogList(data)))
      .catch(() => {});
  }, []);

  const fetchLotStockForEssence = useCallback(async (essenceId: string) => {
    if (!essenceId) {
      setLotStockMl(null);
      return;
    }
    try {
      setLoadingLotStock(true);
      const data = await labService.getLotsEssence({
        essence: Number(essenceId),
        actif: true,
      });
      const lots = extractCatalogList(data);
      const total = lots.reduce<number>((sum, lot: any) => {
        const stock = lot.stock_ml ?? lot.quantite_ml ?? '0';
        return sum + parseFloat(String(stock));
      }, 0);
      setLotStockMl(total);
    } catch {
      setLotStockMl(null);
    } finally {
      setLoadingLotStock(false);
    }
  }, []);

  useEffect(() => {
    if (showModal && form.essence) {
      fetchLotStockForEssence(form.essence);
    }
  }, [showModal, form.essence, fetchLotStockForEssence]);

  const mlRequis = Number(form.taille_ml || 0) * Number(form.stock_disponible || 0);
  const stockInsuffisant = lotStockMl !== null && mlRequis > 0 && mlRequis > lotStockMl;

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    if (!form.essence || form.essence === '') errors.essence = 'Une essence doit être sélectionnée';
    if (!form.nom.trim()) errors.nom = 'Le nom du produit est requis';
    if (!form.marque.trim()) errors.marque = 'La marque est requise';
    if (!form.categorie.trim()) errors.categorie = 'La catégorie est requise';
    if (!form.taille_ml || Number(form.taille_ml) <= 0) errors.taille_ml = 'La taille doit être supérieure à 0';
    if (!form.prix || Number(form.prix) <= 0) errors.prix = 'Le prix doit être supérieur à 0';
    if (form.stock_disponible === '' || Number(form.stock_disponible) < 0)
      errors.stock_disponible = 'Le stock est requis';
    if (stockInsuffisant) errors.stock_disponible = 'Le stock demandé dépasse le stock du lot laboratoire';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form.essence, form.nom, form.marque, form.categorie, form.taille_ml, form.prix, form.stock_disponible, stockInsuffisant]);

  const updateFormField = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const openAdd = () => {
    setEditing(null);
    setForm({
      essence: '',
      taille_ml: '',
      prix: '',
      prix_promotionnel: '',
      stock_disponible: '',
      actif: true,
      nom: '',
      marque: '',
      categorie: '',
    });
    setImageFile(null);
    setFormError('');
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    const essenceId = item.essence_details?.id ?? item.essence_id ?? item.essence ?? '';
    const priceValue = item.prix_actuel ?? item.prix ?? item.prix_unitaire ?? '';
    setForm({
      essence: String(essenceId ?? ''),
      taille_ml: String(item.taille_ml ?? ''),
      prix: String(priceValue ?? ''),
      prix_promotionnel: item.prix_promotionnel ? String(item.prix_promotionnel) : '',
      stock_disponible: String(item.stock_disponible ?? '0'),
      actif: item.actif !== false,
      nom: item.nom ?? '',
      marque: item.marque ?? '',
      categorie: item.categorie ?? '',
    });
    setImageFile(null);
    setFormError('');
    setFormErrors({});
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!permissions.canCreate && !permissions.canUpdate) return;
    if (!validateForm()) {
      setFormError('Veuillez corriger les champs obligatoires.');
      return;
    }

    const { adminService } = await import('@/services/apiService');

    const existingItems = await shopService.getFinishedEssences({
      essence: Number(form.essence),
      taille_ml: Number(form.taille_ml),
    });
    const existingList = extractCatalogList(existingItems).filter(
      (item: any) => !editing || String(item.id) !== String(editing.id)
    );
    if (!editing && existingList.length > 0) {
      setFormError('Un produit fini existe déjà pour cette essence et cette taille. Modifiez le produit existant plutôt que d’en créer un doublon.');
      setSaving(false);
      return;
    }

    const formData = new FormData();
    formData.append('essence', form.essence);
    formData.append('taille_ml', form.taille_ml);
    formData.append('prix', form.prix);
    if (form.prix_promotionnel) {
      formData.append('prix_promotionnel', form.prix_promotionnel);
    } else {
      formData.append('prix_promotionnel', '');
    }
    formData.append('stock_disponible', form.stock_disponible);
    formData.append('actif', String(form.actif));
    formData.append('nom', form.nom);
    formData.append('marque', form.marque);
    formData.append('categorie', form.categorie);
    if (imageFile) {
      formData.append('image_principale', imageFile);
    }

    try {
      setFormError('');
      setSaving(true);
      if (editing) {
        setItems(prev => prev.map(i => i.id === editing.id ? { ...i, ...Object.fromEntries(formData.entries()) } : i));
        setShowModal(false);
        await adm.patchFormData(`shop/produits-essence/${editing.id}/`, formData);
        addToast('Produit essence mis à jour', 'success');
        fetchItems();
      } else {
        setShowModal(false);
        await adm.postFormData('shop/produits-essence/', formData);
        addToast(t('toast_create_ok'), 'success');
        fetchItems();
      }
    } catch (err: any) {
      setFormError(extractApiError(err, 'Erreur lors de la sauvegarde'));
    } finally {
      setSaving(false);
    }
  };

  const patchProduitEssence = async (id: number, field: string, value: string) => {
    if (!permissions.canUpdate) return;
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
    try {
      const { adminService: adm } = await import('@/services/apiService');
      const fd = new FormData();
      fd.append(field, value);
      await adm.patchFormData(`shop/produits-essence/${id}/`, fd);
    } catch {
      addToast(t('toast_patch_error'), 'error');
      fetchItems();
    }
  };

  const handleDelete = async (id: number) => {
    if (!permissions.canDelete) return;
    if (!confirm(t('confirm_delete'))) return;
    const snapshot = items.find(i => i.id === id);
    setItems(prev => prev.filter(i => i.id !== id));
    try {
      await shopService.deleteFinishedEssence(id);
      addToast(t('toast_delete_ok'), 'success');
    } catch {
      if (snapshot) setItems(prev => [snapshot, ...prev]);
      addToast(t('toast_delete_error'), 'error');
    }
  };

  if (!permissions.canRead) {
    return (
      <div className="space-y-6">
        <CatalogAccessNotice permissions={permissions} resourceLabel="les produits essence" />
      </div>
    );
  }

  const activeFilterCount = tailleFilter ? 1 : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
          <p className="text-sm text-foreground/40 mt-0.5">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchItems()}
            className="flex items-center gap-2 border border-white/10 px-3 py-2 rounded-lg text-xs font-medium text-foreground/60 hover:bg-white/[0.06] transition-colors"
          >
            <RefreshCw size={14} />{t('refresh')}
          </button>
          {permissions.canCreate && (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 bg-gold text-black px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-gold/90 transition-colors"
            >
              <Plus size={15} /> {t('add')}
            </button>
          )}
        </div>
      </div>

      <CatalogAccessNotice permissions={permissions} resourceLabel="les produits essence" />

      {/* Toolbar / Inline Search & Collapsible Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="shadow-black/30 shadow-sm flex items-center gap-2 bg-white/[0.02] border border-white/10 rounded-lg px-3 py-2 flex-1">
            <Search size={14} className="text-foreground/40 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isEn ? 'Search by name, brand...' : 'Rechercher par nom, marque...'}
              className="text-xs bg-transparent outline-none flex-1 text-foreground placeholder:text-foreground/30"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`shadow-black/30 shadow-sm flex items-center gap-2 border border-white/10 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'bg-white/[0.06] text-foreground'
                : 'bg-white/[0.02] text-foreground/60 hover:bg-white/[0.05]'
            }`}
          >
            <Filter size={14} />
            <span>Filtres</span>
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center rounded-full bg-gold/20 text-gold text-[10px] h-4 w-4 font-semibold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel (Collapsible) */}
        {showFilters && (
          <div className="shadow-black/30 shadow-sm bg-white/[0.02] border border-white/10 rounded-xl p-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                Taille
              </label>
              <select
                value={tailleFilter}
                onChange={(e) => setTailleFilter(e.target.value)}
                className="bg-white/[0.03] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-white/20"
              >
                <option value="">Toutes tailles</option>
                {[10, 30, 50, 100].map((s) => (
                  <option key={s} value={s}>
                    {s} ml
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-xs text-foreground/40">
            <Loader2 className="animate-spin text-gold" size={16} />
            <span>{t('loading')}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-white/[0.02] border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                <tr>
                  <th className="px-4 py-3">{t('col_image')}</th>
                  <th className="px-4 py-3">{t('col_name')}</th>
                  <th className="px-4 py-3">{t('col_essence')}</th>
                  <th className="px-4 py-3">{t('col_size')}</th>
                  <th className="px-4 py-3">{t('col_price')}</th>
                  <th className="px-4 py-3">{t('col_stock')}</th>
                  <th className="px-4 py-3">{t('col_status')}</th>
                  <th className="px-4 py-3 text-right">{t('col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      {item.image_principale ? (
                        <AppImage
                          src={item.image_principale}
                          alt={item.nom || 'Produit'}
                          width={32}
                          height={32}
                          className="size-8 rounded-lg object-cover border border-white/10"
                        />
                      ) : (
                        <div className="size-8 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center text-[9px] text-foreground/30">
                          N/A
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div>
                        <p className="text-xs font-medium">
                          <InlineCell value={item.nom || ''} onSave={v => patchProduitEssence(item.id, 'nom', v)} disabled={!permissions.canUpdate} className="font-medium text-foreground" />
                        </p>
                        {item.marque && (
                          <p className="text-[10px] text-foreground/40">
                            {item.marque} · {item.categorie}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground/60">
                      {item.essence_details?.nom ??
                        essences.find((e: any) => e.id === item.essence || e.id === item.essence_id)?.nom ??
                        (item.essence ? `Essence #${item.essence}` : '—')}
                    </td>
                    <td className="px-4 py-3 font-mono text-foreground/80">{item.taille_ml} ml</td>
                    <td className="px-4 py-3 font-semibold text-gold tabular-nums">
                      <InlineCell value={String(item.prix_actuel ?? item.prix ?? '')} onSave={v => patchProduitEssence(item.id, 'prix', v)} disabled={!permissions.canUpdate} inputType="number" display={<>{Number(item.prix_actuel ?? item.prix).toLocaleString()} FCFA</>} className="font-semibold text-gold tabular-nums" />
                    </td>
                    <td className="px-4 py-3 font-mono text-foreground/80">
                      <InlineCell value={String(item.stock_disponible ?? '0')} onSave={v => patchProduitEssence(item.id, 'stock_disponible', v)} disabled={!permissions.canUpdate} inputType="number" className="font-mono text-foreground/80 tabular-nums" />
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip active={item.actif} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        {permissions.canUpdate && (
                          <IconButton
                            onClick={() => openEdit(item)}
                            icon={Edit2}
                            variant="gold"
                        title={isEn ? 'Edit' : 'Modifier'}
                          />
                        )}
                        {permissions.canDelete && (
                          <IconButton
                            onClick={() => handleDelete(item.id)}
                            icon={Trash2}
                            variant="red"
                            title="Supprimer"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-sm italic text-foreground/30">
                      {t('no_results')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Untouched Off-limits Create/Edit Form Modal */}
      <SlideOver
        isOpen={Boolean(showModal && (permissions.canCreate || permissions.canUpdate))}
        onClose={() => setShowModal(false)}
        title={editing ? t('modal_edit') : t('modal_new')}
        description={t('modal_desc')}
        size="lg"
        footer={
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 rounded-xl py-2.5 text-sm">Annuler</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gold text-black rounded-xl py-2.5 text-sm font-bold disabled:opacity-50"
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Nom du produit *</label>
            <input
              data-field="nom"
              value={form.nom}
              onChange={(e) => updateFormField('nom', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
            />
            {formErrors.nom && <p className="mt-1 text-xs text-red-500">{formErrors.nom}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Marque</label>
              <input
                data-field="marque"
                value={form.marque}
                onChange={(e) => updateFormField('marque', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
              />
              {formErrors.marque && <p className="mt-1 text-xs text-red-500">{formErrors.marque}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Catégorie</label>
              <input
                data-field="categorie"
                value={form.categorie}
                onChange={(e) => updateFormField('categorie', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
              />
              {formErrors.categorie && <p className="mt-1 text-xs text-red-500">{formErrors.categorie}</p>}
            </div>
          </div>
        </div>

        <div className="relative">
          <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Essence de base *</label>
          <div
            data-field="essence"
            className={`w-full bg-white/5 border rounded-xl px-3 py-2.5 text-base outline-none focus:border-gold bg-neutral-900 cursor-pointer flex items-center justify-between ${formErrors.essence ? 'border-red-500/50' : 'border-white/10'}`}
            onClick={() => setShowEssenceDropdown(v => !v)}
          >
            <span className={form.essence ? 'text-foreground' : 'text-foreground/40'}>
              {form.essence
                ? essences.find((e: any) => String(e.id) === form.essence)?.nom ?? `Essence #${form.essence}`
                : 'Choisir une essence…'}
            </span>
            <Search size={14} className="text-foreground/40" />
          </div>
          {formErrors.essence && <p className="mt-1 text-xs text-red-500">{formErrors.essence}</p>}
          {showEssenceDropdown && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-neutral-900 border border-white/10 rounded-xl shadow-sm overflow-hidden">
              <div className="p-2">
                <input
                  autoFocus
                  value={essenceSearch}
                  onChange={e => setEssenceSearch(e.target.value)}
                  placeholder="Rechercher une essence…"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {essences
                  .filter((e: any) =>
                    !essenceSearch ||
                    e.nom?.toLowerCase().includes(essenceSearch.toLowerCase()) ||
                    e.marque?.toLowerCase().includes(essenceSearch.toLowerCase())
                  )
                  .map((e: any) => (
                    <button
                      key={e.id}
                      onClick={() => {
                        setForm(f => ({ ...f, essence: String(e.id) }));
                        setFormErrors((prev) => {
                          if (!prev.essence) return prev;
                          const next = { ...prev };
                          delete next.essence;
                          return next;
                        });
                        setShowEssenceDropdown(false);
                        setEssenceSearch('');
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors ${
                        String(e.id) === form.essence ? 'text-gold bg-gold/10' : 'text-foreground'
                      }`}
                    >
                      <span className="font-medium">{e.nom}</span>
                      {e.marque && <span className="text-foreground/40 ml-2 text-xs">— {e.marque}</span>}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Image principale</label>
          <input
            data-field="imageFile"
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none file:bg-gold file:text-black file:border-0 file:rounded file:px-2 file:py-1 file:mr-2 file:text-xs file:font-semibold"
          />
          {formErrors.imageFile && <p className="mt-1 text-xs text-red-500">{formErrors.imageFile}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Taille (ml) *</label>
            <input
              data-field="taille_ml"
              type="number"
              value={form.taille_ml}
              onChange={(e) => updateFormField('taille_ml', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
            />
            {formErrors.taille_ml && <p className="mt-1 text-xs text-red-500">{formErrors.taille_ml}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Stock *</label>
            <input
              data-field="stock_disponible"
              type="number"
              value={form.stock_disponible}
              onChange={(e) => updateFormField('stock_disponible', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
            />
            {formErrors.stock_disponible && <p className="mt-1 text-xs text-red-500">{formErrors.stock_disponible}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Prix (FCFA) *</label>
            <input
              data-field="prix"
              type="number"
              value={form.prix}
              onChange={(e) => updateFormField('prix', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
            />
            {formErrors.prix && <p className="mt-1 text-xs text-red-500">{formErrors.prix}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1.5">Prix Promo</label>
            <input
              data-field="prix_promotionnel"
              type="number"
              value={form.prix_promotionnel}
              onChange={(e) => updateFormField('prix_promotionnel', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-base text-foreground outline-none focus:border-gold"
            />
            {formErrors.prix_promotionnel && <p className="mt-1 text-xs text-red-500">{formErrors.prix_promotionnel}</p>}
          </div>
        </div>

        {!editing && form.essence && (
          <div className={`rounded-xl border px-4 py-3 text-sm space-y-1 ${stockInsuffisant ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-white/10 bg-white/5 text-foreground/70'}`}>
            <p className="font-semibold text-xs uppercase tracking-wider text-foreground/50">Consommation lot laboratoire</p>
            <p>
              ML requis : <span className="font-bold">{mlRequis.toLocaleString()} ml</span>
              {' '}(taille × stock)
            </p>
            <p>
              Stock lot disponible :{' '}
              {loadingLotStock ? (
                <span className="text-foreground/40">calcul…</span>
              ) : lotStockMl !== null ? (
                <span className={`font-bold ${stockInsuffisant ? 'text-red-400' : 'text-emerald-400'}`}>
                  {lotStockMl.toLocaleString()} ml
                </span>
              ) : (
                <span className="text-foreground/40">—</span>
              )}
            </p>
            {stockInsuffisant && (
              <p className="text-xs pt-1">
                Stock insuffisant — créez un lot via Labo ou réduisez le stock demandé.
              </p>
            )}
          </div>
        )}

        <label className="flex items-center gap-2 text-sm pt-1 cursor-pointer">
          <input
            type="checkbox"
            checked={form.actif}
            onChange={(e) => setForm((f) => ({ ...f, actif: e.target.checked }))}
            className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold"
          />
          Produit actif
        </label>

        {formError && (
          <p className="text-sm font-semibold text-red-500 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl text-center whitespace-pre-line">
            {formError}
          </p>
        )}
      </SlideOver>
    </div>
  );
}