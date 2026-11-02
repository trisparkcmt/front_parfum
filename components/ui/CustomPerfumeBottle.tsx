'use client';

import React, { useId, useMemo } from 'react';

interface CustomPerfumeBottleProps {
  color?: string;
  name?: string;
  customLabel?: string;
  bottleName?: string;
  fillLevel?: number; // 0 to 1, default 0.78
  className?: string;
}

function hexToRgb(h: string) {
  let hex = (h || '#C5A059').trim().replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return {
    r: isNaN(r) ? 197 : r,
    g: isNaN(g) ? 160 : g,
    b: isNaN(b) ? 89 : b,
  };
}

export function CustomPerfumeBottle({
  color = '#C5A059',
  name,
  customLabel,
  bottleName,
  fillLevel = 0.78,
  className = 'w-full h-full',
}: CustomPerfumeBottleProps) {
  const reactId = useId();
  const id = useMemo(() => reactId.replace(/[^a-zA-Z0-9]/g, ''), [reactId]);

  const col = useMemo(() => {
    const { r, g, b } = hexToRgb(color);
    return {
      top: `rgba(${Math.min(255, r + 35)}, ${Math.min(255, g + 35)}, ${Math.min(255, b + 25)}, 0.90)`,
      mid: `rgba(${r}, ${g}, ${b}, 0.95)`,
      bot: `rgba(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 20)}, 0.98)`,
      glow: `rgba(${r}, ${g}, ${b}, 0.35)`,
      subtle: `rgba(${r}, ${g}, ${b}, 0.15)`,
    };
  }, [color]);

  // Height calculations based on 260x480 viewbox (matching atelier 100ml / 50ml flacons)
  const pct = Math.max(0.1, Math.min(0.95, fillLevel));
  const liquidTopY = Math.round(420 - pct * 290);
  const liquidHeight = Math.max(20, 426 - liquidTopY);

  const displayLabel = customLabel || (name && name.length <= 16 ? name : 'ATELIER');

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Soft back aura from the liquid color */}
      <div
        className="pointer-events-none absolute inset-x-6 top-16 bottom-10 rounded-full blur-2xl transition-colors duration-700 opacity-60"
        style={{ background: col.glow }}
        aria-hidden
      />

      <svg
        viewBox="0 0 260 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-full h-full max-h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]"
      >
        <defs>
          {/* Outer Glass Shaders */}
          <linearGradient id={`g-glass-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
            <stop offset="14%" stopColor="rgba(255,255,255,0.22)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="86%" stopColor="rgba(255,255,255,0.24)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.80)" />
          </linearGradient>

          <linearGradient id={`g-glass-v-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.32)" />
            <stop offset="60%" stopColor="rgba(240,230,215,0.08)" />
            <stop offset="100%" stopColor="rgba(200,190,175,0.22)" />
          </linearGradient>

          {/* Liquid Shaders */}
          <linearGradient id={`g-liquid-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={col.top} stopOpacity="0.94" />
            <stop offset="60%" stopColor={col.mid} stopOpacity="0.96" />
            <stop offset="100%" stopColor={col.bot} stopOpacity="0.99" />
          </linearGradient>

          <radialGradient id={`g-surface-${id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.65)" />
            <stop offset="40%" stopColor={col.top} stopOpacity="0.9" />
            <stop offset="100%" stopColor={col.mid} stopOpacity="1" />
          </radialGradient>

          {/* Chrome Finishes */}
          <linearGradient id={`g-chrome-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#C8C6C6" />
            <stop offset="25%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#AFAFAF" />
            <stop offset="100%" stopColor="#E0DFDF" />
          </linearGradient>

          <linearGradient id={`g-gold-band-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8A6B29" />
            <stop offset="35%" stopColor="#F9E2A0" />
            <stop offset="70%" stopColor="#B48E38" />
            <stop offset="100%" stopColor="#6C521E" />
          </linearGradient>

          {/* Cap Glass */}
          <linearGradient id={`g-cap-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="100%" stopColor="rgba(197,160,89,0.15)" />
          </linearGradient>

          {/* Bottle clip path */}
          <clipPath id={`c-body-${id}`}>
            <rect x="42" y="118" width="176" height="310" rx="10" ry="10" />
          </clipPath>
        </defs>

        {/* ── BOTTLE BASE & GLASS SHELL ───────────────────────────── */}
        <rect
          x="42"
          y="118"
          width="176"
          height="310"
          rx="10"
          fill={`url(#g-glass-v-${id})`}
          stroke="rgba(210,195,175,0.40)"
          strokeWidth="1.2"
        />

        {/* ── LIQUID FILL ────────────────────────────────────────── */}
        <g clipPath={`url(#c-body-${id})`}>
          {/* Main liquid body */}
          <rect
            x="42"
            y={liquidTopY}
            width="176"
            height={liquidHeight}
            fill={`url(#g-liquid-${id})`}
          />

          {/* Deep liquid internal shadow at bottom */}
          <ellipse
            cx="130"
            cy="422"
            rx="75"
            ry="10"
            fill="rgba(0,0,0,0.35)"
          />

          {/* Liquid meniscus surface highlight */}
          <ellipse
            cx="130"
            cy={liquidTopY}
            rx={Math.round(62 + pct * 22)}
            ry="7.5"
            fill={`url(#g-surface-${id})`}
          />

          {/* Internal dip tube with liquid refraction */}
          <line
            x1="130"
            y1="110"
            x2="130"
            y2="415"
            stroke="rgba(255,255,255,0.30)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <line
            x1="129"
            y1="110"
            x2="129"
            y2="415"
            stroke="rgba(0,0,0,0.18)"
            strokeWidth="1.2"
          />
        </g>

        {/* ── GLASS OVERLAY & LIGHT REFLECTIONS ─────────────────── */}
        <rect
          x="42"
          y="118"
          width="176"
          height="310"
          rx="10"
          fill={`url(#g-glass-${id})`}
          opacity="0.65"
        />

        {/* Crisp vertical left reflection */}
        <line
          x1="49"
          y1="128"
          x2="49"
          y2="418"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Soft vertical right reflection */}
        <line
          x1="211"
          y1="128"
          x2="211"
          y2="418"
          stroke="rgba(255,255,255,0.40)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Subtle center vertical refraction */}
        <line
          x1="130"
          y1="124"
          x2="130"
          y2="422"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.8"
        />

        {/* ── LUXURY ETCHED LABEL ON BOTTLE ─────────────────────── */}
        <g opacity="0.92">
          {/* Frosted label plaque */}
          <rect
            x="76"
            y="272"
            width="108"
            height="62"
            rx="4"
            fill="rgba(12,12,12,0.45)"
            stroke="rgba(197,160,89,0.45)"
            strokeWidth="0.8"
          />
          <rect
            x="80"
            y="276"
            width="100"
            height="54"
            rx="2"
            fill="none"
            stroke="rgba(197,160,89,0.22)"
            strokeWidth="0.5"
          />

          <text
            x="130"
            y="294"
            textAnchor="middle"
            fontFamily="serif"
            fontSize="12"
            fontWeight="600"
            fill="#F4E2B2"
            letterSpacing="3"
          >
            NUMBA
          </text>
          <text
            x="130"
            y="308"
            textAnchor="middle"
            fontFamily="sans-serif"
            fontSize="7.5"
            fontWeight="500"
            fill="rgba(244,226,178,0.75)"
            letterSpacing="2.5"
          >
            SUR-MESURE
          </text>

          {displayLabel && displayLabel !== 'ATELIER' && (
            <text
              x="130"
              y="322"
              textAnchor="middle"
              fontFamily="serif"
              fontSize="8"
              fontStyle="italic"
              fill="rgba(255,255,255,0.85)"
              letterSpacing="1"
            >
              {displayLabel.length > 18 ? displayLabel.substring(0, 16) + '…' : displayLabel}
            </text>
          )}
        </g>

        {/* ── BOTTLE NECK ────────────────────────────────────────── */}
        <rect
          x="100"
          y="62"
          width="60"
          height="58"
          rx="2"
          fill={`url(#g-glass-v-${id})`}
          stroke="rgba(190,175,155,0.45)"
          strokeWidth="0.8"
        />

        {/* ── CHROME PUMP / SPRAY COLLAR ─────────────────────────── */}
        <rect
          x="95"
          y="50"
          width="70"
          height="16"
          rx="3"
          fill={`url(#g-chrome-${id})`}
          stroke="rgba(150,150,150,0.5)"
          strokeWidth="0.6"
        />
        <rect
          x="97"
          y="42"
          width="66"
          height="10"
          rx="2"
          fill={`url(#g-gold-band-${id})`}
          stroke="rgba(138,107,41,0.6)"
          strokeWidth="0.5"
        />

        {/* ── LUXURY CRYSTAL CAP ─────────────────────────────────── */}
        <rect
          x="88"
          y="8"
          width="84"
          height="36"
          rx="8"
          fill={`url(#g-cap-${id})`}
          stroke="rgba(197,160,89,0.55)"
          strokeWidth="1"
        />
        <rect
          x="92"
          y="12"
          width="76"
          height="28"
          rx="5"
          fill={`url(#g-glass-${id})`}
          opacity="0.55"
        />
        {/* Monogram inside cap */}
        <text
          x="130"
          y="31"
          textAnchor="middle"
          fontFamily="serif"
          fontSize="11"
          fontWeight="bold"
          fontStyle="italic"
          fill="rgba(244,226,178,0.95)"
          letterSpacing="2"
        >
          N
        </text>
      </svg>
    </div>
  );
}
export default CustomPerfumeBottle;
