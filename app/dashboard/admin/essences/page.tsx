'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Droplets, Loader2 } from 'lucide-react';
import { shopService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { BackButton } from '@/components/ui/BackButton';

export default function EssencesPage() {
  const [essences, setEssences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEssence, setEditingEssence] = useState<any | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [pricePerMl, setPricePerMl] = useState('');
  const [stock, setStock] = useState('');
  const [intensity, setIntensity] = useState('Moyenne');

  const { addToast } = useToastStore();

  const fetchEssences = useCallback(async () => {
    try {
      setLoading(true);
      const data = await shopService.getFinishedEssences();
      const list = data.results || data.resultats || (Array.isArray(data) ? data : []);
      setEssences(list);
    } catch (error) {
      addToast('Erreur lors du chargement des essences', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchEssences();
  }, [fetchEssences]);

  const handleOpenAdd = () => {
    setEditingEssence(null);
    setName('');
    setCategory('');
    setPricePerMl('');
    setStock('');
    setIntensity('Moyenne');
    setShowModal(true);
  };

  const handleOpenEdit = (essence: any) => {
    setEditingEssence(essence);
    setName(essence.nom || essence.name || '');
    setCategory(essence.famille_olfactive || essence.category || '');
    setPricePerMl(String(essence.prix_par_ml || essence.pricePerMl || ''));
    setStock(String(essence.stock || ''));
    setIntensity(essence.intensite || 'Moyenne');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name || !pricePerMl) {
      addToast('Le nom et le prix par ml sont requis', 'error');
      return;
    }

    const payload = {
      nom: name,
      name: name,
      famille_olfactive: category,
      category: category,
      prix_par_ml: parseFloat(pricePerMl),
      pricePerMl: parseFloat(pricePerMl),
      stock: parseInt(stock) || 0,
      intensite: intensity,
    };

    try {
      if (editingEssence) {
        await shopService.updateFinishedEssence(editingEssence.id, payload);
        addToast('Essence mise à jour avec succès', 'success');
      } else {
        await shopService.createFinishedEssence(payload);
        addToast('Essence créée avec succès', 'success');
      }
      setShowModal(false);
      fetchEssences();
    } catch (error: any) {
      addToast(error.response?.data?.detail || 'Erreur lors de la sauvegarde', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cette essence ?')) return;
    try {
      await shopService.deleteFinishedEssence(id);
      addToast('Essence supprimée avec succès', 'success');
      fetchEssences();
    } catch (error) {
      addToast('Erreur lors de la suppression', 'error');
    }
  };

  const filtered = essences.filter(e => {
    const eName = e.nom || e.name || '';
    const eCat = e.famille_olfactive || e.category || '';
    return eName.toLowerCase().includes(search.toLowerCase()) || 
           eCat.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des Essences</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Configurez les essences disponibles pour l'Atelier Numba</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-gold text-black px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gold/80 transition-all shadow-lg"
        >
          <Plus size={16} />
          Ajouter une essence
        </button>
      </div>

      {/* Search */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-2xl">
        <div className="flex items-center gap-2 border border-white/10 rounded-lg px-3 py-2 bg-white/5 focus-within:border-gold/50 transition-all">
          <Search size={15} className="text-foreground/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une essence par nom ou catégorie..."
            className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-foreground/40"
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm font-medium">Chargement des essences...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Essence</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Famille</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Intensité</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Prix / ml</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Stock (ml)</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(e => {
                  const eName = e.nom || e.name || 'Essence';
                  const eCat = e.famille_olfactive || e.category || 'Floral';
                  const ePrice = e.prix_par_ml || e.pricePerMl || 0;
                  const eStock = e.stock || 0;

                  return (
                    <tr key={e.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                            <Droplets size={18} />
                          </div>
                          <p className="font-semibold text-foreground text-sm">{eName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground/60">{eCat}</td>
                      <td className="px-6 py-4 text-sm text-foreground/60">{e.intensite || e.intensity || 'Moyenne'}</td>
                      <td className="px-6 py-4 text-sm font-bold text-foreground">{ePrice.toLocaleString()} FCFA</td>
                      <td className="px-6 py-4 text-sm text-foreground/60">{eStock} ml</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(e)}
                            className="p-2 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(e.id)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-foreground/40 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-20 text-foreground/40 italic">Aucune essence trouvée.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/10">
            <h3 className="font-bold text-foreground mb-4">
              {editingEssence ? 'Modifier l\'essence' : 'Ajouter une essence'}
            </h3>
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase mb-1 block">Nom de l'essence</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="ex: Rose de Turquie"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase mb-1 block">Famille Olfactive</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold text-foreground/60"
                  >
                    <option value="" className="bg-background">Sélectionner...</option>
                    <option value="Floral" className="bg-background">Floral</option>
                    <option value="Boisé" className="bg-background">Boisé</option>
                    <option value="Hespéridé" className="bg-background">Hespéridé</option>
                    <option value="Ambré" className="bg-background">Ambré</option>
                    <option value="Musqué" className="bg-background">Musqué</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-foreground/40 uppercase mb-1 block">Prix / ml (FCFA)</label>
                    <input
                      value={pricePerMl}
                      onChange={e => setPricePerMl(e.target.value)}
                      placeholder="FCFA"
                      type="number"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-foreground/40 uppercase mb-1 block">Stock (ml)</label>
                    <input
                      value={stock}
                      onChange={e => setStock(e.target.value)}
                      placeholder="ml"
                      type="number"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase mb-1 block">Intensité</label>
                  <select
                    value={intensity}
                    onChange={e => setIntensity(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold text-foreground/60"
                  >
                    <option value="Douce" className="bg-background">Douce</option>
                    <option value="Moyenne" className="bg-background">Moyenne</option>
                    <option value="Haute" className="bg-background">Haute</option>
                    <option value="Très Haute" className="bg-background">Très Haute</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">
                Annuler
              </button>
              <button onClick={handleSave} className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-bold hover:bg-gold/80 transition-colors">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
