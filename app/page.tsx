// 'use client';

// /**
//  * @file app/page.tsx
//  * @description Home / Landing Page Component.
//  *
//  * This file serves as the primary entry point for users visiting the platform.
//  * It showcases the brand's core offerings through several high-impact sections:
//  * - **Hero Section**: Implements a luxury visual introduction with smooth text animations.
//  * - **Category Showcase**: Allows users to quickly navigate to Accessories, Perfumes, or the Atelier.
//  * - **Featured Products**: Highlights top-rated or new luxury items using the `ProductCard` component.
//  * - **Numba Introduction**: Promotes the custom perfume creation experience.
//  *
//  * It utilizes `framer-motion` for reveal animations and provides a seamless
//  * transition to deeper parts of the e-commerce experience.
//  */
// import { useState, useEffect } from 'react';
// import Link from 'next/link';
// import { motion, AnimatePresence } from 'framer-motion';
// import { ArrowRight, Sparkles, Droplets, Watch } from 'lucide-react';
// import { Button } from '@/components/ui/Button';
// import { Gallery6 } from './carousel';
// import PromoSection from './promo';
// import { ProductCard } from '@/components/ui/ProductCard';
// import { useCartStore } from '@/store/useCartStore';
// import { useFavoritesStore } from '@/store/useFavoritesStore';
// import { useToastStore } from '@/store/useToastStore';
// import { useTranslation } from 'react-i18next';
// import { useThemeStore } from '@/store/useThemeStore';
// import { productService } from '@/services/productService';
// import { Product } from '@/types';
// import { ProductGridSkeleton } from '@/components/ui/Skeletons';
// import HomeLoadingScreen from '@/components/ui/HomeLoadingScreen';

// export default function Home() {
//   const { t } = useTranslation();
//   const { theme } = useThemeStore();
//   const [mounted, setMounted] = useState(false);
//   const [bestsellers, setBestsellers] = useState<Product[]>([]);
//   const [hotsellers, setHotsellers] = useState<Product[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     setMounted(true);

//     const fetchData = async () => {
//       try {
//         const [best, hot] = await Promise.all([
//           productService.getBestsellerPerfumes().catch(err => {
//             console.error('Bestsellers fetch failed:', err);
//             return [];
//           }),
//           productService.getHotsellerPerfumes().catch(err => {
//             console.error('Hotsellers fetch failed:', err);
//             return [];
//           })
//         ]);
//         setBestsellers(best);
//         setHotsellers(hot.slice(0, 4));
//       } catch (error) {
//         console.error('Failed to fetch products for home page:', error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   const [activeFilter, setActiveFilter] = useState<string>('all');

//   const { addProduct } = useCartStore();
//   const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
//   const { addToast } = useToastStore();

//   const handleAddToCart = (product: Product) => {
//     addProduct(product, 1);
//     addToast(`${product.name} ${t('added_to_cart')}`);
//   };

//   const handleToggleFavorite = (product: Product) => {
//     if (isFavorite(product.id)) {
//       removeFavorite(product.id);
//     } else {
//       addFavorite(product);
//       addToast(`${product.name} ${t('added_to_favorites')}`, 'info');
//     }
//   };

//   if (!mounted || loading) {
//     return <HomeLoadingScreen />;
//   }

//   return (
//     <div className="flex flex-col w-full">
//       {/* Hero Section */}
//       <section className="relative  h-[70vh] md:h-[75vh] w-full flex items-end pb-5 justify-center overflow-hidden">
//         {/* Background */}
//         <div className="absolute inset-0 bg-background z-0">
//           {/* <div className="absolute inset-0 bg-background/65 z-10" /> */}
//           <div className="absolute inset-0 animate-pulse-gold opacity-30" />
//           {/* Placeholder image that looks like luxury fashion/perfume */}
//           <div
//             className="backdrop-blur-sm absolute right-0 top-0 bottom-0 w-full  bg-cover bg-center "
//             style={{ backgroundImage: `url('${theme === 'light' ? '/hero2.png' : '/hero.png'}')` }}
//           />
//         </div>

//         <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full  flex flex-col justify-between ">
//           <motion.div
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 1, ease: 'easeOut' }}
//             className="max-w-2xl "
//           >
//             <h1 className="font-display text-3xl md:text-6xl font-bold text-foreground leading-tight ">
//               {t('hero_title').split(' ').map((word, i) => (
//                 word === 'Compromis' || word === 'Compromise' ? <span key={i} className="text-gradient-gold block">{word}</span> : <span key={i}>{word} </span>
//               ))}
//             </h1>
//             <p className="text-sm md:text-lg lg:text-xl text-foreground/80  leading-relaxed font-light">
//               {t('hero_subtitle')}
//             </p>
//             <div className="flex flex-wrap gap-4">
//               <Link href="/shop/accessories">
//                 <Button size="md" className="w-full sm:w-auto">
//                   {t('shop_now')}
//                 </Button>
//               </Link>
//               <Link href="/numba">
//                 <Button variant="secondary" size="md" className="w-full sm:w-auto" rightIcon={<Sparkles size={18} />}>
//                   {t('olfactory_atelier')}
//                 </Button>
//               </Link>
//             </div>
//           </motion.div>
//         </div>
//       </section>

