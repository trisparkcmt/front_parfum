'use client';

import { Product } from '@/types';
import { ShoppingBag, Minus, Plus, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface ProductPreviewProps {
  product: Product | null;
  onAddToCart: (product: Product, quantity: number) => void;
  isLoading?: boolean;
}

export function ProductPreview({ product, onAddToCart, isLoading = false }: ProductPreviewProps) {
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <ShoppingBag className="w-16 h-16 text-foreground/20 mb-4" />
        <p className="text-sm text-foreground/60">Sélectionnez un produit pour voir les détails</p>
      </div>
    );
  }

  const maxQuantity = product.inStock ? 99 : 0;
  const isOutOfStock = !product.inStock;

  return (
    <div className="flex flex-col h-full p-6 bg-gradient-to-b from-white/5 to-transparent rounded-xl border border-white/10">
      {/* Product Image */}
      <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
        {product.images && product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-20 h-20 text-foreground/20" />
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
              <p className="text-white font-semibold">Rupture de stock</p>
            </div>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">{product.name}</h2>
            <p className="text-sm text-foreground/60 mt-1">{product.brand}</p>
          </div>

          <div className="space-y-2">
            <p className="text-2xl font-bold text-gold">{product.price.toFixed(2)}€</p>
            {product.originalPrice && product.originalPrice > product.price && (
              <p className="text-sm text-foreground/40 line-through">
                {product.originalPrice.toFixed(2)}€
              </p>
            )}
            {product.taux_reduction && (
              <p className="text-sm text-emerald-400">
                -{product.taux_reduction}% réduction
              </p>
            )}
          </div>

          {product.description && (
            <div>
              <p className="text-xs text-foreground/60 leading-relaxed">{product.description}</p>
            </div>
          )}

          {product.volume && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-foreground/60">Volume:</span>
              <span className="text-foreground font-medium">{product.volume}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quantity Selection */}
      <div className="mt-6 space-y-4 border-t border-white/10 pt-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Quantité</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={isOutOfStock}
              className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setQuantity(Math.max(1, Math.min(val, maxQuantity)));
              }}
              disabled={isOutOfStock}
              className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-center text-foreground disabled:opacity-50 focus:outline-none focus:border-gold/50"
            />
            <button
              onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
              disabled={isOutOfStock}
              className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={() => {
            onAddToCart(product, quantity);
            setQuantity(1);
          }}
          disabled={isOutOfStock || isLoading}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-gold to-gold/80 text-black font-semibold hover:shadow-lg hover:shadow-gold/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-5 h-5" />
          Ajouter au panier
        </button>
      </div>
    </div>
  );
}
