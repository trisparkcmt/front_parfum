'use client';

import { useState } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';

type AccessoryCategory = 'bijoux' | 'montre' | 'sac' | 'autre';

const categoryConfig: Record<AccessoryCategory, { label: string; color: string }> = {
  bijoux: { label: 'Bijoux', color: 'text-amber-400 bg-amber-500/10' },
  montre: { label: 'Montres', color: 'text-blue-400 bg-blue-500/10' },
  sac: { label: 'Sacs', color: 'text-purple-400 bg-purple-500/10' },
  autre: { label: 'Autres', color: 'text-slate-400 bg-slate-500/10' },
};

const accessories = [
  { id: 1, name: 'Bracelet Or 18K', category: 'bijoux' as AccessoryCategory, price: '580 000 FCFA', stock: 5, image: '💛' },
  { id: 2, name: 'Collier Diamant', category: 'bijoux' as AccessoryCategory, price: '1 200 000 FCFA', stock: 3, image: '💍' },
  { id: 3, name: 'Montre Argent', category: 'montre' as AccessoryCategory, price: '890 000 FCFA', stock: 8, image: '⌚' },
  { id: 4, name: 'Montre Or Rose', category: 'montre' as AccessoryCategory, price: '1 450 000 FCFA', stock: 2, image: '🕐' },
  { id: 5, name: 'Sac Cuir Noir', category: 'sac' as AccessoryCategory, price: '340 000 FCFA', stock: 11, image: '👜' },
  { id: 6, name: 'Bague Rubis', category: 'bijoux' as AccessoryCategory, price: '720 000 FCFA', stock: 4, image: '💎' },
];

import { BackButton } from '@/components/ui/BackButton';

export default function AccessoriesPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);

  const filtered = accessories.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || a.category === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Accessoires</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Bijoux, montres et autres accessoires</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gold text-black px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gold/80 transition-all shadow-lg"
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(categoryConfig).map(([key, cfg]) => {
          const count = accessories.filter(a => a.category === key).length;
          return (
            <div key={key} className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-2xl">
              <p className="text-xs text-foreground/40 mb-1">{cfg.label}</p>
              <p className="text-2xl font-bold text-foreground">{count}</p>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                {count} articles
              </span>
            </div>
          );
        })}
      </div>

      {/* Filters */}
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
          {['all', ...Object.keys(categoryConfig)].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${filter === s ? 'bg-gold text-black' : 'border border-white/10 text-foreground/40 hover:bg-white/5'}`}
            >
              {s === 'all' ? 'Tous' : categoryConfig[s as AccessoryCategory]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
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
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                        {a.image}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{a.name}</p>
                        <p className="text-xs text-foreground/40">REF: ACC-{a.id.toString().padStart(3, '0')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tight ${categoryConfig[a.category].color}`}>
                      {categoryConfig[a.category].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-foreground text-sm">{a.price}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-foreground/60">{a.stock} unités</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-red-500/10 text-foreground/40 hover:text-red-400 transition-colors">
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
          <div className="py-20 text-center">
            <p className="text-foreground/40 italic">Aucun accessoire trouvé pour "{search}"</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/10">
            <h3 className="font-bold text-foreground mb-4">Ajouter un accessoire</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground/40 uppercase">Image de l'accessoire</label>
                <div className="border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-gold/40 transition-colors cursor-pointer bg-white/5">
                  <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                    <Plus size={20} />
                  </div>
                  <p className="text-[11px] text-foreground/40">Cliquez pour uploader une image</p>
                  <input type="file" className="hidden" />
                </div>
              </div>

              <div className="space-y-3">
                <input placeholder="Nom de l'accessoire" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
                <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold text-foreground/60">
                  <option value="" className="bg-background">Catégorie...</option>
                  {Object.entries(categoryConfig).map(([k, v]) => <option key={k} value={k} className="bg-background">{v.label}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Prix (FCFA)" type="number" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
                  <input placeholder="Stock" type="number" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">Annuler</button>
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-bold hover:bg-gold/80 transition-colors">Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

