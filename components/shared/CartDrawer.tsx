'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, Package } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/useCartStore';
import type { CartLine } from '@/store/useCartStore';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatPrice(amount: number) {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

function CartLineItem({ line }: { line: CartLine }) {
  const { updateQuantity, removeItem, isLoading } = useCartStore();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
      className="flex gap-3 py-4 border-b border-white/5"
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center">
        {line.image ? (
          <Image
            src={line.image}
            alt={line.nom}
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package size={20} className="text-foreground/30" />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2 mb-1">
          {line.nom}
        </p>
        <p className="text-[10px] text-gold font-mono">
          {formatPrice(line.prix_unitaire_snapshot)}
        </p>

        {/* Qty controls */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => updateQuantity(line.type, line.id, Math.max(1, line.quantite - 1))}
            disabled={isLoading || line.quantite <= 1}
            className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors disabled:opacity-30"
          >
            <Minus size={10} />
          </button>
          <span className="text-xs font-mono w-4 text-center">{line.quantite}</span>
          <button
            onClick={() => updateQuantity(line.type, line.id, line.quantite + 1)}
            disabled={isLoading}
            className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors disabled:opacity-30"
          >
            <Plus size={10} />
          </button>

          <button
            onClick={() => removeItem(line.type, line.id)}
            disabled={isLoading}
            className="ml-auto text-foreground/30 hover:text-red-400 transition-colors disabled:opacity-30"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Subtotal */}
      <div className="flex-shrink-0 text-right">
        <p className="text-xs font-bold text-foreground">{formatPrice(line.sous_total)}</p>
      </div>
    </motion.div>
  );
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { getAllLines, getItemCount, getTotalPrice, getSubtotal, getDiscount, getShipping } = useCartStore();

  const lines = getAllLines();
  const itemCount = getItemCount();
  const subtotal = getSubtotal();
  const discount = getDiscount();
  const shipping = getShipping();
  const total = getTotalPrice();

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-[70] w-full max-w-sm flex flex-col bg-[#0d0d0d]/95 backdrop-blur-2xl border-l border-white/[0.06] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <ShoppingBag size={18} className="text-gold" />
                <span className="text-sm font-bold tracking-wide text-foreground">Mon Panier</span>
                {itemCount > 0 && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-gold text-black">
                    {itemCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-foreground/60 hover:text-foreground transition-all"
              >
                <X size={14} />
              </button>
            </div>

            {/* Line items */}
            <div className="flex-1 overflow-y-auto px-5 min-h-0">
              <AnimatePresence mode="popLayout">
                {lines.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center h-full gap-4 py-20 text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <ShoppingBag size={24} className="text-foreground/30" />
                    </div>
                    <p className="text-sm text-foreground/40">Votre panier est vide</p>
                    <button
                      onClick={onClose}
                      className="text-xs text-gold hover:underline"
                    >
                      Continuer mes achats →
                    </button>
                  </motion.div>
                ) : (
                  lines.map((line) => (
                    <CartLineItem key={`${line.type}-${line.id}`} line={line} />
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Footer summary */}
            {lines.length > 0 && (
              <div className="border-t border-white/[0.06] px-5 py-5 space-y-3">
                {/* Summary rows */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-foreground/50">
                    <span>Sous-total</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Réduction</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-foreground/50">
                    <span>Livraison</span>
                    <span>{shipping > 0 ? formatPrice(shipping) : 'Calculée à la commande'}</span>
                  </div>
                  <div className="flex justify-between font-bold text-foreground border-t border-white/5 pt-2 mt-2 text-sm">
                    <span>Total</span>
                    <span className="text-gold">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* CTAs */}
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gold text-black font-bold text-sm hover:bg-gold/90 active:scale-[0.98] transition-all"
                >
                  Passer la commande
                  <ArrowRight size={15} />
                </Link>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl border border-white/10 text-xs text-foreground/50 hover:text-foreground hover:border-white/20 transition-all"
                >
                  Continuer mes achats
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
