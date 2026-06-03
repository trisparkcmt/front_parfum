'use client';

import { useState } from 'react';
import { Plus, Truck, CheckCircle, Clock } from 'lucide-react';

const deliveries = [
  { id: 'LIV001', driver: 'Paul Kamga', orderId: '#00123', client: 'Jean Mvondo', address: 'Akwa, Douala', assigned: '04 Mai 2026', status: 'en_cours' },
  { id: 'LIV002', driver: 'Alain Nkomo', orderId: '#00122', client: 'Amina Bello', address: 'Bonapriso, Douala', assigned: '03 Mai 2026', status: 'livre' },
  { id: 'LIV003', driver: 'Paul Kamga', orderId: '#00119', client: 'Tom Ela', address: 'Bonanjo, Douala', assigned: '02 Mai 2026', status: 'livre' },
  { id: 'LIV004', driver: 'Serge Bello', orderId: '#00125', client: 'Nora Fon', address: 'Yaoundé Centre', assigned: '05 Mai 2026', status: 'en_attente' },
];

const drivers = [
  { name: 'Paul Kamga', phone: '+237 691 111 222', total: 18, active: 1 },
  { name: 'Alain Nkomo', phone: '+237 677 333 444', total: 12, active: 0 },
  { name: 'Serge Bello', phone: '+237 699 555 666', total: 9, active: 1 },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  en_attente: { label: 'En attente', color: 'text-amber-400 bg-amber-500/10', icon: <Clock size={11} /> },
  en_cours: { label: 'En cours', color: 'text-blue-400 bg-blue-500/10', icon: <Truck size={11} /> },
  livre: { label: 'Livré', color: 'text-emerald-400 bg-emerald-500/10', icon: <CheckCircle size={11} /> },
};

import { BackButton } from '@/components/ui/BackButton';

export default function DeliveryPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Livreurs</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Gestion des livraisons et livreurs</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gold text-black px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gold/80 transition-all shadow-lg"
        >
          <Plus size={16} />
          Ajouter livreur
        </button>
      </div>

      {/* Driver cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {drivers.map(d => (
          <div key={d.name} className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-black font-bold">
                {d.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{d.name}</p>
                <p className="text-[11px] text-foreground/40">{d.phone}</p>
              </div>
              <div className={`ml-auto w-2 h-2 rounded-full ${d.active ? 'bg-emerald-400' : 'bg-white/10'}`} />
            </div>
            <div className="flex justify-between text-center">
              <div>
                <p className="text-xl font-bold text-foreground">{d.total}</p>
                <p className="text-[11px] text-foreground/40">Total livraisons</p>
              </div>
              <div>
                <p className="text-xl font-bold text-gold">{d.active}</p>
                <p className="text-[11px] text-foreground/40">En cours</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Deliveries table */}
      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="font-semibold text-foreground">Toutes les livraisons</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                {['ID', 'Livreur', 'Commande', 'Client', 'Adresse', 'Assigné le', 'Statut', 'Action'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {deliveries.map(d => (
                <tr key={d.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-foreground/40">{d.id}</td>
                  <td className="px-5 py-4 font-medium text-foreground">{d.driver}</td>
                  <td className="px-5 py-4 font-mono text-xs text-gold font-semibold">{d.orderId}</td>
                  <td className="px-5 py-4 text-foreground/60">{d.client}</td>
                  <td className="px-5 py-4 text-xs text-foreground/40">{d.address}</td>
                  <td className="px-5 py-4 text-xs text-foreground/40">{d.assigned}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit ${statusConfig[d.status]?.color}`}>
                      {statusConfig[d.status]?.icon}
                      {statusConfig[d.status]?.label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {d.status === 'en_cours' && (
                      <button className="text-xs bg-emerald-500 text-black px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-400 transition-colors flex items-center gap-1 shadow-lg shadow-emerald-500/20">
                        <CheckCircle size={12} />
                        Marquer livré
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-white/10">
            <h3 className="font-bold text-foreground mb-4">Ajouter un livreur</h3>
            <div className="space-y-3">
              <input placeholder="Nom complet" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
              <input placeholder="Téléphone" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
              <input placeholder="Zone de livraison" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-gold" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">Annuler</button>
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gold text-black rounded-lg py-2.5 text-sm font-medium hover:bg-gold/80 transition-colors">Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

