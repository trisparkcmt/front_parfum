'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { shopService, adminService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { BackButton } from '@/components/ui/BackButton';
import ImageUploader from '@/components/admin/ImageUploader';

const categoryConfig: Record<string, { label: string; color: string }> = {
  'bijoux': { label: 'Bijoux', color: 'text-amber-400 bg-amber-500/10' },
  'montre': { label: 'Montres', color: 'text-blue-400 bg-blue-500/10' },
  'sac': { label: 'Sacs', color: 'text-purple-400 bg-purple-500/10' },
  'autre': { label: 'Autres', color: 'text-slate-400 bg-slate-500/10' },
};

export default function AccessoriesPage() {
  const [accessories, setAccessories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<any | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('autre');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  // New fields
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [longDesc, setLongDesc] = useState('');
  const [iaDesc, setIaDesc] = useState('');
  const [volume, setVolume] = useState('');

  const { addToast } = useToastStore();

  const fetchAccessories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await shopService.getAccessories({ search });
      const list = data.results || data.resultats || (Array.isArray(data) ? data : []);
      setAccessories(list);
    } catch (error) {
      addToast('Erreur lors du chargement des accessoires', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, addToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAccessories();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchAccessories]);

  const handleOpenAdd = () => {
    setEditingAccessory(null);
    setName('');
    setCategory('autre');
    setPrice('');
    setStock('');
    setSlug('');
    setSku('');
    setShortDesc('');
    setLongDesc('');
    setIaDesc('');
    setVolume('');
    setImageFile(null);
    setShowModal(true);
  };

  const handleOpenEdit = (acc: any) => {
    setEditingAccessory(acc);
    setName(acc.nom || acc.name || '');
    setCategory(acc.categorie || acc.category || 'autre');
    setPrice(String(acc.prix || acc.price || ''));
    setStock(String(acc.stock || acc.quantite_stock || ''));
    setSlug(acc.slug || '');
    setSku(acc.reference_sku || '');
    setShortDesc(acc.description_courte || '');
    setLongDesc(acc.description_longue || '');
    setIaDesc(acc.description_ia || '');
    setVolume(String(acc.contenance_ml || ''));
    setImageFile(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name || !price) {
      addToast('Le nom et le prix sont requis', 'error');
      return;
    }
    const formData = new FormData();
    formData.append('nom', name);
    if (slug) formData.append('slug', slug);
    if (sku) formData.append('reference_sku', sku);
    if (shortDesc) formData.append('description_courte', shortDesc);
    if (longDesc) formData.append('description_longue', longDesc);
    if (iaDesc) formData.append('description_ia', iaDesc);
    if (volume) formData.append('contenance_ml', volume);
    formData.append('prix_unitaire', price);
    formData.append('categorie', category);
    formData.append('stock', stock);
    if (imageFile) {
      formData.append('image', imageFile);
    }
    try {
      if (editingAccessory) {
        await adminService.postFormData(`shop/accessoires/${editingAccessory.slug}/`, formData);
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
    if (!confirm('Voulez-vous vraiment supprimer cet accessoire ?')) return;
    try {
      await shopService.deleteAccessory(slug);
      addToast('Accessoire supprimé avec succès', 'success');
      fetchAccessories();
    } catch (error) {
      addToast('Erreur lors de la suppression', 'error');
    }
  };

  const filtered = accessories.filter(a => {
    const aCat = a.categorie || a.category || 'autre';
    return filter === 'all' || aCat === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Accessoires</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Bijoux, montres et autres accessoires</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-gold text-black px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gold/80 transition-all shadow-lg"
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-2xl flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 border border-white/10 rounded-lg px-3 py-2 flex-1 min-w-48">
          <Search size={15} className="text-foreground/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un accessoire..."
            className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-foreground/40"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'bijoux', 'montre', 'sac', 'autre'].map(s => (
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

      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm font-medium">Chargement des accessoires...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Accessoire</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Catégorie</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Prix</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(a => {
                  const aName = a.nom || a.name || 'Accessoire';
                  const aPrice = a.prix || a.price || 0;
                  const aStock = a.stock !== undefined ? a.stock : (a.quantite_stock || 0);
                  const aCat = a.categorie || a.category || 'autre';

                  return (
                    <tr key={a.slug || a.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                            👜
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{aName}</p>
                            <p className="text-xs text-foreground/40">SLUG: {a.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tight ${categoryConfig[aCat]?.color || 'text-slate-400 bg-slate-500/10'}`}>
                          {categoryConfig[aCat]?.label || aCat}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-foreground text-sm">{aPrice.toLocaleString()} FCFA</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-foreground/60">{aStock} unités</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleOpenEdit(a)} className="p-2 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(a.slug)} className="p-2 rounded-lg hover:bg-red-500/10 text-foreground/40 hover:text-red-400 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-20 text-foreground/40 italic">Aucun accessoire trouvé.</td>
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
            <h3 className="font-bold text-foreground mb-4">
              {editingAccessory ? 'Modifier l\'accessoire' : 'Ajouter un accessoire'}
            </h3>
            <div className="space-y-4">
              <div className="space-y-3">
                <input
                  placeholder="Nom de l'accessoire"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                />
                <input
                  placeholder="Slug (optionnel)"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                />
                <input
                  placeholder="Référence SKU (optionnel)"
                  value={sku}
                  onChange={e => setSku(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                />
                <textarea
                  placeholder="Description courte"
                  value={shortDesc}
                  onChange={e => setShortDesc(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  rows={2}
                />
                <textarea
                  placeholder="Description longue"
                  value={longDesc}
                  onChange={e => setLongDesc(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  rows={3}
                />
                <textarea
                  placeholder="Description IA"
                  value={iaDesc}
                  onChange={e => setIaDesc(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  rows={2}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Contenance (ml)"
                    type="number"
                    value={volume}
                    onChange={e => setVolume(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  />
                  <input
                    placeholder="Prix (FCFA)"
                    type="number"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  />
                </div>
                <ImageUploader onFileSelect={setImageFile} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">Annuler</button>
              <button onClick={handleSave} className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-bold hover:bg-gold/80 transition-colors">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
