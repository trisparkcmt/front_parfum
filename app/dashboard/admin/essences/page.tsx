'use client';

import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Droplets } from 'lucide-react';

interface Essence {
  id: number;
  name: string;
  category: string;
  intensity: string;
  pricePerMl: string;
  stock: number;
}

const initialEssences: Essence[] = [
  { id: 1, name: 'Rose de Turquie', category: 'Floral', intensity: 'Haute', pricePerMl: '1 200 FCFA', stock: 500 },
  { id: 2, name: 'Oud Noir', category: 'Boisé', intensity: 'Très Haute', pricePerMl: '3 500 FCFA', stock: 250 },
  { id: 3, name: 'Bergamote de Calabre', category: 'Hespéridé', intensity: 'Moyenne', pricePerMl: '800 FCFA', stock: 800 },
  { id: 4, name: 'Musc Blanc', category: 'Musqué', intensity: 'Douce', pricePerMl: '1 500 FCFA', stock: 400 },
  { id: 5, name: 'Jasmin Sambac', category: 'Floral', intensity: 'Moyenne', pricePerMl: '1 800 FCFA', stock: 300 },
];

import { BackButton } from '@/components/ui/BackButton';

export default function EssencesPage() {
  const [essences, setEssences] = useState<Essence[]>(initialEssences);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEssence, setEditingEssence] = useState<Essence | null>(null);

  const filtered = essences.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: number) => {
    if (confirm('Voulez-vous vraiment supprimer cette essence ?')) {
      setEssences(essences.filter(e => e.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des Essences</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Configurez les essences disponibles pour l'Atelier Numba</p>
        </div>
        <button
          onClick={() => { setEditingEssence(null); setShowModal(true); }}
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
      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
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
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                        <Droplets size={18} />
                      </div>
                      <p className="font-semibold text-foreground text-sm">{e.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground/60">{e.category}</td>
                  <td className="px-6 py-4 text-sm text-foreground/60">{e.intensity}</td>
                  <td className="px-6 py-4 text-sm font-bold text-foreground">{e.pricePerMl}</td>
                  <td className="px-6 py-4 text-sm text-foreground/60">{e.stock} ml</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => { setEditingEssence(e); setShowModal(true); }}
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
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-20 text-center text-foreground/40 italic">
            Aucune essence trouvée
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
                    defaultValue={editingEssence?.name}
                    placeholder="ex: Rose de Turquie" 
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase mb-1 block">Famille Olfactive</label>
                  <select 
                    defaultValue={editingEssence?.category}
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
                    <label className="text-[10px] font-bold text-foreground/40 uppercase mb-1 block">Prix / ml</label>
                    <input 
                      defaultValue={editingEssence?.pricePerMl.split(' ')[0]}
                      placeholder="FCFA" 
                      type="number" 
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-foreground/40 uppercase mb-1 block">Stock (ml)</label>
                    <input 
                      defaultValue={editingEssence?.stock}
                      placeholder="ml" 
                      type="number" 
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-foreground/40 uppercase mb-1 block">Intensité</label>
                  <select 
                    defaultValue={editingEssence?.intensity}
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
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-bold hover:bg-gold/80 transition-colors">
                {editingEssence ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


