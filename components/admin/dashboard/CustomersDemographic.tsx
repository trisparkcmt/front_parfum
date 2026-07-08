'use client';

const countries = [
  { name: 'Cameroun', flag: '🇨🇲', customers: 2879, pct: 72, color: '#3641F5' },
  { name: 'France', flag: '🇫🇷', customers: 589, pct: 18, color: '#6366F1' },
  { name: 'Côte d\'Ivoire', flag: '🇨🇮', customers: 312, pct: 8, color: '#A5B4FC' },
  { name: 'Sénégal', flag: '🇸🇳', customers: 180, pct: 5, color: '#C7D2FE' },
  { name: 'Gabon', flag: '🇬🇦', customers: 94, pct: 3, color: '#E0E7FF' },
];

export default function CustomersDemographic() {
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm hover:shadow-gold/5 transition-all duration-300">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-foreground">Démographie Clients</h3>
          <p className="text-xs text-foreground/40 mt-0.5">Répartition par pays</p>
        </div>
      </div>

      {/* Simplified Africa map with pins */}
      <div className="w-full h-44 bg-white/5 rounded-xl mb-5 flex items-center justify-center overflow-hidden relative border border-white/5">
        <svg viewBox="0 0 400 300" className="w-full h-full">
          {/* Simplified Africa shape */}
          <path
            d="M200 30 C240 30 280 50 300 80 C320 110 330 150 320 190 C310 230 290 260 260 275 C230 285 200 280 180 270 C160 260 140 240 130 210 C120 180 110 150 120 120 C130 90 150 60 170 45 C180 37 190 30 200 30Z"
            fill="currentColor"
            className="text-foreground/10"
          />
          {/* Country dots */}
          <circle cx="220" cy="160" r="6" fill="#C5A059" stroke="#0b0b0b" strokeWidth="2">
            <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="180" cy="110" r="4" fill="#C5A059" opacity="0.8" stroke="#0b0b0b" strokeWidth="2" />
          <circle cx="170" cy="155" r="4" fill="#C5A059" opacity="0.6" stroke="#0b0b0b" strokeWidth="2" />
          <circle cx="160" cy="130" r="3.5" fill="#C5A059" opacity="0.4" stroke="#0b0b0b" strokeWidth="2" />
          <circle cx="240" cy="175" r="3" fill="#C5A059" opacity="0.2" stroke="#0b0b0b" strokeWidth="2" />
          
          {/* Connection lines */}
          <line x1="220" y1="160" x2="180" y2="110" stroke="#C5A059" strokeWidth="0.5" opacity="0.1" />
          <line x1="220" y1="160" x2="170" y2="155" stroke="#C5A059" strokeWidth="0.5" opacity="0.1" />
          <line x1="220" y1="160" x2="160" y2="130" stroke="#C5A059" strokeWidth="0.5" opacity="0.1" />
          <line x1="220" y1="160" x2="240" y2="175" stroke="#C5A059" strokeWidth="0.5" opacity="0.1" />
        </svg>
      </div>

      {/* Country list */}
      <div className="space-y-3.5">
        {countries.map((c) => (
          <div key={c.name} className="flex items-center gap-3 group">
            <span className="text-lg">{c.flag}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{c.name}</span>
                <span className="text-xs font-semibold text-foreground/60">{c.pct}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out group-hover:opacity-80"
                  style={{ width: `${c.pct}%`, background: '#C5A059', opacity: (c.pct/100) + 0.3 }}
                />
              </div>
            </div>
            <span className="text-xs text-foreground/40 w-24 text-right tabular-nums">{c.customers.toLocaleString('fr-FR')} clients</span>
          </div>
        ))}
      </div>
    </div>
  );
}


