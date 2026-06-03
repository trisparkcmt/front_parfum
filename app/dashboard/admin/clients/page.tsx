'use client';

import { useState } from 'react';
import { Search, Eye, Users, Heart, FlaskConical } from 'lucide-react';

const clients = [
  { id: 'CLT001', name: 'Marie Dupont', email: 'marie@email.com', phone: '+33 6 12 34 56 78', orders: 7, favorites: 12, compositions: 3, joined: '12 Jan 2025', status: 'actif' },
  { id: 'CLT002', name: 'Jean Mvondo', email: 'jean@email.com', phone: '+237 691 234 567', orders: 3, favorites: 5, compositions: 8, joined: '03 Mar 2025', status: 'actif' },
  { id: 'CLT003', name: 'Amina Bello', email: 'amina@email.com', phone: '+237 677 890 123', orders: 1, favorites: 2, compositions: 1, joined: '20 Avr 2026', status: 'actif' },
  { id: 'CLT004', name: 'Chris Tong', email: 'chris@email.com', phone: '+1 415 555 0123', orders: 12, favorites: 28, compositions: 0, joined: '05 Jun 2024', status: 'actif' },
  { id: 'CLT005', name: 'Sophie Lam', email: 'sophie@email.com', phone: '+33 7 98 76 54 32', orders: 0, favorites: 4, compositions: 2, joined: '01 Mai 2026', status: 'inactif' },
];

import { BackButton } from '@/components/ui/BackButton';

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<typeof clients[0] | null>(null);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Gestion des comptes clients</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Clients', value: clients.length, icon: <Users size={18} />, color: 'text-gold bg-gold/10' },
          { label: 'Actifs', value: clients.filter(c => c.status === 'actif').length, icon: <Users size={18} />, color: 'text-emerald-400 bg-emerald-500/10' },
          { label: 'Favoris enregistrés', value: clients.reduce((s, c) => s + c.favorites, 0), icon: <Heart size={18} />, color: 'text-red-400 bg-red-500/10' },
          { label: 'Compositions créées', value: clients.reduce((s, c) => s + c.compositions, 0), icon: <FlaskConical size={18} />, color: 'text-purple-400 bg-purple-500/10' },
        ].map(k => (
          <div key={k.label} className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-2xl">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${k.color}`}>
              {k.icon}
            </div>
            <p className="text-2xl font-bold text-foreground">{k.value}</p>
            <p className="text-xs text-foreground/40 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 shadow-2xl">
        <div className="flex items-center gap-2 border border-white/10 rounded-lg px-3 py-2 max-w-sm">
          <Search size={15} className="text-foreground/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un client..."
            className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-foreground/40"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                {['Client', 'Contact', 'Commandes', 'Favoris', 'Compositions', 'Inscrit le', 'Statut', 'Action'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-black text-xs font-bold">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{c.name}</p>
                        <p className="text-[11px] text-foreground/40">{c.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-xs text-foreground">{c.email}</p>
                    <p className="text-[11px] text-foreground/40">{c.phone}</p>
                  </td>
                  <td className="px-5 py-4 text-center font-semibold text-foreground">{c.orders}</td>
                  <td className="px-5 py-4 text-center text-foreground/60">{c.favorites}</td>
                  <td className="px-5 py-4 text-center text-foreground/60">{c.compositions}</td>
                  <td className="px-5 py-4 text-xs text-foreground/40">{c.joined}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full
                      ${c.status === 'actif' ? 'text-emerald-400 bg-emerald-500/10' : 'text-foreground/40 bg-white/5'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => setSelected(c)} className="p-1.5 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors">
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-white/10">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-black text-xl font-bold">
                {selected.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-foreground">{selected.name}</h3>
                <p className="text-xs text-foreground/40">{selected.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Commandes', value: selected.orders },
                { label: 'Favoris', value: selected.favorites },
                { label: 'Compositions', value: selected.compositions },
              ].map(s => (
                <div key={s.label} className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                  <p className="text-[11px] text-foreground/40">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-foreground/40 mb-4">Inscrit le {selected.joined} · {selected.phone}</p>
            <button onClick={() => setSelected(null)} className="w-full border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

