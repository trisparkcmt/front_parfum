'use client';

import { SlidersHorizontal } from 'lucide-react';

const orders = [
  {
    id: 'ORD001',
    product: 'Dupe Sauvage 100ml',
    variants: 'Eau de Parfum',
    category: 'Parfum',
    price: '89 000 FCFA',
    status: 'Livré',
    statusColor: 'text-emerald-400 bg-emerald-500/10',
    image: '🌿',
  },
  {
    id: 'ORD002',
    product: 'Montre Royale Or 18K',
    variants: '2 Variantes',
    category: 'Accessoire',
    price: '185 000 FCFA',
    status: 'En attente',
    statusColor: 'text-amber-400 bg-amber-500/10',
    image: '⌚',
  },
  {
    id: 'ORD003',
    product: 'Composition Numba #7',
    variants: 'Sur mesure · 100ml',
    category: 'Atelier',
    price: '42 000 FCFA',
    status: 'Livré',
    statusColor: 'text-emerald-400 bg-emerald-500/10',
    image: '🧪',
  },
  {
    id: 'ORD004',
    product: 'Collier Perles d\'Afrique',
    variants: 'Or & Perles naturelles',
    category: 'Bijoux',
    price: '95 000 FCFA',
    status: 'En livraison',
    statusColor: 'text-purple-400 bg-purple-500/10',
    image: '📿',
  },
  {
    id: 'ORD005',
    product: 'Chanel N°5 Original',
    variants: 'Eau de Parfum · 50ml',
    category: 'Parfum',
    price: '249 000 FCFA',
    status: 'Annulé',
    statusColor: 'text-red-400 bg-red-500/10',
    image: '🌸',
  },
];

export default function RecentOrders() {
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-2xl hover:shadow-gold/5 transition-all duration-300">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-foreground">Commandes Récentes</h3>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-sm border border-white/10 rounded-lg px-3 py-1.5 text-foreground/60 hover:bg-white/5 hover:text-foreground transition-colors">
            <SlidersHorizontal size={14} />
            Filtrer
          </button>
          <button className="text-sm border border-white/10 rounded-lg px-3 py-1.5 text-foreground/60 hover:bg-white/5 hover:text-foreground transition-colors">
            Voir tout
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-foreground/40 font-medium pb-3 text-xs uppercase tracking-wider">Produits</th>
              <th className="text-left text-foreground/40 font-medium pb-3 text-xs uppercase tracking-wider">Catégorie</th>
              <th className="text-left text-foreground/40 font-medium pb-3 text-xs uppercase tracking-wider">Prix</th>
              <th className="text-left text-foreground/40 font-medium pb-3 text-xs uppercase tracking-wider">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                <td className="py-3.5 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                      {order.image}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-xs">{order.product}</p>
                      <p className="text-foreground/40 text-[11px]">{order.variants}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 text-foreground/40 text-xs">{order.category}</td>
                <td className="py-3.5 text-foreground font-semibold text-xs">{order.price}</td>
                <td className="py-3.5">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${order.statusColor}`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


