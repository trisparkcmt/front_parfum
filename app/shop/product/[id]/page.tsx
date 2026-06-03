'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  ShoppingBag, 
  ChevronRight, 
  Star, 
  Check, 
  ArrowLeft,
  ChevronLeft,
  ShieldCheck,
  Truck,
  RotateCcw
} from 'lucide-react';
import { allProducts } from '@/lib/mock-data';
import { productService } from '@/services/productService';
import { cn, formatPrice } from '@/lib/utils';
import { ProductCard } from '@/components/ui/ProductCard';
import { useCartStore } from '@/store/useCartStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useToastStore } from '@/store/useToastStore';
import { Product } from '@/types';

import { BackButton } from '@/components/ui/BackButton';

export default function ProductDetailPage() {
  const { id } = useParams();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'details' | 'reviews'>('description');
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  
  const { addProduct } = useCartStore();
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    if (id) {
      async function loadProduct() {
        setLoading(true);
        const p = await productService.getProductById(String(id));
        setProduct(p);
        setActiveImage(0);

        if (p) {
          // Load related products dynamically
          if (p.category === 'accessory') {
            const list = await productService.getAccessories({ type_accessoire: p.subCategory });
            setRelatedProducts(list.filter(item => item.id !== p.id).slice(0, 4));
          } else {
            const list = await productService.getPerfumes();
            setRelatedProducts(list.filter(item => item.category === p.category && item.id !== p.id).slice(0, 4));
          }
        }
        setLoading(false);
      }
      loadProduct();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="animate-pulse text-gold uppercase tracking-[0.2em] text-xs font-bold">Chargement...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
        <div className="text-foreground/40 text-lg uppercase tracking-[0.2em]">Produit introuvable</div>
        <BackButton />
      </div>
    );
  }

  const handleAddToCart = () => {
    addProduct(product, quantity);
    addToast(`${product.name} ajouté au panier`);
  };

  const handleToggleFavorite = () => {
    if (isFavorite(product.id)) {
      removeFavorite(product.id);
    } else {
      addFavorite(product);
      addToast(`${product.name} ajouté aux favoris`, 'info');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-28 pb-12 px-4 md:px-8 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl bg-gold/5 blur-[120px] rounded-full -z-10 opacity-50 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto">
        <BackButton />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-20">
          {/* Left: Image Gallery */}
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-square rounded-3xl overflow-hidden bg-foreground/5 border border-[var(--t-border)] group"
            >
              <Image 
                src={product.images[activeImage]} 
                alt={product.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </motion.div>
            
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={cn(
                    "relative w-24 h-24 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0",
                    activeImage === idx ? "border-gold" : "border-[var(--t-border)] hover:border-foreground/30"
                  )}
                >
                  <Image src={img} alt={`${product.name} view ${idx}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="flex flex-col">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gold font-medium tracking-widest uppercase text-xs mb-2">
                    {product.brand || 'Exclusif Collection'}
                  </p>
                  <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
                    {product.name}
                  </h1>
                </div>
                <button 
                  onClick={handleToggleFavorite}
                  className={cn(
                    "p-3 rounded-full border transition-all",
                    isFavorite(product.id) 
                      ? "bg-red-500/10 border-red-500 text-red-500" 
                      : "bg-foreground/5 border border-[var(--t-border)] text-foreground hover:bg-foreground/10"
                  )}
                >
                  <Heart size={24} fill={isFavorite(product.id) ? "currentColor" : "none"} />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex text-gold">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} fill={i < Math.floor(product.rating || 4.5) ? "currentColor" : "none"} />
                  ))}
                </div>
                <span className="text-foreground/40 text-sm">({product.reviews || 0} avis clients)</span>
              </div>

              <div className="text-3xl font-light text-foreground mb-8">
                {formatPrice(product.price)}
              </div>

              <p className="text-foreground/70 leading-relaxed mb-8 text-lg">
                {product.description}
              </p>

              {/* Perfume specifics or Accessory specifics */}
              {product.availableColors && product.availableColors.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/60 mb-4">Couleurs Disponibles</h3>
                  <div className="flex gap-3">
                    {product.availableColors.map((color, idx) => (
                      <button
                        key={idx}
                        className="w-10 h-10 rounded-full border-2 border-[var(--t-border)] hover:border-gold transition-all"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <div className="flex items-center border border-[var(--t-border)] rounded-xl bg-foreground/5 px-4 h-14">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center hover:text-gold transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-bold">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center hover:text-gold transition-colors"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="flex-1 h-14 bg-white text-black font-bold uppercase tracking-widest rounded-xl hover:bg-gold hover:text-white transition-all duration-300 flex items-center justify-center gap-3 group"
                >
                  <ShoppingBag size={20} className="group-hover:scale-110 transition-transform" />
                  Ajouter au panier
                </button>
              </div>

              {/* Trust markers */}
              <div className="grid grid-cols-2 gap-4 border-t border-[var(--t-border)] pt-8">
                <div className="flex items-center gap-3 text-sm text-foreground/60">
                  <Truck size={18} className="text-gold" />
                  Livraison Express
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground/60">
                  <ShieldCheck size={18} className="text-gold" />
                  Authenticité Garantie
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground/60">
                  <RotateCcw size={18} className="text-gold" />
                  Retours sous 30 jours
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground/60">
                  <Check size={18} className="text-gold" />
                  Paiement Sécurisé
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mb-20">
          <div className="flex border-b border-[var(--t-border)] mb-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('description')}
              className={cn(
                "px-8 py-4 text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap",
                activeTab === 'description' ? "text-gold" : "text-foreground/40 hover:text-foreground"
              )}
            >
              Description
              {activeTab === 'description' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />}
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={cn(
                "px-8 py-4 text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap",
                activeTab === 'details' ? "text-gold" : "text-foreground/40 hover:text-foreground"
              )}
            >
              Informations Complémentaires
              {activeTab === 'details' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />}
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
                  className="prose prose-invert max-w-none"
                >
                  <p className="text-foreground/70 leading-relaxed text-lg">
                    {product.description} Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </p>
                  <ul className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.notes && Object.entries(product.notes).map(([key, val]) => (
                      <li key={key} className="flex gap-4">
                        <span className="text-gold font-bold capitalize w-20">{key}:</span>
                        <span className="text-foreground/70">{val.join(', ')}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ) : (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr className="border-b border-[var(--t-border)]">
                        <td className="py-4 text-foreground/40 uppercase text-xs tracking-widest w-1/3">Volume</td>
                        <td className="py-4 text-foreground">{product.volume || 'N/A'}</td>
                      </tr>
                      {product.category.includes('perfume') && (
                        <>
                          <tr className="border-b border-white/5">
                            <td className="py-4 text-white/40 uppercase text-xs tracking-widest">Longévité</td>
                            <td className="py-4 text-white">{product.longevity || 'Longue durée (8-10h)'}</td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-4 text-white/40 uppercase text-xs tracking-widest">Sillage</td>
                            <td className="py-4 text-white">{product.sillage || 'Modéré'}</td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-4 text-white/40 uppercase text-xs tracking-widest">Genre</td>
                            <td className="py-4 text-white capitalize">{product.gender || 'Unisexe'}</td>
                          </tr>
                        </>
                      )}
                      <tr className="border-b border-white/5">
                        <td className="py-4 text-white/40 uppercase text-xs tracking-widest">Catégorie</td>
                        <td className="py-4 text-white capitalize">{product.category.replace('-', ' ')}</td>
                      </tr>
                      {product.brand && (
                        <tr className="border-b border-white/5">
                          <td className="py-4 text-white/40 uppercase text-xs tracking-widest">Marque</td>
                          <td className="py-4 text-white">{product.brand}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Related Products */}
        <div>
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-display font-bold text-foreground mb-2">Produits Similaires</h2>
              <div className="w-20 h-1 bg-gold" />
            </div>
            <a href="/shop/perfumes" className="text-gold hover:underline flex items-center gap-2">
              Voir tout <ChevronRight size={16} />
            </a>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard 
                key={p.id} 
                product={p} 
                onAddToCart={addProduct} 
                onToggleFavorite={addFavorite}
                isFavorite={isFavorite(p.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
