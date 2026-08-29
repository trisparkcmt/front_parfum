'use client';

/**
 * @file components/ui/EssenceSizePickerModal.tsx
 * @description Size variant and quantity picker for Essences.
 *
 * Allows selecting a bottle size variant (produits_finis), choosing quantity,
 * and handles adding the selected finished product to the cart.
 */

import { useState, useEffect } from 'react';
import { X, Droplets, ShoppingBag, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product, ProduitFiniEssence } from '@/types';
import { formatPrice, resolveImageUrl } from '@/lib/utils';
import AppImage from '@/components/ui/AppImage';

interface EssenceSizePickerModalProps {
  product: Product; // The main Essence product containing produits_finis array
  onConfirm: (essence: Product, variant: ProduitFiniEssence, quantity: number) => void;
  onClose: () => void;
}

export function EssenceSizePickerModal({ product, onConfirm, onClose }: EssenceSizePickerModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProduitFiniEssence | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  const variants = product.produits_finis || [];

  // Default select the first available variant if any
  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      const firstAvailable = variants.find((v) => v.stock_disponible > 0) || variants[0];
      setSelectedVariant(firstAvailable);
    }
  }, [variants, selectedVariant]);

  // Reset quantity to 1 if selection changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant]);

  const handleConfirm = () => {
    if (!selectedVariant) return;
    onConfirm(product, selectedVariant, quantity);
    onClose();
  };

  const mainImage = product.image_principale || (product.images && product.images[0]) || '';

  return (
    <AnimatePresence>
      <motion.div
        key="size-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pb-20 sm:pb-4"
      >
        <motion.div
          key="size-modal-panel"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-background border border-white/10 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col mb-24 sm:mb-0"
        >
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center gap-4 px-6 pt-4 pb-4 border-b border-white/10">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
              {mainImage ? (
                <AppImage
                  src={resolveImageUrl(mainImage)}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ShoppingBag size={18} className="text-foreground/20" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gold/80 mb-0.5">
                {product.brand || 'Exclusif Collection'} · Huile
              </p>
              <h3 className="text-sm font-bold text-foreground line-clamp-1 leading-tight">
                {product.name}
              </h3>
              {product.stock_total_ml != null && (
                <p className="text-[10px] text-foreground/45 mt-0.5 flex items-center gap-1">
                  <Droplets size={10} className="text-gold" />
                  Stock laboratoire: {product.stock_total_ml.toLocaleString('fr-FR')} ml
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/5 text-foreground/40 hover:text-foreground transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1 min-h-0">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-foreground/50 mb-3">
                Sélectionnez un format
              </p>

              <div className="flex flex-col gap-2.5">
                {variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  const isOutOfStock = v.stock_disponible <= 0;
                  const originalPriceNum = v.prix_promotionnel ? parseFloat(v.prix_promotionnel) : 0;
                  const hasReduction = originalPriceNum > 0 && originalPriceNum > v.prix_actuel;

                  return (
                    <button
                      key={v.id}
                      disabled={isOutOfStock}
                      onClick={() => setSelectedVariant(v)}
                      className={`relative w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-gold/10 border-gold text-gold shadow-md'
                          : isOutOfStock
                          ? 'opacity-40 cursor-not-allowed border-white/5 bg-white/5 text-foreground/35'
                          : 'border-white/10 bg-white/5 text-foreground hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Custom custom checkbox style */}
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-gold bg-gold text-black' : 'border-white/20'
                        }`}>
                          {isSelected && <Check size={11} strokeWidth={3} />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{v.taille_ml} ml</span>
                            {hasReduction && (
                              <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-wide rounded-md">
                                Promo
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-foreground/45 mt-0.5">
                            {isOutOfStock ? (
                              <span className="text-red-400 font-semibold">Rupture de stock</span>
                            ) : v.stock_disponible <= 5 ? (
                              <span className="text-amber-400 font-medium font-sans">Plus que {v.stock_disponible} restants</span>
                            ) : (
                              <span>En stock</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {hasReduction ? (
                          <div className="flex flex-col items-end">
                            <span className="text-xs line-through text-foreground/40 font-mono">
                              {formatPrice(originalPriceNum)}
                            </span>
                            <span className="text-sm font-bold text-gold font-mono">
                              {formatPrice(v.prix_actuel)}
                            </span>
                          </div>
                        ) : (
                          <span className={`text-sm font-bold font-mono ${isSelected ? 'text-gold' : 'text-foreground'}`}>
                            {formatPrice(v.prix_actuel)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedVariant && (
              <div className="space-y-4">
                {/* Quantity selection */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-foreground/50">
                    Quantité
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-sm hover:bg-white/10 disabled:opacity-30 transition-all font-bold"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-mono font-bold text-sm text-foreground">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(selectedVariant.stock_disponible, q + 1))}
                      disabled={quantity >= selectedVariant.stock_disponible}
                      className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-sm hover:bg-white/10 disabled:opacity-30 transition-all font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Total box */}
                <div className="flex items-center justify-between bg-gold/5 border border-gold/20 rounded-2xl px-4 py-3.5">
                  <div>
                    <p className="text-[10px] text-foreground/50 uppercase tracking-widest font-semibold">Total</p>
                    <p className="text-[11px] text-foreground/40 mt-0.5">
                      {quantity} × {selectedVariant.taille_ml}ml ({formatPrice(selectedVariant.prix_actuel)})
                    </p>
                  </div>
                  <p className="text-lg font-black text-gold font-mono">
                    {formatPrice(selectedVariant.prix_actuel * quantity)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="p-6 border-t border-white/10 bg-white/[0.01]">
            <button
              disabled={!selectedVariant}
              onClick={handleConfirm}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all bg-gold text-black hover:bg-gold/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-gold/20"
            >
              <ShoppingBag size={14} />
              Ajouter au panier
              {selectedVariant && (
                <span className="ml-1 text-[10px] font-normal opacity-70">
                  ({quantity} flacon{quantity > 1 ? 's' : ''} {selectedVariant.taille_ml}ml)
                </span>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
