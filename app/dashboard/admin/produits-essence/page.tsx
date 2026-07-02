'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Edit2, Trash2, Plus, Search, RefreshCw } from 'lucide-react';
import { shopService, labService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { useCatalogPermissions } from '@/hooks/useCatalogPermissions';
import CatalogAccessNotice from '@/components/catalog/CatalogAccessNotice';
import AppImage from '@/components/ui/AppImage';
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

  const openAdd = () => {
    setEditing(null);
    setForm({
      essence: essences[0]?.id ? String(essences[0].id) : '',
      taille_ml: '50',
      prix: '',
      prix_promotionnel: '',
      stock_disponible: '0',
      actif: true,
      nom: '',
      marque: '',
      categorie: '',
    });
    setImageFile(null);
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
      nom: item.nom ?? '',
      marque: item.marque ?? '',
      categorie: item.categorie ?? '',
    });
    setImageFile(null);
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!permissions.canCreate && !permissions.canUpdate) return;
    if (!form.essence || !form.taille_ml || !form.prix || form.stock_disponible === '' || !form.nom) {
      setFormError('Essence, nom, taille, prix et stock sont requis');
      return;
    }

    const { adminService } = await import('@/services/apiService');
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
        await adminService.patchFormData(`shop/produits-essence/${editing.id}/`, formData);
        addToast('Produit essence mis à jour', 'success');
      } else {
        await adminService.postFormData('shop/produits-essence/', formData);
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
                  {['Image', 'Nom', 'Essence', 'Taille', 'Prix actuel', 'Stock', 'Actif', ''].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-foreground/40 uppercase px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5">
                    <td className="px-5 py-4">
                      {item.image_principale ? (
                        <AppImage src={item.image_principale} alt={item.nom || 'Produit'} width={40} height={40} className="size-10 rounded-lg object-cover border border-white/10" />
                      ) : (
                        <div className="size-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-foreground/30">Sans image</div>
                      )}
                    </td>
                    <td className="px-5 py-4 font-semibold text-foreground">
                      <div>
                        <p>{item.nom || '—'}</p>
                        {item.marque && <p className="text-[10px] text-foreground/40 font-normal">{item.marque} · {item.categorie}</p>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-foreground/60">
                      {item.essence_details?.nom 
                        ?? essences.find((e: any) => e.id === item.essence || e.id === item.essence_id)?.nom 
                        ?? (item.essence ? `Essence #${item.essence}` : '—')}
                    </td>
                    <td className="px-5 py-4">{item.taille_ml} ml</td>
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
                    <td colSpan={8} className="text-center py-16 text-foreground/40 italic">
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
          <div className="bg-background rounded-2xl w-full max-w-md border border-white/10 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg">{editing ? 'Modifier' : 'Nouveau'} produit essence</h3>
            
            <div className="space-y-3">
              <FloatInput
                label="Nom du produit *"
                placeholder="Nom du produit"
                value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <FloatInput
                  label="Marque"
                  placeholder="Marque"
                  value={form.marque}
                  onChange={(e) => setForm((f) => ({ ...f, marque: e.target.value }))}
                />
                <FloatInput
                  label="Catégorie"
                  placeholder="Catégorie"
                  value={form.categorie}
                  onChange={(e) => setForm((f) => ({ ...f, categorie: e.target.value }))}
                />
              </div>
            </div>

            <div className="relative">
              <label className="text-[10px] font-bold text-gold uppercase block mb-1">Essence de base *</label>
              <div
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-gold bg-neutral-900 cursor-pointer flex items-center justify-between"
                onClick={() => setShowEssenceDropdown(v => !v)}
              >
                <span className={form.essence ? 'text-foreground' : 'text-foreground/40'}>
                  {form.essence
                    ? essences.find((e: any) => String(e.id) === form.essence)?.nom ?? `Essence #${form.essence}`
                    : 'Choisir une essence…'}
                </span>
                <Search size={14} className="text-foreground/40" />
              </div>
              {showEssenceDropdown && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
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
              <label className="text-[10px] font-bold text-gold uppercase block mb-1">Image principale</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none file:bg-gold file:text-black file:border-0 file:rounded file:px-2 file:py-1 file:mr-2 file:text-xs file:font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FloatInput
                type="number"
                label="Taille (ml) *"
                placeholder="Taille (ml)"
                value={form.taille_ml}
                onChange={(e) => setForm((f) => ({ ...f, taille_ml: e.target.value }))}
              />
              <FloatInput
                type="number"
                label="Stock *"
                placeholder="Stock"
                value={form.stock_disponible}
                onChange={(e) => setForm((f) => ({ ...f, stock_disponible: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FloatInput
                type="number"
                label="Prix (FCFA) *"
                placeholder="Prix"
                value={form.prix}
                onChange={(e) => setForm((f) => ({ ...f, prix: e.target.value }))}
              />
              <FloatInput
                type="number"
                label="Prix Promo"
                placeholder="Promo"
                value={form.prix_promotionnel}
                onChange={(e) => setForm((f) => ({ ...f, prix_promotionnel: e.target.value }))}
              />
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
