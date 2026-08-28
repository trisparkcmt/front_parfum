'use client';

import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Paintbrush } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
}

export default function ColorPicker({ 
  value, 
  onChange, 
  label,
  className = ''
}: ColorPickerProps) {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en') ?? false;

  // Determine if a color is selected (not empty, and a valid hex color)
  const isColorSelected = /^#[0-9A-F]{6}$/i.test(value);
  const displayColor = isColorSelected ? value : '#3f3f46'; // fallback neutral color (zinc-700)

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <span className="block text-xs font-bold text-foreground/50 uppercase tracking-widest">
          {label}
        </span>
      )}
      
      <label className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 cursor-pointer select-none">
        {/* Color Preview Circle with transparent overlay input */}
        <div 
          className="relative flex-shrink-0 w-10 h-10 rounded-full border-2 border-white/20 hover:border-white/40 transition-all hover:scale-105 shadow-md flex items-center justify-center overflow-hidden"
          style={{ 
            backgroundColor: displayColor,
            boxShadow: isColorSelected ? `0 0 12px ${value}50` : 'none'
          }}
        >
          {!isColorSelected && (
            <Paintbrush size={14} className="text-white/40" />
          )}
          
          {/* Native color input covers the circle exactly */}
          <input
            type="color"
            value={isColorSelected ? value : '#1a1a1a'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Info & Actions */}
        <div className="flex-1 min-w-0">
          {isColorSelected ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-foreground font-medium truncate">
                {isEn ? 'Color Selected' : 'Couleur sélectionnée'}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault(); // Stop click propagation so it doesn't trigger color picker
                  e.stopPropagation();
                  onChange('');
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-foreground/40 hover:text-red-400 transition-all relative z-10"
                title={isEn ? 'Clear color' : 'Effacer la couleur'}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="text-xs text-gold/80 font-medium animate-pulse">
                {isEn ? 'Please select a color' : 'Veuillez choisir une couleur'}
              </span>
              <span className="text-[10px] text-foreground/30">
                {isEn ? 'Click the circle or button' : 'Cliquez sur le cercle ou le bouton'}
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div
          className="px-3 py-1.5 bg-gold/10 hover:bg-gold/20 border border-gold/30 text-gold hover:text-gold-light text-xs font-semibold rounded-lg transition-all"
        >
          {isEn ? 'Choose...' : 'Choisir...'}
        </div>
      </label>
    </div>
  );
}
