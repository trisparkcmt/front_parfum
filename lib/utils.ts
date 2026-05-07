/**
 * @file lib/utils.ts
 * @description General Purpose Helper Functions & Logic Utilities.
 *
 * This library contains pure functions and small logic wrappers used across 
 * various components to ensure code reuse and clean implementation.
 * 
 * **Key Utilities**:
 * - **`cn(...inputs)`**: A wrapper for `clsx` and `tailwind-merge` to handle conditional class merging and conflict resolution in Tailwind CSS.
 * - **`formatPrice(amount)`**: Formats a numerical value into a localized currency string (FCFA) for consistent pricing display.
 * - **`blendColors(colors)`**: A sophisticated algorithm that takes an array of HEX colors and weights to calculate a single average color. Used primarily for the visual perfume mixer in the Numba Atelier.
 * - **`generateWhatsAppLink(...)`**: Orchestrates the checkout process by generating a URL that pre-fills a WhatsApp message with order details, items, and totals.
 * - **`generateId()`**: Generates a unique, timestamped ID for entities like custom compositions.
 * - **Date Formatters**: (`formatDate`, `formatDateTime`) Provides localized French date strings for dashboards and order history.
 * 
 * **Benefit**: Decouples business logic from UI components, making the codebase easier to test and maintain.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { WHATSAPP_BASE_URL, WHATSAPP_NUMBER, CURRENCY } from './constants';
import type { CartItem } from '@/types';

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as FCFA currency
 */
export function formatPrice(amount: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(amount)} ${CURRENCY}`;
}

/**
 * Generate a WhatsApp link with a pre-filled order message
 */
export function generateWhatsAppLink(
  items: CartItem[],
  subtotal: number,
  total: number,
  promoCode?: string | null,
  promoDiscount?: number
): string {
  let message = '🛍️ *Nouvelle Commande — Accessories Exclusif*\n\n';

  items.forEach((item, index) => {
    const name =
      item.type === 'product'
        ? item.product?.name
        : `Composition: ${item.composition?.name}`;
    message += `${index + 1}. ${name}\n`;
    message += `   Qté: ${item.quantity} × ${formatPrice(item.unitPrice)}\n`;
    message += `   Sous-total: ${formatPrice(item.unitPrice * item.quantity)}\n\n`;
  });

  message += `---\n`;
  message += `💰 Sous-total: ${formatPrice(subtotal)}\n`;

  if (promoCode && promoDiscount) {
    message += `🏷️ Code promo: ${promoCode} (-${promoDiscount}%)\n`;
  }

  message += `✅ *Total: ${formatPrice(total)}*\n\n`;
  message += `Merci de confirmer cette commande 🙏`;

  const encodedMessage = encodeURIComponent(message);
  return `${WHATSAPP_BASE_URL}/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
}

/**
 * Blend multiple hex colors based on their proportions
 */
export function blendColors(
  colors: { hex: string; weight: number }[]
): string {
  if (colors.length === 0) return '#C5A059';
  if (colors.length === 1) return colors[0].hex;

  const totalWeight = colors.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return '#C5A059';

  let r = 0, g = 0, b = 0;

  colors.forEach(({ hex, weight }) => {
    const ratio = weight / totalWeight;
    const parsed = hexToRgb(hex);
    r += parsed.r * ratio;
    g += parsed.g * ratio;
    b += parsed.b * ratio;
  });

  return rgbToHex(Math.round(r), Math.round(g), Math.round(b));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 197, g: 160, b: 89 }; // fallback to gold
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '…';
}

/**
 * Format a date string to locale
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format a date with time
 */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get initials from a name
 */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
