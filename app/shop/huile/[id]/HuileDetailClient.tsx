'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2, Heart, ShoppingBag, Truck, ShieldCheck, RotateCcw,
  Check, ChevronRight, Minus, Plus, Droplets, Leaf, FlaskConical,
  Info, Star, Sparkles, Award
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn, formatPrice, sharePage } from '@/lib/utils';
import { productService } from '@/services/productService';
import { ProductCard } from '@/components/ui/ProductCard';
import { BackButton } from '@/components/ui/BackButton';
import { useCartStore } from '@/store/useCartStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useToastStore } from '@/store/useToastStore';
import { Product, ProduitFiniEssence } from '@/types';

export default function HuileDetailClient({ id }: { id: string }) {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'description' | 'notes' | 'details' | 'usage'>('description');

  // Multi-format selection state: variantId -> quantity
  const [selectedQuantities, setSelectedQuantities] = useState<Record<number, number>>({});

  const { addProduct } = useCartStore();
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const p = await productService.getProductById(id);
        if (!mounted) return;
        setProduct(p);

        // Track view_item event for GA4
        if (p) {
          try {
            const { trackViewItem } = await import('@/lib/gtag');
            trackViewItem({
              value: p.price,
              items: [{
                item_id: String(p.id),
                item_name: p.name,
                item_category: p.category,
                price: p.price,
                quantity: 1,
              }],
            });
          } catch (error) {
            console.warn('Failed to track view_item:', error);
          }
        }

        // Pre-select first available finished product with quantity 1
        if (p?.produits_finis?.length) {
          const firstAvailable = p.produits_finis.find((v) => v.stock_disponible > 0) || p.produits_finis[0];
          if (firstAvailable && firstAvailable.stock_disponible > 0) {
            setSelectedQuantities({ [firstAvailable.id]: 1 });
          }
        }

        if (p) {
          try {
            const related = await productService.getEssencesAsProducts({});
            if (mounted) setRelatedProducts(related.filter(r => r.id !== p.id).slice(0, 4));
          } catch { /* ignore */ }
        }
      } catch {
        if (mounted) setProduct(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const variants = useMemo(() => product?.produits_finis || [], [product]);

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

  const selectedItems = useMemo(() => {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-gold uppercase tracking-[0.2em] text-xs font-bold flex items-center gap-2">
          <Droplets className="w-4 h-4 text-gold animate-bounce" />
          {isEn ? 'Loading essential oil…' : 'Chargement de l\'huile…'}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-foreground/40 text-lg uppercase tracking-[0.2em]">
          {isEn ? 'Oil not found' : 'Huile introuvable'}
        </p>
        <BackButton />
      </div>
    );
  }

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleAddToCart = async () => {
    if (selectedItems.length === 0) return;

    for (const item of selectedItems) {
      const { variant, quantity } = item;
      const cartProduct: Product = {
        id: String(variant.id),
        name: `${product.name} - ${variant.taille_ml}ml`,
        description: product.description || '',
        price: variant.prix_actuel,
        originalPrice: variant.prix_promotionnel
          ? parseFloat(variant.prix_promotionnel)
          : undefined,
        taux_reduction:
          variant.prix_promotionnel &&
          parseFloat(variant.prix_promotionnel) > variant.prix_actuel
            ? String(
                Math.round(
                  (1 - variant.prix_actuel / parseFloat(variant.prix_promotionnel)) * 100
                )
              )
            : undefined,
        category: 'huile',
        images: product.images,
        brand: product.brand,
        inStock: true,
        volume: `${variant.taille_ml}ml`,
        taille_ml: variant.taille_ml,
        stock_total_ml: product.stock_total_ml,
        essence_id: Number(product.id),
        createdAt: new Date().toISOString(),
      };

      await addProduct(cartProduct, quantity);
      try {
        const { trackAddToCart } = await import('@/lib/gtag');
        trackAddToCart({
          id: String(variant.id),
          name: cartProduct.name,
          price: variant.prix_actuel,
          category: 'Huile',
          quantity,
        });
      } catch { /* ignore analytics */ }
    }

    addToast(
      isEn
        ? `${product.name} (${totalQuantity} bottle${totalQuantity > 1 ? 's' : ''}) added to bag`
        : `${product.name} (${totalQuantity} flacon${totalQuantity > 1 ? 's' : ''}) ajouté au panier`,
      'success'
    );
  };

  const handleToggleFavorite = () => {
    if (isFavorite(product.id)) {
      removeFavorite(product.id);
      addToast(isEn ? `${product.name} removed from wishlist` : `${product.name} retiré des favoris`, 'info');
    } else {
      addFavorite(product);
      addToast(isEn ? `${product.name} added to wishlist` : `${product.name} ajouté aux favoris`, 'info');
    }
  };

  const handleShare = async () => {
    const result = await sharePage(
      `/shop/huile/${product.slug || product.id}`,
      product.name,
      isEn
        ? `Discover pure oil ${product.name} on Accessories Exclusif`
        : `Découvrez l'huile pure ${product.name} sur Accessoires Exclusifs`
    );
    if (result === 'shared') addToast(isEn ? 'Link shared' : 'Lien partagé', 'success');
    else if (result === 'copied') addToast(isEn ? 'Link copied' : 'Lien copié', 'success');
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground pt-28 pb-24 px-4 md:px-8 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-full max-w-5xl -translate-x-1/2 rounded-full bg-gold/5 opacity-50 blur-[150px] -z-10" />

      <div className="max-w-5xl mx-auto">
        <BackButton />

        {/* Breadcrumb */}
        <nav className="mt-6 mb-8 flex items-center gap-2 text-[11px] text-foreground/40 uppercase tracking-widest overflow-x-auto whitespace-nowrap scrollbar-hide">
          <a href="/" className="hover:text-gold transition-colors">{isEn ? 'Home' : 'Accueil'}</a>
          <ChevronRight size={11} className="shrink-0" />
          <a href="/shop/perfumes" className="hover:text-gold transition-colors">{isEn ? 'Shop' : 'Boutique'}</a>
          <ChevronRight size={11} className="shrink-0" />
          <a href="/shop/perfumes?tab=huile" className="hover:text-gold transition-colors">{isEn ? 'Pure Oils' : 'Huiles Pures'}</a>
          <ChevronRight size={11} className="shrink-0" />
          <span className="text-foreground/60 truncate max-w-[240px]">{product.name}</span>
        </nav>

        {/* ─── Hero Header & Information Card ──────────────────────────────── */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-6 sm:p-10 mb-12 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8 border-b border-white/10">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400 inline-flex items-center gap-1.5">
                  <Leaf size={11} />
                  {isEn ? '100% Pure Essential Oil' : 'Huile Essentielle 100% Pure'}
                </span>
                {product.intensite && (
                  <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gold capitalize">
                    Intensité : {product.intensite}
                  </span>
                )}
                {product.genre_cible && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-foreground/60 capitalize">
                    {product.genre_cible}
                  </span>
                )}
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gold mb-1">
                  {product.brand || 'Exclusif Collection'} · Laboratoire
                </p>
                <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-foreground">
                  {product.name}
                </h1>
              </div>

              {product.description && (
                <p className="text-sm sm:text-base leading-relaxed text-foreground/70 pt-1">
                  {product.description}
                </p>
              )}
            </div>

            {/* Quick Actions (Share, Wishlist) */}
            <div className="flex items-center gap-2.5 self-start shrink-0">
              <button
                onClick={handleShare}
                className="rounded-2xl border border-foreground/10 bg-foreground/5 p-3.5 text-foreground transition-all hover:border-gold/30 hover:bg-gold/10 hover:text-gold"
                aria-label="Partager"
                title="Partager"
              >
                <Share2 size={18} />
              </button>
              <button
                onClick={handleToggleFavorite}
                className={cn(
                  'rounded-2xl border p-3.5 transition-all',
                  isFavorite(product.id)
                    ? 'border-red-500 bg-red-500/10 text-red-500'
                    : 'border-foreground/10 bg-foreground/5 text-foreground hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500'
                )}
                aria-label="Favoris"
                title="Ajouter aux favoris"
              >
                <Heart size={18} fill={isFavorite(product.id) ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>

          {/* 4 Feature Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-8">
            <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-3.5">
              <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Droplets size={17} className="text-gold" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-foreground/40">{isEn ? 'Purity' : 'Pureté'}</p>
                <p className="text-xs font-bold text-foreground">100% Non Diluée</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Leaf size={17} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-foreground/40">{isEn ? 'Origin' : 'Origine'}</p>
                <p className="text-xs font-bold text-foreground">{product.origine_pays || 'Naturelle'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-3.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <FlaskConical size={17} className="text-blue-400" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-foreground/40">{isEn ? 'Grade' : 'Qualité'}</p>
                <p className="text-xs font-bold text-foreground">Haute Parfumerie</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-3.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                <Award size={17} className="text-purple-400" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-foreground/40">{isEn ? 'Category' : 'Catégorie'}</p>
                <p className="text-xs font-bold text-foreground capitalize">{product.category === 'huile' ? 'Pure Oil' : product.category}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Finished Product Formats Selector (Embedded directly on page) ─── */}
        <div className="rounded-3xl border border-gold/30 bg-gold/[0.02] p-6 sm:p-10 mb-14 shadow-xl relative">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-gold" />
                <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-foreground">
                  {isEn ? 'Select Formats & Quantities' : 'Formats & Tailles Disponibles'}
                </h2>
              </div>
              <p className="text-xs text-foreground/50 mt-1">
                {isEn ? 'Select one or multiple bottle sizes and add them all to your bag.' : 'Sélectionnez un ou plusieurs formats de flacons et ajoutez-les directement au panier.'}
              </p>
            </div>

            {selectedItems.length > 0 && (
              <span className="hidden sm:inline-flex rounded-full bg-gold/15 border border-gold/30 text-gold text-xs font-bold px-3 py-1">
                {selectedItems.length} format{selectedItems.length > 1 ? 's' : ''} choisi{selectedItems.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {variants.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/10 text-foreground/50 text-sm">
              {isEn ? 'No finished bottle formats available for this oil currently.' : 'Aucun format boutique disponible pour cette huile actuellement.'}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {variants.map((v) => {
                  const currentQty = selectedQuantities[v.id] ?? 0;
                  const isSelected = currentQty > 0;
                  const isOutOfStock = v.stock_disponible <= 0;
                  const originalPriceNum = v.prix_promotionnel ? parseFloat(v.prix_promotionnel) : 0;
                  const hasReduction = originalPriceNum > 0 && originalPriceNum > v.prix_actuel;

                  return (
                    <div
                      key={v.id}
                      className={cn(
                        'relative rounded-2xl border p-5 transition-all flex flex-col justify-between gap-4',
                        isSelected
                          ? 'bg-gold/[0.08] border-gold shadow-lg shadow-gold/10'
                          : isOutOfStock
                          ? 'opacity-40 border-white/5 bg-white/[0.02]'
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
                          onClick={() => !isOutOfStock && toggleVariant(v)}
                          className={cn(
                            'flex items-center gap-3.5 flex-1 min-w-0',
                            isOutOfStock ? 'cursor-not-allowed' : 'cursor-pointer'
                          )}
                        >
                          <div
                            className={cn(
                              'w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors',
                              isSelected
                                ? 'border-gold bg-gold text-black'
                                : 'border-white/20 hover:border-white/40'
                            )}
                          >
                            {isSelected && <Check size={14} strokeWidth={3} />}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-bold text-foreground font-mono">
                                Flacon {v.taille_ml} ml
                              </span>
                              {hasReduction && (
                                <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wide rounded-md">
                                  Promo
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-foreground/45 mt-0.5">
                              {isOutOfStock ? (
                                <span className="text-red-400 font-semibold">Rupture de stock</span>
                              ) : v.stock_disponible <= 5 ? (
                                <span className="text-amber-400 font-medium">Plus que {v.stock_disponible} en stock</span>
                              ) : (
                                <span>{v.stock_disponible} flacons disponibles</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Price column */}
                        <div className="text-right shrink-0">
                          {hasReduction ? (
                            <div className="flex flex-col items-end">
                              <span className="text-xs line-through text-foreground/40 font-mono">
                                {formatPrice(originalPriceNum)}
                              </span>
                              <span className="text-base font-black text-gold font-mono">
                                {formatPrice(v.prix_actuel)}
                              </span>
                            </div>
                          ) : (
                            <span className={cn('text-base font-black font-mono', isSelected ? 'text-gold' : 'text-foreground')}>
                              {formatPrice(v.prix_actuel)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Stepper & Subtotal when selected */}
                      {isSelected && (
                        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground/60">
                            Quantité :
                          </span>

                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => updateVariantQuantity(v, -1)}
                              disabled={currentQty <= 1}
                              className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-xs hover:bg-white/20 disabled:opacity-30 transition-all font-bold"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-8 text-center font-mono font-bold text-sm text-foreground">
                              {currentQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateVariantQuantity(v, 1)}
                              disabled={currentQty >= v.stock_disponible}
                              className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-xs hover:bg-white/20 disabled:opacity-30 transition-all font-bold"
                            >
                              <Plus size={13} />
                            </button>

                            <span className="ml-2 text-xs font-black text-gold font-mono">
                              = {formatPrice(v.prix_actuel * currentQty)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Summary & Checkout Action Box */}
              {selectedItems.length > 0 && (
                <div className="mt-6 rounded-2xl border border-gold/30 bg-gold/10 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5">
                  <div className="space-y-1 w-full sm:w-auto text-left">
                    <p className="text-xs font-bold uppercase tracking-widest text-foreground/70">
                      Total de votre commande
                    </p>
                    <p className="text-xs text-foreground/50">
                      {selectedItems.map(it => `${it.quantity}× ${it.variant.taille_ml}ml`).join(' + ')}
                    </p>
                    <p className="text-2xl font-black text-gold font-mono pt-1">
                      {formatPrice(totalPrice)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gold text-black font-bold uppercase tracking-widest text-xs hover:bg-gold/90 transition-all shadow-xl shadow-gold/20 flex items-center justify-center gap-2.5 shrink-0"
                  >
                    <ShoppingBag size={16} />
                    Ajouter au panier ({totalQuantity} flacon{totalQuantity > 1 ? 's' : ''})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Trust Badges ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5 mb-16">
          <div className="flex items-center gap-3 text-xs sm:text-sm text-foreground/60">
            <Truck size={17} className="shrink-0 text-gold" />
            {isEn ? 'Express Shipping' : 'Livraison Express'}
          </div>
          <div className="flex items-center gap-3 text-xs sm:text-sm text-foreground/60">
            <ShieldCheck size={17} className="shrink-0 text-gold" />
            {isEn ? 'Guaranteed Authenticity' : 'Authenticité Garantie'}
          </div>
          <div className="flex items-center gap-3 text-xs sm:text-sm text-foreground/60">
            <RotateCcw size={17} className="shrink-0 text-gold" />
            {isEn ? '30-Day Returns' : 'Retours sous 30 jours'}
          </div>
          <div className="flex items-center gap-3 text-xs sm:text-sm text-foreground/60">
            <Check size={17} className="shrink-0 text-gold" />
            {isEn ? 'Secure Checkout' : 'Paiement Sécurisé'}
          </div>
        </div>

        {/* ─── Tabs ─────────────────────────────────────────────────────────── */}
        <div className="mb-20">
          <div className="mb-8 flex overflow-x-auto border-b border-foreground/10 scrollbar-hide">
            {(
              [
                { key: 'description', label: isEn ? 'Description' : 'Description' },
                { key: 'notes',       label: isEn ? 'Olfactory Notes' : 'Profil Olfactif' },
                { key: 'details',     label: isEn ? 'Specifications' : 'Caractéristiques' },
                { key: 'usage',       label: isEn ? 'How to Use' : 'Mode d\'emploi' },
              ] as const
            ).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'relative whitespace-nowrap px-6 py-4 text-xs sm:text-sm font-bold uppercase tracking-widest transition-all',
                  activeTab === tab.key ? 'text-gold' : 'text-foreground/40 hover:text-foreground'
                )}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <motion.div layoutId="huile-tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
                )}
              </button>
            ))}
          </div>

          <div className="min-h-[160px]">
            <AnimatePresence mode="wait">
              {activeTab === 'description' && (
                <motion.div
                  key="desc"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4 max-w-3xl"
                >
                  <p className="text-sm sm:text-base leading-relaxed text-foreground/75">
                    {product.description || (isEn ? 'No description available.' : 'Aucune description disponible pour cette huile.')}
                  </p>
                </motion.div>
              )}

              {activeTab === 'notes' && (
                <motion.div
                  key="notes"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="max-w-2xl"
                >
                  {product.notes && (product.notes.top?.length || product.notes.middle?.length || product.notes.base?.length) ? (
                    <div className="space-y-6">
                      {product.notes.top && product.notes.top.length > 0 && (
                        <div className="relative pl-7 border-l-2 border-gold/30">
                          <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-gold" />
                          <p className="text-xs font-bold uppercase tracking-widest text-gold mb-1">Notes de Tête</p>
                          <p className="text-sm leading-relaxed text-foreground/80">{product.notes.top.join(' · ')}</p>
                        </div>
                      )}
                      {product.notes.middle && product.notes.middle.length > 0 && (
                        <div className="relative pl-7 border-l-2 border-gold/30">
                          <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-gold" />
                          <p className="text-xs font-bold uppercase tracking-widest text-gold mb-1">Notes de Cœur</p>
                          <p className="text-sm leading-relaxed text-foreground/80">{product.notes.middle.join(' · ')}</p>
                        </div>
                      )}
                      {product.notes.base && product.notes.base.length > 0 && (
                        <div className="relative pl-7 border-l-2 border-gold/30">
                          <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-gold" />
                          <p className="text-xs font-bold uppercase tracking-widest text-gold mb-1">Notes de Fond</p>
                          <p className="text-sm leading-relaxed text-foreground/80">{product.notes.base.join(' · ')}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-foreground/50">
                      {isEn ? 'Olfactory notes are being updated by the laboratory.' : 'Les notes olfactives sont en cours de mise à jour par le laboratoire.'}
                    </p>
                  )}
                </motion.div>
              )}

              {activeTab === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <table className="max-w-2xl w-full border-collapse">
                    <tbody>
                      {product.code_reference && (
                        <tr className="border-b border-foreground/10">
                          <td className="w-1/3 py-3.5 text-xs uppercase tracking-widest text-foreground/40">
                            {isEn ? 'Reference' : 'Code Réf.'}
                          </td>
                          <td className="py-3.5 font-medium text-foreground font-mono">
                            {product.code_reference}
                          </td>
                        </tr>
                      )}
                      {product.intensite && (
                        <tr className="border-b border-foreground/10">
                          <td className="py-3.5 text-xs uppercase tracking-widest text-foreground/40">
                            {isEn ? 'Intensity' : 'Intensité'}
                          </td>
                          <td className="py-3.5 font-medium text-foreground capitalize">
                            {product.intensite}
                          </td>
                        </tr>
                      )}
                      {product.genre_cible && (
                        <tr className="border-b border-foreground/10">
                          <td className="py-3.5 text-xs uppercase tracking-widest text-foreground/40">
                            {isEn ? 'Target' : 'Cible'}
                          </td>
                          <td className="py-3.5 font-medium text-foreground capitalize">
                            {product.genre_cible}
                          </td>
                        </tr>
                      )}
                      {product.famille_olfactive && product.famille_olfactive.length > 0 && (
                        <tr className="border-b border-foreground/10">
                          <td className="py-3.5 text-xs uppercase tracking-widest text-foreground/40">
                            {isEn ? 'Olfactive Family' : 'Famille olfactive'}
                          </td>
                          <td className="py-3.5 font-medium text-foreground">
                            {product.famille_olfactive.join(', ')}
                          </td>
                        </tr>
                      )}
                      <tr className="border-b border-foreground/10">
                        <td className="py-3.5 text-xs uppercase tracking-widest text-foreground/40">
                          {isEn ? 'Type' : 'Type'}
                        </td>
                        <td className="py-3.5 font-medium text-foreground">
                          {isEn ? 'Pure Essential Oil' : 'Huile Essentielle Pure'}
                        </td>
                      </tr>
                      <tr className="border-b border-foreground/10">
                        <td className="py-3.5 text-xs uppercase tracking-widest text-foreground/40">
                          {isEn ? 'Brand' : 'Marque'}
                        </td>
                        <td className="py-3.5 font-medium text-foreground">
                          {product.brand || 'Exclusif Collection'}
                        </td>
                      </tr>
                      {product.origine_pays && (
                        <tr className="border-b border-foreground/10">
                          <td className="py-3.5 text-xs uppercase tracking-widest text-foreground/40">
                            {isEn ? 'Origin' : 'Pays d\'origine'}
                          </td>
                          <td className="py-3.5 font-medium text-foreground">
                            {product.origine_pays}
                          </td>
                        </tr>
                      )}
                      {variants.length > 0 && (
                        <tr className="border-b border-foreground/10">
                          <td className="py-3.5 text-xs uppercase tracking-widest text-foreground/40">
                            {isEn ? 'Available sizes' : 'Formats disponibles'}
                          </td>
                          <td className="py-3.5 font-medium text-foreground">
                            {variants.map(v => `${v.taille_ml}ml (${formatPrice(v.prix_actuel)})`).join(', ')}
                          </td>
                        </tr>
                      )}
                      {product.stock_total_ml != null && (
                        <tr className="border-b border-foreground/10">
                          <td className="py-3.5 text-xs uppercase tracking-widest text-foreground/40">
                            {isEn ? 'Lab stock' : 'Stock laboratoire'}
                          </td>
                          <td className="py-3.5 font-medium text-foreground font-mono">
                            {product.stock_total_ml.toLocaleString('fr-FR')} ml
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </motion.div>
              )}

              {activeTab === 'usage' && (
                <motion.div
                  key="usage"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="max-w-2xl"
                >
                  <div className="space-y-4">
                    {[
                      {
                        icon: <Droplets size={16} className="text-gold" />,
                        title: isEn ? 'Direct Application' : 'Application directe',
                        desc: isEn
                          ? 'Apply 1–2 drops to pulse points (wrist, neck, behind ears). The warmth of your skin will diffuse the fragrance throughout the day.'
                          : 'Appliquez 1 à 2 gouttes sur les points de pulsation (poignets, cou, derrière les oreilles). La chaleur corporelle diffusera le parfum tout au long de la journée.',
                      },
                      {
                        icon: <Leaf size={16} className="text-emerald-400" />,
                        title: isEn ? 'Blending' : 'Mélange personnalisé',
                        desc: isEn
                          ? 'Blend with other pure oils or carrier oils to create your own signature fragrance. Start with 2–3 drops and adjust to taste.'
                          : 'Mélangez avec d\'autres huiles pures ou huiles de support pour créer votre parfum signature. Commencez par 2 à 3 gouttes et ajustez selon votre goût.',
                      },
                      {
                        icon: <FlaskConical size={16} className="text-blue-400" />,
                        title: isEn ? 'Atelier' : 'Dans l\'atelier',
                        desc: isEn
                          ? 'Use this oil in our Atelier to create a fully custom fragrance. Our AI advisor will help you compose the perfect blend.'
                          : 'Utilisez cette huile dans notre Atelier pour créer un parfum entièrement personnalisé. Notre conseillère IA vous aidera à composer le mélange parfait.',
                      },
                      {
                        icon: <Info size={16} className="text-foreground/40" />,
                        title: isEn ? 'Storage' : 'Conservation',
                        desc: isEn
                          ? 'Store in a cool, dark place away from sunlight. Keep tightly closed. Avoid contact with eyes. Keep out of reach of children.'
                          : 'Conservez dans un endroit frais et sombre, à l\'abri du soleil. Gardez le flacon bien fermé. Évitez le contact avec les yeux. Tenir hors de portée des enfants.',
                      },
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-4 sm:p-5">
                        <div className="mt-0.5 shrink-0">{item.icon}</div>
                        <div>
                          <p className="mb-1 text-sm font-semibold text-foreground">{item.title}</p>
                          <p className="text-sm leading-relaxed text-foreground/60">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ─── Related Products ─────────────────────────────────────────────── */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl mb-2">
                  {isEn ? 'You May Also Like' : 'Autres Huiles & Essences'}
                </h2>
                <div className="h-1 w-20 bg-gold" />
              </div>
              <a
                href="/shop/perfumes?tab=huile"
                className="flex shrink-0 items-center gap-2 text-sm text-gold hover:underline"
              >
                {isEn ? 'See all oils' : 'Voir toutes les huiles'}
                <ChevronRight size={16} />
              </a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={() => {}}
                  onToggleFavorite={addFavorite}
                  isFavorite={isFavorite(p.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

