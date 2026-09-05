'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2,
  Heart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  ChevronRight,
  Minus,
  Plus,
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
import { EssenceSizePickerModal } from '@/components/ui/EssenceSizePickerModal';

function getProductCollectionPath(category?: Product['category']) {
  switch (category) {
    case 'accessory':
      return '/shop/accessories';
    case 'huile':
    case 'produit-fini-essence':
      return '/shop/perfumes?categorie=huile';
    case 'perfume-brand':
    case 'perfume-dupe':
    case 'numba-creation':
    default:
      return '/shop/perfumes';
  }
}

export default function ProductDetailClient({ id }: { id: string }) {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'details'>('description');
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProduitFiniEssence | null>(null);
  const [selectedEssence, setSelectedEssence] = useState<Product | null>(null);

  // Auto-select first available variant for finished essences
  useEffect(() => {
    if (product && product.category === 'huile' && product.produits_finis && product.produits_finis.length > 0) {
      const firstAvailable = product.produits_finis.find((v) => v.stock_disponible > 0) || product.produits_finis[0];
      setSelectedVariant(firstAvailable);
    } else {
      setSelectedVariant(null);
    }
  }, [product]);

  const { addProduct, addDiffuseur } = useCartStore();
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    async function loadProduct() {
      setLoading(true);
      try {
        const p = await productService.getProductById(String(id));
        if (!isMounted) return;
        setProduct(p);
        setActiveImage(0);

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

        if (p) {
          try {
            if (p.category === 'accessory') {
              const list = await productService.getAccessories({ type_accessoire: p.subCategory });
              if (isMounted) setRelatedProducts(list.filter((item) => item.id !== p.id).slice(0, 4));
            } else {
              const list = await productService.getPerfumes();
              if (isMounted) {
                setRelatedProducts(
                  list.filter((item) => item.category === p.category && item.id !== p.id).slice(0, 4)
                );
              }
            }
          } catch (relatedError) {
            console.warn('Failed to load related products:', relatedError);
            if (isMounted) setRelatedProducts([]);
          }
        } else if (isMounted) {
          setRelatedProducts([]);
        }
      } catch (error) {
        console.error('Failed to load product details:', error);
        if (isMounted) setProduct(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="animate-pulse text-gold uppercase tracking-[0.2em] text-xs font-bold">
          {isEn ? 'Loading details...' : 'Chargement...'}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
        <div className="text-foreground/40 text-lg uppercase tracking-[0.2em]">
          {isEn ? 'Product not found' : 'Produit introuvable'}
        </div>
        <BackButton />
      </div>
    );
  }

  const handleAddToCart = async () => {
    const isDiffuseur = Boolean(
      product.type_technologie ||
      product.capacite_reservoir_ml !== undefined ||
      product.est_connecte !== undefined ||
      product.a_jeux_de_lumiere !== undefined ||
      product.is_new !== undefined ||
      product.is_bestseller !== undefined ||
      (product.name || '').toLowerCase().includes('diffuseur') ||
      (product.description || '').toLowerCase().includes('diffuseur')
    );

    const addedName = product.category === 'huile' && selectedVariant
      ? `${product.name} - ${selectedVariant.taille_ml}ml`
      : product.name;

    const addedPrice = product.category === 'huile' && selectedVariant
      ? selectedVariant.prix_actuel
      : product.price;

    if (isDiffuseur) {
      await addDiffuseur(Number(product.id), quantity);
    } else if (product.category === 'huile') {
      if (!selectedVariant) return;
      const cartProduct: Product = {
        id: String(selectedVariant.id),
        name: addedName,
        description: product.description || '',
        price: addedPrice,
        originalPrice: selectedVariant.prix_promotionnel ? parseFloat(selectedVariant.prix_promotionnel) : undefined,
        taux_reduction: selectedVariant.prix_promotionnel && parseFloat(selectedVariant.prix_promotionnel) > selectedVariant.prix_actuel
          ? String(Math.round((1 - selectedVariant.prix_actuel / parseFloat(selectedVariant.prix_promotionnel)) * 100))
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
    } else {
      await addProduct(product, quantity);
    }

    addToast(
      isEn ? `${addedName} added to bag` : `${addedName} ajouté au panier`,
      'success'
    );

    const { trackAddToCart } = await import('@/lib/gtag');
    trackAddToCart({
      id: product.category === 'huile' && selectedVariant ? String(selectedVariant.id) : product.id,
      name: addedName,
      price: addedPrice,
      category: isDiffuseur ? 'Diffuseur' : (product.category ?? 'Produit'),
      quantity,
    });
  };

  const handleToggleFavorite = () => {
    if (isFavorite(product.id)) {
      removeFavorite(product.id);
    } else {
      addFavorite(product);
      addToast(
        isEn ? `${product.name} added to wishlist` : `${product.name} ajouté aux favoris`,
        'info'
      );
    }
  };

  const handleShare = async () => {
    const result = await sharePage(
      `/shop/product/${product.slug || product.id}`,
      product.name,
      isEn
        ? `Explore ${product.name} on Accessories Exclusif`
        : `Découvrez ${product.name} sur Accessories Exclusif`
    );

    if (result === 'shared' || result === 'copied') {
      try {
        const { trackShare } = await import('@/lib/gtag');
        trackShare({
          id: product.id,
          name: product.name,
          category: product.category,
          method: result === 'shared' ? 'Web Share API' : 'Clipboard',
        });
      } catch (err) {
        console.warn('[ProductDetailClient] Failed to track share event:', err);
      }
    }

    if (result === 'shared') {
      addToast(isEn ? 'Link shared' : 'Lien partagé', 'success');
    } else if (result === 'copied') {
      addToast(
        isEn ? 'Link copied to clipboard' : 'Lien copié dans le presse-papiers',
        'success'
      );
    } else {
      addToast(
        isEn ? 'Sharing is unavailable on this browser' : "Le partage n'est pas disponible sur ce navigateur",
        'error'
      );
    }
  };

  const handleRelatedAddToCart = (p: Product) => {
    if (p.category === 'huile' || p.produits_finis !== undefined) {
      setSelectedEssence(p);
    } else {
      addProduct(p, 1);
      addToast(
        isEn ? `${p.name} added to bag` : `${p.name} ajouté au panier`,
        'success'
      );
    }
  };

  const handleConfirmRelatedEssenceSize = async (essence: Product, items: { variant: ProduitFiniEssence; quantity: number }[]) => {
    for (const item of items) {
      const { variant, quantity } = item;
      const cartProduct: Product = {
        id: String(variant.id),
        name: `${essence.name} - ${variant.taille_ml}ml`,
        description: essence.description || '',
        price: variant.prix_actuel,
        originalPrice: variant.prix_promotionnel ? parseFloat(variant.prix_promotionnel) : undefined,
        taux_reduction: variant.prix_promotionnel && parseFloat(variant.prix_promotionnel) > variant.prix_actuel
          ? String(Math.round((1 - variant.prix_actuel / parseFloat(variant.prix_promotionnel)) * 100))
          : undefined,
        category: 'huile',
        images: essence.images,
        brand: essence.brand,
        inStock: true,
        volume: `${variant.taille_ml}ml`,
        taille_ml: variant.taille_ml,
        stock_total_ml: essence.stock_total_ml,
        essence_id: Number(essence.id),
        createdAt: new Date().toISOString(),
      };

      await addProduct(cartProduct, quantity);
    }

    const totalCount = items.reduce((s, it) => s + it.quantity, 0);
    addToast(
      isEn
        ? `${essence.name} (${totalCount} bottle${totalCount > 1 ? 's' : ''}) added to bag`
        : `${essence.name} (${totalCount} flacon${totalCount > 1 ? 's' : ''}) ajouté au panier`,
      'success'
    );
  };

  const noteEntries = product.notes ? Object.entries(product.notes) : [];
  const collectionPath = getProductCollectionPath(product.category);

  return (
    <div className="min-h-screen bg-background text-foreground pt-28 pb-24 px-4 md:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl bg-gold/5 blur-[120px] rounded-full -z-10 opacity-50 pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <BackButton />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[11px] text-foreground/40 uppercase tracking-widest mt-6 mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <a href="/" className="hover:text-gold transition-colors">
            {isEn ? 'Home' : 'Accueil'}
          </a>
          <ChevronRight size={11} className="shrink-0" />
          <a href={collectionPath} className="hover:text-gold transition-colors capitalize">
            {product.category?.replace('-', ' ')}
          </a>
          <ChevronRight size={11} className="shrink-0" />
          <span className="text-foreground/60 truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-24">
          {/* Gallery */}
          <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="relative aspect-square rounded-3xl overflow-hidden bg-foreground/5 border border-foreground/10 group"
            >
              {(product.is_new || product.is_bestseller) && (
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                  {product.is_new && (
                    <span className="px-3 py-1.5 rounded-full bg-gold text-black text-[10px] font-bold uppercase tracking-widest">
                      {isEn ? 'New Arrival' : 'Nouveau'}
                    </span>
                  )}
                  {product.is_bestseller && (
                    <span className="px-3 py-1.5 rounded-full bg-foreground text-background text-[10px] font-bold uppercase tracking-widest">
                      {isEn ? 'Bestseller' : 'Best-seller'}
                    </span>
                  )}
                </div>
              )}

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
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

              {product.images && product.images.length > 1 && (
                <div className="absolute bottom-4 right-4 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-[11px] font-medium tabular-nums">
                  {activeImage + 1} / {product.images.length}
                </div>
              )}
            </motion.div>

            {product.images && product.images.filter((img) => img).length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {product.images
                  .filter((img) => img)
                  .map((img, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setActiveImage(idx)}
                      className={cn(
                        'relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0',
                        activeImage === idx
                          ? 'border-gold shadow-lg shadow-gold/20'
                          : 'border-foreground/10 hover:border-foreground/30'
                      )}
                    >
                      <Image src={img} alt={`${product.name} view ${idx + 1}`} fill className="object-cover" />
                    </motion.button>
                  ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              <div className="flex justify-between items-start gap-4 mb-5">
                <div className="min-w-0">
                  <p className="text-gold font-medium tracking-widest uppercase text-xs mb-3">
                    {product.brand || 'Exclusif Collection'}
                  </p>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground leading-[1.08]">
                    {product.name}
                  </h1>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleShare}
                    className="p-3 rounded-full border border-foreground/10 bg-foreground/5 text-foreground transition-all hover:bg-foreground/10 hover:border-foreground/20"
                    aria-label="Share product"
                  >
                    <Share2 size={18} />
                  </button>
                  <button
                    onClick={handleToggleFavorite}
                    className={cn(
                      'p-3 rounded-full border transition-all',
                      isFavorite(product.id)
                        ? 'bg-red-500/10 border-red-500 text-red-500'
                        : 'bg-foreground/5 border-foreground/10 text-foreground hover:bg-foreground/10 hover:border-foreground/20'
                    )}
                    aria-label="Save to wishlist"
                  >
                    <Heart size={18} fill={isFavorite(product.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>

              <div className="text-2xl md:text-3xl font-light text-foreground mb-7 font-mono">
                {product.category === 'huile' && selectedVariant ? (
                  selectedVariant.prix_promotionnel && parseFloat(selectedVariant.prix_promotionnel) > selectedVariant.prix_actuel ? (
                    <div className="flex items-baseline gap-3">
                      <span className="text-gold font-bold">{formatPrice(selectedVariant.prix_actuel)}</span>
                      <span className="line-through text-foreground/45 text-sm md:text-base">
                        {formatPrice(parseFloat(selectedVariant.prix_promotionnel))}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gold font-bold">{formatPrice(selectedVariant.prix_actuel)}</span>
                  )
                ) : (
                  formatPrice(product.price)
                )}
              </div>

              <p className="text-foreground/70 leading-relaxed mb-8 text-[15px] md:text-base max-w-lg">
                {product.description}
              </p>

              {product.availableColors && product.availableColors.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-4">
                    {isEn ? 'Available Finishes' : 'Couleurs Disponibles'}
                  </h3>
                  <div className="flex gap-3">
                    {product.availableColors.map((color, idx) => (
                      <button
                        key={idx}
                        className="w-10 h-10 rounded-full border-2 border-foreground/15 hover:border-gold transition-all"
                        style={{ backgroundColor: color }}
                        aria-label={`Color ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sizing Format Selector for Huiles */}
              {product.category === 'huile' && product.produits_finis && product.produits_finis.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-3">
                    {isEn ? 'Choose Size' : 'Format'}
                  </h3>
                  <div className="flex flex-wrap gap-2.5">
                    {product.produits_finis.map((v) => {
                      const isSelected = selectedVariant?.id === v.id;
                      const isOutOfStock = v.stock_disponible <= 0;
                      return (
                        <button
                          key={v.id}
                          disabled={isOutOfStock}
                          onClick={() => {
                            setSelectedVariant(v);
                            setQuantity(1);
                          }}
                          className={cn(
                            'px-4 py-2.5 rounded-xl border text-xs font-bold transition-all relative flex flex-col items-center gap-0.5 min-w-[70px]',
                            isSelected
                              ? 'border-gold bg-gold/10 text-gold shadow-md'
                              : isOutOfStock
                              ? 'opacity-40 cursor-not-allowed border-white/5 bg-white/5 text-foreground/35'
                              : 'border-white/10 bg-white/5 text-foreground hover:border-white/20'
                          )}
                        >
                          <span className="text-sm font-bold">{v.taille_ml}ml</span>
                          <span className="text-[10px] text-foreground/50 font-normal">{formatPrice(v.prix_actuel)}</span>
                          {isSelected && (
                            <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-gold rounded-full flex items-center justify-center">
                              <Check size={8} className="text-black stroke-[3]" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-row gap-3 mb-10">
                <div className="flex items-center justify-between border border-foreground/10 rounded-xl bg-foreground/5 px-2 h-14 w-28 sm:w-36 shrink-0">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 flex items-center justify-center rounded-lg text-foreground/60 hover:text-gold hover:bg-foreground/5 transition-colors disabled:opacity-30"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="flex-1 text-center font-bold tabular-nums">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={
                      product.category === 'huile' && selectedVariant
                        ? quantity >= selectedVariant.stock_disponible
                        : false
                    }
                    className="w-10 h-10 flex items-center justify-center rounded-lg text-foreground/60 hover:text-gold hover:bg-foreground/5 transition-colors disabled:opacity-30"
                  >
                    <Plus size={15} />
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={product.category === 'huile' && !selectedVariant}
                  className="flex-1 min-w-0 h-14 px-3 bg-foreground text-background font-bold uppercase tracking-widest text-xs sm:text-sm rounded-xl hover:bg-gold hover:text-black transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 group disabled:opacity-40 whitespace-nowrap"
                >
                  <ShoppingBag size={18} className="group-hover:scale-110 transition-transform" />
                  {isEn ? 'Add to Shopping Bag' : 'Ajouter au panier'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-4 border border-foreground/10 rounded-2xl bg-foreground/[0.02] px-5 py-5">
                <div className="flex items-center gap-3 text-sm text-foreground/60">
                  <Truck size={17} className="text-gold shrink-0" />
                  {isEn ? 'Express Worldwide Shipping' : 'Livraison Express'}
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground/60">
                  <ShieldCheck size={17} className="text-gold shrink-0" />
                  {isEn ? 'Guaranteed Authenticity' : 'Authenticité Garantie'}
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground/60">
                  <RotateCcw size={17} className="text-gold shrink-0" />
                  {isEn ? '30-Day Effortless Returns' : 'Retours sous 30 jours'}
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground/60">
                  <Check size={17} className="text-gold shrink-0" />
                  {isEn ? 'Encrypted Checkout' : 'Paiement Sécurisé'}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-24">
          <div className="flex border-b border-foreground/10 mb-10 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('description')}
              className={cn(
                'px-6 sm:px-8 py-4 text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap',
                activeTab === 'description' ? 'text-gold' : 'text-foreground/40 hover:text-foreground'
              )}
            >
              {isEn ? 'Overview' : 'Description'}
              {activeTab === 'description' && (
                <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={cn(
                'px-6 sm:px-8 py-4 text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap',
                activeTab === 'details' ? 'text-gold' : 'text-foreground/40 hover:text-foreground'
              )}
            >
              {isEn ? 'Specifications' : 'Informations Complémentaires'}
              {activeTab === 'details' && (
                <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
              )}
            </button>
          </div>

          <div className="min-h-[200px]">
            <AnimatePresence mode="wait">
              {activeTab === 'description' ? (
                <motion.div
                  key="desc"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-12"
                >
                  <p className="text-foreground/70 leading-relaxed text-[15px] md:text-base">
                    {product.description}
                  </p>

                  {noteEntries.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-6">
                        {isEn ? 'Olfactory Architecture' : 'Pyramide Olfactive'}
                      </h3>
                      <div className="space-y-6">
                        {noteEntries.map(([key, val], idx) => (
                          <div key={key} className="relative pl-7">
                            {idx < noteEntries.length - 1 && (
                              <span className="absolute left-[6px] top-4 bottom-[-24px] w-px bg-gradient-to-b from-gold/50 to-gold/0" />
                            )}
                            <span className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full border-2 border-gold bg-background" />
                            <p className="text-xs font-bold uppercase tracking-widest text-gold mb-1.5">
                              {key}
                            </p>
                            <p className="text-foreground/70 leading-relaxed text-sm">
                              {(val as string[]).join(' · ')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <table className="w-full border-collapse max-w-2xl">
                    <tbody>
                      <tr className="border-b border-foreground/10">
                        <td className="py-4 text-foreground/40 uppercase text-xs tracking-widest w-1/3">
                          {isEn ? 'Volume' : 'Volume'}
                        </td>
                        <td className="py-4 text-foreground font-medium">
                          {product.category === 'huile' && selectedVariant
                            ? `${selectedVariant.taille_ml}ml`
                            : product.volume || 'N/A'}
                        </td>
                      </tr>
                      {product.category?.includes('perfume') && (
                        <>
                          <tr className="border-b border-foreground/10">
                            <td className="py-4 text-foreground/40 uppercase text-xs tracking-widest">
                              {isEn ? 'Longevity' : 'Longévité'}
                            </td>
                            <td className="py-4 text-foreground font-medium">
                              {product.longevity || (isEn ? 'Long-lasting (8-10 hrs)' : 'Longue durée (8-10h)')}
                            </td>
                          </tr>
                          <tr className="border-b border-foreground/10">
                            <td className="py-4 text-foreground/40 uppercase text-xs tracking-widest">
                              {isEn ? 'Sillage' : 'Sillage'}
                            </td>
                            <td className="py-4 text-foreground font-medium">
                              {product.sillage || (isEn ? 'Moderate' : 'Modéré')}
                            </td>
                          </tr>
                          <tr className="border-b border-foreground/10">
                            <td className="py-4 text-foreground/40 uppercase text-xs tracking-widest">
                              {isEn ? 'Gender Profile' : 'Genre'}
                            </td>
                            <td className="py-4 text-foreground font-medium capitalize">
                              {product.gender || (isEn ? 'Unisex' : 'Unisexe')}
                            </td>
                          </tr>
                        </>
                      )}
                      <tr className="border-b border-foreground/10">
                        <td className="py-4 text-foreground/40 uppercase text-xs tracking-widest">
                          {isEn ? 'Category' : 'Catégorie'}
                        </td>
                        <td className="py-4 text-foreground font-medium capitalize">
                          {product.category?.replace('-', ' ')}
                        </td>
                      </tr>
                      {product.brand && (
                        <tr className="border-b border-foreground/10">
                          <td className="py-4 text-foreground/40 uppercase text-xs tracking-widest">
                            {isEn ? 'House / Brand' : 'Marque'}
                          </td>
                          <td className="py-4 text-foreground font-medium">{product.brand}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Related */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
                  {isEn ? 'You May Also Like' : 'Produits Similaires'}
                </h2>
                <div className="w-20 h-1 bg-gold" />
              </div>
              <a
                href={collectionPath}
                className="text-gold hover:underline flex items-center gap-2 text-sm shrink-0"
              >
                {isEn ? 'Explore Collection' : 'Voir tout'} <ChevronRight size={16} />
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={handleRelatedAddToCart}
                  onToggleFavorite={addFavorite}
                  isFavorite={isFavorite(p.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedEssence && (
        <EssenceSizePickerModal
          product={selectedEssence}
          onConfirm={handleConfirmRelatedEssenceSize}
          onClose={() => setSelectedEssence(null)}
        />
      )}
    </div>
  );
}