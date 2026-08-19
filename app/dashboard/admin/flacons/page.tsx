'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Edit2, Trash2, Plus, Search, Filter, X, Image as ImageIcon } from 'lucide-react';
import { InlineCell } from '@/components/admin/InlineCell';
import { shopService, adminService } from '@/services/apiService';
import { useTranslation } from 'react-i18next';

/* ── Inline translations ─────────────────────────────────────────────────── */
const T = {
  fr: {
    title: 'Flacons',
    subtitle: 'Gestion des flacons et formats de contenance',
    add: 'Ajouter un flacon',
    col_name: 'Nom',
    col_volume: 'Contenance',
    col_material: 'Matière / Couleur',
    col_price: 'Prix Vente',
    col_margin: 'Bénéfice Unitaire',
    col_actions: 'Actions',
    not_defined: 'Non défini',
    no_type: 'Sans type',
    no_results: 'Aucun flacon trouvé.',
    loading: 'Chargement des flacons...',
    filter_type_all: 'Tous les types',
    filter_stock_all: 'Stock (tous)',
    filter_in_stock: 'En stock',
    filter_low_stock: 'Stock faible',
    modal_title_new: 'Ajouter un flacon',
    modal_title_edit: 'Modifier le flacon',
    modal_desc: 'Formulaire complet, sans popup ni défilement gênant.',
    field_name: 'Nom *',
    field_type: 'Type de Flacon *',
    field_volume: 'Contenance (ml)',
    field_weight: 'Poids (g)',
    field_material: 'Matière',
    field_color: 'Couleur',
    field_height: 'Hauteur (cm)',
    field_width: 'Largeur (cm)',
    field_price: 'Prix de vente (FCFA)',
    field_purchase: "Prix d'achat (FCFA)",
    field_stock: 'Quantité en stock',
    field_alert: "Seuil d'alerte stock",
    field_active: 'Flacon actif',
    field_image: 'Image principale',
    field_placeholder_type: 'Type Flacon',
    field_change_image: "Changer l'image",
    field_choose_image: 'Choisir une image',
    filter_type_label: 'Type :',
    filter_stock_label: 'Stock :',
    confirm_delete: 'Supprimer ce flacon ?',
    toast_load_error: 'Erreur lors du chargement des flacons',
    toast_create_ok: 'Flacon créé',
    toast_update_ok: 'Flacon mis à jour',
    toast_save_error: 'Erreur lors de la sauvegarde',
    toast_delete_ok: 'Flacon supprimé',
    toast_delete_error: 'Erreur lors de la suppression',
    toast_patch_error: 'Erreur lors de la mise à jour',
    toast_required: 'Champs requis : Nom, Type Flacon',
  },
  en: {
    title: 'Bottles',
    subtitle: 'Manage bottles and volume formats',
    add: 'Add a bottle',
    col_name: 'Name',
    col_volume: 'Volume',
    col_material: 'Material / Color',
    col_price: 'Sale Price',
    col_margin: 'Unit Margin',
    col_actions: 'Actions',
    not_defined: 'Not defined',
    no_type: 'No type',
    no_results: 'No bottles found.',
    loading: 'Loading bottles...',
    filter_type_all: 'All types',
    filter_stock_all: 'Stock (all)',
    filter_in_stock: 'In stock',
    filter_low_stock: 'Low stock',
    modal_title_new: 'Add a bottle',
    modal_title_edit: 'Edit bottle',
    modal_desc: 'Full form with no popup or scroll issues.',
    field_name: 'Name *',
    field_type: 'Bottle Type *',
    field_volume: 'Volume (ml)',
    field_weight: 'Weight (g)',
    field_material: 'Material',
    field_color: 'Color',
    field_height: 'Height (cm)',
    field_width: 'Width (cm)',
    field_price: 'Sale price (FCFA)',
    field_purchase: 'Purchase price (FCFA)',
    field_stock: 'Stock quantity',
    field_alert: 'Stock alert threshold',
    field_active: 'Active bottle',
    field_image: 'Main image',
    field_placeholder_type: 'Bottle Type',
    field_change_image: 'Change image',
    field_choose_image: 'Choose an image',
    filter_type_label: 'Type:',
    filter_stock_label: 'Stock:',
    confirm_delete: 'Delete this bottle?',
    toast_load_error: 'Error loading bottles',
    toast_create_ok: 'Bottle created',
    toast_update_ok: 'Bottle updated',
    toast_save_error: 'Error saving',
    toast_delete_ok: 'Bottle deleted',
    toast_delete_error: 'Error deleting',
    toast_patch_error: 'Error updating',
    toast_required: 'Required fields: Name, Bottle Type',
  },
} as const;
type TKey = keyof typeof T.fr;
import { useToastStore } from '@/store/useToastStore';
import { useCatalogPermissions } from '@/hooks/useCatalogPermissions';
import CatalogAccessNotice from '@/components/catalog/CatalogAccessNotice';
import { extractCatalogList } from '@/lib/catalogUtils';
import { useAuthStore } from '@/store/useAuthStore';
import { SlideOver } from '@/components/ui/SlideOver';
import AppImage from '@/components/ui/AppImage';

