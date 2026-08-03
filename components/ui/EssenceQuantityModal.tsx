'use client';

/**
 * @file components/ui/EssenceQuantityModal.tsx
 * @description Quantity picker for ProduitFiniEssence (finished essence bottles).
 *
 * The backend uses a FIFO lot system — stock is virtual (in ml).
 * The user buys a number of BOTTLES (quantite = number of flasks).
 * Each bottle has a fixed volume (taille_ml). We let the user pick
 * from quick-picks (1, 2, 3, 5, 10 bottles) or enter a custom bottle count.
 *
 * Stock guard: if stock_total_ml is known, we warn if the requested
 * volume exceeds available stock.
 */

import { useState, useRef, useEffect } from 'react';
import { X, Droplets, ShoppingBag, AlertTriangle, Check, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '@/types';
import { formatPrice, resolveImageUrl } from '@/lib/utils';
import AppImage from '@/components/ui/AppImage';

// ── Quick-pick presets (number of bottles) ───────────────────────────────────
const QUICK_PICKS = [1, 2, 3, 5, 10];

// ── Component ─────────────────────────────────────────────────────────────────

interface EssenceQuantityModalProps {
  product: Product;
  onConfirm: (product: Product, quantite: number) => void;
  onClose: () => void;
}

export function EssenceQuantityModal({ product, onConfirm, onClose }: EssenceQuantityModalProps) {
  const [selected, setSelected] = useState<number | 'other'>(1);
  const [customValue, setCustomValue] = useState('');
  const [customError, setCustomError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const tailleMl = product.taille_ml ?? 0;
  const stockMl = product.stock_total_ml;

  useEffect(() => {
    if (selected === 'other') {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [selected]);

  const effectiveQty: number =
    selected === 'other'
      ? (customValue !== '' && !isNaN(Number(customValue)) ? Math.max(1, Math.floor(Number(customValue))) : 0)
      : selected;

  const requestedMl = effectiveQty * tailleMl;
  const stockExceeded = stockMl != null && stockMl > 0 && requestedMl > stockMl;
  const stockLow = stockMl != null && stockMl > 0 && !stockExceeded && requestedMl > stockMl * 0.7;

  const totalPrice = effectiveQty * product.price;
  const canConfirm = effectiveQty >= 1 && !stockExceeded && customError === '';

  const handleCustomChange = (val: string) => {
    setCustomValue(val);
    setCustomError('');
    const num = Number(val);
    if (val !== '' && (isNaN(num) || num < 1 || !Number.isInteger(num))) {
      setCustomError('Veuillez entrer un nombre entier positif.');
    }
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(product, effectiveQty);
    onClose();
  };

  const mainImage = product.image_principale || (product.images && product.images[0]) || '';

  return (
    <AnimatePresence>
      <motion.div
        key="essence-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pb-20 sm:pb-4"
      >
        <motion.div
          key="essence-modal-panel"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-background border border-white/10 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl overflow-hidden max-h-[90dvh] mb-24 sm:mb-0"
        >
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          <div className="flex items-center gap-4 px-6 pt-4 pb-5 border-b border-white/10">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
              {mainImage ? (
                <AppImage
                  src={resolveImageUrl(mainImage)}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ShoppingBag size={20} className="text-foreground/20" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gold/80 mb-0.5">
                Essence · {tailleMl > 0 ? `${tailleMl}ml / flacon` : 'sur demande'}
              </p>
              <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-tight">
                {product.name}
              </h3>
              <p className="text-xs text-foreground/50 mt-0.5">
                {formatPrice(product.price)} / flacon
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/5 text-foreground/40 hover:text-foreground transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-6 py-5 space-y-5">
            {stockMl != null && (
              <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs ${
                stockMl === 0
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                  : stockMl < 100
                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              }`}>
                <Droplets size={13} className="shrink-0" />
                {stockMl === 0
                  ? "Stock épuisé — cette essence n'est plus disponible."
                  : `Stock disponible : ${stockMl.toLocaleString('fr-FR')} ml total`}
              </div>
            )}

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-foreground/50 mb-3">
                Nombre de flacons
              </p>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {QUICK_PICKS.map((qty) => {
                  const qtyMl = qty * tailleMl;
                  const over = stockMl != null && stockMl > 0 && qtyMl > stockMl;
                  return (
                    <button
                      key={qty}
                      disabled={over || stockMl === 0}
                      onClick={() => { setSelected(qty); setCustomValue(''); setCustomError(''); }}
                      className={`relative flex flex-col items-center justify-center py-3 rounded-2xl border text-sm font-bold transition-all ${
                        selected === qty
                          ? 'bg-gold/10 border-gold text-gold shadow-md shadow-gold/10'
                          : over
                          ? 'opacity-30 cursor-not-allowed border-white/5 bg-white/5 text-foreground/30'
                          : 'border-white/10 bg-white/5 text-foreground hover:border-white/25 hover:bg-white/10'
                      }`}
                    >
                      {selected === qty && (
                        <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-gold rounded-full flex items-center justify-center">
                          <Check size={8} className="text-black" />
                        </span>
                      )}
                      <span className="text-base font-black">{qty}</span>
                      {tailleMl > 0 && (
                        <span className="text-[9px] font-medium text-foreground/40 mt-0.5">
                          {qtyMl} ml
                        </span>
                      )}
                    </button>
                  );
                })}

                <button
                  onClick={() => setSelected('other')}
                  className={`flex flex-col items-center justify-center py-3 rounded-2xl border text-sm font-bold transition-all ${
                    selected === 'other'
                      ? 'bg-gold/10 border-gold text-gold shadow-md shadow-gold/10'
                      : 'border-white/10 bg-white/5 text-foreground/60 hover:border-white/25 hover:bg-white/10'
                  }`}
                >
                  <Package size={15} className="mb-0.5" />
                  <span className="text-[11px] font-bold">Autre</span>
                </button>
              </div>

              <AnimatePresence>
                {selected === 'other' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-1">
                      <label className="block text-[10px] text-foreground/40 font-semibold uppercase tracking-wider mb-1.5">
                        Nombre de flacons (entier ≥ 1)
                      </label>
                      <input
                        ref={inputRef}
                        type="number"
                        min={1}
                        step={1}
                        value={customValue}
                        onChange={(e) => handleCustomChange(e.target.value)}
                        placeholder="ex: 7"
                        className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none transition-colors ${
                          customError
                            ? 'border-red-500/60 focus:border-red-500'
                            : 'border-white/10 focus:border-gold'
                        }`}
                      />
                      {customError && (
                        <p className="mt-1 text-[10px] text-red-400 flex items-center gap-1">
                          <AlertTriangle size={10} /> {customError}
                        </p>
                      )}
                      {tailleMl > 0 && effectiveQty > 0 && !customError && (
                        <p className="mt-1 text-[10px] text-foreground/40">
                          = {(effectiveQty * tailleMl).toLocaleString('fr-FR')} ml prélevés sur le stock
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {stockExceeded && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 text-xs text-red-400">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                <span>
                  Volume demandé ({requestedMl.toLocaleString('fr-FR')} ml) supérieur au stock disponible ({(stockMl ?? 0).toLocaleString('fr-FR')} ml).
                </span>
              </div>
            )}

            {stockLow && !stockExceeded && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5 text-xs text-amber-400">
                <AlertTriangle size={12} className="shrink-0" />
                Stock limité — dépêchez-vous !
              </div>
            )}

            {effectiveQty >= 1 && !stockExceeded && (
              <div className="flex items-center justify-between bg-gold/5 border border-gold/20 rounded-xl px-4 py-3">
                <div>
                  <p className="text-[10px] text-foreground/50 uppercase tracking-widest font-semibold">Total estimé</p>
                  <p className="text-xs text-foreground/40 mt-0.5">{effectiveQty} flacon{effectiveQty > 1 ? 's' : ''} × {formatPrice(product.price)}</p>
                </div>
                <p className="text-lg font-black text-gold">{formatPrice(totalPrice)}</p>
              </div>
            )}

            <button
              disabled={!canConfirm}
              onClick={handleConfirm}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all bg-gold text-black hover:bg-gold/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-gold/20"
            >
              <ShoppingBag size={15} />
              Ajouter au panier
              {effectiveQty >= 1 && !stockExceeded && (
                <span className="ml-1 text-[10px] font-normal opacity-70">
                  ({effectiveQty} flacon{effectiveQty > 1 ? 's' : ''})
                </span>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}