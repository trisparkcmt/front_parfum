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
import {
  Trash2,
  Plus,
  Minus,
  Tag,
  ShoppingBag,
  Send,
  CreditCard,
  Truck,
  MapPin,
  Store,
  Smartphone,
  Copy,
  X,
} from 'lucide-react';
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

function cx(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

function itemTypeLabel(type: string) {
  const map = PRODUCT_CATEGORY_LABELS as Record<string, string> | undefined;
  return map?.[type] ?? type.replace(/-/g, ' ');
}

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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Form state for checkout fields
  const [form, setForm] = useState({
    deliveryCity: '',
    deliveryLocation: '',
    noteClient: '',
    paymentMethod: 'cash' as 'cash' | 'mobile_money',
    mobileNetwork: null as 'mtn' | 'orange' | null,
    deliveryType: 'delivery' as 'delivery' | 'pickup',
  });

  const { deliveryType, paymentMethod, mobileNetwork } = form;

  const updateFormField = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const subtotal = getSubtotal();
  const total = getTotalPrice();
  const allItems = cart
    ? [
        ...cart.lignes_parfums.map((line) => ({ ...line, type: 'parfum' as const })),
        ...cart.lignes_accessoires.map((line) => ({ ...line, type: 'accessoire' as const })),
        ...(cart.lignes_diffuseurs || []).map((line) => ({
          ...line,
          type: 'diffuseur-parfum' as const,
        })),
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

  const itemCount = allItems.reduce((acc, item) => acc + item.quantite, 0);

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

  const handleClearCart = () => {
    if (allItems.length === 0) return;
    if (window.confirm(t('confirm_clear_cart', { defaultValue: 'Vider entièrement le panier ?' }))) {
      clearCart();
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      addToast(t('code_copied', { defaultValue: 'Code copié' }), 'success');
    } catch {
      addToast(t('code_copy_error', { defaultValue: 'Impossible de copier le code' }), 'error');
    }
  };

  const handleCheckout = async () => {
    if (!cart || allItems.length === 0) return;

    const errors: Record<string, string> = {};

    if (form.deliveryType === 'delivery' && !form.deliveryCity.trim()) {
      errors.deliveryCity = t('city_required', { defaultValue: 'Ville de livraison requise.' });
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      const firstErrorKey = Object.keys(errors)[0];
      const element = document.getElementById(`field-${firstErrorKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            element.focus();
          }
        }, 0);
      }
      return;
    }

    if (form.paymentMethod === 'mobile_money' && !form.mobileNetwork) {
      addToast(t('choose_network'), 'error');
      return;
    }

    setIsProcessing(true);

    const popupWindow = window.open('', '_blank', 'noopener,noreferrer');

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
        createdAt: '',
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
      form.paymentMethod,
      form.mobileNetwork || undefined,
      form.deliveryType,
      form.deliveryType === 'delivery' ? `${form.deliveryCity.trim()} - ${form.deliveryLocation.trim()}` : 'Retrait magasin'
    );

    try {
      await orderService.placeOrder({
        panier_id: panierId ?? undefined,
        livraison_quartier: form.deliveryType === 'delivery' ? form.deliveryLocation.trim() || undefined : undefined,
        livraison_ville: form.deliveryType === 'delivery' ? form.deliveryCity.trim() : 'Retrait magasin',
        note_client: form.noteClient.trim() || undefined,
        code_promo: cart?.code_promo_applique ?? undefined,
      });

      addToast(t('order_success', { defaultValue: 'Commande passée avec succès. Redirection vers WhatsApp...' }), 'success');

      clearCart();
      await syncCart();

      if (popupWindow) {
        popupWindow.opener = null;
        popupWindow.location.href = waLink;
      } else {
        window.location.assign(waLink);
      }
    } catch (err: any) {
      if (popupWindow) {
        popupWindow.close();
      }
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        t('order_error', { defaultValue: 'Erreur lors du passage de la commande.' });
      addToast(msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  /* ------------------------------------------------------------ */
  /*  Empty state                                                  */
  /* ------------------------------------------------------------ */
  if (!cart || allItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 pt-32 lg:pt-40 text-center">
        <BackButton className="mx-auto" />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="max-w-md mx-auto flex flex-col items-center mt-10"
        >
          <div className="w-20 h-20 rounded-full border border-foreground/10 bg-foreground/5 flex items-center justify-center text-gold/60 mb-6">
            <ShoppingBag size={36} />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-3">{t('cart_empty')}</h1>
          <p className="text-foreground/60 mb-8 text-sm leading-relaxed">{t('cart_empty_desc')}</p>
          <div className="flex flex-wrap justify-center gap-3">
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

  /* ------------------------------------------------------------ */
  /*  Cart                                                          */
  /* ------------------------------------------------------------ */
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24 lg:pt-32">
      <BackButton />

      <div className="flex items-end justify-between gap-4 mt-6 mb-10 border-b border-foreground/10 pb-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">{t('your_cart')}</h1>
          <p className="text-sm text-foreground/40 mt-1">
            {itemCount} {itemCount > 1 ? t('items', { defaultValue: 'articles' }) : t('item', { defaultValue: 'article' })}
          </p>
        </div>
        <button
          onClick={handleClearCart}
          disabled={isLoading}
          className="text-xs font-semibold uppercase tracking-widest text-foreground/40 hover:text-red-500 disabled:opacity-40 transition-colors shrink-0"
        >
          {t('clear_cart', { defaultValue: 'Vider le panier' })}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* ── Cart Items ── */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-foreground/10 divide-y divide-foreground/10 overflow-hidden">
            <AnimatePresence initial={false}>
              {allItems.map((item, index) => (
                <motion.div
                  key={`${item.type}-${item.id}`}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  className="flex gap-4 sm:gap-5 p-4 sm:p-5"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl bg-foreground/5 border border-foreground/10 overflow-hidden relative">
                    {item.image ? (
                      <Image src={item.image} alt={item.nom} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center px-1">
                        <span className="text-[9px] text-gold font-semibold text-center uppercase tracking-wide leading-tight">
                          {itemTypeLabel(item.type)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] text-gold font-semibold mb-1 uppercase tracking-widest">
                          {itemTypeLabel(item.type)}
                        </p>
                        <h3 className="font-display text-sm sm:text-base font-bold text-foreground truncate">
                          {item.nom}
                        </h3>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.type, item.id)}
                        disabled={isLoading}
                        className="p-2 -mr-2 -mt-1 rounded-lg text-foreground/35 hover:text-red-500 hover:bg-red-500/10 disabled:opacity-50 transition-colors shrink-0"
                        aria-label={t('remove_item', { defaultValue: 'Retirer cet article' })}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center gap-1 rounded-lg border border-foreground/10 bg-foreground/5 p-1">
                        <button
                          onClick={() => handleUpdateQuantity(item.type, item.id, item.quantite - 1)}
                          disabled={isLoading}
                          className="w-7 h-7 flex items-center justify-center rounded-md text-foreground/60 hover:text-gold hover:bg-foreground/5 disabled:opacity-50 transition-colors"
                          aria-label={t('decrease_quantity', { defaultValue: 'Diminuer la quantité' })}
                        >
                          <Minus size={13} />
                        </button>
                        <span className="text-sm font-semibold w-6 text-center tabular-nums">{item.quantite}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.type, item.id, item.quantite + 1)}
                          disabled={isLoading}
                          className="w-7 h-7 flex items-center justify-center rounded-md text-foreground/60 hover:text-gold hover:bg-foreground/5 disabled:opacity-50 transition-colors"
                          aria-label={t('increase_quantity', { defaultValue: 'Augmenter la quantité' })}
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <p className="font-bold text-sm sm:text-base tabular-nums">
                        {formatPrice(item.prix_unitaire_snapshot * item.quantite)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Order Summary ── */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
            <h2 className="font-display text-xl font-bold mb-6">{t('summary')}</h2>

            <div className="space-y-5 text-sm">
              <div className="flex justify-between text-foreground/70">
                <span>{t('subtotal')}</span>
                <span className="tabular-nums">{formatPrice(subtotal)}</span>
              </div>

              {/* Reception mode */}
              <div className="space-y-2.5">
                <p className="text-[11px] font-bold text-foreground/40 uppercase tracking-widest">
                  {t('reception_mode')}
                </p>
                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl border border-foreground/10 bg-foreground/5">
                  <button
                    onClick={() => updateFormField('deliveryType', 'delivery')}
                    className={cx(
                      'flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all',
                      form.deliveryType === 'delivery'
                        ? 'bg-background text-gold shadow-sm ring-1 ring-gold/30'
                        : 'text-foreground/50 hover:text-foreground'
                    )}
                  >
                    <Truck size={14} /> {t('delivery_option')}
                  </button>
                  <button
                    onClick={() => updateFormField('deliveryType', 'pickup')}
                    className={cx(
                      'flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all',
                      form.deliveryType === 'pickup'
                        ? 'bg-background text-gold shadow-sm ring-1 ring-gold/30'
                        : 'text-foreground/50 hover:text-foreground'
                    )}
                  >
                    <Store size={14} /> {t('pickup_option')}
                  </button>
                </div>

                <AnimatePresence>
                  {deliveryType === 'delivery' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2 overflow-hidden pt-1"
                    >
                      <Input
                        label={t('city', { defaultValue: 'Ville' })}
                        placeholder={t('city', { defaultValue: 'Ville (ex: Yaoundé)' })}
                        value={form.deliveryCity}
                        onChange={(e) => updateFormField('deliveryCity', e.target.value)}
                        disabled={isLoading || isProcessing}
                        id="field-deliveryCity"
                      />
                      {formErrors.deliveryCity && (
                        <p className="text-xs text-red-500">{formErrors.deliveryCity}</p>
                      )}
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={14} />
                        <input
                          type="text"
                          placeholder={t('delivery_location_placeholder')}
                          value={form.deliveryLocation}
                          onChange={(e) => updateFormField('deliveryLocation', e.target.value)}
                          className="w-full bg-foreground/5 border border-foreground/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground outline-none focus:border-gold transition-all"
                          disabled={isLoading || isProcessing}
                          id="field-deliveryLocation"
                        />
                      </div>
                      {formErrors.deliveryLocation && (
                        <p className="text-xs text-red-500">{formErrors.deliveryLocation}</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Payment method */}
              <div className="space-y-2.5">
                <p className="text-[11px] font-bold text-foreground/40 uppercase tracking-widest">
                  {t('payment_mode')}
                </p>
                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl border border-foreground/10 bg-foreground/5">
                  <button
                    onClick={() => {
                      updateFormField('paymentMethod', 'cash');
                      updateFormField('mobileNetwork', null);
                    }}
                    className={cx(
                      'flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all',
                      form.paymentMethod === 'cash'
                        ? 'bg-background text-gold shadow-sm ring-1 ring-gold/30'
                        : 'text-foreground/50 hover:text-foreground'
                    )}
                  >
                    <CreditCard size={14} /> {t('cash_option')}
                  </button>
                  <button
                    onClick={() => updateFormField('paymentMethod', 'mobile_money')}
                    className={cx(
                      'flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all',
                      form.paymentMethod === 'mobile_money'
                        ? 'bg-background text-gold shadow-sm ring-1 ring-gold/30'
                        : 'text-foreground/50 hover:text-foreground'
                    )}
                  >
                    <Smartphone size={14} /> {t('mobile_money_option')}
                  </button>
                </div>

                <AnimatePresence>
                  {paymentMethod === 'mobile_money' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2.5 overflow-hidden pt-1"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => updateFormField('mobileNetwork', 'mtn')}
                          className={cx(
                            'p-2 rounded-lg border text-[10px] font-bold uppercase tracking-wide transition-all',
                            form.mobileNetwork === 'mtn'
                              ? 'bg-amber-400 text-black border-amber-400'
                              : 'bg-foreground/5 border-foreground/10 text-foreground/40 hover:text-foreground/70'
                          )}
                        >
                          MTN MoMo
                        </button>
                        <button
                          onClick={() => updateFormField('mobileNetwork', 'orange')}
                          className={cx(
                            'p-2 rounded-lg border text-[10px] font-bold uppercase tracking-wide transition-all',
                            form.mobileNetwork === 'orange'
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'bg-foreground/5 border-foreground/10 text-foreground/40 hover:text-foreground/70'
                          )}
                        >
                          Orange Money
                        </button>
                      </div>

                      {mobileNetwork && (
                        <div className="p-3 rounded-xl border border-foreground/10 bg-foreground/5 text-center space-y-1.5">
                          <p className="text-[10px] text-foreground/40 uppercase font-bold tracking-wide">
                            {t('payment_code')}
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <p className="text-sm font-mono font-bold text-gold tabular-nums">
                              {mobileNetwork === 'mtn' ? `*126*1*670000000*${total}#` : `#150*1*1*690000000*${total}#`}
                            </p>
                            <button
                              onClick={() =>
                                handleCopyCode(
                                  mobileNetwork === 'mtn' ? `*126*1*670000000*${total}#` : `#150*1*1*690000000*${total}#`
                                )
                              }
                              className="text-foreground/40 hover:text-gold transition-colors"
                              aria-label={t('copy_code', { defaultValue: 'Copier le code' })}
                            >
                              <Copy size={13} />
                            </button>
                          </div>
                          <p className="text-[10px] text-foreground/40 leading-relaxed">{t('payment_code_notice')}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {cart?.code_promo_applique && (
                <div className="flex justify-between items-center text-emerald-500 font-medium">
                  <span className="flex items-center gap-2">
                    <Tag size={14} />
                    {cart.code_promo_applique}
                  </span>
                  <span className="tabular-nums">-{cart.remise_pourcentage}%</span>
                </div>
              )}

              <div className="flex justify-between text-foreground/70">
                <span>{t('delivery')}</span>
                <span>{deliveryType === 'delivery' ? t('to_be_defined') : t('free')}</span>
              </div>

              {/* Order note */}
              <div>
                <p className="text-[11px] font-bold text-foreground/40 uppercase tracking-widest mb-2">
                  {t('order_note', { defaultValue: 'Note de commande' })}
                </p>
                <textarea
                  id="field-noteClient"
                  value={form.noteClient}
                  onChange={(e) => updateFormField('noteClient', e.target.value)}
                  className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold transition-all resize-none"
                  rows={3}
                  placeholder={t('order_note_placeholder')}
                  disabled={isLoading || isProcessing}
                />
                {formErrors.noteClient && <p className="mt-1 text-xs text-red-500">{formErrors.noteClient}</p>}
              </div>
            </div>

            {/* Total — dashed "receipt" divider */}
            <div className="border-t border-dashed border-foreground/20 mt-6 pt-5 mb-6">
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium text-foreground/70">{t('estimated_total')}</span>
                <span className="font-display text-2xl sm:text-3xl font-bold text-gold tabular-nums">
                  {formatPrice(total)}
                </span>
              </div>
              <p className="text-[11px] text-foreground/40 mt-1 text-right">{t('taxes_included')}</p>
            </div>

            {/* Promo code */}
            {!cart?.code_promo_applique ? (
              <form onSubmit={handleApplyPromo} className="flex gap-2 mb-6">
                <div className="flex-1">
                  <Input
                    label={t('promo_code', { defaultValue: 'Code promo' })}
                    placeholder={t('promo_code')}
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" variant="secondary" className="px-4 self-end" isLoading={isLoading}>
                  {t('apply_code')}
                </Button>
              </form>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium">
                  <Tag size={16} />
                  {cart.code_promo_applique} {t('active')}
                </div>
                <button
                  onClick={() => removePromoCode()}
                  disabled={isLoading}
                  className="text-foreground/40 hover:text-red-500 disabled:opacity-50 transition-colors"
                  aria-label={t('remove_code', { defaultValue: 'Retirer le code' })}
                >
                  <X size={15} />
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