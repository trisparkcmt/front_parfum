'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Product } from '@/types';
import { productService } from '@/services/productService';
import { orderService } from '@/services/orderService';
import { useToastStore } from '@/store/useToastStore';
import { BackButton } from '@/components/ui/BackButton';
import {
  CheckCircle,
  Search,
  X,
  Plus,
  Minus,
  Trash2,
  Loader2,
  PackageSearch,
  ShoppingBag,
  Receipt,
  ImageOff,
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

const TVA_RATE = 0.2;

function formatXAF(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(
    Math.round(amount)
  );
}

/**
 * Robust image lookup helper for the backend API payload.
 * Safely handles plain string URLs, objects containing a url property, 
 * or missing image fallbacks.
 */
function getProductImageUrl(product: Product): string | null {
  if (!product) return null;
  const p = product as unknown as Record<string, unknown>;
  
  const candidates = [
    p.image_principale, // Matches your API field exactly
    p.image,
    p.image_,
    p.thumbnail,
    p.photo,
    p.photo_url,
    p.picture,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    // 1. If the API returns a standard direct URL string
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }

    // 2. Defensive check if the object format changes or gets wrapped on the client side
    if (typeof candidate === 'object' && candidate !== null) {
      const nestedUrl = (candidate as Record<string, unknown>).url;
      if (typeof nestedUrl === 'string' && nestedUrl.trim().length > 0) {
        return nestedUrl.trim();
      }
    }
  }
  return null;
}

// Extracts the correct functional price from your API structure
function getProductPrice(product: Product): number {
  const p = product as unknown as Record<string, unknown>;
  const price = p.price ?? p.prix_actuel ?? p.prix_unitaire ?? 0;
  return typeof price === 'string' ? parseFloat(price) : (price as number);
}

// Extracts the item name safely
function getProductName(product: Product): string {
  const p = product as unknown as Record<string, unknown>;
  return (p.name ?? p.nom ?? 'Produit sans nom') as string;
}

