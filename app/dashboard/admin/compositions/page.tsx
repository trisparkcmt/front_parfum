'use client';

import { useState } from 'react';
import { FlaskConical, Cpu, Pencil, Eye } from 'lucide-react';

type CompoType = 'ia' | 'manuel';

const compositions = [
  {
    id: 'COMP001', client: 'Marie Dupont', type: 'ia' as CompoType,
    essences: ['Rose de Turquie', 'Jasmin Sambac', 'Musc blanc'],
    ratio: [40, 35, 25], status: 'sauvegardée', date: '01 Mai 2026', notes: 'Pour soirée élégante'
  },
  {
    id: 'COMP002', client: 'Jean Mvondo', type: 'manuel' as CompoType,
    essences: ['Oud noir', 'Ambre gris', 'Santal'],
    ratio: [50, 30, 20], status: 'commandée', date: '28 Avr 2026', notes: 'Boisé & oriental'
  },
  {
    id: 'COMP003', client: 'Sophie Lam', type: 'ia' as CompoType,
    essences: ['Bergamote', 'Thé vert', 'Cèdre de l\'Atlas'],
    ratio: [35, 45, 20], status: 'sauvegardée', date: '02 Mai 2026', notes: 'Fraîcheur matinale'
  },
  {
    id: 'COMP004', client: 'Amina Bello', type: 'manuel' as CompoType,
    essences: ['Iris', 'Violette', 'Poudre de riz'],
    ratio: [45, 35, 20], status: 'commandée', date: '04 Mai 2026', notes: 'Floral poudré'
  },
];

export default function CompositionsPage() {
  const [selected, setSelected] = useState<typeof compositions[0] | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Compositions Sur Mesure</h1>
          <p className="text-sm text-foreground/40 mt-0.5">Créations IA et compositions manuelles des clients</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total compositions', value: compositions.length, icon: <FlaskConical size={18} />, color: 'text-gold bg-gold/10' },
          { label: 'Via IA', value: compositions.filter(c => c.type === 'ia').length, icon: <Cpu size={18} />, color: 'text-purple-400 bg-purple-500/10' },
          { label: 'Manuelles', value: compositions.filter(c => c.type === 'manuel').length, icon: <Pencil size={18} />, color: 'text-amber-400 bg-amber-500/10' },
          { label: 'Commandées', value: compositions.filter(c => c.status === 'commandée').length, icon: <FlaskConical size={18} />, color: 'text-emerald-400 bg-emerald-500/10' },
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

      {/* List */}
      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Composition</th>
                <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-foreground/40 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {compositions.map(c => (
                <tr key={c.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                        ${c.type === 'ia' ? 'bg-purple-500/10 text-purple-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {c.type === 'ia' ? <Cpu size={18} /> : <Pencil size={18} />}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{c.id}</p>
                        <p className="text-[11px] text-foreground/40">{c.date}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-foreground font-medium">{c.client}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tight
                      ${c.type === 'ia' ? 'text-purple-400 bg-purple-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                      {c.type === 'ia' ? 'IA' : 'Manuel'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tight
                      ${c.status === 'commandée' ? 'text-emerald-400 bg-emerald-500/10' : 'text-blue-400 bg-blue-500/10'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setSelected(c)} className="p-2 rounded-lg hover:bg-white/5 text-foreground/40 hover:text-gold transition-colors">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-md shadow-2xl border border-white/10">
            <h3 className="font-bold text-foreground mb-1">Composition {selected.id}</h3>
            <p className="text-xs text-foreground/40 mb-4">{selected.client} · {selected.date}</p>
            <p className="text-sm text-foreground/60 italic mb-4">"{selected.notes}"</p>
            <div className="space-y-3 mb-5">
              {selected.essences.map((e, i) => (
                <div key={e}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground font-medium">{e}</span>
                    <span className="text-foreground/40">{selected.ratio[i]}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-gold to-gold-dark" style={{ width: `${selected.ratio[i]}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setSelected(null)} className="w-full border border-white/10 rounded-lg py-2.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

