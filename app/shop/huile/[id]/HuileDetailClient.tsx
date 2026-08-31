'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2, Heart, ShoppingBag, Truck, ShieldCheck, RotateCcw,
  Check, ChevronRight, Minus, Plus, Droplets, Leaf, FlaskConical,
  Info, Star,
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
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProduitFiniEssence | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'description' | 'usage' | 'details'>('description');

  const { addProduct } = useCartStore();
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const { addToast } = useToastStore();

  // Auto-select first available variant
  useEffect(() => {
    if (product?.produits_finis?.length) {
      const first = product.produits_finis.find(v => v.stock_disponible > 0) ?? product.produits_finis[0];
      setSelectedVariant(first);
    } else {
      setSelectedVariant(null);
    }
  }, [product]);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const p = await productService.getProductById(id);
        if (!mounted) return;
        setProduct(p);
        setActiveImage(0);
        if (p) {
          try {
            const related = await productService.getFinishedEssenceProducts({});
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-gold uppercase tracking-[0.2em] text-xs font-bold">
          {isEn ? 'Loading…' : 'Chargement…'}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-foreground/40 text-lg uppercase tracking-[0.2em]">
          {isEn ? 'Product not found' : 'Produit introuvable'}
        </p>
        <BackButton />
      </div>
    );
  }

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    const cartProduct: Product = {
      id: String(selectedVariant.id),
      name: `${product.name} - ${selectedVariant.taille_ml}ml`,
      description: product.description || '',
      price: selectedVariant.prix_actuel,
      originalPrice: selectedVariant.prix_promotionnel
        ? parseFloat(selectedVariant.prix_promotionnel)
        : undefined,
      taux_reduction:
        selectedVariant.prix_promotionnel &&
        parseFloat(selectedVariant.prix_promotionnel) > selectedVariant.prix_actuel
          ? String(
              Math.round(
                (1 - selectedVariant.prix_actuel / parseFloat(selectedVariant.prix_promotionnel)) * 100
              )
            )
          : undefined,
      category: 'huile',
      images: product.images,
      brand: product.brand,
      inStock: true,
      volume: `${selectedVariant.taille_ml}ml`,
      taille_ml: selectedVariant.taille_ml,
      stock_total_ml: product.stock_total_ml,
      essence_id: Number(product.id),
      createdAt: new Date().toISOString(),
    };
    await addProduct(cartProduct, quantity);
    addToast(
      isEn ? `${cartProduct.name} added to bag` : `${cartProduct.name} ajouté au panier`,
      'success'
    );
    try {
      const { trackAddToCart } = await import('@/lib/gtag');
      trackAddToCart({ id: String(selectedVariant.id), name: cartProduct.name, price: selectedVariant.prix_actuel, category: 'Huile', quantity });
    } catch { /* ignore analytics */ }
  };

  const handleToggleFavorite = () => {
    if (isFavorite(product.id)) {
      removeFavorite(product.id);
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
        ? `Discover ${product.name} on Accessories Exclusif`
        : `Découvrez ${product.name} sur Accessories Exclusif`
    );
    if (result === 'shared') addToast(isEn ? 'Link shared' : 'Lien partagé', 'success');
    else if (result === 'copied') addToast(isEn ? 'Link copied' : 'Lien copié', 'success');
  };

  const currentPrice = selectedVariant
    ? selectedVariant.prix_actuel
    : product.price;

  const promoPrice = selectedVariant?.prix_promotionnel
    ? parseFloat(selectedVariant.prix_promotionnel)
    : undefined;

  const hasPromo = promoPrice && promoPrice > currentPrice;

  const variants = product.produits_finis ?? [];
  const totalStock = variants.reduce((s, v) => s + (v.stock_disponible ?? 0), 0);

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground pt-28 pb-24 px-4 md:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-full w-full max-w-4xl -translate-x-1/2 rounded-full bg-gold/5 opacity-40 blur-[140px] -z-10" />

      <div className="max-w-7xl mx-auto">
        <BackButton />

        {/* Breadcrumb */}
        <nav className="mt-6 mb-8 flex items-center gap-2 text-[11px] text-foreground/40 uppercase tracking-widest overflow-x-auto whitespace-nowrap scrollbar-hide">
          <a href="/" className="hover:text-gold transition-colors">{isEn ? 'Home' : 'Accueil'}</a>
          <ChevronRight size={11} className="shrink-0" />
          <a href="/shop/perfumes" className="hover:text-gold transition-colors">{isEn ? 'Shop' : 'Boutique'}</a>
          <ChevronRight size={11} className="shrink-0" />
          <a href="/shop/perfumes?tab=huile" className="hover:text-gold transition-colors">{isEn ? 'Pure Oils' : 'Huiles Pures'}</a>
          <ChevronRight size={11} className="shrink-0" />
          <span className="text-foreground/60 truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-24">

          {/* ─ Gallery ─ */}
          <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="relative aspect-square overflow-hidden rounded-3xl border border-foreground/10 bg-foreground/5 group"
            >
              {/* Badges */}
              <div className="absolute left-4 top-4 z-10 flex gap-2">
                {product.is_new && (
                  <span className="rounded-full bg-gold px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-black">
                    {isEn ? 'New' : 'Nouveau'}
                  </span>
                )}
                {product.is_bestseller && (
                  <span className="rounded-full bg-foreground px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-background">
                    {isEn ? 'Bestseller' : 'Best-seller'}
                  </span>
                )}
                {/* Natural / pure oil badge */}
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
                  <Leaf size={9} className="inline mr-1" />
                  {isEn ? 'Pure Oil' : 'Huile Pure'}
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={product.images[activeImage]}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                  />
                </motion.div>
              </AnimatePresence>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

              {product.images.length > 1 && (
                <div className="absolute bottom-4 right-4 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white tabular-nums backdrop-blur-sm">
                  {activeImage + 1} / {product.images.length}
                </div>
              )}
            </motion.div>

            {/* Thumbnail strip */}
            {product.images.filter(Boolean).length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {product.images.filter(Boolean).map((img, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setActiveImage(idx)}
                    className={cn(
                      'relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                      activeImage === idx
                        ? 'border-gold shadow-lg shadow-gold/20'
                        : 'border-foreground/10 hover:border-foreground/30'
                    )}
                  >
                    <Image src={img} alt={`${product.name} vue ${idx + 1}`} fill className="object-cover" />
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* ─ Product info ─ */}
          <div className="flex flex-col">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.5 }}>

              {/* Header row */}
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="mb-3 text-xs font-medium uppercase tracking-widest text-gold">
                    {product.brand || 'Exclusif Collection'}
                  </p>
                  <h1 className="font-display text-3xl font-bold leading-[1.08] text-foreground md:text-4xl lg:text-5xl">
                    {product.name}
                  </h1>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="rounded-full border border-foreground/10 bg-foreground/5 p-3 text-foreground transition-all hover:border-foreground/20 hover:bg-foreground/10"
                    aria-label="Partager"
                  >
                    <Share2 size={18} />
                  </button>
                  <button
                    onClick={handleToggleFavorite}
                    className={cn(
                      'rounded-full border p-3 transition-all',
                      isFavorite(product.id)
                        ? 'border-red-500 bg-red-500/10 text-red-500'
                        : 'border-foreground/10 bg-foreground/5 text-foreground hover:border-foreground/20 hover:bg-foreground/10'
                    )}
                    aria-label="Favoris"
                  >
                    <Heart size={18} fill={isFavorite(product.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="mb-7 font-mono text-2xl font-light text-foreground md:text-3xl">
                {hasPromo ? (
                  <div className="flex items-baseline gap-3">
                    <span className="font-bold text-gold">{formatPrice(currentPrice)}</span>
                    <span className="text-sm line-through text-foreground/45 md:text-base">{formatPrice(promoPrice!)}</span>
                  </div>
                ) : (
                  <span className="font-bold text-gold">{formatPrice(currentPrice)}</span>
                )}
              </div>

              {/* Short description */}
              {product.description && (
                <p className="mb-8 max-w-lg text-[15px] leading-relaxed text-foreground/70 md:text-base">
                  {product.description}
                </p>
              )}

              {/* Stock indicator */}
              <div className="mb-6 flex items-center gap-2 text-xs">
                <span className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset',
                  totalStock > 10
                    ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                    : totalStock > 0
                    ? 'bg-amber-500/10 text-amber-400 ring-amber-500/20'
                    : 'bg-red-500/10 text-red-400 ring-red-500/20'
                )}>
                  <span className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    totalStock > 10 ? 'bg-emerald-400' : totalStock > 0 ? 'bg-amber-400' : 'bg-red-400'
                  )} />
                  {totalStock > 10
                    ? (isEn ? 'In stock' : 'En stock')
                    : totalStock > 0
                    ? (isEn ? `${totalStock} left` : `${totalStock} restant(s)`)
                    : (isEn ? 'Out of stock' : 'Épuisé')}
                </span>
                {product.brand && (
                  <span className="text-foreground/35">·</span>
                )}
              </div>

              {/* Size variants */}
              {variants.length > 0 && (
                <div className="mb-8">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-foreground/60">
                    {isEn ? 'Choose Size' : 'Format'}
                  </h3>
                  <div className="flex flex-wrap gap-2.5">
                    {variants.map(v => {
                      const isSelected = selectedVariant?.id === v.id;
                      const outOfStock = v.stock_disponible <= 0;
                      return (
                        <button
                          key={v.id}
                          disabled={outOfStock}
                          onClick={() => { setSelectedVariant(v); setQuantity(1); }}
                          className={cn(
                            'relative flex min-w-[72px] flex-col items-center gap-0.5 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all',
                            isSelected
                              ? 'border-gold bg-gold/10 text-gold shadow-md'
                              : outOfStock
                              ? 'cursor-not-allowed border-white/5 bg-white/5 text-foreground/30 opacity-40'
                              : 'border-white/10 bg-white/5 text-foreground hover:border-white/20'
                          )}
                        >
                          <span className="text-sm font-bold">{v.taille_ml}ml</span>
                          <span className="text-[10px] font-normal text-foreground/50">
                            {formatPrice(v.prix_actuel)}
                          </span>
                          {outOfStock && (
                            <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/50 text-[9px] font-bold uppercase tracking-wider text-foreground/30">
                              {isEn ? 'Out' : 'Épuisé'}
                            </span>
                          )}
                          {isSelected && (
                            <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gold">
                              <Check size={8} className="stroke-[3] text-black" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity + CTA */}
              <div className="mb-10 flex flex-col gap-3 sm:flex-row">
                <div className="flex h-14 items-center justify-between rounded-xl border border-foreground/10 bg-foreground/5 px-2 sm:w-36 sm:justify-start">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-gold disabled:opacity-30"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="flex-1 text-center font-bold tabular-nums">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    disabled={!!selectedVariant && quantity >= selectedVariant.stock_disponible}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-gold disabled:opacity-30"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || selectedVariant.stock_disponible <= 0}
                  className="group flex h-14 flex-1 items-center justify-center gap-3 rounded-xl bg-foreground font-bold uppercase tracking-widest text-sm text-background transition-all duration-300 hover:bg-gold hover:text-black disabled:opacity-40"
                >
                  <ShoppingBag size={18} className="transition-transform group-hover:scale-110" />
                  {isEn ? 'Add to Shopping Bag' : 'Ajouter au panier'}
                </button>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-2xl border border-foreground/10 bg-foreground/[0.02] px-5 py-5">
                <div className="flex items-center gap-3 text-sm text-foreground/60">
                  <Truck size={17} className="shrink-0 text-gold" />
                  {isEn ? 'Express Shipping' : 'Livraison Express'}
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground/60">
                  <ShieldCheck size={17} className="shrink-0 text-gold" />
                  {isEn ? 'Guaranteed Authenticity' : 'Authenticité Garantie'}
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground/60">
                  <RotateCcw size={17} className="shrink-0 text-gold" />
                  {isEn ? '30-Day Returns' : 'Retours sous 30 jours'}
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground/60">
                  <Check size={17} className="shrink-0 text-gold" />
                  {isEn ? 'Secure Checkout' : 'Paiement Sécurisé'}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ─ Tabs ─────────────────────────────────────────────────────────────── */}
        <div className="mb-24">
          <div className="mb-10 flex overflow-x-auto border-b border-foreground/10 scrollbar-hide">
            {(
              [
                { key: 'description', label: isEn ? 'Description' : 'Description' },
                { key: 'usage',       label: isEn ? 'How to Use' : 'Mode d\'emploi' },
                { key: 'details',     label: isEn ? 'Specifications' : 'Caractéristiques' },
              ] as const
            ).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'relative whitespace-nowrap px-6 py-4 text-sm font-bold uppercase tracking-widest transition-all sm:px-8',
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

          <div className="min-h-[200px]">
            <AnimatePresence mode="wait">
              {activeTab === 'description' && (
                <motion.div
                  key="desc"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 gap-10 md:grid-cols-2"
                >
                  <div>
                    <p className="text-[15px] leading-relaxed text-foreground/70 md:text-base">
                      {product.description || (isEn ? 'No description available.' : 'Aucune description disponible.')}
                    </p>

                    {/* Key attributes highlights */}
                    <div className="mt-8 grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5 rounded-xl border border-white/8 bg-white/[0.03] p-4">
                        <Droplets size={18} className="text-gold" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                          {isEn ? 'Purity' : 'Pureté'}
                        </p>
                        <p className="text-sm font-medium text-foreground">100% Pure</p>
                      </div>
                      <div className="flex flex-col gap-1.5 rounded-xl border border-white/8 bg-white/[0.03] p-4">
                        <Leaf size={18} className="text-emerald-400" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                          {isEn ? 'Origin' : 'Origine'}
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {isEn ? 'Natural' : 'Naturelle'}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1.5 rounded-xl border border-white/8 bg-white/[0.03] p-4">
                        <FlaskConical size={18} className="text-blue-400" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                          {isEn ? 'Concentration' : 'Concentration'}
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {isEn ? 'Undiluted' : 'Non diluée'}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1.5 rounded-xl border border-white/8 bg-white/[0.03] p-4">
                        <Star size={18} className="text-gold" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                          {isEn ? 'Grade' : 'Qualité'}
                        </p>
                        <p className="text-sm font-medium text-foreground">Premium</p>
                      </div>
                    </div>
                  </div>

                  {/* Olfactory notes if present */}
                  {product.notes && Object.values(product.notes).some(n => n?.length > 0) && (
                    <div>
                      <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-foreground/60">
                        {isEn ? 'Olfactory Profile' : 'Profil Olfactif'}
                      </h3>
                      <div className="space-y-5">
                        {Object.entries(product.notes)
                          .filter(([, v]) => Array.isArray(v) && v.length > 0)
                          .map(([key, val], idx, arr) => (
                            <div key={key} className="relative pl-7">
                              {idx < arr.length - 1 && (
                                <span className="absolute left-[6px] top-4 bottom-[-20px] w-px bg-gradient-to-b from-gold/50 to-gold/0" />
                              )}
                              <span className="absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-gold bg-background" />
                              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-gold">{key}</p>
                              <p className="text-sm leading-relaxed text-foreground/70">
                                {(val as string[]).join(' · ')}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'usage' && (
                <motion.div
                  key="usage"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-2xl"
                >
                  <div className="space-y-5">
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
                      <div key={i} className="flex gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                        <div className="mt-0.5 shrink-0">{item.icon}</div>
                        <div>
                          <p className="mb-1.5 text-sm font-semibold text-foreground">{item.title}</p>
                          <p className="text-sm leading-relaxed text-foreground/60">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <table className="max-w-2xl w-full border-collapse">
                    <tbody>
                      <tr className="border-b border-foreground/10">
                        <td className="w-1/3 py-4 text-xs uppercase tracking-widest text-foreground/40">
                          {isEn ? 'Volume' : 'Volume'}
                        </td>
                        <td className="py-4 font-medium text-foreground">
                          {selectedVariant ? `${selectedVariant.taille_ml}ml` : product.volume || '—'}
                        </td>
                      </tr>
                      <tr className="border-b border-foreground/10">
                        <td className="py-4 text-xs uppercase tracking-widest text-foreground/40">
                          {isEn ? 'Type' : 'Type'}
                        </td>
                        <td className="py-4 font-medium text-foreground">
                          {isEn ? 'Pure Essential Oil' : 'Huile Essentielle Pure'}
                        </td>
                      </tr>
                      <tr className="border-b border-foreground/10">
                        <td className="py-4 text-xs uppercase tracking-widest text-foreground/40">
                          {isEn ? 'Brand' : 'Marque'}
                        </td>
                        <td className="py-4 font-medium text-foreground">
                          {product.brand || 'Exclusif Collection'}
                        </td>
                      </tr>
                      {variants.length > 0 && (
                        <tr className="border-b border-foreground/10">
                          <td className="py-4 text-xs uppercase tracking-widest text-foreground/40">
                            {isEn ? 'Available sizes' : 'Formats disponibles'}
                          </td>
                          <td className="py-4 font-medium text-foreground">
                            {variants.map(v => `${v.taille_ml}ml`).join(', ')}
                          </td>
                        </tr>
                      )}
                      <tr className="border-b border-foreground/10">
                        <td className="py-4 text-xs uppercase tracking-widest text-foreground/40">
                          {isEn ? 'Category' : 'Catégorie'}
                        </td>
                        <td className="py-4 font-medium text-foreground">
                          {isEn ? 'Pure Oil' : 'Huile Pure'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ─ Related products ─ */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="mb-10 flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl mb-2">
                  {isEn ? 'You May Also Like' : 'Autres Huiles'}
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
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
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
