'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Search } from 'lucide-react';
import { shopService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';

export default function FlaconsPage() {
  const [bottles, setBottles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { addToast } = useToastStore();

  const fetchBottles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await shopService.getBottles();
      const list = data.results || data.resultats || (Array.isArray(data) ? data : []);
      setBottles(list);
    } catch (error) {
      addToast('Erreur lors du chargement des flacons', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchBottles();
  }, [fetchBottles]);

  const filtered = bottles.filter(b => 
    b.nom?.toLowerCase().includes(search.toLowerCase()) || 
    b.reference_sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Catalogue Flacons</h1>
        <p className="text-sm text-foreground/40 mt-0.5">Types et volumes de flacons disponibles (Lecture seule)</p>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-2xl flex items-center gap-2 w-full max-w-md">
        <Search size={15} className="text-foreground/40" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un flacon..."
          className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-foreground/40"
        />
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm font-medium">Chargement des flacons...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Contenance</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Matière / Couleur</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Prix</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(b => (
                  <tr key={b.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-medium text-foreground">{b.nom}</td>
                    <td className="px-6 py-4 text-sm text-foreground/60">{b.reference_sku}</td>
                    <td className="px-6 py-4 text-sm text-foreground/60">{b.contenance_ml} ml</td>
                    <td className="px-6 py-4 text-sm text-foreground/60">{b.matiere} · {b.couleur}</td>
                    <td className="px-6 py-4 text-sm text-gold font-bold">{b.prix_unitaire} FCFA</td>
                    <td className="px-6 py-4 text-sm text-foreground/60">{b.stock_quantite} unités</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-20 text-foreground/40 italic">Aucun flacon trouvé.</td>
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
