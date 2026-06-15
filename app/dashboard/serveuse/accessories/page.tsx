'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { shopService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';

export default function AccessoriesPage() {
  const [accessories, setAccessories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [accessoryTypes, setAccessoryTypes] = useState<any[]>([]);
  const { addToast } = useToastStore();

  const fetchAccessories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await shopService.getAccessories({
        search,
        type_accessoire: filter !== 'all' ? Number(filter) : undefined
      });
      const list = data.results || data.resultats || (Array.isArray(data) ? data : []);
      setAccessories(list);
    } catch (error) {
      addToast('Erreur lors du chargement des accessoires', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, filter, addToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAccessories();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchAccessories]);

  useEffect(() => {
    shopService.getAccessoryTypes()
      .then(data => {
        const list = data.results || data.resultats || (Array.isArray(data) ? data : []);
        setAccessoryTypes(list);
      })
      .catch(() => addToast('Erreur lors du chargement des types d\'accessoires', 'error'));
  }, [addToast]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Accessoires</h1>
        <p className="text-sm text-foreground/40 mt-0.5">Bijoux, montres et autres accessoires (Lecture seule)</p>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-2xl flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 border border-white/10 rounded-lg px-3 py-2 flex-1 min-w-48">
          <Search size={15} className="text-foreground/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom..."
            className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-foreground/40"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${filter === 'all' ? 'bg-gold text-black' : 'border border-white/10 text-foreground/40 hover:bg-white/5'}`}
          >
            Tous
          </button>
          {accessoryTypes.map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(String(t.id))}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${filter === String(t.id) ? 'bg-gold text-black' : 'border border-white/10 text-foreground/40 hover:bg-white/5'}`}
            >
              {t.nom}
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
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Prix</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {accessories.map(a => {
                  const aName = a.nom || 'Accessoire';
                  const aPrice = a.prix_unitaire || 0;
                  const aStock = a.stock_quantite || 0;
                  const typeName = typeof a.type_accessoire === 'object'
                    ? a.type_accessoire?.nom
                    : (accessoryTypes.find(t => t.id === a.type_accessoire)?.nom || '—');

                  return (
                    <tr key={a.slug || a.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform overflow-hidden border border-white/5">
                            {a.image_principale ? (
                              <img src={a.image_principale} alt={aName} className="w-full h-full object-cover" />
                            ) : (
                              '👜'
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{aName}</p>
                            <p className="text-[10px] text-foreground/30 font-mono mt-1 uppercase">{a.reference_sku || a.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tight text-slate-400 bg-slate-500/10">
                          {typeName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-foreground text-sm">{Number(aPrice).toLocaleString()} FCFA</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-foreground/60">{aStock} unités</p>
                      </td>
                    </tr>
                  );
                })}
                {accessories.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-20 text-foreground/40 italic">Aucun accessoire trouvé.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
