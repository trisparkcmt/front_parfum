'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface ColorDisplayProps {
  color: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  clickable?: boolean;
}

export default function ColorDisplay({ 
  color, 
  size = 'md',
  label,
  clickable = true
}: ColorDisplayProps) {
  const [showModal, setShowModal] = useState(false);

  // Ensure valid hex color
  const validColor = /^#[0-9A-F]{6}$/i.test(color) ? color : '#1a1a1a';

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const circleSizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  return (
    <>
      {/* Display Circle */}
      <div 
        className={`${sizeClasses[size]} rounded-full border-2 border-white/20 shadow-lg transition-all ${
          clickable ? 'cursor-pointer hover:border-white/40 hover:shadow-xl' : ''
        }`}
        style={{ backgroundColor: validColor }}
        onClick={() => clickable && setShowModal(true)}
        title={clickable ? 'Cliquer pour voir les détails' : undefined}
      >
        <div 
          className="w-full h-full rounded-full pointer-events-none"
          style={{
            boxShadow: `inset 0 0 8px ${validColor}40, 0 0 12px ${validColor}40`,
          }}
        />
      </div>

      {/* Modal */}
      {showModal && clickable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-slate-900/95 rounded-2xl border border-white/10 shadow-2xl max-w-sm w-full p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Détails de la Couleur</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} className="text-foreground/60" />
              </button>
            </div>

            {/* Large Color Display */}
            <div className="flex flex-col items-center gap-4">
              <div 
                className={`${circleSizeClasses.lg} rounded-full border-4 border-white/20 shadow-2xl`}
                style={{ backgroundColor: validColor }}
              >
                <div 
                  className="w-full h-full rounded-full pointer-events-none"
                  style={{
                    boxShadow: `inset 0 0 20px ${validColor}60, 0 0 24px ${validColor}50`,
                  }}
                />
              </div>
            </div>

            {/* Color Info */}
            <div className="space-y-3">
              {label && (
                <div>
                  <p className="text-xs text-foreground/40 uppercase tracking-wide mb-1">Nom</p>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                </div>
              )}
              
              <div>
                <p className="text-xs text-foreground/40 uppercase tracking-wide mb-1">Code HEX</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-white/5 rounded-lg text-sm font-mono text-gold border border-white/10">
                    {validColor}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(validColor);
                    }}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium text-foreground transition-colors"
                  >
                    Copier
                  </button>
                </div>
              </div>

              {/* RGB Display */}
              <div>
                <p className="text-xs text-foreground/40 uppercase tracking-wide mb-1">RGB</p>
                <HexToRgbDisplay hex={validColor} />
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="w-full px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-foreground font-medium transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function HexToRgbDisplay({ hex }: { hex: string }) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  const r = parseInt(result?.[1] || '0', 16);
  const g = parseInt(result?.[2] || '0', 16);
  const b = parseInt(result?.[3] || '0', 16);

  return (
    <code className="px-3 py-2 bg-white/5 rounded-lg text-sm font-mono text-gold border border-white/10 block">
      rgb({r}, {g}, {b})
    </code>
  );
}