// --- Helper Functions & Primitives ---

function cx(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

type StatusType = 'emerald' | 'blue' | 'amber' | 'red' | 'purple';

function StatusChip({
  status,
  label,
}: {
  status: StatusType;
  label: string;
}) {
  const styles: Record<StatusType, { text: string; bg: string; ring: string; dot: string }> = {
    emerald: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      ring: 'ring-emerald-500/20',
      dot: 'bg-emerald-400',
    },
    blue: {
      text: 'text-blue-400',
      bg: 'bg-blue-500/10',
      ring: 'ring-blue-500/20',
      dot: 'bg-blue-400',
    },
    amber: {
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      ring: 'ring-amber-500/20',
      dot: 'bg-amber-400',
    },
    red: {
      text: 'text-red-400',
      bg: 'bg-red-500/10',
      ring: 'ring-red-500/20',
      dot: 'bg-red-400',
    },
    purple: {
      text: 'text-purple-400',
      bg: 'bg-purple-500/10',
      ring: 'ring-purple-500/20',
      dot: 'bg-purple-400',
    },
  };

  const current = styles[status] || styles.blue;

  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset',
        current.text,
        current.bg,
        current.ring
      )}
    >
      <span className={cx('h-1.5 w-1.5 rounded-full shrink-0', current.dot)} />
      {label}
    </span>
  );
}

function IconButton({
  icon: Icon,
  onClick,
  title,
  tint = 'neutral',
  disabled = false,
}: {
  icon: any;
  onClick?: () => void;
  title?: string;
  tint?: 'gold' | 'red' | 'blue' | 'emerald' | 'neutral';
  disabled?: boolean;
}) {
  const tintStyles = {
    gold: 'hover:text-gold hover:bg-gold/10',
    red: 'hover:text-red-400 hover:bg-red-500/10',
    blue: 'hover:text-blue-400 hover:bg-blue-500/10',
    emerald: 'hover:text-emerald-400 hover:bg-emerald-500/10',
    neutral: 'hover:text-foreground hover:bg-white/10',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'rounded-md p-1.5 text-foreground/45 transition-colors disabled:opacity-40 inline-flex items-center justify-center',
        tintStyles[tint]
      )}
      title={title}
    >
      <Icon size={14} />
    </button>
  );
}

// --- Main Page Component ---

