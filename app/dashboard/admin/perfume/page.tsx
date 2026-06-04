'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Loader2, Sparkles } from 'lucide-react';
import { shopService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { BackButton } from '@/components/ui/BackButton';

type PerfumeCategory = 'grande-marque' | 'dupe' | 'numba' | 'sur-mesure';

const categoryConfig: Record<string, { label: string; color: string }> = {
  'grande-marque': { label: 'Grande Marque', color: 'text-purple-400 bg-purple-500/10' },
  'dupe': { label: 'Dupe', color: 'text-blue-400 bg-blue-500/10' },
  'numba': { label: 'Numba Atelier', color: 'text-amber-400 bg-amber-500/10' },
  'sur-mesure': { label: 'Sur Mesure', color: 'text-emerald-400 bg-emerald-500/10' },
};

export default function PerfumesPage() {
  const [perfumes, setPerfumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPerfume, setEditingPerfume] = useState<any | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [contenanceMl, setContenanceMl] = useState('100');

  const { addToast } = useToastStore();

  const fetchPerfumes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await shopService.getPerfumes({ search });
      const list = data.results || data.resultats || (Array.isArray(data) ? data : []);
      setPerfumes(list);
    } catch (error) {
      addToast('Erreur lors du chargement des parfums', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, addToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPerfumes();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchPerfumes]);

  const handleOpenAdd = () => {
    setEditingPerfume(null);
    setName('');
    setBrand('');
    setCategory('numba');
    setPrice('');
    setStock('');
    setDescription('');
    setContenanceMl('100');
    setShowModal(true);
  };

  const handleOpenEdit = (perfume: any) => {
    setEditingPerfume(perfume);
    setName(perfume.nom || perfume.name || '');
    setBrand(perfume.marque || perfume.brand || '');
    setCategory(perfume.categorie || perfume.category || 'numba');
    setPrice(String(perfume.prix || perfume.price || ''));
    setStock(String(perfume.stock || perfume.quantite_stock || ''));
    setDescription(perfume.description || '');
    setContenanceMl(String(perfume.contenance_ml || '100'));
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name || !price) {
      addToast('Le nom et le prix sont requis', 'error');
      return;
    }
    const payload = {
      nom: name,
      name: name,
      marque: brand,
      brand: brand,
      prix: parseFloat(price),
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      quantite_stock: parseInt(stock) || 0,
      description: description,
      contenance_ml: parseInt(contenanceMl) || 100,
      categorie: category,
      category: category,
    };

    try {
      if (editingPerfume) {
        await shopService.updatePerfume(editingPerfume.slug, payload);
        addToast('Parfum mis à jour avec succès', 'success');
      } else {
        await shopService.createPerfume(payload);
        addToast('Parfum créé avec succès', 'success');
      }
      setShowModal(false);
      fetchPerfumes();
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Erreur lors de la sauvegarde', 'error');
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce parfum ?')) return;
    try {
      await shopService.deletePerfume(slug);
      addToast('Parfum supprimé avec succès', 'success');
      fetchPerfumes();
    } catch (error) {
      addToast('Erreur lors de la suppression', 'error');
    }
  };

  const filtered = perfumes.filter(p => {
    const pCat = p.categorie || p.category || '';
    return filter === 'all' || pCat === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parfums</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Catalogue complet des parfums</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-gold text-black px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gold/80 transition-all shadow-lg"
        >
          <Plus size={16} />
          Ajouter un parfum
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-2xl flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 border border-white/10 rounded-lg px-3 py-2 flex-1 min-w-48">
          <Search size={15} className="text-foreground/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un parfum..."
            className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-foreground/40"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'grande-marque', 'dupe', 'numba', 'sur-mesure'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${filter === s ? 'bg-gold text-black' : 'border border-white/10 text-foreground/40 hover:bg-white/5'}`}
            >
              {s === 'all' ? 'Tous' : categoryConfig[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm font-medium">Chargement des parfums...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Produit</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Catégorie</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Prix</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(p => {
                  const pName = p.nom || p.name || 'Parfum';
                  const pBrand = p.marque || p.brand || '';
                  const pPrice = p.prix || p.price || 0;
                  const pStock = p.stock !== undefined ? p.stock : (p.quantite_stock || 0);
                  const pCat = p.categorie || p.category || 'numba';

                  return (
                    <tr key={p.slug || p.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                            🌸
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{pName}</p>
                            <p className="text-xs text-foreground/40">{pBrand} • {p.contenance_ml}ml</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tight ${categoryConfig[pCat]?.color || 'text-slate-400 bg-slate-500/10'}`}>
                          {categoryConfig[pCat]?.label || pCat}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-foreground text-sm">{pPrice.toLocaleString()} FCFA</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-foreground/60">{pStock} unités</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleOpenEdit(p)} className="p-2 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(p.slug)} className="p-2 rounded-lg hover:bg-red-500/10 text-foreground/40 hover:text-red-400 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-20 text-foreground/40 italic">Aucun parfum trouvé.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/10">
            <h3 className="font-bold text-foreground mb-4">
              {editingPerfume ? 'Modifier le parfum' : 'Ajouter un parfum'}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <input
                  placeholder="Nom du parfum"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                />
                <input
                  placeholder="Marque"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                />
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold text-foreground/60"
                >
                  <option value="grande-marque" className="bg-background">Grande Marque</option>
                  <option value="dupe" className="bg-background">Dupe</option>
                  <option value="numba" className="bg-background">Numba Atelier</option>
                  <option value="sur-mesure" className="bg-background">Sur Mesure</option>
                </select>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    placeholder="Prix (FCFA)"
                    type="number"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="col-span-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  />
                  <input
                    placeholder="Stock"
                    type="number"
                    value={stock}
                    onChange={e => setStock(e.target.value)}
                    className="col-span-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  />
                  <input
                    placeholder="Contenance (ml)"
                    type="number"
                    value={contenanceMl}
                    onChange={e => setContenanceMl(e.target.value)}
                    className="col-span-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  />
                </div>
                <textarea
                  placeholder="Description du parfum"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold h-20 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">
                Annuler
              </button>
              <button onClick={handleSave} className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-bold hover:bg-gold/80 transition-colors">
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
