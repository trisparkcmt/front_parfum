'use client';

/**
 * @file components/ui/EssenceSizePickerModal.tsx
 * @description Multi-format variant and quantity picker for Essences.
 *
 * Allows selecting multiple bottle size variants (produits_finis) simultaneously,
 * adjusting quantity per format, and adding all selected formats to the cart.
 */

import { useState, useEffect, useMemo } from 'react';
import { X, Droplets, ShoppingBag, Check, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product, ProduitFiniEssence } from '@/types';
import { formatPrice, resolveImageUrl } from '@/lib/utils';
import AppImage from '@/components/ui/AppImage';

export interface SelectedVariantItem {
  variant: ProduitFiniEssence;
  quantity: number;
}

interface EssenceSizePickerModalProps {
  product: Product; // The main Essence product containing produits_finis array
  onConfirm: (essence: Product, items: SelectedVariantItem[]) => void;
  onClose: () => void;
}

export function EssenceSizePickerModal({ product, onConfirm, onClose }: EssenceSizePickerModalProps) {
  // Map of variantId -> quantity (0 or undefined means not selected)
  const [selectedQuantities, setSelectedQuantities] = useState<Record<number, number>>({});

  const variants = useMemo(() => product.produits_finis || [], [product.produits_finis]);

  // Default select the first available variant with quantity 1
  useEffect(() => {
    if (variants.length > 0 && Object.keys(selectedQuantities).length === 0) {
      const firstAvailable = variants.find((v) => v.stock_disponible > 0) || variants[0];
      if (firstAvailable && firstAvailable.stock_disponible > 0) {
        setSelectedQuantities({ [firstAvailable.id]: 1 });
      }
    }
  }, [variants, selectedQuantities]);

  const toggleVariant = (variant: ProduitFiniEssence) => {
    if (variant.stock_disponible <= 0) return;
    setSelectedQuantities((prev) => {
      const next = { ...prev };
      if (next[variant.id]) {
        delete next[variant.id];
      } else {
        next[variant.id] = 1;
      }
      return next;
    });
  };

  const updateVariantQuantity = (variant: ProduitFiniEssence, delta: number) => {
    setSelectedQuantities((prev) => {
      const current = prev[variant.id] ?? 0;
      const nextQty = Math.max(1, Math.min(variant.stock_disponible, current + delta));
      return {
        ...prev,
        [variant.id]: nextQty,
      };
    });
  };

  const selectedItems: SelectedVariantItem[] = useMemo(() => {
    return variants
      .filter((v) => (selectedQuantities[v.id] ?? 0) > 0)
      .map((v) => ({
        variant: v,
        quantity: selectedQuantities[v.id],
      }));
  }, [variants, selectedQuantities]);

  const totalQuantity = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [selectedItems]);

  const totalPrice = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.variant.prix_actuel * item.quantity, 0);
  }, [selectedItems]);

  const handleConfirm = () => {
    if (selectedItems.length === 0) return;
    onConfirm(product, selectedItems);
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
          className="bg-background border border-white/10 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col mb-24 sm:mb-0"
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
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-foreground/50">
                  Sélectionnez les formats souhaités
                </p>
                {selectedItems.length > 0 && (
                  <span className="text-[11px] font-semibold text-gold">
                    {selectedItems.length} format{selectedItems.length > 1 ? 's' : ''} sélectionné{selectedItems.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {variants.map((v) => {
                  const currentQty = selectedQuantities[v.id] ?? 0;
                  const isSelected = currentQty > 0;
                  const isOutOfStock = v.stock_disponible <= 0;
                  const originalPriceNum = v.prix_promotionnel ? parseFloat(v.prix_promotionnel) : 0;
                  const hasReduction = originalPriceNum > 0 && originalPriceNum > v.prix_actuel;

                  return (
                    <div
                      key={v.id}
                      className={`relative w-full rounded-2xl border transition-all p-4 ${
                        isSelected
                          ? 'bg-gold/[0.07] border-gold/60 shadow-md'
                          : isOutOfStock
                          ? 'opacity-40 border-white/5 bg-white/5 text-foreground/35'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Checkbox & Details */}
                        <div
                          onClick={() => !isOutOfStock && toggleVariant(v)}
                          className={`flex items-center gap-3 flex-1 min-w-0 ${
                            isOutOfStock ? 'cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'border-gold bg-gold text-black'
                                : 'border-white/20 hover:border-white/40'
                            }`}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>

                          <div className="min-w-0">
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
                                <span className="text-amber-400 font-medium">Plus que {v.stock_disponible} restants</span>
                              ) : (
                                <span>En stock ({v.stock_disponible} flacons)</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Price display */}
                        <div className="text-right shrink-0">
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
                      </div>

                      {/* Quantity Stepper when selected */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                          <span className="text-[11px] font-medium text-foreground/60">
                            Quantité :
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateVariantQuantity(v, -1)}
                              disabled={currentQty <= 1}
                              className="w-7 h-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-xs hover:bg-white/20 disabled:opacity-30 transition-all font-bold"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-8 text-center font-mono font-bold text-sm text-foreground">
                              {currentQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateVariantQuantity(v, 1)}
                              disabled={currentQty >= v.stock_disponible}
                              className="w-7 h-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-xs hover:bg-white/20 disabled:opacity-30 transition-all font-bold"
                            >
                              <Plus size={12} />
                            </button>

                            <span className="ml-3 text-xs font-bold text-gold font-mono">
                              = {formatPrice(v.prix_actuel * currentQty)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total summary box */}
            {selectedItems.length > 0 && (
              <div className="bg-gold/5 border border-gold/20 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/60">
                    Récapitulatif de la sélection
                  </span>
                  <span className="text-sm font-bold text-gold font-mono">
                    {totalQuantity} flacon{totalQuantity > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="text-[11px] text-foreground/50 space-y-0.5">
                  {selectedItems.map((item) => (
                    <div key={item.variant.id} className="flex justify-between">
                      <span>• {item.quantity} × {item.variant.taille_ml}ml</span>
                      <span className="font-mono">{formatPrice(item.variant.prix_actuel * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-gold/15 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">Total</span>
                  <span className="text-base font-black text-gold font-mono">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="p-6 border-t border-white/10 bg-white/[0.01]">
            <button
              disabled={selectedItems.length === 0}
              onClick={handleConfirm}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all bg-gold text-black hover:bg-gold/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-gold/20"
            >
              <ShoppingBag size={14} />
              Ajouter au panier
              {totalQuantity > 0 && (
                <span className="ml-1 text-[10px] font-bold opacity-85">
                  ({totalQuantity} flacon{totalQuantity > 1 ? 's' : ''} · {formatPrice(totalPrice)})
                </span>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
