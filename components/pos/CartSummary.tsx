'use client';

import { Product } from '@/types';
import { Trash2, ShoppingCart, Loader2 } from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartSummaryProps {
  items: CartItem[];
  totals: { subtotal: number; tva: number; total: number };
  onRemoveItem: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onValidate: () => Promise<void>;
  isLoading?: boolean;
}

export function CartSummary({ 
  items, 
  totals, 
  onRemoveItem, 
  onUpdateQuantity, 
  onValidate, 
  isLoading = false 
}: CartSummaryProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Cart Items - Scrollable */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-2 pr-2">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-foreground/40">
              <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Panier vide</p>
            </div>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.product.id} className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-gold/20 transition-all space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                  <p className="text-xs text-foreground/60 mt-0.5">{item.product.price.toFixed(2)}€/u</p>
                </div>
                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  className="p-1.5 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all flex-shrink-0"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              {/* Quantity Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                  className="w-6 h-6 flex items-center justify-center rounded border border-white/10 hover:bg-white/5 hover:border-gold/30 text-xs text-foreground/70 hover:text-gold transition-all"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => onUpdateQuantity(item.product.id, parseInt(e.target.value, 10) || 1)}
                  className="flex-1 h-6 px-1 rounded border border-white/10 bg-white/5 text-center text-xs focus:border-gold focus:outline-none"
                />
                <button
                  onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                  className="w-6 h-6 flex items-center justify-center rounded border border-white/10 hover:bg-white/5 hover:border-gold/30 text-xs text-foreground/70 hover:text-gold transition-all"
                >
                  +
                </button>
                <span className="text-xs font-semibold text-gold ml-auto min-w-14 text-right">
                  {(item.product.price * item.quantity).toFixed(2)}€
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      {items.length > 0 && (
        <div className="space-y-2 p-4 rounded-xl border border-white/10 bg-white/5 mb-4">
          <div className="flex justify-between text-xs text-foreground/70">
            <span>Sous-total</span>
            <span className="font-medium text-foreground">{totals.subtotal.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between text-xs text-foreground/70">
            <span>TVA (20%)</span>
            <span className="font-medium text-foreground">{totals.tva.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between text-sm border-t border-white/10 pt-2">
            <span className="font-semibold text-foreground">Total TTC</span>
            <span className="font-bold text-lg text-gold">{totals.total.toFixed(2)}€</span>
          </div>
        </div>
      )}

      {/* Validate Button */}
      <button
        onClick={onValidate}
        disabled={items.length === 0 || isLoading}
        className="w-full py-3 bg-gold hover:bg-gold-light disabled:bg-white/10 disabled:cursor-not-allowed text-slate-900 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:text-foreground/40 font-serif"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Traitement...</span>
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            <span>Valider la commande</span>
          </>
        )}
      </button>
    </div>
  );
}
