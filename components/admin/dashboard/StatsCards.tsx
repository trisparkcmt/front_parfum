'use client';

import { Users, Package, Sparkles, DollarSign, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';

const stats = [
  {
    label: 'Clients',
    value: '3 782',
    change: '+11.01%',
    positive: true,
    icon: <Users size={22} className="text-gold" />,
    bg: 'bg-gold/10',
  },
  {
    label: 'Commandes',
    value: '5 359',
    change: '-9.05%',
    positive: false,
    icon: <Package size={22} className="text-[#F59E0B]" />,
    bg: 'bg-amber-50',
  },
  {
    label: 'Parfums',
    value: '847',
    change: '+23.5%',
    positive: true,
    icon: <Sparkles size={22} className="text-[#8B5CF6]" />,
    bg: 'bg-purple-50',
  },
  {
    label: 'Revenu',
    value: '2.4M',
    change: '+14.2%',
    positive: true,
    icon: <DollarSign size={22} className="text-emerald-500" />,
    bg: 'bg-emerald-50',
    suffix: ' FCFA',
  },
];

export default function StatsCards() {
  return (
    <>
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="bg-white/5 rounded-2xl border border-white/10 p-5 flex flex-col justify-between shadow-2xl hover:shadow-gold/5 transition-all duration-300 group"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
            {stat.icon}
          </div>
          <div>
            <p className="text-sm text-foreground/40 mb-1">{stat.label}</p>
            <div className="flex items-end gap-3">
              <span className="text-2xl font-bold text-foreground">
                {stat.value}
                {stat.suffix && <span className="text-sm font-medium text-foreground/40 ml-1">{stat.suffix}</span>}
              </span>
              <span className={`text-xs font-medium flex items-center gap-1 mb-0.5 ${stat.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                {stat.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {stat.change}
              </span>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}


