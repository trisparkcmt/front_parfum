'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ProductCard } from '@/components/ui/ProductCard';
import { allProducts } from '@/lib/mock-data';
import { useCartStore } from '@/store/useCartStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useToastStore } from '@/store/useToastStore';
import { ACCESSORY_SUBCATEGORY_LABELS } from '@/lib/constants';

export default function AccessoriesShop() {
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Accessoires d'Exception</h1>
        <p className="text-foreground/60 max-w-2xl mx-auto">
          Découvrez notre sélection de montres de luxe, bijoux raffinés et pièces de maroquinerie exclusives.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
        {categories.map((cat) => (
          <button
            key={cat as string}
            onClick={() => setActiveFilter(cat as string)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === cat 
                ? 'bg-gold text-deep-black' 
                : 'bg-white/5 border border-white/10 hover:border-gold/50'
            }`}
          >
            {cat === 'all' ? 'Tout voir' : ACCESSORY_SUBCATEGORY_LABELS[cat as string]}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
