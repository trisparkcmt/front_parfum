'use client';

/**
 * @file app/shop/accessories/[id]/page.tsx
 * @description Dynamic Detail Page for a Specific Accessory.
 *
 * This component provides an immersive look at an individual luxury accessory, 
 * allowing users to view detailed specifications and make a purchase.
 * 
 * **Key Features**:
 * - **Dynamic Data Fetching**: Uses the Next.js `use()` hook to resolve the `id` from the URL parameters and find the corresponding product in the `mockProducts` dataset.
 * - **Visual Showcase**: Implements a high-end image gallery or featured image display with elegant layout.
 * - **Product Information**: Renders product descriptions, technical details, pricing, and availability status.
 * - **E-commerce Action**: Provides a prominent "Add to Cart" button that interacts with the `useCartStore` and provides visual feedback via `useToastStore`.
 * - **Navigation**: Includes breadcrumb-style navigation or a "Return to Shop" link for easy browsing.
 * 
 * **UX Design**: Focuses on high-quality visuals and effortless conversion.
 */
import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, Heart, Star, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { allProducts } from '@/lib/mock-data';
import { formatPrice } from '@/lib/utils';
import { PRODUCT_CATEGORY_LABELS } from '@/lib/constants';
import { useCartStore } from '@/store/useCartStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useToastStore } from '@/store/useToastStore';

export default function AccessoryDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const product = allProducts.find(p => p.id === resolvedParams.id);

  const { addProduct } = useCartStore();
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const { addToast } = useToastStore();

  if (!product) {
    return <div className="p-24 text-center">Produit non trouvé</div>;
  }

  const isFav = isFavorite(product.id);

  const handleAddToCart = () => {
    addProduct(product, 1);
    addToast(`${product.name} ajouté au panier`);
  };

  const handleToggleFavorite = () => {
    if (isFav) {
      removeFavorite(product.id);
    } else {
      addFavorite(product);
      addToast(`${product.name} ajouté aux favoris`, 'info');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24 lg:pt-32">
      <Link href="/shop/accessories" className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-gold mb-8 transition-colors">
        <ArrowLeft size={16} /> Retour aux accessoires
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative aspect-square rounded-3xl overflow-hidden bg-cream-dark dark:bg-deep-black/50 border border-white/5"
        >
          {product.images[0] && (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          )}
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col justify-center"
        >
          <div className="mb-4">
            <Badge variant="gold" className="mb-4">{PRODUCT_CATEGORY_LABELS[product.category]}</Badge>
            {product.brand && (
              <p className="text-gold font-medium uppercase tracking-wider text-sm mb-2">{product.brand}</p>
            )}
            <h1 className="font-display text-4xl font-bold mb-4">{product.name}</h1>

            <div className="flex items-center gap-4 mb-6">
              <p className="font-display text-3xl font-bold text-gold">{formatPrice(product.price)}</p>
              {product.rating && (
                <div className="flex items-center gap-1 text-sm bg-white/5 px-3 py-1.5 rounded-full">
                  <Star size={16} className="fill-gold text-gold" />
                  <span className="font-medium">{product.rating}</span>
                  <span className="text-foreground/40">({product.reviews} avis)</span>
                </div>
              )}
            </div>
          </div>

          <div className="prose prose-sm dark:prose-invert text-foreground/70 mb-8">
            <p className="leading-relaxed text-lg">{product.description}</p>
          </div>

          <div className="flex items-center gap-4 border-t border-white/10 pt-8 mt-auto">
            <Button size="lg" className="flex-1" onClick={handleAddToCart} rightIcon={<ShoppingBag size={20} />}>
              Ajouter au panier
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="px-6"
              onClick={handleToggleFavorite}
            >
              <Heart size={20} className={isFav ? 'fill-red-500 text-red-500' : ''} />
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 text-sm text-foreground/60">
            <div className="flex flex-col gap-1 p-4  bg-white/5">
              <span className="font-medium text-foreground">Disponibilité</span>
              <span>{product.inStock ? 'En stock' : 'Rupture'}</span>
            </div>
            <div className="flex flex-col gap-1 p-4  bg-white/5">
              <span className="font-medium text-foreground">Livraison</span>
              <span>Express (24h-48h)</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
