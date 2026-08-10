'use client';

import { MoreHorizontal } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const data = [
  { month: 'Jan', sales: 1800000, target: 2000000 },
  { month: 'Feb', sales: 3100000, target: 2500000 },
  { month: 'Mar', sales: 2700000, target: 2500000 },
  { month: 'Apr', sales: 2400000, target: 3000000 },
  { month: 'May', sales: 2000000, target: 2500000 },
  { month: 'Jun', sales: 1600000, target: 2000000 },
  { month: 'Jul', sales: 2200000, target: 2000000 },
  { month: 'Aug', sales: 1100000, target: 1500000 },
  { month: 'Sep', sales: 1750000, target: 2000000 },
  { month: 'Oct', sales: 2900000, target: 2500000 },
  { month: 'Nov', sales: 3400000, target: 3000000 },
  { month: 'Dec', sales: 1300000, target: 2000000 },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="bg-[#1E293B] text-foreground px-4 py-3 rounded-xl shadow-sm text-xs">
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
    <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm hover:shadow-gold/5 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-foreground">Monthly Sales</h3>
          <p className="text-xs text-foreground/40 mt-0.5">Sales vs target comparison</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-foreground/60">
              <span className="w-2.5 h-2.5 rounded-sm bg-gold" /> Sales
            </span>
            <span className="flex items-center gap-1.5 text-foreground/60">
              <span className="w-2.5 h-2.5 rounded-sm bg-white/10" /> Target
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
          <Bar dataKey="target" name="Target" fill="#ffffff1a" radius={[6, 6, 0, 0]} />
          <Bar dataKey="sales" name="Sales" fill="#C5A059" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}