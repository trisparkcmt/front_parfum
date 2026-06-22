'use client';

import { Product } from '@/types';
import { ShoppingBag, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface ProductListProps {
  products: Product[];
  selectedId?: string;
  onSelect: (product: Product) => void;
  isLoading?: boolean;
  searchTerm?: string;
}

export function ProductList({ products, selectedId, onSelect, isLoading = false, searchTerm = '' }: ProductListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-white/5 rounded-lg border border-white/10 animate-pulse" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <AlertCircle className="w-12 h-12 text-foreground/20 mb-3" />
        <p className="text-sm text-foreground/60">
          {searchTerm ? 'Aucun produit trouvé' : 'Commencez à chercher un produit'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4 overflow-y-auto max-h-[calc(100vh-400px)]">
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => onSelect(product)}
          className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 ${
            selectedId === product.id
              ? 'border-gold/50 bg-gold/10'
              : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
          }`}
        >
          <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-white/10">
            {product.images && product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-foreground/20" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
            <p className="text-xs text-foreground/60 truncate">{product.brand}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-sm font-semibold text-gold">{product.price.toFixed(2)}€</p>
              <span className={`text-xs px-2 py-1 rounded ${product.inStock ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                {product.inStock ? 'En stock' : 'Rupture'}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
