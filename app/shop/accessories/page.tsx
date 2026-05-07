'use client';

/**
 * @file app/shop/accessories/page.tsx
 * @description Main Marketplace Catalog for Luxury Accessories.
 *
 * This component provides a high-end browsing experience for the brand's 
 * collection of watches, jewelry, bags, and other accessories.
 * 
 * **Key Functionalities**:
 * - **Category Filtering**: Implements a sidebar/filter-bar for selecting sub-categories (e.g., Montres, Bijoux).
 * - **Dynamic Search**: Features a real-time search bar that filters the displayed product grid.
 * - **Responsive Grid**: Uses a fluid layout to display `ProductCard` components across different screen sizes.
 * - **Data Integration**: Consumes the `mockProducts` dataset, filtering specifically for items with the 'accessory' category.
 * 
 * **Design**: Emphasizes premium imagery and smooth interactions to maintain a luxury feel.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductCard } from '@/components/ui/ProductCard';
import { allProducts } from '@/lib/mock-data';
import { useCartStore } from '@/store/useCartStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useToastStore } from '@/store/useToastStore';
import { ACCESSORY_SUBCATEGORY_LABELS } from '@/lib/constants';

export default function AccessoriesShop() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const accessories = allProducts.filter(p => p.category === 'accessory');
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

  const categories = ['all', ...Array.from(new Set(accessories.map(a => a.subCategory).filter(Boolean)))];

  const filteredAccessories = activeFilter === 'all'
    ? accessories
    : accessories.filter(a => a.subCategory === activeFilter);

  if (!mounted) return null;

  return (
    <div className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8 py-12 pt-24 lg:pt-32">


      {/* Filters - Minimalist Scrollable Line */}
      <div className="w-full border-b border-white/5 mb-12">
        <div className="flex items-center gap-8 overflow-x-auto pb-4 scrollbar-hide px-4 sm:px-0">
          {categories.map((cat) => (
            <button
              key={cat as string}
              onClick={() => setActiveFilter(cat as string)}
              className={`relative whitespace-nowrap text-xs font-bold uppercase tracking-[0.2em] transition-all pb-2 ${activeFilter === cat
                ? 'text-gold'
                : 'text-foreground/30 hover:text-foreground'
                }`}
            >
              {cat === 'all' ? 'Tout voir' : ACCESSORY_SUBCATEGORY_LABELS[cat as string]}
              {activeFilter === cat && (
                <motion.div
                  layoutId="activeFilter"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex flex-row  justify-center flex-wrap gap-2 md:gap-6">
        {filteredAccessories.map((product, index) => (
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
        ))}

      </div>
    </div>
  );
}
