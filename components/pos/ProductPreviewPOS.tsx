'use client';

import { useCallback, useState } from 'react';
import { Product } from '@/types';
import { ShoppingBag } from 'lucide-react';

interface ProductPreviewPOSProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
}

export function ProductPreviewPOS({ product, onAddToCart }: ProductPreviewPOSProps) {
  const [quantity, setQuantity] = useState(1);

  const handleIncrement = useCallback(() => {
    const maxStock = Math.max(1, 999);
    if (quantity < maxStock) {
      setQuantity(quantity + 1);
    }
  }, [quantity]);

  const handleDecrement = useCallback(() => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  }, [quantity]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 1;
    setQuantity(Math.max(1, Math.min(value, 999)));
  }, []);

  const handleAddToCart = useCallback(() => {
    onAddToCart(product, quantity);
    setQuantity(1);
  }, [product, quantity, onAddToCart]);

  const mainImage = product.image_principale || product.images?.[0];

  return (
    <div className="flex flex-col h-full overflow-y-auto space-y-4">
      {/* Product Image - Full display with object-contain */}
      <div className="flex-1 min-h-0 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 p-4">
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-foreground/40">
            <ShoppingBag size={48} />
            <span className="text-sm mt-2">Pas d'image</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-foreground line-clamp-2 text-lg">{product.name}</h3>
          <p className="text-sm text-foreground/60 mt-1">{product.brand}</p>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-3 py-3 border-t border-b border-white/10">
          <span className="text-3xl font-bold text-gold">{product.price.toFixed(2)}€</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-sm line-through text-foreground/40">
              {product.originalPrice.toFixed(2)}€
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="flex items-center gap-2 pt-1">
          {product.inStock ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/10 text-gold text-xs font-medium">
              <div className="w-2 h-2 rounded-full bg-gold" />
              En stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 text-xs font-medium">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              Rupture de stock
            </span>
          )}
        </div>
      </div>

      {/* Quantity Controls */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Quantité</label>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDecrement}
            disabled={quantity <= 1}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-white/10 hover:bg-white/5 hover:border-gold/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-foreground/70 hover:text-gold"
          >
            −
          </button>
          <input
            type="number"
            min="1"
            max="999"
            value={quantity}
            onChange={handleInputChange}
            className="flex-1 h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-center text-foreground focus:border-gold/50 focus:outline-none transition-colors"
          />
          <button
            onClick={handleIncrement}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-white/10 hover:bg-white/5 hover:border-gold/30 transition-all text-foreground/70 hover:text-gold"
          >
            +
          </button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={!product.inStock}
        className="w-full py-3 bg-gold hover:bg-gold-light disabled:bg-white/10 disabled:cursor-not-allowed text-slate-900 font-semibold rounded-lg transition-all disabled:text-foreground/40 font-serif"
      >
        {product.inStock ? 'Ajouter au panier' : 'Indisponible'}
      </button>
    </div>
  );
}

