'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FlaskConical, Package, Layers, Plus, Edit2, Trash2,
  Loader2, Search, RefreshCw, AlertTriangle, Filter, X
} from 'lucide-react';
import { labService } from '@/services/apiService';
import { InlineCell } from '@/components/admin/InlineCell';
import { useTranslation } from 'react-i18next';

/* ── Inline translations ─────────────────────────────────────────────────── */
const T = {
  fr: {
    // Page tabs
    tab_ingredients: 'Ingrédients',
    tab_lots: 'Lots d\'Essence',
    tab_inventory: 'Inventaire Labo',
    // Ingredients tab
    ing_title: 'Ingrédients de composition',
    ing_add: 'Ajouter un ingrédient',
    ing_search: 'Rechercher un ingrédient...',
    ing_col_ingredient: 'Ingrédient',
    ing_col_price: 'Prix / ml',
    ing_col_stock: 'Stock (ml)',
    ing_col_alert: 'Seuil alerte',
    ing_col_active: 'Actif',
    ing_col_actions: 'Actions',
    ing_no_results: 'Aucun ingrédient trouvé.',
    ing_loading: 'Chargement des ingrédients...',
    ing_modal_new: 'Ajouter un ingrédient',
    ing_modal_edit: 'Modifier l\'ingrédient',
    ing_field_name: 'Nom *',
    ing_field_desc: 'Description',
    ing_field_price: 'Prix Vente / ml *',
    ing_field_purchase: 'Prix Achat / ml',
    ing_field_stock: 'Stock (ml) *',
    ing_field_alert: 'Seuil alerte (ml)',
    ing_field_active: 'Ingrédient actif',
    ing_confirm_delete: 'Supprimer cet ingrédient ?',
    ing_toast_load: 'Erreur lors du chargement des ingrédients',
    ing_toast_create: 'Ingrédient créé',
    ing_toast_update: 'Ingrédient mis à jour',
    ing_toast_delete: 'Ingrédient supprimé',
    ing_toast_delete_error: 'Erreur lors de la suppression',
    ing_toast_save_error: 'Erreur lors de la sauvegarde',
    ing_toast_patch: 'Erreur lors de la mise à jour',
    ing_required: 'Nom, prix par ml et stock requis',
    // Lots tab
    lot_title: 'Lots d\'essence',
    lot_add: 'Créer un lot',
    lot_search: 'Filtres',
    lot_col_ref: 'Réf. / Lot',
    lot_col_essence: 'Essence',
    lot_col_stock: 'Stock Restant (ml)',
    lot_col_cost: 'Coût d\'Achat Total',
    lot_col_ca: 'CA Généré',
    lot_col_margin: 'Bénéfice Lot',
    lot_col_status: 'Statut',
    lot_col_actions: 'Actions',
    lot_no_results: 'Aucun lot enregistré.',
    lot_loading: 'Chargement...',
    lot_modal_new: 'Créer un lot',
    lot_modal_edit: 'Modifier le lot',
    lot_modal_desc: 'Gestion détaillée d\'un lot d\'essence avec calcul des coûts d\'achat.',
    lot_field_essence: 'Essence *',
    lot_field_qty: 'Quantité initiale reçue (ml) *',
    lot_field_purchase: 'Prix d\'achat par ml (FCFA) *',
    lot_field_stock: 'Stock restant (ml)',
    lot_field_alert: 'Seuil alerte (ml)',
    lot_field_ref: 'Référence fournisseur',
    lot_field_active: 'Lot actif',
    lot_confirm_delete: 'Supprimer ce lot ?',
    lot_toast_load: 'Erreur lors du chargement des lots',
    lot_toast_create: 'Lot créé',
    lot_toast_update: 'Lot mis à jour',
    lot_toast_delete: 'Lot supprimé',
    lot_toast_delete_error: 'Erreur lors de la suppression',
    lot_toast_save_error: 'Erreur lors de la sauvegarde',
    lot_toast_patch: 'Erreur lors de la mise à jour',
    lot_required: 'Essence et quantité requises',
    lot_status_active: 'Actif',
    lot_status_done: 'Terminé',
    // Inventory tab
    inv_title: 'Inventaire du laboratoire',
    inv_loading: 'Chargement...',
    inv_col_essence: 'Essence',
    inv_col_qty: 'Quantité Disponible (ml)',
    inv_col_alert: 'Seuil Alerte (ml)',
    inv_col_status: 'Statut Stock',
    inv_col_actions: 'Actions',
    inv_no_results: 'Aucun stock enregistré.',
    inv_status_ok: 'Stock OK',
    inv_status_low: 'Stock Bas',
    inv_status_critical: 'Critique',
    inv_modal_edit: 'Modifier l\'inventaire',
    inv_field_qty: 'Quantité disponible (ml)',
    inv_field_alert: 'Seuil d\'alerte (ml)',
    inv_field_active: 'Actif',
    inv_toast_load: 'Erreur lors du chargement de l\'inventaire',
    inv_toast_update: 'Inventaire mis à jour',
    inv_toast_save_error: 'Erreur lors de la sauvegarde',
    inv_toast_patch: 'Erreur lors de la mise à jour',
    // Common
    save: 'Enregistrer',
    saving: 'Enregistrement…',
    cancel: 'Annuler',
    edit: 'Modifier',
    delete: 'Supprimer',
    refresh: 'Rafraîchir',
    filters: 'Filtres',
    reset: 'Réinitialiser',
    all: 'Toutes les essences',
    select_essence: 'Sélectionner une essence',
    status_all: 'Tous les statuts',
    status_active: 'Actifs',
    status_inactive: 'Inactifs',
    alerts_title: 'Stocks en alerte',
    alerts_empty: 'Tous les stocks sont au-dessus du seuil.',
  },
  en: {
    tab_ingredients: 'Ingredients',
    tab_lots: 'Essence Lots',
    tab_inventory: 'Lab Inventory',
    ing_title: 'Composition ingredients',
    ing_add: 'Add ingredient',
    ing_search: 'Search ingredient...',
    ing_col_ingredient: 'Ingredient',
    ing_col_price: 'Price / ml',
    ing_col_stock: 'Stock (ml)',
    ing_col_alert: 'Alert threshold',
    ing_col_active: 'Active',
    ing_col_actions: 'Actions',
    ing_no_results: 'No ingredients found.',
    ing_loading: 'Loading ingredients...',
    ing_modal_new: 'Add ingredient',
    ing_modal_edit: 'Edit ingredient',
    ing_field_name: 'Name *',
    ing_field_desc: 'Description',
    ing_field_price: 'Sale price / ml *',
    ing_field_purchase: 'Purchase price / ml',
    ing_field_stock: 'Stock (ml) *',
    ing_field_alert: 'Alert threshold (ml)',
    ing_field_active: 'Active ingredient',
    ing_confirm_delete: 'Delete this ingredient?',
    ing_toast_load: 'Error loading ingredients',
    ing_toast_create: 'Ingredient created',
    ing_toast_update: 'Ingredient updated',
    ing_toast_delete: 'Ingredient deleted',
    ing_toast_delete_error: 'Error deleting',
    ing_toast_save_error: 'Error saving',
    ing_toast_patch: 'Error updating',
    ing_required: 'Name, price per ml and stock required',
    lot_title: 'Essence lots',
    lot_add: 'Create lot',
    lot_search: 'Filters',
    lot_col_ref: 'Ref. / Lot',
    lot_col_essence: 'Essence',
    lot_col_stock: 'Remaining Stock (ml)',
    lot_col_cost: 'Total Purchase Cost',
    lot_col_ca: 'Revenue Generated',
    lot_col_margin: 'Lot Margin',
    lot_col_status: 'Status',
    lot_col_actions: 'Actions',
    lot_no_results: 'No lots recorded.',
    lot_loading: 'Loading...',
    lot_modal_new: 'Create lot',
    lot_modal_edit: 'Edit lot',
    lot_modal_desc: 'Detailed lot management with purchase cost calculation.',
    lot_field_essence: 'Essence *',
    lot_field_qty: 'Initial quantity received (ml) *',
    lot_field_purchase: 'Purchase price per ml (FCFA) *',
    lot_field_stock: 'Remaining stock (ml)',
    lot_field_alert: 'Alert threshold (ml)',
    lot_field_ref: 'Supplier reference',
    lot_field_active: 'Active lot',
    lot_confirm_delete: 'Delete this lot?',
    lot_toast_load: 'Error loading lots',
    lot_toast_create: 'Lot created',
    lot_toast_update: 'Lot updated',
    lot_toast_delete: 'Lot deleted',
    lot_toast_delete_error: 'Error deleting',
    lot_toast_save_error: 'Error saving',
    lot_toast_patch: 'Error updating',
    lot_required: 'Essence and quantity required',
    lot_status_active: 'Active',
    lot_status_done: 'Finished',
    inv_title: 'Lab inventory',
    inv_loading: 'Loading...',
    inv_col_essence: 'Essence',
    inv_col_qty: 'Available Quantity (ml)',
    inv_col_alert: 'Alert Threshold (ml)',
    inv_col_status: 'Stock Status',
    inv_col_actions: 'Actions',
    inv_no_results: 'No stock recorded.',
    inv_status_ok: 'Stock OK',
    inv_status_low: 'Low Stock',
    inv_status_critical: 'Critical',
    inv_modal_edit: 'Edit inventory',
    inv_field_qty: 'Available quantity (ml)',
    inv_field_alert: 'Alert threshold (ml)',
    inv_field_active: 'Active',
    inv_toast_load: 'Error loading inventory',
    inv_toast_update: 'Inventory updated',
    inv_toast_save_error: 'Error saving',
    inv_toast_patch: 'Error updating',
    save: 'Save',
    saving: 'Saving…',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    refresh: 'Refresh',
    filters: 'Filters',
    reset: 'Reset',
    all: 'All essences',
    select_essence: 'Select an essence',
    status_all: 'All statuses',
    status_active: 'Active',
    status_inactive: 'Inactive',
    alerts_title: 'Low stock alerts',
    alerts_empty: 'All stocks are above threshold.',
  },
} as const;
type TKey = keyof typeof T.fr;
import { useToastStore } from '@/store/useToastStore';
import { useCatalogPermissions } from '@/hooks/useCatalogPermissions';
import CatalogAccessNotice from '@/components/catalog/CatalogAccessNotice';
import { extractCatalogList } from '@/lib/catalogUtils';
import { extractApiError } from '@/lib/apiError';
import { SlideOver } from '@/components/ui/SlideOver';

