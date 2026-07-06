'use client';

import { TrendingUp } from 'lucide-react';

const products = [
  {
    rank: 1,
    name: 'Dupe Sauvage 100ml',
    category: 'Dupe',
    sold: 342,
    revenue: '30.4M',
    trend: '+18%',
    image: '🌿',
    barWidth: 100,
  },
  {
    rank: 2,
    name: 'Composition Numba #3',
    category: 'Atelier',
    sold: 218,
    revenue: '9.1M',
    trend: '+32%',
    image: '🧪',
    barWidth: 64,
  },
  {
    rank: 3,
    name: 'Montre Royale Or 18K',
    category: 'Accessoire',
    sold: 156,
    revenue: '28.8M',
    trend: '+8%',
    image: '⌚',
    barWidth: 46,
  },
  {
    rank: 4,
    name: 'Chanel N°5 Original',
    category: 'Grande Marque',
    sold: 124,
    revenue: '30.8M',
    trend: '+5%',
    image: '🌸',
    barWidth: 36,
  },
  {
    rank: 5,
    name: 'Collier Perles d\'Afrique',
    category: 'Bijoux',
    sold: 98,
    revenue: '9.3M',
    trend: '+12%',
    image: '📿',
    barWidth: 29,
  },
];

export default function TopProducts() {
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm hover:shadow-gold/5 transition-all duration-300">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-foreground">Top Produits</h3>
          <p className="text-xs text-foreground/40 mt-0.5">Meilleures ventes ce mois</p>
        </div>
        <button className="text-xs text-gold font-medium hover:underline">Voir tout</button>
      </div>

      <div className="space-y-4">
        {products.map((p) => (
          <div key={p.rank} className="flex items-center gap-3 group">
            {/* Rank */}
            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0
              ${p.rank <= 3 ? 'bg-gold/20 text-gold' : 'bg-white/5 text-foreground/40'}`}>
              {p.rank}
            </span>

            {/* Product icon */}
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform duration-200">
              {p.image}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-0.5 shrink-0 ml-2">
                  <TrendingUp size={9} /> {p.trend}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-foreground/40">{p.sold} vendus</span>
                <span className="text-[11px] font-semibold text-foreground">{p.revenue} FCFA</span>
              </div>
              {/* Mini progress bar */}
              <div className="h-1 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold to-gold-dark transition-all duration-700"
                  style={{ width: `${p.barWidth}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


