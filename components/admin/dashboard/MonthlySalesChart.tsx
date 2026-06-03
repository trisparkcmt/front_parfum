'use client';

import { Menu, Search, Moon, Sun, Bell, ChevronDown, LogOut, Settings, User, ArrowLeft, MoreHorizontal } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const data = [
  { month: 'Jan', ventes: 1800000, objectif: 2000000 },
  { month: 'Fév', ventes: 3100000, objectif: 2500000 },
  { month: 'Mar', ventes: 2700000, objectif: 2500000 },
  { month: 'Avr', ventes: 2400000, objectif: 3000000 },
  { month: 'Mai', ventes: 2000000, objectif: 2500000 },
  { month: 'Jun', ventes: 1600000, objectif: 2000000 },
  { month: 'Jul', ventes: 2200000, objectif: 2000000 },
  { month: 'Aoû', ventes: 1100000, objectif: 1500000 },
  { month: 'Sep', ventes: 1750000, objectif: 2000000 },
  { month: 'Oct', ventes: 2900000, objectif: 2500000 },
  { month: 'Nov', ventes: 3400000, objectif: 3000000 },
  { month: 'Déc', ventes: 1300000, objectif: 2000000 },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="bg-[#1E293B] text-foreground px-4 py-3 rounded-xl shadow-xl text-xs">
      <p className="font-semibold mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill || p.color }} />
          {p.name}: <span className="font-bold">{(p.value / 1000000).toFixed(1)}M FCFA</span>
        </p>
      ))}
    </div>
  );
}

export default function MonthlySalesChart() {
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-2xl hover:shadow-gold/5 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-foreground">Ventes Mensuelles</h3>
          <p className="text-xs text-foreground/40 mt-0.5">Comparaison ventes vs objectif</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-foreground/60">
              <span className="w-2.5 h-2.5 rounded-sm bg-gold" /> Ventes
            </span>
            <span className="flex items-center gap-1.5 text-foreground/60">
              <span className="w-2.5 h-2.5 rounded-sm bg-white/10" /> Objectif
            </span>
          </div>
          <button className="text-foreground/40 hover:text-foreground p-1 rounded-lg hover:bg-white/5 transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barSize={16} barGap={4} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#ffffff66' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#ffffff66' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05', radius: 8 }} />
          <Bar dataKey="objectif" name="Objectif" fill="#ffffff1a" radius={[6, 6, 0, 0]} />
          <Bar dataKey="ventes" name="Ventes" fill="#C5A059" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}