//       {/* Collections Carousel */}
//       <Gallery6
//         heading={t('best_sellers')}
//         demoUrl="/shop/perfumes"
//         items={bestsellers}
//       />
//       {/* Hots seller */}
//       {(loading || hotsellers.length > 0) && (
//         <section className="flex flex-col justify-center pb-4 items-center h-auto">
//           <h1 className='text-2xl md:text-6xl mx-10 font-medium mb-6'>{t('current_products')}</h1>
//           <div className="flex flex-row justify-center flex-wrap gap-3 md:gap-6">
//             {loading ? (
//               <ProductGridSkeleton count={4} />
//             ) : (
//               hotsellers.map((product, index) => (
//                 <motion.div
//                   key={product.id}
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ duration: 0.4, delay: index * 0.05 }}
//                 >
//                   <ProductCard
//                     product={product}
//                     onAddToCart={handleAddToCart}
//                     onToggleFavorite={handleToggleFavorite}
//                     isFavorite={isFavorite(product.id)}
//                   />
//                 </motion.div>
//               ))
//             )}
//           </div>
//         </section>
//       )}

//       {/* Promotional Section */}
//       <PromoSection />
//     </div>
//   );
// }




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
import { ProductCard } from '@/components/ui/ProductCard';
import { useCartStore } from '@/store/useCartStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useToastStore } from '@/store/useToastStore';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/store/useThemeStore';
import { productService } from '@/services/productService';
import { Product } from '@/types';
import { ProductGridSkeleton } from '@/components/ui/Skeletons';
import HomeLoadingScreen from '@/components/ui/HomeLoadingScreen';

export default function Home() {
  const { t } = useTranslation();
  const { theme } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [hotsellers, setHotsellers] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string; type: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | number>('all');

  useEffect(() => {
    setMounted(true);
    
    const fetchData = async () => {
      try {
        const [fetchedBestsellers, fetchedHotsellers, fetchedCategories] = await Promise.all([
          productService.getBestsellerPerfumes().catch(err => { console.error('Bestsellers fetch failed:', err); return []; }),
          productService.getHotsellerPerfumes().catch(err => { console.error('Hotsellers fetch failed:', err); return []; }),
          productService.getPerfumeCategories().catch(() => [])
        ]);
        setBestsellers(fetchedBestsellers);
        setHotsellers(fetchedHotsellers.slice(0, 4)); // Display first 4 hotsellers
        setCategories(
          (fetchedCategories ?? []).map((c: any, idx: number) => ({
            id: typeof c?.id === 'number' ? c.id : idx + 1,
            name: String(c?.name ?? c?.type ?? ''),
            type: String(c?.type ?? c?.name ?? ''),
          }))
        );
      } catch (error) {
        console.error('Failed to fetch products for home page:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  const { addProduct } = useCartStore();
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const { addToast } = useToastStore();
  
  const handleAddToCart = (product: Product) => {
    addProduct(product, 1);
    addToast(`${product.name} ${t('added_to_cart')}`);
  };

  const handleToggleFavorite = (product: Product) => {
    if (isFavorite(product.id)) {
      removeFavorite(product.id);
    } else {
      addFavorite(product);
      addToast(`${product.name} ${t('added_to_favorites')}`, 'info');
    }
  };

  if (!mounted || loading) {
    return <HomeLoadingScreen />;
  }

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative  h-[70vh] md:h-[75vh] w-full flex items-end pb-5 justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-background z-0">
          {/* <div className="absolute inset-0 bg-background/65 z-10" /> */}
          <div className="absolute inset-0 animate-pulse-gold opacity-30" />
          {/* Placeholder image that looks like luxury fashion/perfume */}
          <div 
            className="backdrop-blur-sm absolute right-0 top-0 bottom-0 w-full  bg-cover bg-center " 
            style={{ backgroundImage: `url('${theme === 'light' ? '/hero2.png' : '/hero.png'}')` }}
          />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full  flex flex-col justify-between ">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="max-w-2xl "
          >
            <h1 className="font-display text-3xl md:text-6xl font-bold text-foreground leading-tight ">
              {t('hero_title').split(' ').map((word, i) => (
                word === 'Compromis' || word === 'Compromise' ? <span key={i} className="text-gradient-gold block">{word}</span> : <span key={i}>{word} </span>
              ))}
            </h1>
            <p className="text-sm md:text-lg lg:text-xl text-foreground/80  leading-relaxed font-light">
              {t('hero_subtitle')}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/shop/accessories">
                <Button size="md" className="w-full sm:w-auto">
                  {t('shop_now')}
                </Button>
              </Link>
              <Link href="/numba">
                <Button variant="secondary" size="md" className="w-full sm:w-auto" rightIcon={<Sparkles size={18} />}>
                  {t('olfactory_atelier')}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Collections Carousel */}
      <Gallery6 
        heading={t('best_sellers')} 
        demoUrl="/shop/perfumes"
        items={bestsellers} // Pass bestsellers to the carousel
      />

      

      {/* Hots seller */}
      {(loading || hotsellers.length > 0) && (
        <section className="flex flex-col justify-center pb-4 items-center h-auto">
  <h1 className='text-2xl md:text-6xl mx-10 font-medium mb-6'>{t('current_products')}</h1>
  <div className="flex flex-row justify-center flex-wrap gap-3 md:gap-6">
    {loading ? (
      <ProductGridSkeleton count={4} /> // Adjust skeleton count for hotsellers
    ) : (
      hotsellers
        
        .slice(0, 4)
        .map((product, index) => (
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
      ))
    )}
  </div>
</section>
      )}
      {/* Promotional Section */}
      <PromoSection />
    </div>
  );
}