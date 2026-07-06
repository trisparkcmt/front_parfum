'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Search, Sparkles, Gem, FlaskConical } from 'lucide-react';
import { shopService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { AppImage } from '@/components/ui/AppImage';

type TabKey = 'perfume_categories' | 'accessory_categories' | 'bottle_types';

function TabButton({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void;
  icon: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-200 whitespace-nowrap
        ${active
          ? 'border-gold text-gold bg-white/5'
          : 'border-transparent text-foreground/40 hover:text-foreground/80 hover:border-white/20'
        }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('perfume_categories');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { addToast } = useToastStore();

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      let data: any;
      if (activeTab === 'perfume_categories') {
        data = await shopService.getPerfumeCategories();
      } else if (activeTab === 'accessory_categories') {
        data = await shopService.getAccessoryTypes();
      } else if (activeTab === 'bottle_types') {
        data = await shopService.getBottleTypes();
      }
      const list = data?.results || data?.resultats || (Array.isArray(data) ? data : []);
      setItems(list);
    } catch {
      addToast('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, addToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filtered = items.filter(c =>
    (c.nom || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.slug || '').toLowerCase().includes(search.toLowerCase())
  );

  const colSpan = activeTab === 'perfume_categories' ? 4 : activeTab === 'accessory_categories' ? 4 : 2;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Classifications & Catégories</h1>
        <p className="text-sm text-foreground/40 mt-0.5">Types d'accessoires, flacons et catégories de parfums (Lecture seule)</p>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-sm">
        <div className="flex border-b border-white/10 overflow-x-auto">
          <TabButton active={activeTab === 'perfume_categories'} onClick={() => setActiveTab('perfume_categories')} icon={<Sparkles size={14} />} label="Catégories Parfums" />
          <TabButton active={activeTab === 'accessory_categories'} onClick={() => setActiveTab('accessory_categories')} icon={<Gem size={14} />} label="Catégories Accessoires" />
          <TabButton active={activeTab === 'bottle_types'} onClick={() => setActiveTab('bottle_types')} icon={<FlaskConical size={14} />} label="Types Flacons" />
        </div>

        <div className="p-6">
          <div className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-sm flex items-center gap-2 w-full max-w-md mb-6">
            <Search size={15} className="text-foreground/40" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-foreground/40"
            />
          </div>

          <div className="bg-white/5 rounded-2xl border border-white/10 shadow-sm overflow-hidden min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gold gap-3">
                <Loader2 className="animate-spin" size={32} />
                <p className="text-sm font-medium">Chargement des éléments...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      {activeTab === 'perfume_categories' && (
                        <>
                          <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Nom</th>
                          <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Slug</th>
                          <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Ordre</th>
                          <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Taux Réduction</th>
                        </>
                      )}
                      {activeTab === 'accessory_categories' && (
                        <>
                          <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider w-16">Icône</th>
                          <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Nom</th>
                          <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Description</th>
                          <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Taux Réduction</th>
                        </>
                      )}
                      {activeTab === 'bottle_types' && (
                        <>
                          <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Nom</th>
                          <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Description</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map(c => (
                      <tr key={c.id} className="hover:bg-white/5 transition-colors group">
                        {activeTab === 'perfume_categories' && (
                          <>
                            <td className="px-6 py-4 font-medium text-foreground">{c.nom}</td>
                            <td className="px-6 py-4 text-sm text-foreground/60">{c.slug}</td>
                            <td className="px-6 py-4 text-sm text-foreground/60">{c.ordre_affichage}</td>
                            <td className="px-6 py-4 text-sm">
                              {c.taux_reduction && parseFloat(c.taux_reduction) > 0 ? (
                                <span className="bg-gold/10 text-gold px-2 py-0.5 rounded-md text-xs font-bold font-mono">-{c.taux_reduction}%</span>
                              ) : (
                                <span className="text-foreground/30 text-xs">—</span>
                              )}
                            </td>
                          </>
                        )}
                        {activeTab === 'accessory_categories' && (
                          <>
                            <td className="px-6 py-3 whitespace-nowrap">
                              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                                {c.icone ? (
                                  <AppImage src={c.icone} alt={c.nom || 'Icône'} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                ) : (
                                  <Gem size={18} className="text-foreground/20" />
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-medium text-foreground">{c.nom}</td>
                            <td className="px-6 py-4 text-sm text-foreground/60 max-w-[200px] truncate">{c.description || '—'}</td>
                            <td className="px-6 py-4 text-sm">
                              {c.taux_reduction && parseFloat(c.taux_reduction) > 0 ? (
                                <span className="bg-gold/10 text-gold px-2 py-0.5 rounded-md text-xs font-bold font-mono">-{c.taux_reduction}%</span>
                              ) : (
                                <span className="text-foreground/30 text-xs">—</span>
                              )}
                            </td>
                          </>
                        )}
                        {activeTab === 'bottle_types' && (
                          <>
                            <td className="px-6 py-4 font-medium text-foreground">{c.nom}</td>
                            <td className="px-6 py-4 text-sm text-foreground/60">{c.description || '—'}</td>
                          </>
                        )}
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={colSpan} className="text-center py-20 text-foreground/40 italic">Aucun élément trouvé.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
