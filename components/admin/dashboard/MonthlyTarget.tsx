'use client';

import { TrendingUp, TrendingDown, MoreHorizontal } from 'lucide-react';

export default function MonthlyTarget() {
  const percentage = 75.55;
  // SVG arc calculation for a semicircle gauge
  const radius = 85;
  const cx = 100;
  const cy = 100;
  const startAngle = 180;
  const endAngle = 0;
  const sweepAngle = (percentage / 100) * 180;
  
  // Convert angles to radians for SVG arc
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  
  // Start point (left side of arc)
  const startX = cx + radius * Math.cos(toRad(startAngle));
  const startY = cy - radius * Math.sin(toRad(startAngle));
  
  // End point for background (right side)
  const bgEndX = cx + radius * Math.cos(toRad(endAngle));
  const bgEndY = cy - radius * Math.sin(toRad(endAngle));
  
  // End point for progress
  const progressAngle = 180 - sweepAngle;
  const progressEndX = cx + radius * Math.cos(toRad(progressAngle));
  const progressEndY = cy - radius * Math.sin(toRad(progressAngle));
  
  const largeArcFlag = sweepAngle > 180 ? 1 : 0;

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-2xl hover:shadow-gold/5 transition-all duration-300">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-foreground">Objectif Mensuel</h3>
          <p className="text-xs text-foreground/40 mt-0.5">Objectif que vous vous êtes fixé</p>
        </div>
        <button className="text-foreground/40 hover:text-foreground p-1 rounded-lg hover:bg-white/5 transition-colors">
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Gauge */}
      <div className="flex flex-col items-center py-4">
        <div className="relative w-52 h-32">
          <svg viewBox="0 0 200 115" className="w-full h-full">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#C5A059" />
                <stop offset="50%" stopColor="#D4B87A" />
                <stop offset="100%" stopColor="#A8864A" />
              </linearGradient>
              <filter id="gaugeShadow">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#C5A059" floodOpacity="0.3" />
              </filter>
            </defs>
            {/* Background arc */}
            <path
              d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${bgEndX} ${bgEndY}`}
              fill="none"
              stroke="#ffffff10"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Progress arc */}
            <path
              d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${progressEndX} ${progressEndY}`}
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="14"
              strokeLinecap="round"
              filter="url(#gaugeShadow)"
              className="transition-all duration-1000 ease-out"
            />
            {/* Tick marks */}
            {[0, 25, 50, 75, 100].map((tick) => {
              const tickAngle = 180 - (tick / 100) * 180;
              const innerR = radius - 20;
              const outerR = radius - 24;
              const x1 = cx + innerR * Math.cos(toRad(tickAngle));
              const y1 = cy - innerR * Math.sin(toRad(tickAngle));
              const x2 = cx + outerR * Math.cos(toRad(tickAngle));
              const y2 = cy - outerR * Math.sin(toRad(tickAngle));
              return (
                <line key={tick} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#ffffff20" strokeWidth="1.5" strokeLinecap="round" />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
            <span className="text-3xl font-bold text-foreground">75.55%</span>
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1 mt-0.5">
              <TrendingUp size={11} /> +10%
            </span>
          </div>
        </div>
        <p className="text-xs text-center text-foreground/40 mt-3 leading-relaxed max-w-[220px]">
          Vous gagnez <span className="font-semibold text-foreground">3 287 000 FCFA</span> aujourd&apos;hui,
          c&apos;est plus que le mois dernier !
        </p>
      </div>

      {/* Bottom stats */}
      <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
        {[
          { label: 'Objectif', value: '20M', positive: false },
          { label: 'Revenu', value: '15.1M', positive: true },
          { label: "Aujourd'hui", value: '3.2M', positive: true },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <p className="text-[10px] text-foreground/40 mb-1">{item.label}</p>
            <p className={`text-sm font-bold flex items-center justify-center gap-0.5 ${item.positive ? 'text-emerald-400' : 'text-red-400'}`}>
              {item.value}
              {item.positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}