export default function POSPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draftQty, setDraftQty] = useState<number>(1);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastOrderNumber, setLastOrderNumber] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToastStore();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Perform search when debounced term changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchTerm.trim()) {
        setProducts([]);
        return;
      }

      setIsLoading(true);
      try {
        const [perfumes, accessories] = await Promise.all([
          productService.getPerfumes({ search: debouncedSearchTerm }),
          productService.getAccessories({ search: debouncedSearchTerm }),
        ]);

        const uniqueProducts = new Map<string, Product>();

        // Process search responses checking arrays or paginated results object safely
        const extractResults = (res: any): Product[] => {
          if (!res) return [];
          if (Array.isArray(res)) return res;
          return res.results ?? res.resultats ?? [];
        };

        const cleanedPerfumes = extractResults(perfumes);
        const cleanedAccessories = extractResults(accessories);

        [...cleanedPerfumes, ...cleanedAccessories].forEach((p) => {
          if (p && p.id && !uniqueProducts.has(String(p.id))) {
            uniqueProducts.set(String(p.id), p);
          }
        });

        setProducts(Array.from(uniqueProducts.values()));
      } catch (error) {
      console.error('Search error:', error);
      addToast('Erreur lors de la recherche', 'error');
      setProducts([]);
    } finally { // <-- Fixed the spelling here!
      setIsLoading(false);
    }
    };

    performSearch();
  }, [debouncedSearchTerm, addToast]);

  const handleToggleExpand = useCallback((productId: string) => {
    setExpandedId((prev) => (prev === productId ? null : productId));
    setDraftQty(1);
  }, []);

  const handleAddToCart = useCallback(
    (product: Product, quantity: number) => {
      if (quantity <= 0) return;

      setCartItems((prev) => {
        const existing = prev.find((item) => item.product.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [...prev, { product, quantity }];
      });

      addToast(`${getProductName(product)} ajouté à la commande`, 'success');
      setExpandedId(null);
      setDraftQty(1);
    },
    [addToast]
  );

  const handleRemoveFromCart = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const handleUpdateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        handleRemoveFromCart(productId);
        return;
      }
      setCartItems((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    },
    [handleRemoveFromCart]
  );

  const totals = useMemo(() => {
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartItems.reduce(
      (sum, item) => sum + getProductPrice(item.product) * item.quantity,
      0
    );
    const tva = subtotal * TVA_RATE;
    const total = subtotal + tva;

    return { itemCount, subtotal, tva, total };
  }, [cartItems]);

  const handleValidateOrder = async () => {
    if (cartItems.length === 0) {
      addToast('La commande est vide', 'error');
      return;
    }

    setIsValidating(true);
    try {
      const items = cartItems.map((item) => ({
        produit: item.product.id,
        quantite: item.quantity,
        prix_unitaire: getProductPrice(item.product),
      }));

      const orderPayload = {
        items,
        total_ht: totals.subtotal,
        total_tva: totals.tva,
        total_ttc: totals.total,
        status: 'validée',
        payment: 'payé',
        source: 'pos',
      };

      const order = await orderService.createOrder(orderPayload);
      setLastOrderNumber(order.numero_commande || `#${order.id}`);
      setIsSuccess(true);
      setCartItems([]);
      setExpandedId(null);
      setSearchTerm('');

      addToast(`Commande ${order.numero_commande || '#' + order.id} créée avec succès !`, 'success');

      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error('Order creation error:', error);
      addToast('Erreur lors de la création de la commande', 'error');
    } finally {
      setIsValidating(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setExpandedId(null);
    searchInputRef.current?.focus();
  };

  if (isSuccess) {
    return (
      <div className="h-screen overflow-hidden bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-5 max-w-md">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gold/10 border border-gold/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-gold" strokeWidth={1.5} />
            </div>
          </div>
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold text-foreground font-serif">Commande validée</h1>
            <p className="text-foreground/50 text-sm tracking-wide">{lastOrderNumber}</p>
          </div>
          <p className="text-foreground/60 text-sm">
            L&apos;inventaire a été mis à jour automatiquement.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      <main className="flex-1 min-h-0 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4 pb-6 flex flex-col">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-xl font-bold text-foreground font-serif">
              Point de vente
            </h1>
          </div>

          {cartItems.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-foreground/60 border border-white/10 bg-white/5 rounded-full px-4 py-2">
              <ShoppingBag className="w-4 h-4 text-gold" strokeWidth={1.5} />
              <span>
                {totals.itemCount} article{totals.itemCount > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Counter layout: search rail + order ticket */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,38%)_minmax(0,62%)] gap-5 flex-1 min-h-0">
          {/* Search rail */}
          <section className="border border-white/10 bg-white/[0.03] rounded-sm flex flex-col min-h-0">
            <div className="p-5 border-b border-white/10 shrink-0">
              <label className="block text-xs uppercase tracking-[0.15em] text-gold/80 mb-3 font-medium">
                Rechercher un produit
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30"
                  strokeWidth={1.5}
                />
                <input
                  ref={searchInputRef}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nom, référence, marque…"
                  className="w-full bg-background/40 border border-white/10 rounded-sm py-2.5 pl-10 pr-9 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-gold/50 transition-colors"
                  autoFocus
                />
                {isLoading ? (
                  <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gold animate-spin" />
                ) : searchTerm ? (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/70 transition-colors"
                    aria-label="Effacer la recherche"
                  >
                    <X className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                ) : null}
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {!searchTerm ? (
                <EmptyState
                  icon={<PackageSearch className="w-7 h-7 text-foreground/20" strokeWidth={1.5} />}
                  title="Commencez une recherche"
                  subtitle="Les résultats apparaissent ici au fil de la frappe."
                />
              ) : isLoading ? (
                <EmptyState
                  icon={<Loader2 className="w-7 h-7 text-gold animate-spin" />}
                  title="Recherche en cours"
                  subtitle={null}
                />
              ) : products.length === 0 ? (
                <EmptyState
                  icon={<PackageSearch className="w-7 h-7 text-foreground/20" strokeWidth={1.5} />}
                  title="Aucun produit trouvé"
                  subtitle={`Rien ne correspond à « ${searchTerm} ».`}
                />
              ) : (
                <ul className="divide-y divide-white/5">
                  {products.map((product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      isExpanded={expandedId === String(product.id)}
                      onToggle={() => handleToggleExpand(String(product.id))}
                      draftQty={draftQty}
                      onDraftQtyChange={setDraftQty}
                      onAdd={(qty) => handleAddToCart(product, qty)}
                      inCartQty={
                        cartItems.find((c) => c.product.id === product.id)?.quantity
                      }
                    />
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Order ticket */}
          <section className="relative border border-white/10 bg-white/[0.03] rounded-sm flex flex-col min-h-0">
            {/* Perforated receipt edge */}
            <div
              aria-hidden="true"
              className="h-3 w-full shrink-0"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 10px 0px, transparent 6px, var(--background, #0a0908) 6px)',
                backgroundSize: '20px 12px',
                backgroundRepeat: 'repeat-x',
                backgroundPosition: 'top',
                marginTop: '-1px',
              }}
            />

            <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-dashed border-white/15 shrink-0">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-4 h-4 text-gold" strokeWidth={1.5} />
                <h2 className="text-sm uppercase tracking-[0.15em] text-gold/80 font-medium">
                  Commande en cours
                </h2>
              </div>
              {cartItems.length > 0 && (
                <button
                  onClick={() => setCartItems([])}
                  className="text-xs text-foreground/40 hover:text-foreground/70 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Vider
                </button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="flex-1 min-h-0 overflow-y-auto">
                <EmptyState
                  icon={<ShoppingBag className="w-7 h-7 text-foreground/20" strokeWidth={1.5} />}
                  title="La commande est vide"
                  subtitle="Ajoutez un produit depuis la recherche pour commencer."
                  className="py-20"
                />
              </div>
            ) : (
              <ol className="flex-1 min-h-0 overflow-y-auto px-6 divide-y divide-white/5">
                {cartItems.map((item, index) => (
                  <li key={item.product.id} className="flex items-center gap-4 py-4">
                    <span className="font-serif text-foreground/30 text-sm w-5 text-right tabular-nums shrink-0">
                      {index + 1}
                    </span>

                    <ProductThumb product={item.product} size={44} />

                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-base text-foreground truncate">
                        {getProductName(item.product)}
                      </p>
                      <p className="text-xs text-foreground/40 mt-0.5">
                        {formatXAF(getProductPrice(item.product))} F CFA / unité
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 border border-white/10 rounded-sm shrink-0">
                      <button
                        onClick={() =>
                          handleUpdateQuantity(item.product.id, item.quantity - 1)
                        }
                        className="w-7 h-7 flex items-center justify-center text-foreground/50 hover:text-gold transition-colors"
                        aria-label="Diminuer la quantité"
                      >
                        <Minus className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                      <span className="w-6 text-center text-sm tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleUpdateQuantity(item.product.id, item.quantity + 1)
                        }
                        className="w-7 h-7 flex items-center justify-center text-foreground/50 hover:text-gold transition-colors"
                        aria-label="Augmenter la quantité"
                      >
                        <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    </div>

                    <p className="font-serif text-base text-foreground tabular-nums w-24 text-right shrink-0">
                      {formatXAF(getProductPrice(item.product) * item.quantity)}
                    </p>

                    <button
                      onClick={() => handleRemoveFromCart(item.product.id)}
                      className="text-foreground/25 hover:text-red-400 transition-colors shrink-0"
                      aria-label={`Retirer ${getProductName(item.product)}`}
                    >
                      <X className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </li>
                ))}
              </ol>
            )}

            {/* Totals */}
            <div className="px-6 pt-5 pb-6 border-t border-white/10 shrink-0">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-foreground/50">
                  <span>Sous-total HT</span>
                  <span className="tabular-nums">{formatXAF(totals.subtotal)} F CFA</span>
                </div>
                <div className="flex justify-between text-foreground/50">
                  <span>TVA (20%)</span>
                  <span className="tabular-nums">{formatXAF(totals.tva)} F CFA</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline mt-4 pt-4 border-t border-gold/20">
                <span className="font-serif text-lg text-foreground">Total</span>
                <span className="font-serif text-2xl text-gold tabular-nums">
                  {formatXAF(totals.total)} F CFA
                </span>
              </div>

              <button
                onClick={handleValidateOrder}
                disabled={isValidating || cartItems.length === 0}
                className="w-full mt-5 bg-gold text-background font-medium text-sm uppercase tracking-[0.1em] rounded-sm py-3.5 flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Encaissement…
                  </>
                ) : (
                  'Valider la commande'
                )}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function ProductThumb({
  product,
  size = 44,
}: {
  product: Product;
  size?: number;
}) {
  const [errored, setErrored] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const url = useMemo(() => getProductImageUrl(product), [product]);
  const showFallback = !url || errored;

  useEffect(() => {
    setErrored(false);
    setIsLoaded(false);
  }, [url]);

  return (
    <div
      className="relative shrink-0 rounded-sm overflow-hidden border border-white/10 bg-background/40 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {showFallback ? (
        <ImageOff className="w-4 h-4 text-foreground/20" strokeWidth={1.5} />
      ) : (
        <>
          {!isLoaded && !errored && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <Loader2 className="w-3 h-3 text-gold animate-spin" />
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={getProductName(product)}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setIsLoaded(true)}
            onError={() => {
              console.error(`Failed to load image: ${url}`);
              setErrored(true);
            }}
          />
        </>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
  className = 'py-16',
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string | null;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-6 ${className}`}>
      <div className="mb-3">{icon}</div>
      <p className="text-sm text-foreground/50">{title}</p>
      {subtitle && <p className="text-xs text-foreground/30 mt-1 max-w-[15rem]">{subtitle}</p>}
    </div>
  );
}

function ProductRow({
  product,
  isExpanded,
  onToggle,
  draftQty,
  onDraftQtyChange,
  onAdd,
  inCartQty,
}: {
  product: Product;
  isExpanded: boolean;
  onToggle: () => void;
  draftQty: number;
  onDraftQtyChange: (qty: number) => void;
  onAdd: (qty: number) => void;
  inCartQty?: number;
}) {
  const currentPrice = getProductPrice(product);
  
  return (
    <li>
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors ${
          isExpanded ? 'bg-gold/5' : 'hover:bg-white/[0.03]'
        }`}
      >
        <ProductThumb product={product} size={40} />

        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground truncate">{getProductName(product)}</p>
          <p className="text-xs text-foreground/40 mt-0.5">
            {formatXAF(currentPrice)} F CFA
            {typeof inCartQty === 'number' && (
              <span className="text-gold/70"> · {inCartQty} en commande</span>
            )}
          </p>
        </div>
        <Plus
          className={`w-4 h-4 text-foreground/30 shrink-0 transition-transform ${
            isExpanded ? 'rotate-45 text-gold' : ''
          }`}
          strokeWidth={1.5}
        />
      </button>

      {isExpanded && (
        <div className="px-5 pb-4 pt-1 bg-gold/5 flex items-center gap-3">
          <div className="flex items-center gap-1.5 border border-white/10 rounded-sm bg-background/40">
            <button
              onClick={() => onDraftQtyChange(Math.max(1, draftQty - 1))}
              className="w-8 h-8 flex items-center justify-center text-foreground/50 hover:text-gold transition-colors"
              aria-label="Diminuer la quantité"
            >
              <Minus className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
            <span className="w-7 text-center text-sm tabular-nums">{draftQty}</span>
            <button
              onClick={() => onDraftQtyChange(draftQty + 1)}
              className="w-8 h-8 flex items-center justify-center text-foreground/50 hover:text-gold transition-colors"
              aria-label="Augmenter la quantité"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>

          <button
            onClick={() => onAdd(draftQty)}
            className="flex-1 bg-gold text-background text-xs font-medium uppercase tracking-[0.08em] rounded-sm py-2.5 hover:opacity-90 transition-opacity"
          >
            Ajouter — {formatXAF(currentPrice * draftQty)} F CFA
          </button>
        </div>
      )}
    </li>
  );
}