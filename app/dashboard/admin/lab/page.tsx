'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FlaskConical, Package, Layers, Plus, Edit2, Trash2,
  Loader2, Search, RefreshCw, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { labService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';

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
      className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-200 whitespace-nowrap
        ${active
          ? 'border-gold text-gold bg-white/5'
          : 'border-transparent text-foreground/40 hover:text-foreground/80 hover:border-white/20'
        }`}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${active ? 'bg-gold/20 text-gold' : 'bg-white/5 text-foreground/40'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Ingredients Tab ─────────────────────────────────────────────────────────

function IngredientsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToastStore();

  const [form, setForm] = useState({
    nom: '',
    code_reference: '',
    unite: 'ml',
    prix_par_ml: '',
    stock_disponible: '',
    description: '',
  });

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await labService.getIngredients();
      const list = Array.isArray(data) ? data : (data as any)?.results || (data as any)?.resultats || [];
      setItems(list);
    } catch {
      addToast('Erreur lors du chargement des ingrédients', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openAdd = () => {
    setEditing(null);
    setForm({ nom: '', code_reference: '', unite: 'ml', prix_par_ml: '', stock_disponible: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      nom: item.nom || '',
      code_reference: item.code_reference || '',
      unite: item.unite || 'ml',
      prix_par_ml: String(item.prix_par_ml || ''),
      stock_disponible: String(item.stock_disponible || ''),
      description: item.description || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nom || !form.prix_par_ml) {
      addToast('Nom et Prix requis', 'error'); return;
    }
    try {
      setSaving(true);
      const payload = { ...form, prix_par_ml: Number(form.prix_par_ml), stock_disponible: Number(form.stock_disponible) };
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
    if (!confirm('Supprimer cet ingrédient ?')) return;
    try {
      await labService.deleteIngredient(id);
      addToast('Ingrédient supprimé', 'success');
      fetchItems();
    } catch {
      addToast('Erreur lors de la suppression', 'error');
    }
  };

  const filtered = items.filter(i =>
    (i.nom || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.code_reference || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 max-w-sm flex-1">
          <Search size={15} className="text-foreground/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un ingrédient..."
            className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-foreground/40"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={fetchItems} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-foreground/60 hover:text-foreground transition-all">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 bg-gold text-black px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gold/80 transition-all shadow-lg shadow-gold/10">
            <Plus size={15} /> Ajouter
          </button>
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden min-h-[200px]">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gold gap-2">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-sm">Chargement...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  {['Ingrédient', 'Code Réf.', 'Unité', 'Prix Unitaire', 'Stock', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-foreground text-sm">{item.nom}</p>
                      {item.description && <p className="text-[11px] text-foreground/40 mt-0.5 truncate max-w-[200px]">{item.description}</p>}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-foreground/60">{item.code_reference || '—'}</td>
                    <td className="px-5 py-3 text-sm text-foreground/60">{item.unite}</td>
                    <td className="px-5 py-3 font-semibold text-foreground text-sm">{Number(item.prix_par_ml || 0).toLocaleString()} FCFA</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${Number(item.stock_disponible) > 50
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : Number(item.stock_disponible) > 10
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                        {item.stock_disponible ?? '—'} {item.unite}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-foreground/40 hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-foreground/40 italic text-sm">Aucun ingrédient trouvé.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/10">
            <h3 className="font-bold text-foreground mb-4">{editing ? 'Modifier l\'ingrédient' : 'Ajouter un ingrédient'}</h3>
            <div className="space-y-3">
              {[
                { label: 'Nom *', field: 'nom', placeholder: 'Ex: Huile de Rose' },
                { label: 'Code Référence', field: 'code_reference', placeholder: 'Ex: ING-ROSE-001' },
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
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Unité', field: 'unite', placeholder: 'ml, g, kg' },
                  { label: 'Prix (FCFA)', field: 'prix_par_ml', placeholder: '500', type: 'number' },
                  { label: 'Stock Disponible', field: 'stock_disponible', placeholder: '100', type: 'number' },
                ].map(f => (
                  <div key={f.field}>
                    <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">{f.label}</label>
                    <input
                      type={f.type || 'text'}
                      value={(form as any)[f.field]}
                      onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-bold hover:bg-gold/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Lots Tab ─────────────────────────────────────────────────────────────────

function LotsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToastStore();

  const [form, setForm] = useState({
    essence: '',
    numero_lot: '',
    quantite_ml: '',
    date_fabrication: '',
    date_expiration: '',
    actif: true,
  });

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await labService.getLotsEssence();
      const list = Array.isArray(data) ? data : (data as any)?.results || (data as any)?.resultats || [];
      setItems(list);
    } catch {
      addToast('Erreur lors du chargement des lots', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openAdd = () => {
    setEditing(null);
    setForm({ essence: '', numero_lot: '', quantite_ml: '', date_fabrication: '', date_expiration: '', actif: true });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      essence: String(item.essence || item.essence_id || ''),
      numero_lot: item.numero_lot || '',
      quantite_ml: String(item.quantite_ml || ''),
      date_fabrication: item.date_fabrication?.split('T')[0] || '',
      date_expiration: item.date_expiration?.split('T')[0] || '',
      actif: item.actif !== undefined ? item.actif : true,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.essence || !form.numero_lot || !form.quantite_ml) {
      addToast('Essence, Numéro de lot et Quantité requis', 'error'); return;
    }
    try {
      setSaving(true);
      const payload = {
        ...form,
        essence: Number(form.essence),
        quantite_ml: Number(form.quantite_ml),
      };
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
      addToast(e.response?.data?.detail || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce lot ?')) return;
    try {
      await labService.deleteLotEssence(id);
      addToast('Lot supprimé', 'success');
      fetchItems();
    } catch {
      addToast('Erreur lors de la suppression', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <p className="text-sm text-foreground/40">{items.length} lot(s) enregistré(s)</p>
        <div className="flex gap-2">
          <button onClick={fetchItems} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-foreground/60 hover:text-foreground transition-all">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 bg-gold text-black px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gold/80 transition-all shadow-lg shadow-gold/10">
            <Plus size={15} /> Nouveau lot
          </button>
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden min-h-[200px]">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gold gap-2">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  {['Numéro Lot', 'Essence ID', 'Quantité (ml)', 'Fabrication', 'Expiration', 'Actif', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map(item => {
                  const expDate = item.date_expiration ? new Date(item.date_expiration) : null;
                  const isExpired = expDate ? expDate < new Date() : false;
                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3 font-mono text-sm text-gold font-bold">{item.numero_lot}</td>
                      <td className="px-5 py-3 text-sm text-foreground/60">
                        {item.essence_details?.nom || `ID: ${item.essence || item.essence_id || '—'}`}
                      </td>
                      <td className="px-5 py-3 font-semibold text-foreground text-sm">{Number(item.quantite_ml || 0).toLocaleString()} ml</td>
                      <td className="px-5 py-3 text-xs text-foreground/40">
                        {item.date_fabrication ? new Date(item.date_fabrication).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="px-5 py-3 text-xs">
                        {expDate ? (
                          <span className={isExpired ? 'text-red-400' : 'text-foreground/40'}>
                            {expDate.toLocaleDateString('fr-FR')}
                            {isExpired && ' ⚠️'}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        {item.actif
                          ? <CheckCircle2 size={15} className="text-emerald-400" />
                          : <AlertTriangle size={15} className="text-red-400" />
                        }
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-foreground/40 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-foreground/40 italic text-sm">Aucun lot enregistré.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/10">
            <h3 className="font-bold text-foreground mb-4">{editing ? 'Modifier le lot' : 'Créer un lot'}</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'ID Essence *', field: 'essence', placeholder: '1', type: 'number' },
                  { label: 'Numéro de Lot *', field: 'numero_lot', placeholder: 'LOT-2026-001' },
                  { label: 'Quantité (ml) *', field: 'quantite_ml', placeholder: '5000', type: 'number' },
                ].map(f => (
                  <div key={f.field} className={f.field === 'numero_lot' ? 'col-span-2' : ''}>
                    <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">{f.label}</label>
                    <input
                      type={f.type || 'text'}
                      value={(form as any)[f.field]}
                      onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Date Fabrication', field: 'date_fabrication', type: 'date' },
                  { label: 'Date Expiration', field: 'date_expiration', type: 'date' },
                ].map(f => (
                  <div key={f.field}>
                    <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">{f.label}</label>
                    <input
                      type={f.type}
                      value={(form as any)[f.field]}
                      onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))}
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
                <span className="text-sm text-foreground/60">Lot actif</span>
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-bold hover:bg-gold/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
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
    <div className="space-y-5">
      {alertItems.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-400">Alerte de stock faible</p>
            <p className="text-xs text-foreground/50 mt-0.5">
              {alertItems.length} essence(s) en dessous du seuil d'alerte dans le labo.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={fetchItems} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-foreground/60 hover:text-foreground transition-all">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden min-h-[200px]">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gold gap-2">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  {['Essence', 'Quantité Disponible (ml)', 'Seuil Alerte (ml)', 'Statut Stock', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-xs font-semibold text-foreground/40 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map(item => {
                  const qty = Number(item.quantite_disponible_ml || 0);
                  const threshold = Number(item.seuil_alerte_ml || 100);
                  const pct = Math.min((qty / (threshold * 2)) * 100, 100);
                  const isLow = qty <= threshold;
                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-foreground text-sm">
                          {item.essence_details?.nom || item.essence_nom || `Essence #${item.essence || item.id}`}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 max-w-[120px] h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isLow ? 'bg-red-400' : 'bg-emerald-400'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-foreground">{qty.toLocaleString()} ml</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-foreground/60">{threshold.toLocaleString()} ml</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isLow ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                          {isLow ? '⚠ Critique' : '✓ OK'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors">
                          <Edit2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-foreground/40 italic text-sm">
                      Aucun inventaire labo disponible.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-white/10">
            <h3 className="font-bold text-foreground mb-1">Ajuster le stock labo</h3>
            <p className="text-xs text-foreground/40 mb-4">
              {editing.essence_details?.nom || `Essence #${editing.essence || editing.id}`}
            </p>
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
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-bold hover:bg-gold/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                Mettre à jour
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LabPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('ingredients');

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Laboratoire</h1>
        <p className="text-sm text-foreground/40 mt-0.5">
          Gestion des ingrédients, des lots de production et de l'inventaire labo
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="flex border-b border-white/10 overflow-x-auto">
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

        <div className="p-6">
          {activeTab === 'ingredients' && <IngredientsTab />}
          {activeTab === 'lots' && <LotsTab />}
          {activeTab === 'inventory' && <InventoryTab />}
        </div>
      </div>
    </div>
  );
}
