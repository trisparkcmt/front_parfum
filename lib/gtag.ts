/**
 * @file lib/gtag.ts
 * @description GA4 e-commerce event helpers.
 *
 * All functions are safe to call server-side (they no-op when window is undefined)
 * and when the gtag script hasn't loaded yet (gtag is queued by Google's snippet).
 *
 * Measurement ID is loaded from the same environment variable used by
 * @next/third-parties/google (NEXT_PUBLIC_GA_ID).
 * If you hard-coded the ID directly in layout.tsx ("G-JG0NYEN3VL"), set
 * NEXT_PUBLIC_GA_ID=G-JG0NYEN3VL in your .env.local so it matches.
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/** Raw gtag call — safe in SSR and before the script loads. */
function gtag(...args: any[]) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer ?? [];
  if (typeof window.gtag === 'function') {
    window.gtag(...args);
  } else {
    // Queue the event — gtag will drain the dataLayer on load.
    window.dataLayer.push(args);
  }
}

// ─── Shared item shape ────────────────────────────────────────────────────────

export interface GA4Item {
  item_id: string;
  item_name: string;
  item_category?: string;
  price: number;
  quantity: number;
}

/** Map a cart line type to a human-readable GA4 category. */
function categoryFromType(type?: string): string {
  switch (type) {
    case 'parfum':                  return 'Parfum';
    case 'accessoire':              return 'Accessoire';
    case 'diffuseur-parfum':        return 'Diffuseur';
    case 'produit-fini-essence':    return 'Essence finie';
    case 'parfum-personnalise':     return 'Parfum personnalisé';
    case 'essence-personnalisee':   return 'Essence personnalisée';
    default:                        return type ?? 'Produit';
  }
}

// ─── Event helpers ────────────────────────────────────────────────────────────

/**
 * Fired when the user clicks "Ajouter au panier".
 * Call this AFTER the cart store action resolves successfully.
 */
export function trackAddToCart(product: {
  id: string | number;
  name: string;
  price: number;
  category?: string;
  quantity?: number;
}) {
  const item: GA4Item = {
    item_id:       String(product.id),
    item_name:     product.name,
    item_category: product.category,
    price:         product.price,
    quantity:      product.quantity ?? 1,
  };

  gtag('event', 'add_to_cart', {
    currency: 'XAF',          // FCFA ISO code
    value:    item.price * item.quantity,
    items:    [item],
  });
}

/**
 * Fired when the order is submitted and WhatsApp link is opened
 * (i.e. after orderService.placeOrder resolves successfully).
 * This maps to "begin_checkout" in GA4 — it's the last trackable
 * action on the client side before the off-platform payment.
 */
export function trackBeginCheckout(params: {
  value: number;
  items: GA4Item[];
  coupon?: string;
}) {
  gtag('event', 'begin_checkout', {
    currency: 'XAF',
    value:    params.value,
    coupon:   params.coupon || undefined,
    items:    params.items,
  });
}

/**
 * Fired when the ADMIN clicks the "Livré" button.
 * This is the real purchase confirmation in this workflow:
 * the client has paid and received their order.
 */
export function trackPurchase(params: {
  transactionId: string;   // order.numero_commande
  value: number;           // parseFloat(order.total_ttc)
  items: GA4Item[];
  coupon?: string;
}) {
  gtag('event', 'purchase', {
    transaction_id: params.transactionId,
    currency:       'XAF',
    value:          params.value,
    coupon:         params.coupon || undefined,
    items:          params.items,
  });
}

// ─── Cart-line → GA4Item converter ───────────────────────────────────────────

/** Convert a CartLine (from useCartStore) to a GA4Item. */
export function cartLineToGA4Item(line: {
  id: number;
  nom: string;
  prix_unitaire_snapshot: number;
  quantite: number;
  type?: string;
}): GA4Item {
  return {
    item_id:       String(line.id),
    item_name:     line.nom,
    item_category: categoryFromType(line.type),
    price:         line.prix_unitaire_snapshot,
    quantity:      line.quantite,
  };
}

/**
 * Convert a BackendOrderLine (from the admin order page) to a GA4Item.
 * Accepts any line shape across all order line arrays.
 */
export function orderLineToGA4Item(line: {
  id?: number;
  nom_snapshot?: string;
  nom?: string;
  prix_unitaire_snapshot?: number | string;
  quantite?: number;
  type?: string;
}): GA4Item {
  return {
    item_id:       String(line.id ?? ''),
    item_name:     line.nom_snapshot ?? line.nom ?? 'Produit',
    item_category: categoryFromType(line.type),
    price:         parseFloat(String(line.prix_unitaire_snapshot ?? 0)),
    quantity:      line.quantite ?? 1,
  };
}
