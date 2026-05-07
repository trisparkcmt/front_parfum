'use client';

/**
 * @file app/cart/page.tsx
 * @description Shopping Cart and Checkout Overview Page.
 *
 * This component manages the final stage of the shopping experience, providing
 * a comprehensive overview of selected items and facilitating the checkout process.
 * 
 * **Key Functionalities**:
 * - **Live Cart Synchronization**: Subscribes to the `useCartStore` to display a real-time list of all products and custom Numba compositions currently in the user's session.
 * - **Item Management**: Allows users to increase or decrease item quantities, remove products entirely, and clear the entire cart.
 * - **Custom Composition Display**: Specifically handles the rendering of custom-created perfumes, showing their unique ingredients, volumes, and visual characteristics.
 * - **Promo Code System**: Integrates a promotional code input that communicates with the `cartStore` to apply percentage-based discounts.
 * - **Financial Summary**: Dynamically calculates subtotal, applied discounts, and the final estimated total (FCFA).
 * - **WhatsApp Checkout Integration**: Implements a `handleCheckout` function that generates a structured WhatsApp message using `generateWhatsAppLink`, redirecting the user to finalize the order with a human agent.
 * 
 * **UI/UX Features**:
 * - **Animated Transitions**: Uses `AnimatePresence` and `motion.div` from `framer-motion` for smooth list reordering and item removal.
 * - **Empty State**: Provides a dedicated "Empty Cart" UI with quick-access links back to the shop or atelier.
 */
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus, ArrowRight, Tag, ShoppingBag, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCartStore } from '@/store/useCartStore';
import { useToastStore } from '@/store/useToastStore';
import { formatPrice, generateWhatsAppLink } from '@/lib/utils';
import { PRODUCT_CATEGORY_LABELS } from '@/lib/constants';

export default function CartPage() {
  const { items, removeItem, updateQuantity, applyPromoCode, clearPromoCode, promoCode, promoDiscount, getSubtotal, getTotal, clearCart } = useCartStore();
  const { addToast } = useToastStore();
  const [promoInput, setPromoInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = getSubtotal();
  const total = getTotal();

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    const success = applyPromoCode(promoInput);
    if (success) {
      addToast(`Code promo ${promoInput} appliqué avec succès (-${promoDiscount}%)`, 'success');
      setPromoInput('');
    } else {
      addToast('Code promo invalide ou expiré', 'error');
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    setIsProcessing(true);

    // Simulate slight delay for UX
    setTimeout(() => {
      const link = generateWhatsAppLink(items, subtotal, total, promoCode, promoDiscount);
      window.open(link, '_blank');

      // In a real app we might want to wait for confirmation before clearing, 
      // but for this flow we can clear it or leave it. Let's keep it to allow them to retry if needed.
      setIsProcessing(false);
    }, 500);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 pt-32 lg:pt-40 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto flex flex-col items-center"
        >
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-gold/50 mb-6">
            <ShoppingBag size={48} />
          </div>
          <h1 className="font-display text-3xl font-bold mb-4">Votre panier est vide</h1>
          <p className="text-foreground/60 mb-8">
            Découvrez notre collection d'accessoires ou créez votre parfum sur mesure.
          </p>
          <div className="flex gap-4">
            <Link href="/shop/accessories">
              <Button>Explorer la boutique</Button>
            </Link>
            <Link href="/numba">
              <Button variant="secondary">Atelier Numba</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24 lg:pt-32">
      <h1 className="font-display text-4xl font-bold mb-12">Votre Panier</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex gap-6 p-4  bg-white/5 border border-white/10"
              >
                {/* Image placeholder based on type */}
                <div className="w-24 h-24 shrink-0  bg-white/10 overflow-hidden relative border border-white/5">
                  {item.type === 'product' && item.product?.images[0] && (
                    <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                  )}
                  {item.type === 'custom-composition' && (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-charcoal">
                      <div className="w-6 h-10 rounded-t-lg rounded-b-md mb-1 relative" style={{ backgroundColor: item.composition?.essences[0]?.essence.color || '#C5A059' }}>
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-2 bg-silver rounded-sm" />
                      </div>
                      <span className="text-[10px] text-gold font-medium leading-tight">Numba<br />Custom</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs text-gold font-medium mb-1 uppercase tracking-wide">
                        {item.type === 'product' ? PRODUCT_CATEGORY_LABELS[item.product!.category] : 'Création Sur Mesure'}
                      </p>
                      <Link
                        href={item.type === 'product' ? `/shop/${item.product!.category.includes('perfume') ? 'perfumes' : 'accessories'}/${item.product!.id}` : '#'}
                        className="font-display text-lg font-bold hover:text-gold transition-colors"
                      >
                        {item.type === 'product' ? item.product!.name : item.composition!.name}
                      </Link>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-foreground/40 hover:text-red-500 hover:bg-red-500/10  transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {item.type === 'custom-composition' && (
                    <p className="text-xs text-foreground/60 mb-4 line-clamp-1">
                      {item.composition?.essences.map(e => e.essence.name).join(', ')}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-3 bg-black/20  p-1 border border-white/5">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <p className="font-bold text-lg">{formatPrice(item.unitPrice * item.quantity)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 p-6 rounded-3xl glass-dark border border-white/10">
            <h2 className="font-display text-2xl font-bold mb-6">Résumé</h2>

            <div className="space-y-4 mb-6 text-sm">
              <div className="flex justify-between text-foreground/70">
                <span>Sous-total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {promoCode && (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span className="flex items-center gap-2">
                    <Tag size={14} />
                    Code ({promoCode})
                  </span>
                  <span>-{promoDiscount}%</span>
                </div>
              )}

              <div className="flex justify-between text-foreground/70">
                <span>Livraison</span>
                <span>Calculée après validation</span>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 mb-8">
              <div className="flex justify-between items-end">
                <span className="text-lg font-medium">Total Estimé</span>
                <span className="font-display text-3xl font-bold text-gold">{formatPrice(total)}</span>
              </div>
              <p className="text-xs text-foreground/40 mt-1 text-right">Taxes incluses</p>
            </div>

            {!promoCode ? (
              <form onSubmit={handleApplyPromo} className="flex gap-2 mb-8">
                <Input
                  placeholder="Code promo"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="bg-black/20"
                />
                <Button type="submit" variant="secondary" className="px-4">Appliquer</Button>
              </form>
            ) : (
              <div className="flex items-center justify-between p-3  bg-emerald-500/10 border border-emerald-500/20 mb-8">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                  <Tag size={16} />
                  Code {promoCode} actif
                </div>
                <button
                  onClick={clearPromoCode}
                  className="text-xs text-foreground/50 hover:text-red-400 transition-colors"
                >
                  Retirer
                </button>
              </div>
            )}

            <Button
              size="lg"
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white hover:text-white border-none shadow-lg shadow-[#25D366]/20"
              onClick={handleCheckout}
              isLoading={isProcessing}
              rightIcon={<Send size={18} />}
            >
              Commander via WhatsApp
            </Button>

            <p className="text-xs text-center text-foreground/50 mt-4 leading-relaxed">
              En cliquant sur commander, vous serez redirigé vers WhatsApp pour finaliser et valider votre commande avec notre équipe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
