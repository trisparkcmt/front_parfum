'use client';

/**
 * @file app/admin/pos/page.tsx
 * @description Interface Point de Vente (POS) / Caisse & Création d'Atelier en Direct.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Product, EssenceClient } from '@/types';
import { productService } from '@/services/productService';
import { orderService } from '@/services/orderService';
import { labService } from '@/services/labService';
import { useToastStore } from '@/store/useToastStore';
import { CartIcon } from '@/components/icons/CustomIcons';
import { BackButton } from '@/components/ui/BackButton';
import { AppImage } from '@/components/ui/AppImage';
import {
  CheckCircle,
  Search,
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  Loader2,
  PackageSearch,
  Receipt,
  ImageOff,
  User,
  Phone,
  FileText,
  Tag,
  FlaskConical,
  RefreshCcw,
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}


// ── Shared Primitives & Helpers ─────────────────────────────────────────────

function cx(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

function StatusChip({
  status,
  label,
}: {
  status: 'success' | 'blue' | 'amber' | 'red' | 'purple' | 'gold';
  label: string;
}) {
  const colorStyles = {
    success: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20',
    blue: 'text-blue-400 bg-blue-500/10 ring-blue-500/20',
    amber: 'text-amber-400 bg-amber-500/10 ring-amber-500/20',
    red: 'text-red-400 bg-red-500/10 ring-red-500/20',
    purple: 'text-purple-400 bg-purple-500/10 ring-purple-500/20',
    gold: 'text-gold bg-gold/10 ring-gold/20',
  };

  const dotStyles = {
    success: 'bg-emerald-400',
    blue: 'bg-blue-400',
    amber: 'bg-amber-400',
    red: 'bg-red-400',
    purple: 'bg-purple-400',
    gold: 'bg-gold',
  };

  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset',
        colorStyles[status]
      )}
    >
      <span className={cx('h-1.5 w-1.5 rounded-full', dotStyles[status])} />
      {label}
    </span>
  );
}

function formatXAF(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(
    Math.round(amount)
  );
}

function getProductImageUrl(product: Product): string | null {
  if (!product) return null;
  const p = product as unknown as Record<string, unknown>;

  const candidates = [
    p.image_principale,
    p.image,
    p.image_,
    p.thumbnail,
    p.photo,
    p.photo_url,
    p.picture,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
    if (typeof candidate === 'object' && candidate !== null) {
      const nestedUrl = (candidate as Record<string, unknown>).url;
      if (typeof nestedUrl === 'string' && nestedUrl.trim().length > 0) {
        return nestedUrl.trim();
      }
    }
  }
  return null;
}

function getProductPrice(product: Product): number {
  const p = product as unknown as Record<string, unknown>;
  const price = p.price ?? p.prix_actuel ?? p.prix_unitaire ?? 0;
  return typeof price === 'string' ? parseFloat(price) : (price as number);
}

function getProductName(product: Product): string {
  const p = product as unknown as Record<string, unknown>;
  return (p.name ?? p.nom ?? 'Produit sans nom') as string;
}

// ── Main POS Page ───────────────────────────────────────────────────────────

export default function POSPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draftQty, setDraftQty] = useState<number>(1);

  // Cart & items
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Client info (for direct POS sale)
  const [nomClient, setNomClient] = useState('');
  const [telephoneClient, setTelephoneClient] = useState('');
  const [note, setNote] = useState('');
  const [codePromo, setCodePromo] = useState('');

  // UI state
  const [activeTab, setActiveTab] = useState<'products' | 'composition'>('products');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastOrderNumber, setLastOrderNumber] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToastStore();

  // Simplified Atelier space states
  const [essences, setEssences] = useState<EssenceClient[]>([]);
  const [flacons, setFlacons] = useState<any[]>([]);
  const [selectedFlaconId, setSelectedFlaconId] = useState<number | null>(null);
  const [loadingEssences, setLoadingEssences] = useState(false);
  const [selectedSize, setSelectedSize] = useState<number>(100);
  const [compositionName, setCompositionName] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [essenceTier, setEssenceTier] = useState<'all' | 'premium' | 'super-premium' | 'high'>('all');
  const [essenceSearch, setEssenceSearch] = useState('');

  // Load lab items (essences, ingredients, flacons) on component mount
  useEffect(() => {
    async function loadEssences() {
      try {
        setLoadingEssences(true);
        const { productService } = await import('@/services/productService');
        const [ing, ess, bottlesRes] = await Promise.all([
          labService.getIngredients(),
          labService.getEssences(),
          productService.getBottles(),
        ]);
        const bottles =
          (bottlesRes as any)?.results ||
          (bottlesRes as any)?.resultats ||
          (Array.isArray(bottlesRes) ? bottlesRes : []);
        setFlacons(bottles);
        setEssences([...ing, ...ess]);
        // Auto-select 100ml flacon
        const def = bottles.find((f: any) => Number(f.contenance_ml) === 100);
        if (def) setSelectedFlaconId(Number(def.id));
      } catch (err) {
        console.error('Failed to load POS atelier data:', err);
      } finally {
        setLoadingEssences(false);
      }
    }
    loadEssences();
  }, []);

  const totalMl = useMemo(() => {
    return Object.values(quantities).reduce((a, b) => a + b, 0);
  }, [quantities]);

  const maxOilMl = useMemo(
    () => Math.max(0, Number((selectedSize * 0.45).toFixed(2))),
    [selectedSize]
  );
  const oilLimitExceeded = totalMl > maxOilMl;

  const compositionPrice = useMemo(() => {
    const basePrice =
      selectedSize === 30 ? 2000 : selectedSize === 50 ? 5000 : 12000;
    let total = basePrice;
    for (const item of essences) {
      const q = quantities[item.id] || 0;
      if (q > 0) total += q * (item.pricePerMl || 300);
    }
    return Math.round(total);
  }, [quantities, selectedSize, essences]);

  // Range slider sets quantity directly
  const setQuantityRange = (id: string, value: number) => {
    setQuantities((prev) => {
      const totalOther = Object.entries(prev)
        .filter(([key]) => key !== id)
        .reduce((sum, [_, q]) => sum + q, 0);
      const capped = Math.min(
        value,
        Math.min(selectedSize - totalOther, maxOilMl - totalOther)
      );
      const temp = { ...prev };
      if (capped <= 0) delete temp[id];
      else temp[id] = capped;
      return temp;
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      const temp = { ...prev };
      if (next === 0) {
        delete temp[id];
      } else {
        const totalOther = Object.entries(temp)
          .filter(([key]) => key !== id)
          .reduce((sum, [_, q]) => sum + q, 0);
        if (totalOther + next > maxOilMl) {
          addToast(
            `Le contenu ne peut dépasser ${maxOilMl} ml pour respecter la règle de 45% du flacon.`,
            'info'
          );
          return prev;
        }
        temp[id] = next;
      }
      return temp;
    });
  };

  const filteredEssences = useMemo(() => {
    let base = essences;
    if (essenceTier !== 'all') {
      base = essences.filter((e) => (e.family as string) === essenceTier);
    }
    if (!essenceSearch.trim()) return base;
    const query = essenceSearch.toLowerCase();
    return base.filter((e) => {
      const name = `${e.name || ''} ${e.family || ''}`.toLowerCase();
      return name.includes(query);
    });
  }, [essences, essenceTier, essenceSearch]);

  // Helper to select flacon from DB
  const handleSelectFlacon = (f: any) => {
    const cap = Number(f.contenance_ml || 0);
    const fId = Number(f.id);
    if (totalMl > cap) {
      setQuantities({});
      addToast(
        `Format ${cap}ml sélectionné — composition réinitialisée.`,
        'info'
      );
    }
    setSelectedSize(cap);
    setSelectedFlaconId(fId);
  };

  // Helper to add the composed creation directly to standard POS basket
  const handleAddCompositionToCart = async () => {
    if (totalMl === 0) {
      addToast('Veuillez composer avec au moins 1ml.', 'error');
      return;
    }
    if (oilLimitExceeded) {
      addToast(
        `Le contenu dépasse la limite de ${maxOilMl} ml pour ce flacon.`,
        'error'
      );
      return;
    }
    const finalName =
      compositionName.trim() || `Composition Client ${selectedSize}ml`;

    const lignes = Object.entries(quantities)
      .filter(([_, qty]) => (qty as number) > 0)
      .map(([essenceId, qty]) => {
        const details = essences.find((e) => String(e.id) === String(essenceId));

        if (details?.itemType === 'ingredient') {
          return {
            ingredient: details.backendId ?? Number(essenceId),
            quantite_ml: qty,
          };
        }

        return {
          lot_essence_id:
            details?.lotEssenceId ?? details?.backendId ?? Number(essenceId),
          quantite_ml: qty,
        };
      });

    const simulatedProduct: Product = {
      id: `custom-${Date.now()}`,
      nom: finalName,
      marque: 'Atelier Exclusif',
      prix_unitaire: compositionPrice,
      prix_actuel: compositionPrice,
      slug: `custom-${Date.now()}`,
      is_custom: true,
      flaconId: selectedFlaconId,
      description: `Format ${selectedSize}ml (Mélange de ${totalMl}ml d'ingrédients).`,
      quantities,
      selectedSize,
    } as any;

    setCartItems((prev) => [...prev, { product: simulatedProduct, quantity: 1 }]);
    addToast('Composition ajoutée au ticket de caisse !', 'success');
    setQuantities({});
    setCompositionName('');
    setActiveTab('products');
  };

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

        const extractResults = (res: any): Product[] => {
          if (!res) return [];
          if (Array.isArray(res)) return res;
          return res.results ?? res.resultats ?? [];
        };

        const cleanedPerfumes = extractResults(perfumes);
        const cleanedAccessories = extractResults(accessories);

        const normalizedPerfumes = cleanedPerfumes.map((p: any) => ({
          ...p,
          type: 'parfum',
        }));
        const normalizedAccessories = cleanedAccessories.map((p: any) => ({
          ...p,
          type: 'accessoire',
        }));

        [...normalizedPerfumes, ...normalizedAccessories].forEach((p) => {
          if (p && p.id && !uniqueProducts.has(String(p.id))) {
            uniqueProducts.set(String(p.id), p);
          }
        });

        setProducts(Array.from(uniqueProducts.values()));
      } catch (error) {
        console.error('Search error:', error);
        addToast('Erreur lors de la recherche', 'error');
        setProducts([]);
      } finally {
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
    const total = subtotal;

    return { itemCount, subtotal, total };
  }, [cartItems]);

  const handleValidateOrder = async () => {
    if (cartItems.length === 0) {
      addToast('La commande est vide', 'error');
      return;
    }

    setIsValidating(true);
    try {
      const order = await orderService.createPOSOrderFromCart({
        cartItems,
        clientTelephone: telephoneClient || undefined,
        clientNom: nomClient || undefined,
        clientEmail: undefined,
        livraisonNom: nomClient || undefined,
        livraisonTelephone: telephoneClient || undefined,
        codePromo: codePromo || undefined,
        noteInterne: note || undefined,
      });

      setLastOrderNumber(order.numero_commande || `#${order.id}`);
      setIsSuccess(true);

      // Reset form
      setCartItems([]);
      setExpandedId(null);
      setSearchTerm('');
      setNomClient('');
      setTelephoneClient('');
      setNote('');
      setCodePromo('');

      addToast(
        `Commande ${order.numero_commande || '#' + order.id} créée avec succès !`,
        'success'
      );
      setTimeout(() => setIsSuccess(false), 4000);
    } catch (error: any) {
      console.error('Order creation error:', error);
      const msg =
        error?.response?.data?.detail ||
        error?.response?.data?.non_field_errors?.[0] ||
        'Erreur lors de la création de la commande';
      addToast(msg, 'error');
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
        <div className="text-center space-y-4 max-w-md w-full rounded-xl border border-white/10 bg-white/[0.02] p-8">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35 block">
              Confirmation
            </span>
            <h1 className="text-xl font-semibold text-foreground">
              Commande validée
            </h1>
            <p className="text-xs font-mono text-gold pt-1">{lastOrderNumber}</p>
          </div>
          <p className="text-xs text-foreground/50 leading-relaxed">
            L'inventaire a été mis à jour automatiquement.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col font-sans">
      <main className="flex-1 min-h-0 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4 pb-6 flex flex-col space-y-4">
        {/* Header Strip */}
        <div className="shrink-0 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BackButton href="/dashboard/profile" />
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35 block mb-0.5">
                Terminal d'encaissement
              </span>
              <h1 className="text-xl font-semibold text-foreground">
                Point de vente
              </h1>
            </div>
          </div>

          {cartItems.length > 0 && (
            <StatusChip
              status="gold"
              label={`${totals.itemCount} article${totals.itemCount > 1 ? 's' : ''}`}
            />
          )}
        </div>

        {/* Quiet Underline Tabs */}
        <div className="shrink-0 flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('products')}
            className={cx(
              'px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2',
              activeTab === 'products'
                ? 'border-gold text-gold'
                : 'border-transparent text-foreground/45 hover:text-foreground'
            )}
          >
            <ShoppingBag size={14} />
            Produits & Accessoires
          </button>
          <button
            onClick={() => setActiveTab('composition')}
            className={cx(
              'px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2',
              activeTab === 'composition'
                ? 'border-gold text-gold'
                : 'border-transparent text-foreground/45 hover:text-foreground'
            )}
          >
            <FlaskConical size={14} />
            Création Atelier
          </button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
          {/* Left Panel : Product Catalog / Atelier Builder */}
          <section className="lg:col-span-6 border border-white/10 bg-white/[0.02] rounded-xl flex flex-col min-h-0 overflow-hidden">
            {activeTab === 'products' ? (
              <>
                {/* Search Bar */}
                <div className="p-4 border-b border-white/10 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground/35" />
                    <input
                      ref={searchInputRef}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Rechercher un produit, une référence, une marque…"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-lg py-2 pl-9 pr-8 text-xs text-foreground placeholder:text-foreground/35 focus:outline-none focus:border-gold/50 transition-colors"
                      autoFocus
                    />
                    {isLoading ? (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gold animate-spin" />
                    ) : searchTerm ? (
                      <button
                        onClick={handleClearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/35 hover:text-foreground transition-colors"
                      >
                        <X size={14} />
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Search Results List */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                  {!searchTerm ? (
                    <EmptyState
                      icon={
                        <PackageSearch className="size-6 text-foreground/20" />
                      }
                      title="Saisissez un terme de recherche"
                      subtitle="Les produits correspondants s'afficheront instantanément."
                    />
                  ) : isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2">
                      <Loader2 size={16} className="animate-spin text-gold" />
                      <span className="text-xs text-foreground/40">
                        Recherche en cours…
                      </span>
                    </div>
                  ) : products.length === 0 ? (
                    <p className="text-sm italic text-foreground/30 text-center py-16">
                      Aucun produit ne correspond à « {searchTerm} ».
                    </p>
                  ) : (
                    <ul className="divide-y divide-white/5">
                      {products.map((product) => (
                        <ProductRow
                          key={product.id}
                          product={product}
                          isExpanded={expandedId === String(product.id)}
                          onToggle={() =>
                            handleToggleExpand(String(product.id))
                          }
                          draftQty={draftQty}
                          onDraftQtyChange={setDraftQty}
                          onAdd={(qty) => handleAddToCart(product, qty)}
                          inCartQty={
                            cartItems.find((c) => c.product.id === product.id)
                              ?.quantity
                          }
                        />
                      ))}
                    </ul>
                  )}
                </div>
              </>
            ) : (
              /* Atelier Custom Builder */
              <div className="flex-1 flex flex-col min-h-0">
                {/* Atelier Top Controls */}
                <div className="p-4 border-b border-white/10 shrink-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gold">
                      Composition sur mesure
                    </span>
                    <button
                      onClick={() => {
                        setQuantities({});
                        setCompositionName('');
                      }}
                      className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40 hover:text-red-400 flex items-center gap-1 transition-colors"
                    >
                      <RefreshCcw size={10} /> Réinitialiser
                    </button>
                  </div>

                  <input
                    value={compositionName}
                    onChange={(e) => setCompositionName(e.target.value)}
                    placeholder="Nom personnalisé de la formule (ex: Secret Oud)…"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-lg py-2 px-3 text-xs text-foreground placeholder:text-foreground/35 focus:outline-none focus:border-gold/50"
                  />

                  {/* Flacon Selection */}
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35 block mb-1.5">
                      Contenance du Flacon
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {flacons.length === 0 && (
                        <>
                          {[30, 50, 100].map((ml) => (
                            <button
                              key={ml}
                              onClick={() => {
                                setSelectedSize(ml);
                                if (totalMl > ml) setQuantities({});
                              }}
                              className={cx(
                                'px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors',
                                selectedSize === ml
                                  ? 'bg-gold text-black border-gold font-semibold'
                                  : 'border-white/10 text-foreground/60 hover:bg-white/6'
                              )}
                            >
                              {ml} ml
                            </button>
                          ))}
                        </>
                      )}
                      {flacons.map((f: any) => {
                        const cap = Number(f.contenance_ml || 0);
                        const fId = Number(f.id);
                        return (
                          <button
                            key={fId}
                            onClick={() => handleSelectFlacon(f)}
                            className={cx(
                              'px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors',
                              selectedFlaconId === fId
                                ? 'bg-gold text-black border-gold font-semibold'
                                : 'border-white/10 text-foreground/60 hover:bg-white/6'
                            )}
                          >
                            {f.nom || `${cap} ml`}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Volume Gauge Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                      <span>Remplissage Huiles</span>
                      <span
                        className={
                          oilLimitExceeded
                            ? 'text-red-400'
                            : totalMl >= maxOilMl
                            ? 'text-gold'
                            : ''
                        }
                      >
                        {totalMl} / {maxOilMl} ml (Max 45%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={cx(
                          'h-full transition-all duration-300',
                          oilLimitExceeded ? 'bg-red-500' : 'bg-gold'
                        )}
                        style={{
                          width: `${maxOilMl > 0 ? Math.min(100, (totalMl / maxOilMl) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Filters & Essence Tiers */}
                <div className="px-4 pt-3 shrink-0 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-foreground/35" />
                    <input
                      value={essenceSearch}
                      onChange={(e) => setEssenceSearch(e.target.value)}
                      placeholder="Filtrer essences & ingrédients…"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-lg py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-foreground/35 focus:outline-none focus:border-gold/50"
                    />
                  </div>
                  <div className="flex gap-1">
                    {(['all', 'premium', 'super-premium', 'high'] as const).map(
                      (tier) => (
                        <button
                          key={tier}
                          onClick={() => setEssenceTier(tier)}
                          className={cx(
                            'px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-colors',
                            essenceTier === tier
                              ? 'bg-gold/10 text-gold ring-1 ring-inset ring-gold/20'
                              : 'text-foreground/40 hover:text-foreground hover:bg-white/5'
                          )}
                        >
                          {tier === 'all'
                            ? 'Tous'
                            : tier === 'super-premium'
                            ? 'S.Premium'
                            : tier === 'high'
                            ? 'High'
                            : 'Premium'}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Essence Sliders List */}
                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2">
                  {loadingEssences ? (
                    <div className="flex items-center justify-center py-8 gap-2">
                      <Loader2 size={14} className="animate-spin text-gold" />
                      <span className="text-xs text-foreground/40">
                        Chargement du laboratoire…
                      </span>
                    </div>
                  ) : filteredEssences.length === 0 ? (
                    <p className="text-xs italic text-foreground/30 text-center py-8">
                      Aucun ingrédient dans cette catégorie.
                    </p>
                  ) : (
                    filteredEssences.map((essence) => {
                      const currentVal = quantities[essence.id] || 0;
                      const maxForThis = selectedSize - (totalMl - currentVal);
                      return (
                        <div
                          key={essence.id}
                          className="bg-white/[0.02] border border-white/5 p-2.5 rounded-lg space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{
                                  backgroundColor: essence.color || '#C5A059',
                                }}
                              />
                              <span className="truncate text-xs font-medium text-foreground">
                                {essence.name}
                              </span>
                              {essence.pricePerMl > 0 && (
                                <span className="text-[10px] font-mono text-foreground/35 shrink-0">
                                  {formatXAF(essence.pricePerMl)} CFA/ml
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => updateQuantity(essence.id, -1)}
                                className="h-5 w-5 rounded-md border border-white/10 bg-white/5 flex items-center justify-center text-foreground/60 hover:text-gold transition-colors"
                              >
                                <Minus size={10} />
                              </button>
                              <span className="w-9 text-center text-xs font-mono font-semibold tabular-nums text-foreground">
                                {currentVal} ml
                              </span>
                              <button
                                onClick={() => updateQuantity(essence.id, 1)}
                                disabled={
                                  totalMl >= selectedSize && currentVal === 0
                                }
                                className="h-5 w-5 rounded-md border border-white/10 bg-white/5 flex items-center justify-center text-foreground/60 hover:text-gold disabled:opacity-30 transition-colors"
                              >
                                <Plus size={10} />
                              </button>
                            </div>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={Math.max(maxForThis, currentVal)}
                            step={1}
                            value={currentVal}
                            onChange={(e) =>
                              setQuantityRange(
                                essence.id,
                                Number(e.target.value)
                              )
                            }
                            className="w-full h-1 accent-[#C5A059] cursor-pointer bg-white/10 rounded-lg"
                          />
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Confirm Composition Strip */}
                <div className="shrink-0 p-4 border-t border-white/10 flex items-center justify-between bg-white/[0.02]">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35 block">
                      Prix Estime
                    </span>
                    <span className="text-lg font-semibold tabular-nums text-gold">
                      {formatXAF(compositionPrice)} F CFA
                    </span>
                  </div>
                  <button
                    onClick={handleAddCompositionToCart}
                    disabled={totalMl === 0}
                    className="rounded-lg bg-gold text-black px-4 py-2 text-xs font-semibold hover:bg-gold/90 disabled:opacity-30 transition-colors"
                  >
                    Ajouter au ticket
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Right Panel : Ticket Checkout Counter */}
          <section className="lg:col-span-6 border border-white/10 bg-white/[0.02] rounded-xl flex flex-col min-h-0 overflow-hidden">
            {/* Ticket Header */}
            <div className="p-4 flex items-center justify-between border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <Receipt className="size-4 text-gold" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/70">
                  Ticket de caisse
                </span>
              </div>
              {cartItems.length > 0 && (
                <button
                  onClick={() => setCartItems([])}
                  className="text-xs text-foreground/40 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <Trash2 size={13} />
                  Vider
                </button>
              )}
            </div>

            {/* Cart Items List */}
            {cartItems.length === 0 ? (
              <div className="flex-1 min-h-0 flex items-center justify-center p-6">
                <EmptyState
                  icon={<CartIcon className="size-7 text-foreground/20" />}
                  title="Ticket de caisse vide"
                  subtitle="Sélectionnez des articles dans le catalogue ou créez une composition."
                />
              </div>
            ) : (
              <ol className="flex-1 min-h-0 overflow-y-auto divide-y divide-white/5 px-4">
                {cartItems.map((item, index) => (
                  <li
                    key={item.product.id}
                    className="flex items-center gap-3 py-3"
                  >
                    <span className="text-xs font-mono text-foreground/30 w-4 text-right shrink-0">
                      {index + 1}
                    </span>

                    <ProductThumb product={item.product} size={36} />

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {getProductName(item.product)}
                      </p>
                      <p className="text-[10px] text-foreground/40 font-mono">
                        {formatXAF(getProductPrice(item.product))} F CFA / un.
                      </p>
                    </div>

                    <div className="flex items-center gap-1 border border-white/10 rounded-lg bg-white/[0.03] shrink-0">
                      <button
                        onClick={() =>
                          handleUpdateQuantity(
                            item.product.id,
                            item.quantity - 1
                          )
                        }
                        className="h-6 w-6 flex items-center justify-center text-foreground/50 hover:text-gold transition-colors"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="w-5 text-center text-xs font-mono font-semibold tabular-nums text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleUpdateQuantity(
                            item.product.id,
                            item.quantity + 1
                          )
                        }
                        className="h-6 w-6 flex items-center justify-center text-foreground/50 hover:text-gold transition-colors"
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    <p className="text-xs font-semibold text-foreground tabular-nums w-16 text-right shrink-0">
                      {formatXAF(
                        getProductPrice(item.product) * item.quantity
                      )}
                    </p>

                    <button
                      onClick={() => handleRemoveFromCart(item.product.id)}
                      className="text-foreground/30 hover:text-red-400 transition-colors p-1 shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ol>
            )}

            {/* Client Infos & Totals */}
            <div className="p-4 border-t border-white/10 shrink-0 space-y-4 bg-white/[0.02]">
              {/* Optional Fields */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-foreground/35" />
                  <input
                    value={nomClient}
                    onChange={(e) => setNomClient(e.target.value)}
                    placeholder="Nom client"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-lg py-1.5 pl-7 pr-2 text-xs text-foreground placeholder:text-foreground/35 focus:outline-none focus:border-gold/50"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-foreground/35" />
                  <input
                    value={telephoneClient}
                    onChange={(e) => setTelephoneClient(e.target.value)}
                    placeholder="Téléphone"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-lg py-1.5 pl-7 pr-2 text-xs text-foreground placeholder:text-foreground/35 focus:outline-none focus:border-gold/50"
                  />
                </div>
                <div className="relative">
                  <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-foreground/35" />
                  <input
                    value={codePromo}
                    onChange={(e) => setCodePromo(e.target.value)}
                    placeholder="Code promo"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-lg py-1.5 pl-7 pr-2 text-xs text-foreground placeholder:text-foreground/35 focus:outline-none focus:border-gold/50"
                  />
                </div>
                <div className="relative">
                  <FileText className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-foreground/35" />
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Note interne"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-lg py-1.5 pl-7 pr-2 text-xs text-foreground placeholder:text-foreground/35 focus:outline-none focus:border-gold/50"
                  />
                </div>
              </div>

              {/* Stat Strip Totals */}
              <div className="w-full rounded-xl border border-white/10 bg-white/[0.02] flex divide-x divide-white/8">
                <div className="flex-1 p-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35 block mb-0.5">
                    Sous-total
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {formatXAF(totals.subtotal)} CFA
                  </span>
                </div>
                <div className="flex-1 p-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35 block mb-0.5">
                    Total
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-gold">
                    {formatXAF(totals.total)} CFA
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={handleValidateOrder}
                disabled={isValidating || cartItems.length === 0}
                className="w-full bg-gold text-black font-semibold text-xs uppercase tracking-wider rounded-lg py-3 flex items-center justify-center gap-2 transition-colors hover:bg-gold/90 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isValidating ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-black" />
                    <span>Encaissement en cours…</span>
                  </>
                ) : (
                  <span>Valider et Encaisser</span>
                )}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// ── Secondary Components ────────────────────────────────────────────────────

function ProductThumb({
  product,
  size = 36,
}: {
  product: Product;
  size?: number;
}) {
  const url = useMemo(() => getProductImageUrl(product), [product]);

  return (
    <div
      className="relative shrink-0 rounded-lg overflow-hidden border border-white/10 bg-white/[0.03]"
      style={{ width: size, height: size }}
    >
      {url ? (
        <AppImage
          fill
          src={url}
          alt={getProductName(product)}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-foreground/20">
          <ImageOff size={14} />
        </div>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string | null;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 space-y-1">
      <div className="mb-2">{icon}</div>
      <p className="text-xs font-medium text-foreground/50">{title}</p>
      {subtitle && (
        <p className="text-[11px] text-foreground/30 max-w-[14rem]">
          {subtitle}
        </p>
      )}
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
        className={cx(
          'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
          isExpanded ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
        )}
      >
        <ProductThumb product={product} size={36} />

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">
            {getProductName(product)}
          </p>
          <p className="text-[10px] text-foreground/40 font-mono mt-0.5">
            {formatXAF(currentPrice)} F CFA
            {typeof inCartQty === 'number' && (
              <span className="text-gold font-semibold">
                {' '}
                · {inCartQty} en ticket
              </span>
            )}
          </p>
        </div>

        <Plus
          className={cx(
            'size-4 text-foreground/35 transition-transform',
            isExpanded && 'rotate-45 text-gold'
          )}
        />
      </button>

      {isExpanded && (
        <div className="px-4 pb-3 pt-1 bg-white/[0.04] flex items-center gap-2 border-t border-white/5">
          <div className="flex items-center gap-1 border border-white/10 rounded-lg bg-white/[0.03]">
            <button
              onClick={() => onDraftQtyChange(Math.max(1, draftQty - 1))}
              className="h-7 w-7 flex items-center justify-center text-foreground/50 hover:text-gold transition-colors"
            >
              <Minus size={11} />
            </button>
            <span className="w-6 text-center text-xs font-mono font-semibold tabular-nums text-foreground">
              {draftQty}
            </span>
            <button
              onClick={() => onDraftQtyChange(draftQty + 1)}
              className="h-7 w-7 flex items-center justify-center text-foreground/50 hover:text-gold transition-colors"
            >
              <Plus size={11} />
            </button>
          </div>

          <button
            onClick={() => onAdd(draftQty)}
            className="flex-1 bg-gold text-black rounded-lg py-1.5 px-3 text-xs font-semibold hover:bg-gold/90 transition-colors"
          >
            Ajouter — {formatXAF(currentPrice * draftQty)} F CFA
          </button>
        </div>
      )}
    </li>
  );
}