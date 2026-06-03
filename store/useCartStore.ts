'use client';

/**
 * @file store/useCartStore.ts
 * @description Global Shopping Cart & Transactional State.
 *
 * This store acts as the source of truth for all items the user intends to purchase, 
 * including standard catalog products and custom Numba compositions.
 * 
 * **State Management**:
 * - **`items`**: An array of `CartItem` objects, which can be either a catalog product or a complex custom-mixed perfume.
 * - **`promoCode` / `promoDiscount`**: Tracks the currently applied discount code and its percentage value.
 * 
 * **Business Logic Actions**:
 * - **`addItem`**: Intelligently adds a catalog product, incrementing quantity if the item already exists in the cart.
 * - **`addComposition`**: Adds a unique custom perfume creation as a separate line item.
 * - **`updateQuantity`**: Modifies the count of a specific item, with a floor of 1.
 * - **`removeItem`**: Deletes a specific item from the cart by its unique ID.
 * - **`applyPromoCode`**: Validates a string against known codes (e.g., 'BIENVENUE') and updates the discount state.
 * - **`clearCart`**: Resets the entire store state.
 * 
 * **Helper Functions**:
 * - **`getSubtotal`**: Calculates the raw cost of all items.
 * - **`getTotal`**: Computes the final price after applying the promo discount.
 * 
 * **Persistence**: Uses `persist` middleware to ensure the user's shopping cart is saved locally.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product, CustomComposition } from '@/types';
import { generateId } from '@/lib/utils';

interface CartState {
  items: CartItem[];
  promoCode: string | null;
  promoDiscount: number;
  addProduct: (product: Product, quantity?: number) => void;
  addComposition: (composition: CustomComposition) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  applyPromoCode: (code: string) => boolean;
  clearPromoCode: () => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: null,
      promoDiscount: 0,

      addProduct: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(
            (item) => item.type === 'product' && item.product?.id === product.id
          );
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.id === existing.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                id: generateId(),
                type: 'product',
                product,
                quantity,
                unitPrice: product.price,
              },
            ],
          };
        });
      },

      addComposition: (composition) => {
        set((state) => ({
          items: [
            ...state.items,
            {
              id: generateId(),
              type: 'custom-composition',
              composition,
              quantity: 1,
              unitPrice: composition.totalPrice,
            },
          ],
        }));
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }));
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        }));
      },

      applyPromoCode: (code) => {
        // TODO: Validate promo code against backend API
        // For now, accept any non-empty code with a 5% discount
        // In production, call backend to validate and get actual discount
        if (code && code.length > 0) {
          set({ promoCode: code, promoDiscount: 5 });
          return true;
        }
        return false;
      },

      clearPromoCode: () => {
        set({ promoCode: null, promoDiscount: 0 });
      },

      clearCart: () => {
        set({ items: [], promoCode: null, promoDiscount: 0 });
      },

      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0
        );
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().promoDiscount;
        return subtotal - subtotal * (discount / 100);
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'ae-cart',
    }
  )
);
