'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product, CustomComposition } from '@/types';
import { generateId } from '@/lib/utils';
import { mockPromoCodes } from '@/lib/mock-data';

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
        const promo = mockPromoCodes.find(
          (p) => p.code.toUpperCase() === code.toUpperCase() && p.isActive
        );
        if (promo) {
          set({ promoCode: promo.code, promoDiscount: promo.discountPercent });
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
