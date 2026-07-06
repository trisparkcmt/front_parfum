'use client';

import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Calendar } from 'lucide-react';

const data = [
  { date: '1', revenue: 1850000, target: 600000 },
  { date: '5', revenue: 1600000, target: 500000 },
  { date: '10', revenue: 1750000, target: 550000 },
  { date: '15', revenue: 1900000, target: 450000 },
  { date: '20', revenue: 2000000, target: 700000 },
  { date: '25', revenue: 2200000, target: 800000 },
  { date: '30', revenue: 2450000, target: 900000 },
];

const tabs = ['Mensuel', 'Trimestriel', 'Annuel'];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="bg-[#1E293B] text-foreground px-4 py-3 rounded-xl shadow-sm text-xs">
      <p className="font-semibold mb-2">Jour {label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-2 mt-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.stroke }} />
          {p.name === 'revenue' ? 'Revenu' : 'Objectif'}:
          <span className="font-bold">{(p.value / 1000000).toFixed(1)}M FCFA</span>
        </p>
      ))}
    </div>
  );
}

export default function StatisticsChart() {
  const [activeTab, setActiveTab] = useState('Mensuel');

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm hover:shadow-gold/5 transition-all duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-semibold text-foreground">Statistiques</h3>
          <p className="text-xs text-foreground/40 mt-0.5">Évolution du revenu et objectif mensuel</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-white/10 overflow-hidden">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-sm font-medium transition-all duration-200
                  ${activeTab === tab
                    ? 'bg-gold text-black'
                    : 'text-foreground/60 hover:bg-white/5'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="hidden sm:flex items-center gap-2 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-foreground/60 hover:bg-white/5 transition-colors cursor-pointer">
            <Calendar size={14} />
            <span>30 Avr – 6 Mai</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-4 text-xs">
        <span className="flex items-center gap-2 text-foreground/60">
          <span className="w-3 h-0.5 rounded-full bg-gold" /> Revenu
        </span>
        <span className="flex items-center gap-2 text-foreground/60">
          <span className="w-3 h-0.5 rounded-full bg-white/40" /> Objectif
        </span>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C5A059" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#C5A059" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ffffff" stopOpacity={0.05} />
              <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
          <XAxis
            dataKey="date"
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
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#C5A059"
            strokeWidth={2.5}
            fill="url(#colorRevenue)"
            dot={{ r: 3, fill: '#C5A059', strokeWidth: 2, stroke: '#171717' }}
            activeDot={{ r: 5, fill: '#C5A059', strokeWidth: 2, stroke: '#171717' }}
          />
          <Area
            type="monotone"
            dataKey="target"
            stroke="#ffffff44"
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="url(#colorTarget)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}


