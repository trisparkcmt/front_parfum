'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal, Eye, CheckCircle, Truck, XCircle } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'text-amber-400 bg-amber-500/10' },
  validated: { label: 'Validé', color: 'text-blue-400 bg-blue-500/10' },
  delivering: { label: 'En livraison', color: 'text-purple-400 bg-purple-500/10' },
  delivered: { label: 'Livré', color: 'text-emerald-400 bg-emerald-500/10' },
  cancelled: { label: 'Annulé', color: 'text-red-400 bg-red-500/10' },
};

const orders = [
  { id: '#00124', client: 'Marie Dupont', product: 'Chanel N°5 + Bracelet Or', total: '589 000 FCFA', date: '04 Mai 2026', status: 'pending', promo: 'NUMBA10', deliverer: null },
  { id: '#00123', client: 'Jean Mvondo', product: 'Composition Numba Sur Mesure', total: '340 000 FCFA', date: '03 Mai 2026', status: 'validated', promo: null, deliverer: 'Paul K.' },
  { id: '#00122', client: 'Amina Bello', product: 'Dupe Sauvage 100ml', total: '89 000 FCFA', date: '02 Mai 2026', status: 'delivering', promo: 'VIP20', deliverer: 'Alain N.' },
  { id: '#00121', client: 'Chris Tong', product: 'Montre Argent + Parfum', total: '720 000 FCFA', date: '01 Mai 2026', status: 'delivered', promo: null, deliverer: 'Paul K.' },
  { id: '#00120', client: 'Sophie Lam', product: 'Essence Oud 50ml', total: '150 000 FCFA', date: '30 Avr 2026', status: 'cancelled', promo: null, deliverer: null },
];

const deliverers = ['Paul K.', 'Alain N.', 'Serge B.'];

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [selectedDeliverer, setSelectedDeliverer] = useState('');

  const filtered = orders.filter(o => {
    const matchSearch = o.client.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search);
    const matchFilter = filter === 'all' || o.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Commandes</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Gérez toutes les commandes clients</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-2xl flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 border border-white/10 rounded-lg px-3 py-2 flex-1 min-w-48">
          <Search size={15} className="text-foreground/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher commande ou client..."
            className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-foreground/40"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'validated', 'delivering', 'delivered', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${filter === s ? 'bg-gold text-black' : 'border border-white/10 text-foreground/40 hover:bg-white/5'}`}
            >
              {s === 'all' ? 'Tous' : statusConfig[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                {['ID', 'Client', 'Produit', 'Total', 'Date', 'Promo', 'Livreur', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider px-5 py-3.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(order => (
                <tr key={order.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-gold font-semibold">{order.id}</td>
                  <td className="px-5 py-4 font-medium text-foreground">{order.client}</td>
                  <td className="px-5 py-4 text-foreground/40 max-w-48 truncate">{order.product}</td>
                  <td className="px-5 py-4 font-semibold text-foreground">{order.total}</td>
                  <td className="px-5 py-4 text-foreground/40 text-xs">{order.date}</td>
                  <td className="px-5 py-4">
                    {order.promo
                      ? <span className="text-xs font-mono bg-gold/10 text-gold px-2 py-0.5 rounded">{order.promo}</span>
                      : <span className="text-foreground/40">—</span>
                    }
                  </td>
                  <td className="px-5 py-4 text-xs text-foreground/40">{order.deliverer || '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusConfig[order.status]?.color}`}>
                      {statusConfig[order.status]?.label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button title="Voir" className="p-1.5 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors">
                        <Eye size={14} />
                      </button>
                      {order.status === 'pending' && (
                        <button
                          title="Valider & Assigner"
                          onClick={() => setAssignModal(order.id)}
                          className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-foreground/40 hover:text-emerald-400 transition-colors"
                        >
                          <CheckCircle size={14} />
                        </button>
                      )}
                      {order.status === 'validated' && (
                        <button title="En livraison" className="p-1.5 rounded-lg hover:bg-purple-500/10 text-foreground/40 hover:text-purple-400 transition-colors">
                          <Truck size={14} />
                        </button>
                      )}
                      {(order.status === 'pending' || order.status === 'validated') && (
                        <button title="Annuler" className="p-1.5 rounded-lg hover:bg-red-500/10 text-foreground/40 hover:text-red-400 transition-colors">
                          <XCircle size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Deliverer Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-white/10">
            <h3 className="font-bold text-foreground mb-1">Assigner un livreur</h3>
            <p className="text-sm text-foreground/40 mb-4">Commande {assignModal}</p>
            <select
              value={selectedDeliverer}
              onChange={e => setSelectedDeliverer(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground mb-4 outline-none focus:border-gold"
            >
              <option value="" className="bg-background">Choisir un livreur...</option>
              {deliverers.map(d => <option key={d} value={d} className="bg-background">{d}</option>)}
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => setAssignModal(null)}
                className="flex-1 border border-white/10 rounded-lg py-2 text-sm text-foreground/60 hover:bg-white/5 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => setAssignModal(null)}
                className="flex-1 bg-gold text-black rounded-lg py-2 text-sm font-medium hover:bg-gold/80 transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

