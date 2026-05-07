'use client';

/**
 * @file app/page.tsx
 * @description Home / Landing Page Component.
 *
 * This file serves as the primary entry point for users visiting the platform.
 * It showcases the brand's core offerings through several high-impact sections:
 * - **Hero Section**: Implements a luxury visual introduction with smooth text animations.
 * - **Category Showcase**: Allows users to quickly navigate to Accessories, Perfumes, or the Atelier.
 * - **Featured Products**: Highlights top-rated or new luxury items using the `ProductCard` component.
 * - **Numba Introduction**: Promotes the custom perfume creation experience.
 *
 * It utilizes `framer-motion` for reveal animations and provides a seamless
 * transition to deeper parts of the e-commerce experience.
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Droplets, Watch } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Gallery6 } from './carousel';
import PromoSection from './promo';
import { allProducts } from '@/lib/mock-data';
import { ProductCard } from '@/components/ui/ProductCard';
import { useCartStore } from '@/store/useCartStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useToastStore } from '@/store/useToastStore';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
    const [activeFilter, setActiveFilter] = useState<string>('all');
  
    const { addProduct } = useCartStore();
    const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
    const { addToast } = useToastStore();
  
    const handleAddToCart = (product: any) => {
      addProduct(product, 1);
      addToast(`${product.name} ajouté au panier`);
    };
  
    const handleToggleFavorite = (product: any) => {
      if (isFavorite(product.id)) {
        removeFavorite(product.id);
      } else {
        addFavorite(product);
        addToast(`${product.name} ajouté aux favoris`, 'info');
      }
    };

  if (!mounted) {
    return <div className="min-h-screen bg-deep-black" />; // Prevent flash of unstyled content
  }
  const filterProduct =()=>{
    
  }

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative h-[70vh] md:h-[75vh] w-full flex items-end pb-5 justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-deep-black z-0">
          <div className="absolute inset-0 bg-black/65 z-10" />
          <div className="absolute inset-0 animate-pulse-gold opacity-30" />
          {/* Placeholder image that looks like luxury fashion/perfume */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-full  bg-cover bg-center " 
            style={{ backgroundImage: "url('/hero.png')" }}
          />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full  flex flex-col justify-between ">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="max-w-2xl "
          >
            <h1 className="font-display text-3xl md:text-6xl font-bold text-white leading-tight ">
              L'Élégance <br />
              <span className="text-gradient-gold">Sans Compromis</span>
            </h1>
            <p className="text-sm md:text-lg lg:text-xl text-cream/80  leading-relaxed font-light">
              Découvrez notre collection exclusive d'accessoires de luxe et plongez dans l'art de la haute parfumerie avec notre atelier de création sur mesure Numba.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/shop/accessories">
                <Button size="md" className="w-full sm:w-auto">
                  Découvrir la Boutique
                </Button>
              </Link>
              <Link href="/numba">
                <Button variant="secondary" size="md" className="w-full sm:w-auto" rightIcon={<Sparkles size={18} />}>
                  Atelier Olfactif
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Collections Carousel */}
      <Gallery6 
        heading="Nos best seller" 
        demoUrl="/shop/perfumes"
      />
      {/* Hots seller */}
      <section className="flex flex-col justify-center pb-4 items-center h-auto">
  <h1 className='text-2xl md:text-6xl font-medium mb-6'>Nos produits du moment</h1>
  <div className="flex flex-row justify-center flex-wrap gap-2 md:gap-6">
    {allProducts.map((product, index) => (
      /* Use a standard filter/ternary outside the JSX return or ensure the null case is handled */
      product.price >= 70000 ? (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.05 }}
        >
          <ProductCard
            product={product}
            onAddToCart={handleAddToCart}
            onToggleFavorite={handleToggleFavorite}
            isFavorite={isFavorite(product.id)}
          />
        </motion.div>
      ) : null
    ))}
  </div>
</section>

      {/* Promotional Section */}
      <PromoSection />
    </div>
  );
}