export default function FlaconsAdminPage() {
  const permissions = useCatalogPermissions('flacons');
  const { user } = useAuthStore();
  const isAdmin = Boolean(user?.is_staff || user?.is_superuser || user?.role === 'superadmin');
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en') ?? false;
  const t = (k: TKey) => isEn ? T.en[k] : T.fr[k];
  const [bottles, setBottles] = useState<any[]>([]);
  const [bottleTypes, setBottleTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [enStockFilter, setEnStockFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBottle, setEditingBottle] = useState<any | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nom: '',
    type_flacon: '',
    contenance_ml: 100,
    matiere: 'Verre',
    couleur: 'Transparent',
    hauteur_cm: '15.00',
    largeur_cm: '6.00',
    poids_grammes: 200,
    prix_unitaire: '5000.00',
    prix_achat: '',
    stock_quantite: 100,
    seuil_alerte_stock: 10,
    actif: true,
  });

  const { addToast } = useToastStore();

  const fetchBottlesAndTypes = useCallback(async () => {
    if (!permissions.canRead) return;
    try {
      setLoading(true);
      const params: Record<string, unknown> = {};
      if (search) params.search = search;
      if (typeFilter) params.type_flacon = Number(typeFilter);
      if (enStockFilter === 'true') params.en_stock = true;
      if (enStockFilter === 'false') params.en_stock = false;
      const [bottlesData, typesData] = await Promise.all([
        shopService.getBottles(params),
        shopService.getBottleTypes(),
      ]);
      setBottles(extractCatalogList(bottlesData));
      setBottleTypes(extractCatalogList(typesData));
    } catch {
      addToast(t('toast_load_error'), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, permissions.canRead, search, typeFilter, enStockFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchBottlesAndTypes, 300);
    return () => clearTimeout(timer);
  }, [fetchBottlesAndTypes]);

  const updateForm = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenAdd = () => {
    if (!permissions.canCreate) return;
    setEditingBottle(null);
    setImageFile(null);
    setImagePreview(null);
    setForm({
      nom: '',
      type_flacon: bottleTypes[0]?.id ? String(bottleTypes[0].id) : '',
      contenance_ml: 100,
      matiere: 'Verre',
      couleur: 'Transparent',
      hauteur_cm: '15.00',
      largeur_cm: '6.00',
      poids_grammes: 200,
      prix_unitaire: '5000.00',
      prix_achat: '',
      stock_quantite: 100,
      seuil_alerte_stock: 10,
      actif: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (bot: any) => {
    if (!permissions.canUpdate) return;
    setEditingBottle(bot);
    setImageFile(null);
    setImagePreview(bot.image_principale || bot.image || null);
    setForm({
      nom: bot.nom || '',
      type_flacon: bot.type_flacon?.id ? String(bot.type_flacon.id) : String(bot.type_flacon || ''),
      contenance_ml: bot.contenance_ml || 100,
      matiere: bot.matiere || 'Verre',
      couleur: bot.couleur || 'Transparent',
      hauteur_cm: bot.hauteur_cm || '15.00',
      largeur_cm: bot.largeur_cm || '6.00',
      poids_grammes: bot.poids_grammes || 200,
      prix_unitaire: bot.prix_unitaire || '5000.00',
      prix_achat: bot.prix_achat ? String(bot.prix_achat) : '',
      stock_quantite: bot.stock_quantite || 100,
      seuil_alerte_stock: bot.seuil_alerte_stock || 10,
      actif: bot.actif !== undefined ? bot.actif : true,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!permissions.canCreate && !permissions.canUpdate) return;
    if (!form.nom || !form.type_flacon) {
      addToast(t('toast_required'), 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nom: form.nom,
        type_flacon: Number(form.type_flacon),
        contenance_ml: Number(form.contenance_ml),
        matiere: form.matiere,
        couleur: form.couleur,
        hauteur_cm: form.hauteur_cm,
        largeur_cm: form.largeur_cm,
        poids_grammes: Number(form.poids_grammes),
        prix_unitaire: form.prix_unitaire,
        stock_quantite: Number(form.stock_quantite),
        seuil_alerte_stock: Number(form.seuil_alerte_stock),
        actif: form.actif,
      };
      if (imageFile) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') formData.append(key, String(value));
        });
        formData.append('image_principale', imageFile);
        if (editingBottle) {
          setBottles(prev => prev.map(b => b.id === editingBottle.id ? { ...b, ...payload } : b));
          setShowModal(false);
          await adminService.patchFormData(`shop/flacons/${editingBottle.id}/`, formData);
          addToast(t('toast_update_ok'), 'success');
        } else {
          setShowModal(false);
          await adminService.postFormData('shop/flacons/', formData);
          addToast(t('toast_create_ok'), 'success');
        }
      } else {
        if (editingBottle) {
          setBottles(prev => prev.map(b => b.id === editingBottle.id ? { ...b, ...payload } : b));
          setShowModal(false);
          await shopService.updateBottle(editingBottle.id, payload);
          addToast(t('toast_update_ok'), 'success');
        } else {
          setShowModal(false);
          await shopService.createBottle(payload);
          addToast(t('toast_create_ok'), 'success');
        }
      }
      fetchBottlesAndTypes();
    } catch (error: any) {
      const msg = error?.response?.data ? JSON.stringify(error.response.data) : 'Erreur lors de la sauvegarde';
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const patchBottle = async (id: number, field: string, value: string) => {
    if (!permissions.canUpdate) return;
    setBottles(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
    try {
      await shopService.updateBottle(id, { [field]: value });
    } catch {
      addToast(t('toast_patch_error'), 'error');
      fetchBottlesAndTypes();
    }
  };

  const handleDelete = async (id: number) => {
    if (!permissions.canDelete) return;
    if (!confirm(t('confirm_delete'))) return;
    const snapshot = bottles.find(b => b.id === id);
    setBottles(prev => prev.filter(b => b.id !== id));
    try {
      await shopService.deleteBottle(id);
      addToast(t('toast_delete_ok'), 'success');
    } catch {
      if (snapshot) setBottles(prev => [snapshot, ...prev]);
      addToast(t('toast_delete_error'), 'error');
    }
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (typeFilter) count++;
    if (enStockFilter) count++;
    return count;
  }, [typeFilter, enStockFilter]);

  if (!permissions.canRead) {
    return (
      <div className="space-y-6">
        <CatalogAccessNotice permissions={permissions} resourceLabel="les flacons" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
          <p className="text-sm text-foreground/40 mt-0.5">
            {t('subtitle')}
          </p>
        </div>
        {permissions.canCreate && (
          <button
            onClick={handleOpenAdd}
            className="bg-gold text-black rounded-lg px-3.5 py-2 text-xs font-semibold hover:bg-gold/80 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus size={14} />
            <span>{t('add')}</span>
          </button>
        )}
      </div>

      <CatalogAccessNotice permissions={permissions} resourceLabel="les flacons" />

      {/* Toolbar & Expanded Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isEn ? 'Search a bottle...' : 'Rechercher un flacon...'}
              className="w-full bg-white/[0.02] border border-white/10 rounded-lg pl-9 pr-8 py-1.5 text-xs text-foreground placeholder:text-foreground/40 outline-none focus:border-white/20 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cx(
              'flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium transition-colors',
              showFilters || activeFiltersCount > 0
                ? 'bg-white/10 text-foreground'
                : 'text-foreground/60 hover:bg-white/5'
            )}
          >
            <Filter size={13} />
            <span>Filtres</span>
            {activeFiltersCount > 0 && (
              <span className="ml-0.5 rounded-full bg-gold px-1.5 py-0.2 text-[10px] font-bold text-black">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Expandable Filter Panel */}
        {showFilters && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground/50">Type :</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-foreground outline-none focus:border-white/20"
              >
                <option value="" className="bg-background text-foreground">{t('filter_type_all')}</option>
                {bottleTypes.map((t) => (
                  <option key={t.id} value={t.id} className="bg-background text-foreground">
                    {t.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground/50">Stock :</span>
              <select
                value={enStockFilter}
                onChange={(e) => setEnStockFilter(e.target.value)}
                className="text-xs bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-foreground outline-none focus:border-white/20"
              >
                <option value="" className="bg-background text-foreground">{t('filter_stock_all')}</option>
                <option value="true" className="bg-background text-foreground">{t('filter_in_stock')}</option>
                <option value="false" className="bg-background text-foreground">{t('filter_low_stock')}</option>
              </select>
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setTypeFilter('');
                  setEnStockFilter('');
                }}
                className="text-[11px] text-foreground/40 hover:text-foreground underline ml-auto"
              >
                Réinitialiser
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-foreground/40 gap-2 text-xs">
            <Loader2 className="animate-spin text-gold" size={16} />
            <span>{t('loading')}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                  <th className="pl-4 py-3">{t('col_name')}</th>
                  <th className="px-3 py-3">{t('col_volume')}</th>
                  <th className="px-3 py-3">Matière / Couleur</th>
                  <th className="px-3 py-3">{t('col_price')}</th>
                  {isAdmin && <th className="px-3 py-3">{t('col_margin')}</th>}
                  <th className="pr-4 py-3 text-right">{t('col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {bottles.map((b) => {
                  const prixVenteNum = parseFloat(String(b.prix_unitaire || 0));
                  const prixAchatNum = parseFloat(String(b.prix_achat || 0));
                  const beneficeCalc =
                    b.benefice_unitaire !== undefined
                      ? parseFloat(String(b.benefice_unitaire))
                      : b.prix_unitaire && b.prix_achat
                      ? prixVenteNum - prixAchatNum
                      : null;

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="pl-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
                            {(b.image_principale || b.image) ? (
                              <AppImage src={b.image_principale || b.image} alt={b.nom} fill className="object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-foreground/25">
                                <ImageIcon size={16} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              <InlineCell value={b.nom} onSave={v => patchBottle(b.id, 'nom', v)} disabled={!permissions.canUpdate} className="font-medium text-foreground" />
                            </p>
                            <p className="mt-0.5 text-[11px] text-foreground/35">{b.type_flacon?.nom || b.type_flacon_nom || t('no_type')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-foreground/60 tabular-nums">
                        <InlineCell value={String(b.contenance_ml ?? '')} onSave={v => patchBottle(b.id, 'contenance_ml', v)} disabled={!permissions.canUpdate} inputType="number" display={<>{b.contenance_ml} ml</>} className="text-foreground/60 tabular-nums" />
                      </td>
                      <td className="px-3 py-3 text-foreground/60">
                        <InlineCell value={b.matiere ?? ''} onSave={v => patchBottle(b.id, 'matiere', v)} disabled={!permissions.canUpdate} className="text-foreground/60" />
                        {' · '}
                        <InlineCell value={b.couleur ?? ''} onSave={v => patchBottle(b.id, 'couleur', v)} disabled={!permissions.canUpdate} className="text-foreground/60" />
                      </td>
                      <td className="px-3 py-3 font-semibold text-gold tabular-nums">
                        <InlineCell value={String(b.prix_unitaire ?? '')} onSave={v => patchBottle(b.id, 'prix_unitaire', v)} disabled={!permissions.canUpdate} inputType="number" display={<>{b.prix_unitaire} FCFA</>} className="font-semibold text-gold tabular-nums" />
                      </td>
                      {isAdmin && (
                        <td className="px-3 py-3">
                          {beneficeCalc !== null ? (
                            <StatusChip
                              status={beneficeCalc >= 0 ? 'emerald' : 'red'}
                              label={`+${beneficeCalc.toLocaleString()} FCFA`}
                            />
                          ) : (
                            <span className="text-foreground/30 text-xs italic">
                              Non défini
                            </span>
                          )}
                        </td>
                      )}
                      <td className="pr-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          {permissions.canUpdate && (
                            <IconButton
                              icon={Edit2}
                              onClick={() => handleOpenEdit(b)}
                              title="Modifier"
                              tint="gold"
                            />
                          )}
                          {permissions.canDelete && (
                            <IconButton
                              icon={Trash2}
                              onClick={() => handleDelete(b.id)}
                              title="Supprimer"
                              tint="red"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {bottles.length === 0 && (
                  <tr>
                    <td
                      colSpan={isAdmin ? 6 : 5}
                      className="py-16 text-center text-sm italic text-foreground/30"
                    >
                      {t('no_results')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SlideOver Drawer (Untouched Form Content) */}
      <SlideOver
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingBottle ? t('modal_title_edit') : t('modal_title_new')}
        description="Formulaire complet, sans popup ni défilement gênant."
        size="lg"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors"
            >
              {isEn ? 'Cancel' : 'Annuler'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-bold hover:bg-gold/80 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {saving ? (isEn ? 'Saving…' : 'Enregistrement…') : (isEn ? 'Save' : 'Enregistrer')}
            </button>
          </div>
        }
      >
        <div className="p-6 lg:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">
                  Nom *
                </label>
                <input
                  placeholder="Nom du flacon"
                  value={form.nom}
                  onChange={(e) => updateForm('nom', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">
                  Type de Flacon *
                </label>
                <select
                  value={form.type_flacon}
                  onChange={(e) => updateForm('type_flacon', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                >
                  <option value="" disabled className="text-black bg-white">
                    Type Flacon
                  </option>
                  {bottleTypes.map((t) => (
                    <option key={t.id} value={t.id} className="text-black bg-white">
                      {t.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">
                    Contenance (ml)
                  </label>
                  <input
                    type="number"
                    value={form.contenance_ml}
                    onChange={(e) => updateForm('contenance_ml', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">
                    Poids (g)
                  </label>
                  <input
                    type="number"
                    value={form.poids_grammes}
                    onChange={(e) => updateForm('poids_grammes', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">
                    Matière
                  </label>
                  <input
                    value={form.matiere}
                    onChange={(e) => updateForm('matiere', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">
                    Couleur
                  </label>
                  <input
                    value={form.couleur}
                    onChange={(e) => updateForm('couleur', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">
                    Hauteur (cm)
                  </label>
                  <input
                    value={form.hauteur_cm}
                    onChange={(e) => updateForm('hauteur_cm', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">
                    Largeur (cm)
                  </label>
                  <input
                    value={form.largeur_cm}
                    onChange={(e) => updateForm('largeur_cm', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  />
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-foreground/40">
                  Image principale
                </label>
                <div className="flex flex-col gap-3">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground/70 transition-colors hover:border-gold/40 hover:bg-white/10">
                    <Plus size={14} className="text-gold" />
                    <span>{imageFile ? 'Changer l’image' : 'Choisir une image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const nextPreview = URL.createObjectURL(file);
                        setImagePreview((prev) => {
                          if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
                          return nextPreview;
                        });
                        setImageFile(file);
                      }}
                    />
                  </label>
                  <div className="relative h-40 overflow-hidden rounded-lg border border-white/10 bg-background/70">
                    {imagePreview ? (
                      <AppImage src={imagePreview} alt="Aperçu du flacon" fill className="object-cover" />
                    ) : (editingBottle?.image_principale || editingBottle?.image) ? (
                      <AppImage src={editingBottle.image_principale || editingBottle.image} alt={editingBottle.nom} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-foreground/30">Aucune image</div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">
                  Prix Unitaire (FCFA)
                </label>
                <input
                  value={form.prix_unitaire}
                  onChange={(e) => updateForm('prix_unitaire', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                />
              </div>
              {isAdmin && (
                <div>
                  <label className="text-[10px] font-bold text-amber-400/80 uppercase block mb-1 flex items-center gap-1">
                    Prix d'achat (FCFA){' '}
                    <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1 rounded">
                      (Admin)
                    </span>
                  </label>
                  <input
                    type="number"
                    placeholder="ex: 2500"
                    value={form.prix_achat}
                    onChange={(e) => updateForm('prix_achat', e.target.value)}
                    className="w-full bg-white/5 border border-amber-500/20 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                  />
                  {form.prix_unitaire && form.prix_achat && (
                    <p className="text-xs text-emerald-400 mt-1">
                      Bénéfice estimé : +
                      {(
                        parseFloat(String(form.prix_unitaire)) -
                        parseFloat(String(form.prix_achat))
                      ).toLocaleString()}{' '}
                      FCFA
                    </p>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">
                    Stock Initial
                  </label>
                  <input
                    type="number"
                    value={form.stock_quantite}
                    onChange={(e) => updateForm('stock_quantite', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">
                    Seuil Alerte
                  </label>
                  <input
                    type="number"
                    value={form.seuil_alerte_stock}
                    onChange={(e) => updateForm('seuil_alerte_stock', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-base text-foreground outline-none focus:border-gold"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={form.actif}
                    onChange={(e) => updateForm('actif', e.target.checked)}
                    className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold"
                  />
                  <span className="text-xs text-foreground/60 font-medium">Actif</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </SlideOver>
    </div>
  );
}
