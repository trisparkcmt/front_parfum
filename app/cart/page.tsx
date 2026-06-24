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
import { Trash2, Plus, Minus, ArrowRight, Tag, ShoppingBag, Send, CreditCard, Truck, MapPin, Store, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCartStore } from '@/store/useCartStore';
import { useToastStore } from '@/store/useToastStore';
import { formatPrice, generateWhatsAppLink } from '@/lib/utils';
import { PRODUCT_CATEGORY_LABELS } from '@/lib/constants';
import { useTranslation } from 'react-i18next';

import { BackButton } from '@/components/ui/BackButton';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { orderService } from '@/services/apiService';

export default function CartPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const {
    panierId,
    cart,
    isLoading,
    removeItem,
    updateQuantity,
    applyPromoCode,
    removePromoCode,
    getTotalPrice,
    getSubtotal,
    clearCart,
    syncCart,
  } = useCartStore();

  const { addToast } = useToastStore();
  const [promoInput, setPromoInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // New state for checkout options
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money'>('cash');
  const [mobileNetwork, setMobileNetwork] = useState<'mtn' | 'orange' | null>(null);
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryLocation, setDeliveryLocation] = useState(''); // quartier (free text)
  const [deliveryCity, setDeliveryCity] = useState('');
  const [noteClient, setNoteClient] = useState('');

  const subtotal = getSubtotal();
  const total = getTotalPrice();
  const allItems = cart
    ? [
        ...cart.lignes_parfums.map((line) => ({ ...line, type: 'parfum' as const })),
        ...cart.lignes_accessoires.map((line) => ({ ...line, type: 'accessoire' as const })),
        ...cart.lignes_produit_fini_essence.map((line) => ({
          ...line,
          type: 'produit-fini-essence' as const,
        })),
        ...cart.lignes_parfums_perso.map((line) => ({
          ...line,
          type: 'parfum-personnalise' as const,
        })),
        ...cart.lignes_essence_personnalisee.map((line) => ({
          ...line,
          type: 'essence-personnalisee' as const,
        })),
      ]
    : [];

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    try {
      await applyPromoCode(promoInput);
      setPromoInput('');
    } catch (error) {
      addToast(t('invalid_promo'), 'error');
    }
  };

  const handleRemoveItem = async (type: any, lineId: number) => {
    try {
      await removeItem(type, lineId);
    } catch (error) {
      addToast(t('error_removing_item'), 'error');
    }
  };

  const handleUpdateQuantity = async (type: any, lineId: number, newQty: number) => {
    if (newQty < 1) {
      await handleRemoveItem(type, lineId);
      return;
    }
    try {
      await updateQuantity(type, lineId, newQty);
    } catch (error) {
      addToast(t('error_updating_quantity'), 'error');
    }
  };

  const handleCheckout = async () => {
    if (!cart || allItems.length === 0) return;

    if (!isAuthenticated) {
      addToast(t('login_required', { defaultValue: 'Veuillez vous connecter pour passer commande.' }), 'error');
      router.push('/login?redirect=/cart');
      return;
    }

    if (deliveryType === 'delivery' && !deliveryCity.trim()) {
      addToast(t('city_required', { defaultValue: 'Ville de livraison requise.' }), 'error');
      return;
    }

    // Keep existing payment UI, but backend order placement is independent for now.
    if (paymentMethod === 'mobile_money' && !mobileNetwork) {
      addToast(t('choose_network'), 'error');
      return;
    }

    setIsProcessing(true);
    try {
      await orderService.placeOrder({
        panier_id: panierId ?? undefined,
        livraison_quartier: deliveryType === 'delivery' ? deliveryLocation.trim() || undefined : undefined,
        livraison_ville: deliveryType === 'delivery' ? deliveryCity.trim() : 'Retrait magasin',
        note_client: noteClient.trim() || undefined,
        // Include applied promo code so the backend can attribute it to the order
        code_promo: cart?.code_promo_applique ?? undefined,
      });

     // Format items to match the CartItem structure expected by generateWhatsAppLink
      const formattedItems = allItems.map((item: any) => ({
        id: String(item.id),
        type: 'product' as const,
        product: {
          id: String(item.id),
          name: item.nom,
          price: item.prix_unitaire_snapshot,
          description: '',
          category: 'accessory' as const,
          images: [],
          stock: 99,
          inStock: true,
          isActive: true,
          createdAt: ''
        },
        quantity: item.quantite,
        unitPrice: item.prix_unitaire_snapshot,
      }));

      const waLink = generateWhatsAppLink(
        formattedItems,
        subtotal,
        total,
        cart?.code_promo_applique,
        cart?.remise_pourcentage ? Number(cart.remise_pourcentage) : undefined,
        paymentMethod,
        mobileNetwork || undefined,
        deliveryType,
        deliveryType === 'delivery' ? `${deliveryCity.trim()} - ${deliveryLocation.trim()}` : 'Retrait magasin'
      );

      addToast(t('order_success', { defaultValue: 'Commande passée avec succès. Redirection vers WhatsApp...' }), 'success');

      // The backend will convert the cart -> order and create a new active cart.
      clearCart();
      await syncCart();
      
      // Redirect client to WhatsApp
      window.open(waLink, '_blank');
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        t('order_error', { defaultValue: 'Erreur lors du passage de la commande.' });
      addToast(msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!cart || allItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 pt-32 lg:pt-40 text-center">
        <BackButton className="mx-auto" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto flex flex-col items-center"
        >
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-gold/50 mb-6">
            <ShoppingBag size={48} />
          </div>
          <h1 className="font-display text-3xl font-bold mb-4">{t('cart_empty')}</h1>
          <p className="text-foreground/60 mb-8">
            {t('cart_empty_desc')}
          </p>
          <div className="flex gap-4">
            <Link href="/shop/accessories">
              <Button>{t('explore_shop')}</Button>
            </Link>
            <Link href="/numba">
              <Button variant="secondary">{t('nav_atelier')}</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24 lg:pt-32">
      <BackButton />
      <h1 className="font-display text-4xl font-bold mb-12">{t('your_cart')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence>
            {allItems.map((item) => (
              <motion.div
                key={`${item.type}-${item.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex gap-6 p-4  bg-white/5 backdrop-blur-md border-white/10  backdrop-saturate-150 rounded-xl  "
              >
                {/* Image placeholder based on type */}
                <div className="w-24 h-24 shrink-0  bg-white/10 overflow-hidden relative border border-white/5">
                  {item.image && (
                    <Image src={item.image} alt={item.nom} fill className="object-cover" />
                  )}
                  {!item.image && (
                    <div className="w-full h-full flex items-center justify-center bg-charcoal">
                      <span className="text-[10px] text-gold font-medium text-center">{item.type}</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs text-gold font-medium mb-1 uppercase tracking-wide">
                        {item.type}
                      </p>
                      <h3 className="font-display text-sm md:text-lg font-bold hover:text-gold transition-colors">
                        {item.nom}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.type, item.id)}
                      disabled={isLoading}
                      className="p-2 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-3 bg-black/20  p-1 border border-white/5">
                      <button
                        onClick={() => handleUpdateQuantity(item.type, item.id, item.quantite - 1)}
                        disabled={isLoading}
                        className="p-1 hover:bg-white/10 disabled:opacity-50 rounded transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantite}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.type, item.id, item.quantite + 1)}
                        disabled={isLoading}
                        className="p-1 hover:bg-white/10 disabled:opacity-50 rounded transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <p className="font-bold text-sm md:text-lg">
                      {formatPrice(item.prix_unitaire_snapshot * item.quantite)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 p-6 rounded-3xl glass-dark border border-white/10">
            <h2 className="font-display text-2xl font-bold mb-6">{t('summary')}</h2>

            <div className="space-y-4 mb-6 text-sm">
              <div className="flex justify-between text-foreground/70">
                <span>{t('subtotal')}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>



              {/* Delivery Mode Selection */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider">{t('reception_mode')}</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDeliveryType('delivery')}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                      deliveryType === 'delivery' ? 'bg-gold/10 border-gold text-gold' : 'bg-white/5 border-white/10 text-foreground/60'
                    }`}
                  >
                    <Truck size={14} /> {t('delivery_option')}
                  </button>
                  <button
                    onClick={() => setDeliveryType('pickup')}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                      deliveryType === 'pickup' ? 'bg-gold/10 border-gold text-gold' : 'bg-white/5 border-white/10 text-foreground/60'
                    }`}
                  >
                    <Store size={14} /> {t('pickup_option')}
                  </button>
                </div>

                {deliveryType === 'delivery' && (
                  <div className="space-y-2 mt-2">
                    <Input
                      placeholder={t('city', { defaultValue: 'Ville (ex: Yaoundé)' })}
                      value={deliveryCity}
                      onChange={(e) => setDeliveryCity(e.target.value)}
                      disabled={isLoading || isProcessing}
                      className="bg-black/20"
                    />
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={14} />
                      <input
                        type="text"
                        placeholder={t('delivery_location_placeholder')}
                        value={deliveryLocation}
                        onChange={(e) => setDeliveryLocation(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-foreground outline-none focus:border-gold/50 transition-all"
                        disabled={isLoading || isProcessing}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider">{t('payment_mode')}</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setPaymentMethod('cash'); setMobileNetwork(null); }}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                      paymentMethod === 'cash' ? 'bg-gold/10 border-gold text-gold' : 'bg-white/5 border-white/10 text-foreground/60'
                    }`}
                  >
                    <CreditCard size={14} /> {t('cash_option')}
                  </button>
                  <button
                    onClick={() => setPaymentMethod('mobile_money')}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                      paymentMethod === 'mobile_money' ? 'bg-gold/10 border-gold text-gold' : 'bg-white/5 border-white/10 text-foreground/60'
                    }`}
                  >
                    <Smartphone size={14} /> {t('mobile_money_option')}
                  </button>
                </div>

                {paymentMethod === 'mobile_money' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3 pt-1"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setMobileNetwork('mtn')}
                        className={`p-2 rounded-lg border text-[10px] font-bold uppercase transition-all ${
                          mobileNetwork === 'mtn' ? 'bg-amber-400 text-black border-amber-400' : 'bg-white/5 border-white/10 text-foreground/40'
                        }`}
                      >
                        MTN Mobile Money
                      </button>
                      <button
                        onClick={() => setMobileNetwork('orange')}
                        className={`p-2 rounded-lg border text-[10px] font-bold uppercase transition-all ${
                          mobileNetwork === 'orange' ? 'bg-orange-500 text-foreground border-orange-500' : 'bg-white/5 border-white/10 text-foreground/40'
                        }`}
                      >
                        Orange Money
                      </button>
                    </div>

                    {mobileNetwork && (
                      <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-center space-y-1">
                        <p className="text-[10px] text-foreground/40 uppercase font-bold">{t('payment_code')}</p>
                        <p className="text-sm font-mono font-bold text-gold">
                          {mobileNetwork === 'mtn' ? `*126*1*670000000*${total}#` : `#150*1*1*690000000*${total}#`}
                        </p>
                        <p className="text-[9px] text-foreground/40">{t('payment_code_notice')}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Promo Code Section */}
              {cart?.code_promo_applique ? (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span className="flex items-center gap-2">
                    <Tag size={14} />
                    {t('promo_code')} ({cart.code_promo_applique})
                  </span>
                  <span>-{cart.remise_pourcentage}%</span>
                </div>
              ) : null}

              <div className="flex justify-between text-foreground/70">
                <span>{t('delivery')}</span>
                <span>{deliveryType === 'delivery' ? t('to_be_defined') : t('free')}</span>
              </div>
            </div>

            <div className="mb-6">
              <textarea
                value={noteClient}
                onChange={(e) => setNoteClient(e.target.value)}
                rows={2}
                placeholder={t('order_note', { defaultValue: 'Note (optionnel) — ex: appeler avant de livrer…' })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-foreground outline-none focus:border-gold/50 transition-all resize-none"
                disabled={isLoading || isProcessing}
              />
            </div>

            <div className="border-t border-white/10 pt-4 mb-8">
              <div className="flex justify-between items-end">
                <span className="text-lg font-medium">{t('estimated_total')}</span>
                <span className="font-display text-3xl font-bold text-gold">{formatPrice(total)}</span>
              </div>
              <p className="text-xs text-foreground/40 mt-1 text-right">{t('taxes_included')}</p>
            </div>

            {!cart?.code_promo_applique ? (
              <form onSubmit={handleApplyPromo} className="flex gap-2 mb-8">
                <Input
                  placeholder={t('promo_code')}
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  disabled={isLoading}
                  className="bg-black/20"
                />
                <Button type="submit" variant="secondary" className="px-4" isLoading={isLoading}>
                  {t('apply_code')}
                </Button>
              </form>
            ) : (
              <div className="flex items-center justify-between p-3  bg-emerald-500/10 border border-emerald-500/20 mb-8">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                  <Tag size={16} />
                  {t('promo_code')} {cart.code_promo_applique} {t('active')}
                </div>
                <button
                  onClick={() => removePromoCode()}
                  disabled={isLoading}
                  className="text-xs text-foreground/50 hover:text-red-400 disabled:opacity-50 transition-colors"
                >
                  {t('remove_code')}
                </button>
              </div>
            )}

            <Button
              size="lg"
              className="w-full"
              onClick={handleCheckout}
              isLoading={isProcessing}
              rightIcon={<Send size={18} />}
            >
              {t('place_order', { defaultValue: 'Passer la commande' })}
            </Button>

            <p className="text-xs text-center text-foreground/50 mt-4 leading-relaxed">
              {t('order_backend_notice', { defaultValue: 'Votre commande sera visible dans votre tableau de bord après validation.' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}