// --- Shared Helpers & Primitives ---

function cx(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

type StatusType = 'emerald' | 'blue' | 'amber' | 'red' | 'purple' | 'neutral';

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
    neutral: {
      text: 'text-foreground/60',
      bg: 'bg-white/5',
      ring: 'ring-white/10',
      dot: 'bg-foreground/40',
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

// ─── Types ───────────────────────────────────────────────────────────────────

type TabKey = 'ingredients' | 'lots' | 'inventory';

// ─── Sub-components ──────────────────────────────────────────────────────────

function TabButton({ active, onClick, icon, label, count }: {
  active: boolean; onClick: () => void;
  icon: React.ReactNode; label: string; count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap',
        active
          ? 'border-gold text-gold'
          : 'border-transparent text-foreground/45 hover:text-foreground'
      )}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && (
        <span className={cx(
          'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
          active ? 'bg-gold/20 text-gold' : 'bg-white/5 text-foreground/40'
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Ingredients Tab ─────────────────────────────────────────────────────────

function IngredientsTab() {
  const permissions = useCatalogPermissions('ingredients');
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en') ?? false;
  const t = (k: TKey) => isEn ? T.en[k] : T.fr[k];
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToastStore();

  const [form, setForm] = useState({
    nom: '',
    description: '',
    prix_par_ml: '',
    prix_achat_par_ml: '',
    stock_ml: '',
    seuil_alerte_ml: '0',
    actif: true,
  });

  const fetchItems = useCallback(async () => {
    if (!permissions.canRead) return;
    try {
      setLoading(true);
      const data = await labService.getIngredients(search ? { search } : undefined);
      setItems(extractCatalogList(data));
    } catch {
      addToast(t('ing_toast_load'), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, permissions.canRead, search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchItems(), 300);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  const openAdd = () => {
    if (!permissions.canCreate) return;
    setEditing(null);
    setForm({ nom: '', description: '', prix_par_ml: '', prix_achat_par_ml: '', stock_ml: '', seuil_alerte_ml: '0', actif: true });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    if (!permissions.canUpdate) return;
    setEditing(item);
    setForm({
      nom: item.nom || '',
      description: item.description || '',
      prix_par_ml: String(item.prix_par_ml || ''),
      prix_achat_par_ml: item.prix_achat_par_ml ? String(item.prix_achat_par_ml) : '',
      stock_ml: String(item.stock_ml ?? item.stock_disponible ?? ''),
      seuil_alerte_ml: String(item.seuil_alerte_ml ?? '0'),
      actif: item.actif !== undefined ? item.actif : true,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!permissions.canCreate && !permissions.canUpdate) return;
    if (!form.nom || !form.prix_par_ml || !form.stock_ml) {
      addToast(t('ing_required'), 'error'); return;
    }
    try {
      setSaving(true);
      const payload = {
        nom: form.nom,
        description: form.description || undefined,
        prix_par_ml: form.prix_par_ml,
        stock_ml: form.stock_ml,
        seuil_alerte_ml: form.seuil_alerte_ml || '0',
        actif: form.actif,
      };
      if (editing) {
        setItems(prev => prev.map(i => i.id === editing.id ? { ...i, ...payload } : i));
        setShowModal(false);
        await labService.updateIngredient(editing.id, payload);
        addToast(t('ing_toast_update'), 'success');
        fetchItems();
      } else {
        setShowModal(false);
        await labService.createIngredient(payload);
        addToast(t('ing_toast_create'), 'success');
        fetchItems();
      }
    } catch (e: any) {
      addToast(e.response?.data?.detail || t('ing_toast_save_error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const patchIngredient = async (id: number, field: string, value: string) => {
    if (!permissions.canUpdate) return;
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
    try {
      await labService.updateIngredient(id, { [field]: value });
    } catch {
      addToast(t('ing_toast_patch'), 'error');
      fetchItems();
    }
  };

  const handleDelete = async (id: number) => {
    if (!permissions.canDelete) return;
      if (!confirm(t('ing_confirm_delete'))) return;
    const snapshot = items.find(i => i.id === id);
    setItems(prev => prev.filter(i => i.id !== id));
    try {
      await labService.deleteIngredient(id);
      addToast(t('ing_toast_delete'), 'success');
    } catch {
      if (snapshot) setItems(prev => [snapshot, ...prev]);
      addToast('Erreur lors de la suppression', 'error');
    }
  };

  if (!permissions.canRead) {
    return <CatalogAccessNotice permissions={permissions} resourceLabel="les ingrédients" />;
  }

  return (
    <div className="space-y-4">
      <CatalogAccessNotice permissions={permissions} resourceLabel="les ingrédients" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un ingrédient..."
            className="shadow-black/30 shadow-sm w-full bg-white/[0.02] border border-white/10 rounded-lg pl-9 pr-8 py-1.5 text-xs text-foreground placeholder:text-foreground/40 outline-none focus:border-white/20 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground">
              <X size={12} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchItems}
            className="border border-white/10 rounded-lg p-1.5 text-foreground/60 hover:bg-white/5 hover:text-foreground transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          {permissions.canCreate && (
            <button
              onClick={openAdd}
              className="bg-gold text-black rounded-lg px-3.5 py-2 text-xs font-semibold hover:bg-gold/80 transition-colors flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>{t('ing_add')}</span>
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden min-h-[200px]">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-foreground/40 gap-2 text-xs">
            <Loader2 className="animate-spin text-gold" size={16} />
            <span>{t('ing_loading')}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                  <th className="pl-4 py-3">{t('ing_col_ingredient')}</th>
                  <th className="px-3 py-3">{t('ing_col_price')}</th>
                  <th className="px-3 py-3">{t('ing_col_stock')}</th>
                  <th className="px-3 py-3">{t('ing_col_alert')}</th>
                  <th className="px-3 py-3">{t('ing_col_active')}</th>
                  <th className="pr-4 py-3 text-right">{t('ing_col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {items.map(item => {
                  const stockVal = Number(item.stock_ml ?? item.stock_disponible ?? 0);
                  const statusType: StatusType = stockVal > 50 ? 'emerald' : stockVal > 10 ? 'amber' : 'red';
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="pl-4 py-3">
                        <p className="font-medium text-foreground">
                          <InlineCell value={item.nom} onSave={v => patchIngredient(item.id, 'nom', v)} disabled={!permissions.canUpdate} className="font-medium text-foreground" />
                        </p>
                        {item.description && <p className="text-[11px] text-foreground/40 truncate max-w-[200px] mt-0.5">{item.description}</p>}
                      </td>
                      <td className="px-3 py-3 text-foreground/60 tabular-nums">
                        <InlineCell value={String(item.prix_par_ml || '0')} onSave={v => patchIngredient(item.id, 'prix_par_ml', v)} disabled={!permissions.canUpdate} inputType="number" display={<>{Number(item.prix_par_ml || 0).toLocaleString()} FCFA</>} className="text-foreground/60 tabular-nums" />
                      </td>
                      <td className="px-3 py-3">
                        <InlineCell value={String(item.stock_ml ?? item.stock_disponible ?? '0')} onSave={v => patchIngredient(item.id, 'stock_ml', v)} disabled={!permissions.canUpdate} inputType="number" display={<StatusChip status={statusType} label={`${stockVal} ml`} />} className="tabular-nums" />
                      </td>
                      <td className="px-3 py-3 text-foreground/60 tabular-nums">
                        <InlineCell value={String(item.seuil_alerte_ml ?? '0')} onSave={v => patchIngredient(item.id, 'seuil_alerte_ml', v)} disabled={!permissions.canUpdate} inputType="number" display={<>{item.seuil_alerte_ml ?? '—'} ml</>} className="text-foreground/60 tabular-nums" />
                      </td>
                      <td className="px-3 py-3">
                        <StatusChip
                          status={item.actif ? 'emerald' : 'red'}
                          label={item.actif ? 'Oui' : 'Non'}
                        />
                      </td>
                      <td className="pr-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          {permissions.canUpdate && (
                            <IconButton icon={Edit2} onClick={() => openEdit(item)} title="Modifier" tint="gold" />
                          )}
                          {permissions.canDelete && (
                            <IconButton icon={Trash2} onClick={() => handleDelete(item.id)} title="Supprimer" tint="red" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-sm italic text-foreground/30">
                      {t('ing_no_results')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SlideOver
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? t('ing_modal_edit') : t('ing_modal_new')}
        description={isEn ? 'Complete entry form in a side panel.' : 'Formulaire de saisie complet dans un panneau latéral.'}
        size="lg"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">
              {t('cancel')}
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-bold hover:bg-gold/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? t('saving') : t('save')}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
              {[
                { label: 'Nom *', field: 'nom', placeholder: 'Ex: Huile de Rose' },
                { label: 'Description', field: 'description', placeholder: 'Description de l\'ingrédient' },
              ].map(f => (
                <div key={f.field}>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">{f.label}</label>
                  <input
                    value={(form as any)[f.field]}
                    onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Prix Vente / ml *', field: 'prix_par_ml', placeholder: '500' },
                  { label: 'Prix Achat / ml', field: 'prix_achat_par_ml', placeholder: '300' },
                  { label: 'Stock (ml) *', field: 'stock_ml', placeholder: '100' },
                  { label: 'Seuil alerte (ml)', field: 'seuil_alerte_ml', placeholder: '0' },
                ].map(f => (
                  <div key={f.field}>
                    <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">{f.label}</label>
                    <input
                      value={(form as any)[f.field]}
                      onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                    />
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={form.actif}
                  onChange={e => setForm(p => ({ ...p, actif: e.target.checked }))}
                  className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold"
                />
                <span className="text-sm text-foreground/60">Ingrédient actif</span>
              </label>
            </div>
      </SlideOver>
    </div>
  );
}

// ─── Lots Tab ─────────────────────────────────────────────────────────────────

function LotsTab() {
  const permissions = useCatalogPermissions('lots_essence');
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en') ?? false;
  const t = (k: TKey) => isEn ? T.en[k] : T.fr[k];
  const [items, setItems] = useState<any[]>([]);
  const [essences, setEssences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [essenceFilter, setEssenceFilter] = useState('');
  const [actifFilter, setActifFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToastStore();

  const [form, setForm] = useState({
    essence: '',
    quantite_initiale_ml: '',
    prix_achat_par_ml: '',
    stock_ml: '',
    seuil_alerte_ml: '',
    reference_fournisseur: '',
    actif: true,
  });

  const fetchItems = useCallback(async () => {
    if (!permissions.canRead) return;
    try {
      setLoading(true);
      const params: Record<string, unknown> = {};
      if (essenceFilter) params.essence = Number(essenceFilter);
      if (actifFilter === 'true') params.actif = true;
      if (actifFilter === 'false') params.actif = false;
      const data = await labService.getLotsEssence(params);
      setItems(extractCatalogList(data));
    } catch {
      addToast(t('lot_toast_load'), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, permissions.canRead, essenceFilter, actifFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    labService.getEssences()
      .then((data) => setEssences(extractCatalogList(data)))
      .catch(() => {});
  }, []);

  const openAdd = () => {
    if (!permissions.canCreate) return;
    setEditing(null);
    setForm({
      essence: essences[0]?.id ? String(essences[0].id) : '',
      quantite_initiale_ml: '',
      prix_achat_par_ml: '',
      stock_ml: '',
      seuil_alerte_ml: '',
      reference_fournisseur: '',
      actif: true,
    });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    if (!permissions.canUpdate) return;
    setEditing(item);
    setForm({
      essence: String(item.essence || item.essence_id || ''),
      quantite_initiale_ml: String(item.quantite_initiale_ml ?? item.quantite_initiale ?? ''),
      prix_achat_par_ml: item.prix_achat_par_ml ? String(item.prix_achat_par_ml) : '',
      stock_ml: String(item.stock_ml ?? item.quantite_ml ?? ''),
      seuil_alerte_ml: String(item.seuil_alerte_ml ?? ''),
      reference_fournisseur: item.reference_fournisseur || '',
      actif: item.actif !== undefined ? item.actif : true,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!permissions.canCreate && !permissions.canUpdate) return;
    if (!form.essence || (!form.stock_ml && !form.quantite_initiale_ml)) {
      addToast(t('lot_required'), 'error'); return;
    }
    try {
      setSaving(true);
      const payload: Record<string, unknown> = {
        essence: Number(form.essence),
        stock_ml: form.stock_ml || form.quantite_initiale_ml,
        actif: form.actif,
      };
      if (form.quantite_initiale_ml) payload.quantite_initiale_ml = form.quantite_initiale_ml;
      if (form.prix_achat_par_ml) payload.prix_achat_par_ml = form.prix_achat_par_ml;
      if (form.seuil_alerte_ml) payload.seuil_alerte_ml = form.seuil_alerte_ml;
      if (form.reference_fournisseur) payload.reference_fournisseur = form.reference_fournisseur;
      if (editing) {
        setItems(prev => prev.map(i => i.id === editing.id ? { ...i, ...payload } : i));
        setShowModal(false);
        await labService.updateLotEssence(editing.id, payload as any);
        addToast(t('lot_toast_update'), 'success');
        fetchItems();
      } else {
        setShowModal(false);
        await labService.createLotEssence(payload as any);
        addToast(t('lot_toast_create'), 'success');
        fetchItems();
      }
    } catch (e: any) {
      addToast(extractApiError(e, t('lot_toast_save_error')), 'error');
    } finally {
      setSaving(false);
    }
  };

  const patchLot = async (id: number, field: string, value: string) => {
    if (!permissions.canUpdate) return;
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
    try {
      await labService.updateLotEssence(id, { [field]: value });
    } catch {
      addToast(t('lot_toast_patch'), 'error');
      fetchItems();
    }
  };

  const handleDelete = async (id: number) => {
    if (!permissions.canDelete) return;
    if (!confirm(t('lot_confirm_delete'))) return;
    const snapshot = items.find(i => i.id === id);
    setItems(prev => prev.filter(i => i.id !== id));
    try {
      await labService.deleteLotEssence(id);
      addToast(t('lot_toast_delete'), 'success');
    } catch {
      if (snapshot) setItems(prev => [snapshot, ...prev]);
      addToast(t('lot_toast_delete_error'), 'error');
    }
  };


  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (essenceFilter) count++;
    if (actifFilter) count++;
    return count;
  }, [essenceFilter, actifFilter]);

  if (!permissions.canRead) {
    return <CatalogAccessNotice permissions={permissions} resourceLabel="les lots d'essence" />;
  }

  return (
    <div className="space-y-4">
      <CatalogAccessNotice permissions={permissions} resourceLabel="les lots d'essence" />
      
      {/* Toolbar & Filters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
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
            <span>{t('filters')}</span>
            {activeFiltersCount > 0 && (
              <span className="ml-0.5 rounded-full bg-gold px-1.5 py-0.2 text-[10px] font-bold text-black">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchItems}
              className="border border-white/10 rounded-lg p-1.5 text-foreground/60 hover:bg-white/5 hover:text-foreground transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            {permissions.canCreate && (
              <button
                onClick={openAdd}
                className="bg-gold text-black rounded-lg px-3.5 py-2 text-xs font-semibold hover:bg-gold/80 transition-colors flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Nouveau lot</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground/50">Essence :</span>
              <select
                value={essenceFilter}
                onChange={e => setEssenceFilter(e.target.value)}
                className="text-xs bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-foreground outline-none focus:border-white/20"
              >
                <option value="" className="bg-background text-foreground">{t('all')}</option>
                {essences.map(e => (
                  <option key={e.id} value={e.id} className="bg-background text-foreground">{e.nom}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground/50">Statut :</span>
              <select
                value={actifFilter}
                onChange={e => setActifFilter(e.target.value)}
                className="text-xs bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-foreground outline-none focus:border-white/20"
              >
                <option value="" className="bg-background text-foreground">{t('status_all')}</option>
                <option value="true" className="bg-background text-foreground">{t('status_active')}</option>
                <option value="false" className="bg-background text-foreground">{t('status_inactive')}</option>
              </select>
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setEssenceFilter('');
                  setActifFilter('');
                }}
                className="text-[11px] text-foreground/40 hover:text-foreground underline ml-auto"
              >
                {t('reset')}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden min-h-[200px]">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-foreground/40 gap-2 text-xs">
            <Loader2 className="animate-spin text-gold" size={16} />
            <span>{t('ing_loading')}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                  <th className="pl-4 py-3">{t('lot_col_ref')}</th>
                  <th className="px-3 py-3">{t('lot_col_essence')}</th>
                  <th className="px-3 py-3">{t('lot_col_stock')}</th>
                  <th className="px-3 py-3">{t('lot_col_cost')}</th>
                  <th className="px-3 py-3">{t('lot_col_ca')}</th>
                  <th className="px-3 py-3">{t('lot_col_margin')}</th>
                  <th className="px-3 py-3">{t('lot_col_status')}</th>
                  <th className="pr-4 py-3 text-right">{t('lot_col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {items.map(item => {
                  const coutTotal = item.cout_achat_total 
                    ? parseFloat(item.cout_achat_total) 
                    : (item.quantite_initiale_ml && item.prix_achat_par_ml 
                        ? parseFloat(item.quantite_initiale_ml) * parseFloat(item.prix_achat_par_ml) 
                        : null);
                  const caGenere = item.chiffre_affaires_genere ? parseFloat(item.chiffre_affaires_genere) : 0;
                  const beneficeLot = item.benefice_lot !== undefined && item.benefice_lot !== null
                    ? parseFloat(item.benefice_lot)
                    : (coutTotal !== null ? caGenere - coutTotal : null);
                  const isTermine = item.est_termine !== undefined ? item.est_termine : (Number(item.stock_ml ?? item.quantite_ml ?? 0) <= 0);

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="pl-4 py-3 font-medium text-gold">
                        <InlineCell value={item.reference_fournisseur || item.numero_lot || item.reference || ''} onSave={v => patchLot(item.id, 'reference_fournisseur', v)} disabled={!permissions.canUpdate} display={<>{item.reference_fournisseur || item.numero_lot || item.reference || '—'}</>} className="font-medium text-gold" />
                      </td>
                      <td className="px-3 py-3 text-foreground/60">
                        {item.essence_details?.nom || `ID: ${item.essence || '—'}`}
                      </td>
                      <td className="px-3 py-3 font-semibold text-foreground tabular-nums">
                        <InlineCell value={String(item.stock_ml ?? item.quantite_ml ?? '0')} onSave={v => patchLot(item.id, 'stock_ml', v)} disabled={!permissions.canUpdate} inputType="number" display={<>{Number(item.stock_ml ?? item.quantite_ml ?? 0).toLocaleString()} ml{item.quantite_initiale_ml && <span className="text-[10px] text-foreground/40 block font-normal">/ {item.quantite_initiale_ml} ml reçus</span>}</>} className="font-semibold text-foreground tabular-nums" />
                      </td>
                      <td className="px-3 py-3 text-foreground/70 tabular-nums">
                        {coutTotal !== null ? `${coutTotal.toLocaleString()} FCFA` : '—'}
                      </td>
                      <td className="px-3 py-3 text-blue-400 tabular-nums">
                        {caGenere.toLocaleString()} FCFA
                      </td>
                      <td className="px-3 py-3 tabular-nums">
                        {beneficeLot !== null ? (
                          <StatusChip
                            status={beneficeLot >= 0 ? 'emerald' : 'red'}
                            label={`${beneficeLot >= 0 ? '+' : ''}${beneficeLot.toLocaleString()} FCFA`}
                          />
                        ) : '—'}
                      </td>
                      <td className="px-3 py-3">
                        <StatusChip
                          status={isTermine ? 'neutral' : 'emerald'}
                          label={isTermine ? 'Terminé' : 'En cours'}
                        />
                      </td>
                      <td className="pr-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          {permissions.canUpdate && (
                            <IconButton icon={Edit2} onClick={() => openEdit(item)} title="Modifier" tint="gold" />
                          )}
                          {permissions.canDelete && (
                            <IconButton icon={Trash2} onClick={() => handleDelete(item.id)} title="Supprimer" tint="red" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-sm italic text-foreground/30">
                      {t('lot_no_results')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SlideOver
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? t('lot_modal_edit') : t('lot_modal_new')}
        description={t('lot_modal_desc')}
        size="lg"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">
              {t('cancel')}
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-bold hover:bg-gold/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? t('saving') : t('save')}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Essence *</label>
                <select
                  value={form.essence}
                  onChange={e => setForm(p => ({ ...p, essence: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                >
                  <option value="" disabled>Sélectionner une essence</option>
                  {essences.map(e => (
                    <option key={e.id} value={e.id}>{e.nom} ({e.code_reference})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Quantité initiale reçue (ml) *</label>
                  <input
                    type="number"
                    value={form.quantite_initiale_ml}
                    onChange={e => setForm(p => ({ ...p, quantite_initiale_ml: e.target.value }))}
                    placeholder="ex: 500"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Prix d'achat par ml (FCFA) *</label>
                  <input
                    type="number"
                    value={form.prix_achat_par_ml}
                    onChange={e => setForm(p => ({ ...p, prix_achat_par_ml: e.target.value }))}
                    placeholder="ex: 2.50"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Stock restant (ml)</label>
                  <input
                    type="number"
                    value={form.stock_ml}
                    onChange={e => setForm(p => ({ ...p, stock_ml: e.target.value }))}
                    placeholder="ex: 500"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Seuil alerte (ml)</label>
                  <input
                    type="number"
                    value={form.seuil_alerte_ml}
                    onChange={e => setForm(p => ({ ...p, seuil_alerte_ml: e.target.value }))}
                    placeholder="50"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Référence fournisseur</label>
                <input
                  value={form.reference_fournisseur}
                  onChange={e => setForm(p => ({ ...p, reference_fournisseur: e.target.value }))}
                  placeholder="LOT-GRASSET-PATCH-09"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={form.actif}
                  onChange={e => setForm(p => ({ ...p, actif: e.target.checked }))}
                  className="rounded border-white/10 bg-white/5 text-gold focus:ring-gold"
                />
                <span className="text-sm text-foreground/60">{t('lot_field_active')}</span>
              </label>
            </div>
      </SlideOver>
    </div>
  );
}

// ─── Lab Inventory Tab ────────────────────────────────────────────────────────

function InventoryTab() {
  const permissions = useCatalogPermissions('lots_essence');
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en') ?? false;
  const t = (k: TKey) => isEn ? T.en[k] : T.fr[k];
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToastStore();

  const [form, setForm] = useState({
    quantite_disponible_ml: '',
    seuil_alerte_ml: '',
    actif: true,
  });

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await labService.getLaboInventory();
      const list = Array.isArray(data) ? data : (data as any)?.results || (data as any)?.resultats || [];
      setItems(list);
    } catch {
      addToast(t('inv_toast_load'), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      quantite_disponible_ml: String(item.quantite_disponible_ml || ''),
      seuil_alerte_ml: String(item.seuil_alerte_ml || ''),
      actif: item.actif !== undefined ? item.actif : true,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editing) return;
    try {
      setSaving(true);
      await labService.updateLaboInventory(editing.id, {
        quantite_disponible_ml: Number(form.quantite_disponible_ml),
        seuil_alerte_ml: Number(form.seuil_alerte_ml),
        actif: form.actif,
      });
      addToast(t('inv_toast_update'), 'success');
      setShowModal(false);
      fetchItems();
    } catch (e: any) {
      addToast(e.response?.data?.detail || t('inv_toast_save_error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const patchInventory = async (id: number, field: string, value: string) => {
    if (!permissions.canUpdate) return;
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
    try {
      await labService.updateLaboInventory(id, { [field]: Number(value) });
    } catch {
      addToast(t('inv_toast_patch'), 'error');
      fetchItems();
    }
  };

  const alertItems = items.filter(i =>
    Number(i.quantite_disponible_ml) <= Number(i.seuil_alerte_ml || 100)
  );

  return (
    <div className="space-y-4">
      {alertItems.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3.5 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-400">Alerte de stock faible</p>
            <p className="text-xs text-foreground/50 mt-0.5">
              {alertItems.length} essence(s) en dessous du seuil d'alerte dans le labo.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={fetchItems}
          className="border border-white/10 rounded-lg p-1.5 text-foreground/60 hover:bg-white/5 hover:text-foreground transition-colors"
          title="Rafraîchir"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden min-h-[200px]">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-foreground/40 gap-2 text-xs">
            <Loader2 className="animate-spin text-gold" size={16} />
            <span>{t('ing_loading')}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                  <th className="pl-4 py-3">{t('inv_col_essence')}</th>
                  <th className="px-3 py-3">{t('inv_col_qty')}</th>
                  <th className="px-3 py-3">{t('inv_col_alert')}</th>
                  <th className="px-3 py-3">{t('inv_col_status')}</th>
                  <th className="pr-4 py-3 text-right">{t('inv_col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {items.map(item => {
                  const qty = Number(item.quantite_disponible_ml || 0);
                  const threshold = Number(item.seuil_alerte_ml || 100);
                  const pct = Math.min((qty / (threshold * 2)) * 100, 100);
                  const isLow = qty <= threshold;
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="pl-4 py-3 font-medium text-foreground">
                        {item.essence_details?.nom || item.essence_nom || `Essence #${item.essence || item.id}`}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={cx('h-full rounded-full transition-all', isLow ? 'bg-red-400' : 'bg-emerald-400')}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <InlineCell value={String(qty)} onSave={v => patchInventory(item.id, 'quantite_disponible_ml', v)} disabled={!permissions.canUpdate} inputType="number" display={<span className="font-semibold text-foreground tabular-nums">{qty.toLocaleString()} ml</span>} className="font-semibold text-foreground tabular-nums" />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-foreground/60 tabular-nums">
                        <InlineCell value={String(threshold)} onSave={v => patchInventory(item.id, 'seuil_alerte_ml', v)} disabled={!permissions.canUpdate} inputType="number" display={<>{threshold.toLocaleString()} ml</>} className="text-foreground/60 tabular-nums" />
                      </td>
                      <td className="px-3 py-3">
                        <StatusChip
                          status={isLow ? 'red' : 'emerald'}
                          label={isLow ? t('inv_status_critical') : t('inv_status_ok')}
                        />
                      </td>
                      <td className="pr-4 py-3 text-right">
                        <IconButton icon={Edit2} onClick={() => openEdit(item)} title="Ajuster" tint="gold" />
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-sm italic text-foreground/30">
                      {t('inv_no_results')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SlideOver
        isOpen={Boolean(showModal && editing)}
        onClose={() => setShowModal(false)}
        title="Ajuster le stock labo"
        description={editing?.essence_details?.nom || `Essence #${editing?.essence || editing?.id}`}
        size="lg"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">
              {t('cancel')}
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-bold hover:bg-gold/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              Mettre à jour
            </button>
          </div>
        }
      >
        <div className="space-y-3">
              {[
                { label: 'Quantité disponible (ml)', field: 'quantite_disponible_ml', placeholder: '5000' },
                { label: 'Seuil d\'alerte (ml)', field: 'seuil_alerte_ml', placeholder: '500' },
              ].map(f => (
                <div key={f.field}>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">{f.label}</label>
                  <input
                    type="number"
                    value={(form as any)[f.field]}
                    onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  />
                </div>
              ))}
            </div>
      </SlideOver>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LabPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('ingredients');
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en') ?? false;
  const t = (k: TKey) => isEn ? T.en[k] : T.fr[k];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">{isEn ? 'Laboratory' : 'Laboratoire'}</h1>
        <p className="text-sm text-foreground/40 mt-0.5">
          {isEn ? 'Manage ingredients, production lots and lab inventory' : "Gestion des ingrédients, des lots de production et de l'inventaire labo"}
        </p>
      </div>

      {/* Tabs & Content Container */}
      <div className="shadow-black/30 shadow-sm rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="flex border-b border-white/10 overflow-x-auto px-2 pt-1">
          <TabButton
            active={activeTab === 'ingredients'}
            onClick={() => setActiveTab('ingredients')}
            icon={<FlaskConical size={14} />}
            label={t('tab_ingredients')}
          />
          <TabButton
            active={activeTab === 'lots'}
            onClick={() => setActiveTab('lots')}
            icon={<Layers size={14} />}
            label={t('tab_lots')}
          />
          <TabButton
            active={activeTab === 'inventory'}
            onClick={() => setActiveTab('inventory')}
            icon={<Package size={14} />}
            label={t('tab_inventory')}
          />
        </div>

        <div className="p-4 sm:p-5">
          {activeTab === 'ingredients' && <IngredientsTab />}
          {activeTab === 'lots' && <LotsTab />}
          {activeTab === 'inventory' && <InventoryTab />}
        </div>
      </div>
    </div>
  );
}
