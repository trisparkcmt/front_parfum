'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Product, EssenceClient } from '@/types';
import { productService } from '@/services/productService';
import { orderService } from '@/services/orderService';
import { labService } from '@/services/labService';
import { cartService } from '@/services/apiService';
import { useToastStore } from '@/store/useToastStore';
import { BackButton } from '@/components/ui/BackButton';
import { AppImage } from '@/components/ui/AppImage';
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

const TVA_RATE = 0.2;

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
        const bottles = (bottlesRes as any)?.results || (bottlesRes as any)?.resultats || (Array.isArray(bottlesRes) ? bottlesRes : []);
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

  const maxOilMl = useMemo(() => Math.max(0, Number((selectedSize * 0.45).toFixed(2))), [selectedSize]);
  const oilLimitExceeded = totalMl > maxOilMl;

  const compositionPrice = useMemo(() => {
    const basePrice = selectedSize === 30 ? 2000 : selectedSize === 50 ? 5000 : 12000;
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
      const capped = Math.min(value, Math.min(selectedSize - totalOther, maxOilMl - totalOther));
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
          addToast(`Le contenu ne peut dépasser ${maxOilMl} ml pour respecter la règle de 45% du flacon.`, "info");
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
      addToast(`Format ${cap}ml sélectionné — composition réinitialisée.`, 'info');
    }
    setSelectedSize(cap);
    setSelectedFlaconId(fId);
  };

  // Helper to add the composed creation directly to standard POS basket
  const handleAddCompositionToCart = async () => {
    if (totalMl === 0) {
      addToast("Veuillez composer avec au moins 1ml.", "error");
      return;
    }
    if (oilLimitExceeded) {
      addToast(`Le contenu dépasse la limite de ${maxOilMl} ml pour ce flacon.`, "error");
      return;
    }
    const finalName = compositionName.trim() || `Composition Client ${selectedSize}ml`;

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
          lot_essence_id: details?.lotEssenceId ?? details?.backendId ?? Number(essenceId),
          quantite_ml: qty,
        };
      });

    try {
      await cartService.addDirectComposition({
        flacon_id: Number(selectedFlaconId || selectedSize),
        lignes,
        quantite: 1,
        nom: finalName,
        note_client: note.trim() || undefined,
      });
    } catch (err: any) {
      addToast(err?.response?.data?.detail || 'La composition n’a pas pu être ajoutée au panier.', 'error');
      return;
    }

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
    addToast("Composition ajoutée au ticket de caisse !", "success");
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

        const normalizedPerfumes = cleanedPerfumes.map((p: any) => ({ ...p, type: 'parfum' }));
        const normalizedAccessories = cleanedAccessories.map((p: any) => ({ ...p, type: 'accessoire' }));

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
      const regularItems = cartItems.filter((item) => !(item.product as any).is_custom);
      if (regularItems.length === 0) {
        addToast('Aucun article standard à commander. La composition a été enregistrée via le panier.', 'info');
        setIsValidating(false);
        return;
      }

      const lignes = regularItems.map((item) => {
        const p = item.product as any;
        const isPerfume = p.type === 'parfum' || p.contenance_ml !== undefined || p.genre_cible || p.notes_tete;
        return {
          type: isPerfume ? 'parfum' : 'accessoire',
          id: Number(item.product.id),
          quantite: item.quantity,
        };
      });

      // Use the POS endpoint for instant checkout (with the correct 'lignes' body key)
      const order = await orderService.createPOSOrder({
        lignes,
        client_nom_complet: nomClient || undefined,
        client_telephone: telephoneClient || undefined,
        note_interne: note || undefined,
        code_promo: codePromo || undefined,
      } as any);

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

      addToast(`Commande ${order.numero_commande || '#' + order.id} créée avec succès !`, 'success');
      setTimeout(() => setIsSuccess(false), 4000);
    } catch (error: any) {
      console.error('Order creation error:', error);
      const msg = error?.response?.data?.detail || error?.response?.data?.non_field_errors?.[0] || 'Erreur lors de la création de la commande';
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

        {/* Tabs selector */}
        <div className="shrink-0 flex gap-2 mb-3">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-medium uppercase tracking-widest transition-colors ${
              activeTab === 'products'
                ? 'bg-gold text-background'
                : 'border border-white/10 text-foreground/50 hover:bg-white/5'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Produits
          </button>
          <button
            onClick={() => setActiveTab('composition')}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-medium uppercase tracking-widest transition-colors ${
              activeTab === 'composition'
                ? 'bg-gold text-background'
                : 'border border-white/10 text-foreground/50 hover:bg-white/5'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Création Composition
          </button>
        </div>

        {/* Counter layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,45%)_minmax(0,55%)] gap-5 flex-1 min-h-0">
          {/* Left space */}
          <section className="border border-white/10 bg-white/[0.03] rounded-sm flex flex-col min-h-0">
            {activeTab === 'products' ? (
              <>
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

                {/* Results list */}
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
              </>
            ) : (
              /* Simplified POS Atelier workspace */
              <div className="flex-1 flex flex-col min-h-0">
                {/* Name + Flacon selector */}
                <div className="p-4 border-b border-white/10 shrink-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gold flex items-center gap-2">
                      <FlaskConical className="w-3.5 h-3.5" /> Composition sur mesure
                    </h3>
                    <button
                      onClick={() => { setQuantities({}); setCompositionName(''); }}
                      className="text-[10px] uppercase text-foreground/30 hover:text-red-400 flex items-center gap-1"
                    >
                      <RefreshCcw size={9} /> Reset
                    </button>
                  </div>

                  <input
                    value={compositionName}
                    onChange={(e) => setCompositionName(e.target.value)}
                    placeholder="Nom du parfum (ex: Secret Oud)…"
                    className="w-full bg-background/50 border border-white/10 rounded-sm py-2 px-3 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-gold/40"
                  />

                  {/* Flacon chips — real DB flacons */}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-foreground/40 mb-1.5">Format flacon</p>
                    <div className="flex flex-wrap gap-1.5">
                      {flacons.length === 0 && (
                        <>
                          {[30, 50, 100].map(ml => (
                            <button key={ml} onClick={() => { setSelectedSize(ml); if (totalMl > ml) setQuantities({}); }}
                              className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider border transition-all ${ selectedSize === ml ? 'bg-gold text-background border-gold' : 'border-white/15 text-foreground/60 hover:border-gold/40' }`}
                            >{ml}ml</button>
                          ))}
                        </>
                      )}
                      {flacons.map((f: any) => {
                        const cap = Number(f.contenance_ml || 0);
                        const fId = Number(f.id);
                        return (
                          <button key={fId} onClick={() => handleSelectFlacon(f)}
                            className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider border transition-all ${ selectedFlaconId === fId ? 'bg-gold text-background border-gold' : 'border-white/15 text-foreground/60 hover:border-gold/40' }`}
                          >{f.nom || `${cap}ml`}</button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-foreground/40">
                      <span>Rempli</span>
                      <span className={oilLimitExceeded ? 'text-red-400 font-bold' : totalMl >= selectedSize ? 'text-gold font-bold' : ''}>{totalMl} / {selectedSize} ml</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gold transition-all duration-300"
                        style={{ width: `${Math.min(100, (Math.min(totalMl, maxOilMl) / selectedSize) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Tier sub-tabs */}
                <div className="px-4 pt-3 shrink-0 space-y-2">
                  <div className="flex items-center gap-2 rounded-sm border border-white/10 bg-background/50 px-3 py-2">
                    <Search className="w-3.5 h-3.5 text-foreground/30" />
                    <input
                      value={essenceSearch}
                      onChange={(e) => setEssenceSearch(e.target.value)}
                      placeholder="Rechercher une huile ou une essence…"
                      className="w-full bg-transparent text-xs text-foreground placeholder:text-foreground/30 outline-none"
                    />
                  </div>
                  <div className="flex gap-1">
                  {(['all', 'premium', 'super-premium', 'high'] as const).map(tier => (
                    <button key={tier} onClick={() => setEssenceTier(tier)}
                      className={`px-2.5 py-1 rounded-sm text-[9px] uppercase tracking-wider transition-colors ${ essenceTier === tier ? 'bg-gold/20 text-gold border border-gold/40' : 'text-foreground/40 hover:text-foreground/70' }`}
                    >
                      {tier === 'all' ? 'Tous' : tier === 'super-premium' ? 'S.Premium' : tier === 'high' ? 'High' : 'Premium'}
                    </button>
                  ))}
                  </div>
                </div>

                <div className="px-4 pb-2">
                  <p className={`text-[10px] ${oilLimitExceeded ? 'text-red-400' : 'text-foreground/40'}`}>
                    Limite d’huile : {maxOilMl} ml max sur {selectedSize} ml ({(maxOilMl / selectedSize * 100).toFixed(0)}%).
                  </p>
                </div>

                {/* Essence list with range sliders */}
                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2">
                  {loadingEssences ? (
                    <div className="text-center text-xs py-8 text-foreground/40">Chargement des essences…</div>
                  ) : filteredEssences.length === 0 ? (
                    <div className="text-center text-xs py-8 text-foreground/30">Aucune essence dans cette catégorie.</div>
                  ) : (
                    filteredEssences.map((essence) => {
                      const currentVal = quantities[essence.id] || 0;
                      const maxForThis = selectedSize - (totalMl - currentVal);
                      return (
                        <div key={essence.id} className="bg-white/[0.02] border border-white/5 p-2.5 rounded-sm space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: essence.color }} />
                              <span className="truncate text-xs text-foreground/80 font-medium">{essence.name}</span>
                              {essence.pricePerMl > 0 && (
                                <span className="text-[9px] text-foreground/30 shrink-0">{formatXAF(essence.pricePerMl)}/ml</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => updateQuantity(essence.id, -1)}
                                className="w-5 h-5 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center text-foreground/50 hover:text-gold"
                              ><Minus size={8} /></button>
                              <span className="w-10 text-center text-[10px] font-mono font-bold tabular-nums">{currentVal}ml</span>
                              <button onClick={() => updateQuantity(essence.id, 1)}
                                disabled={totalMl >= selectedSize && currentVal === 0}
                                className="w-5 h-5 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center text-foreground/50 hover:text-gold disabled:opacity-20"
                              ><Plus size={8} /></button>
                            </div>
                          </div>
                          {/* Range slider */}
                          <input
                            type="range" min={0} max={Math.max(maxForThis, currentVal)} step={1}
                            value={currentVal}
                            onChange={(e) => setQuantityRange(essence.id, Number(e.target.value))}
                            className="w-full h-1 accent-[#C5A059] cursor-pointer"
                          />
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Confirm section */}
                <div className="shrink-0 px-4 py-3 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-foreground/40">Estimation prix</p>
                    <p className="text-gold font-bold font-serif text-base">{formatXAF(compositionPrice)} F CFA</p>
                  </div>
                  <button
                    onClick={handleAddCompositionToCart}
                    disabled={totalMl === 0}
                    className="bg-gold text-background px-4 py-2.5 rounded-sm text-xs uppercase tracking-wider font-semibold hover:opacity-90 disabled:opacity-30 transition-all"
                  >
                    Ajouter au ticket
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Ticket checkout panel */}
          <section className="relative border border-white/10 bg-white/[0.03] rounded-sm flex flex-col min-h-0">
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
                  Ticket de caisse
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
                  subtitle="Ajoutez des articles ou composez un parfum pour commencer."
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
                      <p className="font-serif text-sm text-foreground truncate">
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

                    <p className="font-serif text-sm text-foreground tabular-nums w-20 text-right shrink-0">
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

            {/* Client info + Totals + Validate */}
            <div className="px-6 pt-4 pb-6 border-t border-white/10 shrink-0 space-y-4">
              {/* Optional client info */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30" strokeWidth={1.5} />
                  <input
                    value={nomClient}
                    onChange={(e) => setNomClient(e.target.value)}
                    placeholder="Nom client (optionnel)"
                    className="w-full bg-background/40 border border-white/10 rounded-sm py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-gold/50"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30" strokeWidth={1.5} />
                  <input
                    value={telephoneClient}
                    onChange={(e) => setTelephoneClient(e.target.value)}
                    placeholder="Téléphone (optionnel)"
                    className="w-full bg-background/40 border border-white/10 rounded-sm py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-gold/50"
                  />
                </div>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30" strokeWidth={1.5} />
                  <input
                    value={codePromo}
                    onChange={(e) => setCodePromo(e.target.value)}
                    placeholder="Code promo (optionnel)"
                    className="w-full bg-background/40 border border-white/10 rounded-sm py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-gold/50"
                  />
                </div>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30" strokeWidth={1.5} />
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Note interne (optionnel)"
                    className="w-full bg-background/40 border border-white/10 rounded-sm py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-gold/50"
                  />
                </div>
              </div>

              {/* Totals */}
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

              <div className="flex justify-between items-baseline pt-3 border-t border-gold/20">
                <span className="font-serif text-lg text-foreground">Total</span>
                <span className="font-serif text-2xl text-gold tabular-nums">
                  {formatXAF(totals.total)} F CFA
                </span>
              </div>

              <button
                onClick={handleValidateOrder}
                disabled={isValidating || cartItems.length === 0}
                className="w-full bg-gold text-background font-medium text-sm uppercase tracking-[0.1em] rounded-sm py-3.5 flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
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
  const url = useMemo(() => getProductImageUrl(product), [product]);

  return (
    <div
      className="relative shrink-0 rounded-sm overflow-hidden border border-white/10 bg-background/40"
      style={{ width: size, height: size }}
    >
      {url ? (
        <AppImage fill src={url} alt={getProductName(product)} className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-foreground/20">
          <ImageOff className="w-4 h-4" strokeWidth={1.5} />
        </div>
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