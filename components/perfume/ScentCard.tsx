'use client';

import { motion } from 'framer-motion';
import { Plus, Minus, Info } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import type { Essence } from '@/types';
import { ESSENCE_INCREMENT_ML } from '@/lib/constants';

interface ScentCardProps {
  essence: Essence;
  currentQuantity: number;
  onAdd: (amount: number) => void;
  onRemove: (amount: number) => void;
  disabled?: boolean;
}

export function ScentCard({ essence, currentQuantity, onAdd, onRemove, disabled }: ScentCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={cn(
        "relative rounded-2xl p-4 border transition-all duration-300 overflow-hidden group flex flex-col h-full",
        currentQuantity > 0 
          ? "bg-charcoal border-gold shadow-lg shadow-gold/10" 
          : "bg-white/5 border-white/10 hover:border-white/30"
      )}
    >
      <div 
        className="absolute top-0 left-0 right-0 h-1" 
        style={{ backgroundColor: essence.color }} 
      />
      
      <div className="flex justify-between items-start mb-3 mt-1">
        <div>
          <h4 className="font-display font-bold text-lg leading-tight">{essence.name}</h4>
          <span className="text-xs text-foreground/50 uppercase tracking-wider">{essence.family}</span>
        </div>
        <div 
          className="w-4 h-4 rounded-full shadow-sm shrink-0"
          style={{ backgroundColor: essence.color }}
        />
      </div>

      <p className="text-sm text-foreground/60 line-clamp-3 mb-4 flex-1">
        {essence.description}
      </p>

      <div className="flex items-center justify-between mt-auto border-t border-white/10 pt-4">
        <div className="font-medium text-gold text-sm">
          {formatPrice(essence.pricePerMl * ESSENCE_INCREMENT_ML)} <span className="text-foreground/40 text-xs font-normal">/ {ESSENCE_INCREMENT_ML}ml</span>
        </div>

        <div className="flex items-center gap-3 bg-black/20 rounded-lg p-1 border border-white/5">
          <button 
            onClick={() => onRemove(ESSENCE_INCREMENT_ML)}
            disabled={currentQuantity === 0}
            className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Minus size={16} />
          </button>
          <span className="text-sm font-bold w-6 text-center">{currentQuantity}</span>
          <button 
            onClick={() => onAdd(ESSENCE_INCREMENT_ML)}
            disabled={disabled}
            className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
