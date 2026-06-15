'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Search, Image as ImageIcon } from 'lucide-react';
import { shopService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';

export default function PerfumePage() {
  const [perfumes, setPerfumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { addToast } = useToastStore();

  const fetchPerfumes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await shopService.getPerfumes({ search });
      const list = data.results || data.resultats || (Array.isArray(data) ? data : []);
      setPerfumes(list);
    } catch {
      addToast('Erreur lors du chargement des parfums', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, addToast]);

  useEffect(() => {
    const timer = setTimeout(fetchPerfumes, 300);
    return () => clearTimeout(timer);
  }, [fetchPerfumes]);

  const filtered = perfumes.filter(p => {
    const term = search.toLowerCase();
    return (
      p.nom?.toLowerCase().includes(term) ||
      p.reference_sku?.toLowerCase().includes(term) ||
      p.slug?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Catalogue Parfums</h1>
        <p className="text-sm text-foreground/40 mt-0.5">Parfums de marque et dupes disponibles (Lecture seule)</p>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-2xl flex items-center gap-2 w-full max-w-md">
        <Search size={15} className="text-foreground/40" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un parfum..."
          className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-foreground/40"
        />
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm font-medium">Chargement des parfums…</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider w-16">Image</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Contenance (ml)</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Prix</th>
                  <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(p => {
                  const productImg = p.image_principale || p.image;
                  return (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                          {productImg ? (
                            <img
                              src={productImg}
                              alt={p.nom || 'Parfum'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <ImageIcon size={18} className="text-foreground/20" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">{p.nom || p.name}</td>
                      <td className="px-6 py-4 text-sm text-foreground/60">{p.reference_sku || ''}</td>
                      <td className="px-6 py-4 text-sm text-foreground/60">{p.contenance_ml} ml</td>
                      <td className="px-6 py-4 text-sm font-bold">
                        <div className="flex items-center gap-2 flex-wrap">
                          {p.taux_reduction ? (
                            <>
                              <span className="text-foreground/40 line-through text-xs">{p.prix_unitaire} FCFA</span>
                              <span className="text-gold">{p.prix_actuel} FCFA</span>
                              <span className="text-xs bg-gold/10 text-gold px-1.5 py-0.5 rounded-md">-{p.taux_reduction}%</span>
                            </>
                          ) : (
                            <span className="text-gold">{p.prix_unitaire ? `${p.prix_unitaire} FCFA` : ''}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground/60">{p.stock_quantite} unités</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-20 text-foreground/40 italic">Aucun parfum trouvé.</td>
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
