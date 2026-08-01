'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FlaskConical, Package, Layers, Plus, Edit2, Trash2,
  Loader2, Search, RefreshCw, AlertTriangle, Filter, X
} from 'lucide-react';
import { labService } from '@/services/apiService';
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
      addToast('Erreur lors du chargement des ingrédients', 'error');
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
      addToast('Nom, prix par ml et stock requis', 'error'); return;
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
        await labService.updateIngredient(editing.id, payload);
        addToast('Ingrédient mis à jour', 'success');
      } else {
        await labService.createIngredient(payload);
        addToast('Ingrédient créé', 'success');
      }
      setShowModal(false);
      fetchItems();
    } catch (e: any) {
      addToast(e.response?.data?.detail || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!permissions.canDelete) return;
    if (!confirm('Supprimer cet ingrédient ?')) return;
    try {
      await labService.deleteIngredient(id);
      addToast('Ingrédient supprimé', 'success');
      fetchItems();
    } catch {
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
            className="w-full bg-white/[0.02] border border-white/10 rounded-lg pl-9 pr-8 py-1.5 text-xs text-foreground placeholder:text-foreground/40 outline-none focus:border-white/20 transition-all"
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
              <span>Ajouter</span>
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden min-h-[200px]">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-foreground/40 gap-2 text-xs">
            <Loader2 className="animate-spin text-gold" size={16} />
            <span>Chargement...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                  <th className="pl-4 py-3">Ingrédient</th>
                  <th className="px-3 py-3">Prix / ml</th>
                  <th className="px-3 py-3">Stock (ml)</th>
                  <th className="px-3 py-3">Seuil alerte</th>
                  <th className="px-3 py-3">Actif</th>
                  <th className="pr-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {items.map(item => {
                  const stockVal = Number(item.stock_ml ?? item.stock_disponible ?? 0);
                  const statusType: StatusType = stockVal > 50 ? 'emerald' : stockVal > 10 ? 'amber' : 'red';
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="pl-4 py-3">
                        <p className="font-medium text-foreground">{item.nom}</p>
                        {item.description && <p className="text-[11px] text-foreground/40 truncate max-w-[200px] mt-0.5">{item.description}</p>}
                      </td>
                      <td className="px-3 py-3 text-foreground/60 tabular-nums">{Number(item.prix_par_ml || 0).toLocaleString()} FCFA</td>
                      <td className="px-3 py-3">
                        <StatusChip status={statusType} label={`${stockVal} ml`} />
                      </td>
                      <td className="px-3 py-3 text-foreground/60 tabular-nums">{item.seuil_alerte_ml ?? '—'} ml</td>
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
                      Aucun ingrédient trouvé.
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
        title={editing ? 'Modifier l\'ingrédient' : 'Ajouter un ingrédient'}
        description="Formulaire de saisie complet dans un panneau latéral."
        size="lg"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-bold hover:bg-gold/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              Enregistrer
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
      addToast('Erreur lors du chargement des lots', 'error');
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
      addToast('Essence et quantité requises', 'error'); return;
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
        await labService.updateLotEssence(editing.id, payload);
        addToast('Lot mis à jour', 'success');
      } else {
        await labService.createLotEssence(payload);
        addToast('Lot créé', 'success');
      }
      setShowModal(false);
      fetchItems();
    } catch (e: any) {
      addToast(extractApiError(e, 'Erreur lors de la sauvegarde'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!permissions.canDelete) return;
    if (!confirm('Supprimer ce lot ?')) return;
    try {
      await labService.deleteLotEssence(id);
      addToast('Lot supprimé', 'success');
      fetchItems();
    } catch {
      addToast('Erreur lors de la suppression', 'error');
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
            <span>Filtres</span>
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
                <option value="" className="bg-background text-foreground">Toutes les essences</option>
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
                <option value="" className="bg-background text-foreground">Tous les statuts</option>
                <option value="true" className="bg-background text-foreground">Actifs</option>
                <option value="false" className="bg-background text-foreground">Inactifs</option>
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
                Réinitialiser
              </button>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden min-h-[200px]">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-foreground/40 gap-2 text-xs">
            <Loader2 className="animate-spin text-gold" size={16} />
            <span>Chargement...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                  <th className="pl-4 py-3">Réf. / Lot</th>
                  <th className="px-3 py-3">Essence</th>
                  <th className="px-3 py-3">Stock Restant (ml)</th>
                  <th className="px-3 py-3">Coût d'Achat Total</th>
                  <th className="px-3 py-3">CA Généré</th>
                  <th className="px-3 py-3">Bénéfice Lot</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="pr-4 py-3 text-right">Actions</th>
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
                        {item.reference_fournisseur || item.numero_lot || item.reference || '—'}
                      </td>
                      <td className="px-3 py-3 text-foreground/60">
                        {item.essence_details?.nom || `ID: ${item.essence || '—'}`}
                      </td>
                      <td className="px-3 py-3 font-semibold text-foreground tabular-nums">
                        {Number(item.stock_ml ?? item.quantite_ml ?? 0).toLocaleString()} ml
                        {item.quantite_initiale_ml && (
                          <span className="text-[10px] text-foreground/40 block font-normal">
                            / {item.quantite_initiale_ml} ml reçus
                          </span>
                        )}
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
                      Aucun lot enregistré.
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
        title={editing ? 'Modifier le lot' : 'Créer un lot'}
        description="Gestion détaillée d’un lot d’essence avec calcul des coûts d'achat."
        size="lg"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-bold hover:bg-gold/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              Enregistrer
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
                <span className="text-sm text-foreground/60">Lot actif</span>
              </label>
            </div>
      </SlideOver>
    </div>
  );
}

// ─── Lab Inventory Tab ────────────────────────────────────────────────────────

function InventoryTab() {
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
      addToast('Erreur lors du chargement de l\'inventaire', 'error');
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
      addToast('Inventaire mis à jour', 'success');
      setShowModal(false);
      fetchItems();
    } catch (e: any) {
      addToast(e.response?.data?.detail || 'Erreur lors de la mise à jour', 'error');
    } finally {
      setSaving(false);
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
            <span>Chargement...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
                  <th className="pl-4 py-3">Essence</th>
                  <th className="px-3 py-3">Quantité Disponible (ml)</th>
                  <th className="px-3 py-3">Seuil Alerte (ml)</th>
                  <th className="px-3 py-3">Statut Stock</th>
                  <th className="pr-4 py-3 text-right">Actions</th>
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
                          <span className="font-semibold text-foreground tabular-nums">{qty.toLocaleString()} ml</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-foreground/60 tabular-nums">{threshold.toLocaleString()} ml</td>
                      <td className="px-3 py-3">
                        <StatusChip
                          status={isLow ? 'red' : 'emerald'}
                          label={isLow ? 'Critique' : 'OK'}
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
                      Aucun inventaire labo disponible.
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
              Annuler
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Laboratoire</h1>
        <p className="text-sm text-foreground/40 mt-0.5">
          Gestion des ingrédients, des lots de production et de l'inventaire labo
        </p>
      </div>

      {/* Tabs & Content Container */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="flex border-b border-white/10 overflow-x-auto px-2 pt-1">
          <TabButton
            active={activeTab === 'ingredients'}
            onClick={() => setActiveTab('ingredients')}
            icon={<FlaskConical size={14} />}
            label="Ingrédients"
          />
          <TabButton
            active={activeTab === 'lots'}
            onClick={() => setActiveTab('lots')}
            icon={<Layers size={14} />}
            label="Lots de Production"
          />
          <TabButton
            active={activeTab === 'inventory'}
            onClick={() => setActiveTab('inventory')}
            icon={<Package size={14} />}
            label="Inventaire Labo"
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