'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Edit2, Trash2, Plus, Search, RefreshCw } from 'lucide-react';
import { shopService, labService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { useCatalogPermissions } from '@/hooks/useCatalogPermissions';
import CatalogAccessNotice from '@/components/catalog/CatalogAccessNotice';
import { extractCatalogList } from '@/lib/catalogUtils';
import { extractApiError } from '@/lib/apiError';
import { FloatInput } from '@/components/ui/Input';

export default function FinishedEssenceAdminPage() {
  const permissions = useCatalogPermissions('produits_essence');
  const [items, setItems] = useState<any[]>([]);
  const [essences, setEssences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tailleFilter, setTailleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const { addToast } = useToastStore();

  const [form, setForm] = useState({
    essence: '',
    taille_ml: '50',
    prix: '',
    prix_promotionnel: '',
    stock_disponible: '0',
    actif: true,
  });
  const [lotStockMl, setLotStockMl] = useState<number | null>(null);
  const [loadingLotStock, setLoadingLotStock] = useState(false);

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
      addToast('Erreur lors du chargement des produits essence', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, tailleFilter, addToast, permissions.canRead]);

  useEffect(() => {
    const timer = setTimeout(fetchItems, 300);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  useEffect(() => {
    labService.getEssences()
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
      const data = await labService.getLotsEssence({ essence: Number(essenceId), actif: true });
      const lots = extractCatalogList(data);
      const total = lots.reduce((sum, lot: any) => {
        const stock = lot.stock_ml ?? lot.quantite_ml ?? '0';
        return Number(sum) + parseFloat(String(stock));
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

  const openAdd = () => {
    setEditing(null);
    setForm({
      essence: essences[0]?.id ? String(essences[0].id) : '',
      taille_ml: '50',
      prix: '',
      prix_promotionnel: '',
      stock_disponible: '0',
      actif: true,
    });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      essence: String(item.essence ?? ''),
      taille_ml: String(item.taille_ml ?? ''),
      prix: String(item.prix ?? ''),
      prix_promotionnel: item.prix_promotionnel ? String(item.prix_promotionnel) : '',
      stock_disponible: String(item.stock_disponible ?? '0'),
      actif: item.actif !== false,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!permissions.canCreate && !permissions.canUpdate) return;
    if (!form.essence || !form.taille_ml || !form.prix || form.stock_disponible === '') {
      setFormError('Essence, taille, prix et stock sont requis');
      return;
    }

    const payload = {
      essence: Number(form.essence),
      taille_ml: Number(form.taille_ml),
      prix: form.prix,
      prix_promotionnel: form.prix_promotionnel || null,
      stock_disponible: Number(form.stock_disponible),
      actif: form.actif,
    };

    try {
      setFormError('');
      setSaving(true);
      if (editing) {
        await shopService.updateFinishedEssence(editing.id, payload);
        addToast('Produit essence mis à jour', 'success');
      } else {
        await shopService.createFinishedEssence(payload);
        addToast('Produit essence créé', 'success');
      }
      setShowModal(false);
      fetchItems();
    } catch (err: any) {
      setFormError(extractApiError(err, 'Erreur lors de la sauvegarde'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!permissions.canDelete) return;
    if (!confirm('Supprimer ce produit essence ?')) return;
    try {
      await shopService.deleteFinishedEssence(id);
      addToast('Produit supprimé', 'success');
      fetchItems();
    } catch {
      addToast('Erreur lors de la suppression', 'error');
    }
  };

  if (!permissions.canRead) {
    return (
      <div className="space-y-6">
        <CatalogAccessNotice permissions={permissions} resourceLabel="les produits essence" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produits Essence</h1>
          <p className="text-sm text-foreground/40 mt-0.5">
            Formats prêts à la vente (`/shop/produits-essence/`)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchItems()}
            className="flex items-center gap-2 border border-white/10 px-4 py-2.5 rounded-xl text-sm text-foreground/60 hover:bg-white/5"
          >
            <RefreshCw size={15} />
            Actualiser
          </button>
          {permissions.canCreate && (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 bg-gold text-black px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gold/80"
            >
              <Plus size={16} /> Ajouter
            </button>
          )}
        </div>
      </div>

      <CatalogAccessNotice permissions={permissions} resourceLabel="les produits essence" />

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 flex-1 min-w-[200px]">
          <Search size={15} className="text-foreground/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="text-sm bg-transparent outline-none flex-1 text-foreground"
          />
        </div>
        <select
          value={tailleFilter}
          onChange={(e) => setTailleFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none"
        >
          <option value="">Toutes tailles</option>
          {[10, 30, 50, 100].map((s) => (
            <option key={s} value={s}>{s} ml</option>
          ))}
        </select>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden min-h-[280px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm">Chargement…</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  {['Essence', 'Taille', 'Prix', 'Prix actuel', 'Stock', 'Actif', ''].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-foreground/40 uppercase px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5">
                    <td className="px-5 py-4 font-medium">
                      {item.essence_details?.nom ?? `Essence #${item.essence}`}
                    </td>
                    <td className="px-5 py-4">{item.taille_ml} ml</td>
                    <td className="px-5 py-4">{Number(item.prix).toLocaleString()} FCFA</td>
                    <td className="px-5 py-4 font-bold text-gold">
                      {Number(item.prix_actuel ?? item.prix).toLocaleString()} FCFA
                    </td>
                    <td className="px-5 py-4">{item.stock_disponible}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.actif ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {item.actif ? 'Oui' : 'Non'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1">
                        {permissions.canUpdate && (
                          <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-white/10 text-foreground/40 hover:text-gold">
                            <Edit2 size={14} />
                          </button>
                        )}
                        {permissions.canDelete && (
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-foreground/40 hover:text-red-400">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-foreground/40 italic">
                      Aucun produit essence trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (permissions.canCreate || permissions.canUpdate) && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl w-full max-w-md border border-white/10 p-6 space-y-4">
            <h3 className="font-bold text-lg">{editing ? 'Modifier' : 'Nouveau'} produit essence</h3>
            <div>
              <label className="text-[10px] font-bold text-gold uppercase block mb-1">Essence *</label>
              <select
                value={form.essence}
                onChange={(e) => setForm((f) => ({ ...f, essence: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-gold bg-neutral-900"
              >
                <option value="">Choisir une essence…</option>
                {essences.map((e) => (
                  <option key={e.id} value={e.id}>{e.marque} — {e.nom}</option>
                ))}
              </select>
            </div>
            <FloatInput
              type="number"
              label="Taille (ml) *"
              placeholder="Taille (ml)"
              value={form.taille_ml}
              onChange={(e) => setForm((f) => ({ ...f, taille_ml: e.target.value }))}
            />
            <FloatInput
              type="number"
              label="Prix (FCFA) *"
              placeholder="Prix (FCFA)"
              value={form.prix}
              onChange={(e) => setForm((f) => ({ ...f, prix: e.target.value }))}
            />
            <FloatInput
              type="number"
              label="Prix promotionnel (optionnel)"
              placeholder="Prix promotionnel (optionnel)"
              value={form.prix_promotionnel}
              onChange={(e) => setForm((f) => ({ ...f, prix_promotionnel: e.target.value }))}
            />
            <FloatInput
              type="number"
              label="Stock disponible *"
              placeholder="Stock disponible"
              value={form.stock_disponible}
              onChange={(e) => setForm((f) => ({ ...f, stock_disponible: e.target.value }))}
            />

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

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 rounded-xl py-2.5 text-sm">
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-gold text-black rounded-xl py-2.5 text-sm font-bold disabled:opacity-50"
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
