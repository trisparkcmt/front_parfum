'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductCard } from '@/components/ui/ProductCard';
import { allProducts } from '@/lib/mock-data';
import { useCartStore } from '@/store/useCartStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useToastStore } from '@/store/useToastStore';

export default function PerfumesShop() {
  const perfumes = allProducts.filter(p => p.category.startsWith('perfume-') || p.category === 'numba-creation');
  const [activeTab, setActiveTab] = useState<'perfume-brand' | 'perfume-dupe' | 'numba-creation'>('perfume-brand');
  
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

  const tabs = [
    { id: 'perfume-brand', label: 'Grandes Marques', desc: 'Les parfums iconiques des maisons de luxe.' },
    { id: 'perfume-dupe', label: 'Nos Inspirations (Dupes)', desc: 'L\'excellence olfactive à prix accessible.' },
    { id: 'numba-creation', label: 'Créations Numba', desc: 'Nos signatures exclusives et uniques.' },
  ];

  const filteredPerfumes = perfumes.filter(p => p.category === activeTab);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Haute Parfumerie</h1>
        <p className="text-foreground/60 max-w-2xl mx-auto">
          Explorez notre collection de fragrances d'exception, de nos inspirations audacieuses aux créations signatures Numba.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-col items-center mb-12">
        <div className="inline-flex flex-wrap justify-center p-1 bg-white/5 border border-white/10 rounded-2xl mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-gold text-deep-black shadow-lg' 
                  : 'text-foreground/70 hover:text-foreground hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-gold/80 italic text-center px-4">
          {tabs.find(t => t.id === activeTab)?.desc}
        </p>
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {filteredPerfumes.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <ProductCard 
                product={product} 
                onAddToCart={handleAddToCart}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={isFavorite(product.id)}
              />
            </motion.div>
          ))}
          {filteredPerfumes.length === 0 && (
            <div className="col-span-full py-12 text-center text-foreground/50">
              Aucun parfum disponible dans cette catégorie pour le moment.
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
