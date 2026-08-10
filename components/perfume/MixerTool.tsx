'use client';

/**
 * @file components/perfume/MixerTool.tsx
 * @description Visual Liquid Blending & Bottle Simulation with in-file translations.
 */

import { motion } from 'framer-motion';
import i18n from 'i18next';
import { Droplets } from 'lucide-react';
import { MAX_COMPOSITION_ML } from '@/lib/constants';
import { blendColors } from '@/lib/utils';
import type { CompositionEssence } from '@/types';

// ── In-File Dictionary ─────────────────────────────────────────────────────

const dict = {
  fr: {
    full: 'Flacon plein — Prêt à créer !',
    addEssences: 'Ajoutez des essences pour remplir votre flacon',
  },
  en: {
    full: 'Bottle full — Ready to craft!',
    addEssences: 'Add essences to fill your bottle',
  },
};

function getLang(): 'fr' | 'en' {
  return i18n.language && i18n.language.startsWith('en') ? 'en' : 'fr';
}

interface MixerToolProps {
  essences: CompositionEssence[];
  totalMl: number;
}

export function MixerTool({ essences, totalMl }: MixerToolProps) {
  const t = dict[getLang()];
  const percentage = Math.min(100, Math.round((totalMl / MAX_COMPOSITION_ML) * 100));
  
  const colorsToBlend = essences.map(e => ({
    hex: e.essence.color,
    weight: e.quantityMl
  }));
  
  const blendedColor = blendColors(colorsToBlend);

  return (
    <div className="relative flex flex-col items-center justify-center p-8 bg-charcoal rounded-3xl border border-white/10 w-full max-w-sm mx-auto">
      <div 
        className="absolute inset-0 rounded-3xl opacity-20 blur-2xl transition-colors duration-1000"
        style={{ backgroundColor: blendedColor }}
      />
      
      <div className="relative z-10 w-48 h-64 border-4 border-white/20 rounded-b-3xl rounded-t-xl bg-deep-black overflow-hidden flex flex-col justify-end">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-12 border-4 border-white/20 rounded-t-md bg-deep-black" />
        
        <motion.div
          className="w-full relative"
          initial={{ height: 10 }}
          animate={{ height: `${percentage}%` }}
          transition={{ type: 'spring', bounce: 0.2, duration: 1 }}
          style={{ backgroundColor: blendedColor }}
        >
          <div className="absolute top-0 inset-x-0 h-4 bg-white/20 mix-blend-overlay" />
          
          {percentage > 0 && (
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <Droplets size={48} className="text-foreground mix-blend-overlay" />
            </div>
          )}
        </motion.div>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-foreground mix-blend-difference pointer-events-none">
          <span className="font-display text-4xl font-bold">{totalMl}</span>
          <span className="text-sm tracking-widest uppercase">/ {MAX_COMPOSITION_ML} ml</span>
        </div>
      </div>
      
      <div className="mt-8 text-center relative z-10 w-full">
        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-2">
          <motion.div 
            className="h-full"
            style={{ backgroundColor: percentage === 100 ? '#10B981' : blendedColor }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-sm font-medium">
          {percentage === 100 ? (
            <span className="text-emerald-400">{t.full}</span>
          ) : (
            <span className="text-foreground/60">{t.addEssences}</span>
          )}
        </p>
      </div>
    </div>
  );
}