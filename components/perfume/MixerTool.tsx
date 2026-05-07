'use client';

/**
 * @file components/perfume/MixerTool.tsx
 * @description Visual Liquid Blending & Bottle Simulation.
 *
 * This component provides a highly visual, interactive representation of a perfume 
 * bottle being filled with various essences in the Numba Atelier. 
 * 
 * **Key Visual Logic**:
 * - **Liquid Level Simulation**: Uses `framer-motion` to animate the height of the liquid container (`percentage`), which is calculated based on the `totalMl` relative to `MAX_COMPOSITION_ML`.
 * - **Dynamic Color Blending**: Integrates the `blendColors` utility. It calculates the resulting liquid color by weighting the HEX codes of each added essence by its specific milliliter volume.
 * - **Glass Aesthetic**: Implements a multi-layered design with a `deep-black` background and semi-transparent borders to simulate a luxury glass flacon.
 * - **Interactive Feedback**: Includes a real-time capacity progress bar and status text that changes when the bottle reaches 100% capacity.
 * 
 * **Props**:
 * - `essences`: Array of `CompositionEssence` objects containing the ingredient data.
 * - `totalMl`: The cumulative volume of all essences added to the mix.
 * 
 * **Technical Implementation**: Leverages CSS `mix-blend-mode` for realistic lighting effects and `spring` transitions for smooth volume changes.
 */
import { motion } from 'framer-motion';
import { Droplets } from 'lucide-react';
import { MAX_COMPOSITION_ML } from '@/lib/constants';
import { blendColors } from '@/lib/utils';
import type { CompositionEssence } from '@/types';

interface MixerToolProps {
  essences: CompositionEssence[];
  totalMl: number;
}

export function MixerTool({ essences, totalMl }: MixerToolProps) {
  const percentage = Math.min(100, Math.round((totalMl / MAX_COMPOSITION_ML) * 100));
  
  const colorsToBlend = essences.map(e => ({
    hex: e.essence.color,
    weight: e.quantityMl
  }));
  
  const blendedColor = blendColors(colorsToBlend);

  return (
    <div className="relative flex flex-col items-center justify-center p-8 bg-charcoal rounded-3xl border border-white/10 w-full max-w-sm mx-auto">
      {/* Background glow based on blended color */}
      <div 
        className="absolute inset-0 rounded-3xl opacity-20 blur-2xl transition-colors duration-1000"
        style={{ backgroundColor: blendedColor }}
      />
      
      <div className="relative z-10 w-48 h-64 border-4 border-white/20 rounded-b-3xl rounded-t-xl bg-deep-black overflow-hidden flex flex-col justify-end">
        {/* Cap outline */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-12 border-4 border-white/20 rounded-t-md bg-deep-black" />
        
        {/* Liquid */}
        <motion.div
          className="w-full relative"
          initial={{ height: 10 }}
          animate={{ height: `${percentage}%` }}
          transition={{ type: 'spring', bounce: 0.2, duration: 1 }}
          style={{ backgroundColor: blendedColor }}
        >
          {/* Waves / bubbles effect */}
          <div className="absolute top-0 inset-x-0 h-4 bg-white/20 mix-blend-overlay" />
          
          {percentage > 0 && (
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <Droplets size={48} className="text-white mix-blend-overlay" />
            </div>
          )}
        </motion.div>

        {/* Total ML indicator */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white mix-blend-difference pointer-events-none">
          <span className="font-display text-4xl font-bold">{totalMl}</span>
          <span className="text-sm tracking-widest uppercase">/ {MAX_COMPOSITION_ML} ml</span>
        </div>
      </div>
      
      {/* Capacity Warning */}
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
            <span className="text-emerald-400">Flacon plein — Prêt à créer !</span>
          ) : (
            <span className="text-foreground/60">Ajoutez des essences pour remplir votre flacon</span>
          )}
        </p>
      </div>
    </div>
  );
}
