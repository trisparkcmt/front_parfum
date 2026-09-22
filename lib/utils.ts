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
import { WHATSAPP_BASE_URL, CURRENCY, API_BASE_URL } from './constants';
import { API_ROOT } from '@/services/api';
import type { CartItem } from '@/types';

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Return a new array with the items in a random order. */
export function shuffleArray<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

/**
 * Interleave two arrays with a specified ratio (default 3:1).
 * Takes `ratioA` items from `listA`, then `ratioB` items from `listB`, repeating until both are exhausted.
 */
export function interleaveArraysWithRatio<T>(
  listA: T[],
  listB: T[],
  ratioA: number = 3,
  ratioB: number = 1
): T[] {
  const result: T[] = [];
  let indexA = 0;
  let indexB = 0;

  // We stop interleaving as soon as the primary list (listA) is exhausted.
  // This prevents appending all of listB at the end when listA is shorter.
  while (indexA < listA.length) {
    for (let i = 0; i < ratioA && indexA < listA.length; i += 1) {
      result.push(listA[indexA]);
      indexA += 1;
    }

    for (let j = 0; j < ratioB && indexB < listB.length; j += 1) {
      result.push(listB[indexB]);
      indexB += 1;
    }
  }

  return result;
}

/**
 * Format a number as FCFA currency
 */
export function formatPrice(amount: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(amount)} ${CURRENCY}`;
}

export function normalizeCameroonPhone(value?: string | null): string {
  const digits = (value || '').replace(/\D/g, '');
  return digits.startsWith('237') && digits.length === 12 ? digits.slice(3) : digits;
}

export function getCompanyWhatsAppNumber(companyInfo?: { whatsapp?: string | null; telephone_principal?: string | null } | null): string {
  const primary = normalizeCameroonPhone(companyInfo?.whatsapp);
  if (primary) return primary;
  return normalizeCameroonPhone(companyInfo?.telephone_principal);
}

export function formatDisplayPhone(phone?: string | null): string {
  const digits = normalizeCameroonPhone(phone);
  if (!digits) return '';
  if (digits.length === 9) {
    return `+237 ${digits.replace(/(\d{3})(?=\d)/g, '$1 ')}`.trim();
  }
  return `+${digits}`;
}

export function normalizeSocialUsername(value?: string | null): string {
  return (value || '')
    .trim()
    .replace(/^https?:\/\/(www\.)?[^/]+\//i, '')
    .replace(/^@/, '')
    .replace(/\/$/, '');
}

export function normalizeSocialProfileUrl(platform: 'facebook' | 'instagram', value?: string | null): string {
  const username = normalizeSocialUsername(value);
  if (!username) return '';
  return `https://www.${platform}.com/${username}`;
}

export function buildWhatsAppUrl(phone?: string | null, message?: string): string {
  const number = normalizeCameroonPhone(phone);
  const query = message ? `?text=${encodeURIComponent(message)}` : '';
  return `${WHATSAPP_BASE_URL}/237${number}${query}`;
}

export function buildSocialUrl(platform: 'facebook' | 'instagram', username?: string | null): string {
  return normalizeSocialProfileUrl(platform, username);
}

export function buildAbsoluteUrl(path: string): string {
  if (typeof window === 'undefined') {
    return path.startsWith('/') ? path : `/${path}`;
  }

  const base = window.location.origin;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Resolve a possibly-relative product image path into an absolute URL.
 * Required both for <Image> rendering AND for Open Graph tags / Web Share
 * file attachments, which can't work with relative paths.
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_ROOT}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Best-effort fetch of a remote image into a File, for use with
 * navigator.share({ files }). Returns null if the fetch fails (e.g. the
 * image host doesn't send CORS headers) so callers can fall back gracefully.
 */
async function imageUrlToFile(imageUrl: string): Promise<File | null> {
  try {
    const response = await fetch(imageUrl, { mode: 'cors' });
    if (!response.ok) return null;
    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) return null;
    const extension = blob.type.split('/')[1] || 'jpg';
    return new File([blob], `product.${extension}`, { type: blob.type });
  } catch {
    return null;
  }
}

/**
 * Share a page via the Web Share API.
 *
 * Two distinct behaviors are possible on the receiving app:
 * - Passing `imageUrl` attaches the actual image as a file (like sharing a
 *   photo) — supported only where `navigator.canShare({ files })` is true.
 * - A plain link share (title/text/url, no files) lets apps like WhatsApp
 *   or iMessage fetch the URL themselves and build a rich preview card
 *   from the page's Open Graph tags — this is what makes a shared link
 *   show a thumbnail, similar to sharing a TikTok link.
 *
 * This function tries the file attachment first (if an image URL is given
 * and the platform supports it), then falls back to a plain link share,
 * then to copying the link to the clipboard.
 */
export async function sharePage(
  path: string,
  title: string,
  text?: string,
  imageUrl?: string
): Promise<'shared' | 'copied' | 'failed'> {
  const url = buildAbsoluteUrl(path);
  const canUseShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  if (canUseShare && imageUrl) {
    try {
      const file = await imageUrlToFile(imageUrl);
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title, text: text || title, url, files: [file] });
        return 'shared';
      }
    } catch (fileError) {
      const err = fileError as DOMException;
      if (err?.name === 'AbortError') {
        // User dismissed the share sheet — don't keep trying other methods.
        return 'failed';
      }
      console.warn('Image attachment share failed, falling back to link share:', fileError);
    }
  }

  if (canUseShare) {
    try {
      await navigator.share({ title, text: text || title, url });
      return 'shared';
    } catch (error) {
      const err = error as DOMException;
      if (err?.name === 'AbortError') {
        // User dismissed the native share sheet — don't fall back to clipboard.
        return 'failed';
      }
      // Any other error: fall through and try the clipboard instead.
    }
  }

  if (typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(url);
      return 'copied';
    } catch {
      return 'failed';
    }
  }

  return 'failed';
}

/**
 * A wrapper around the native fetch API to include necessary headers for the backend.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Generate a WhatsApp link with a pre-filled order message
 */
export function generateWhatsAppLink(
  items: CartItem[],
  subtotal: number,
  total: number,
  promoCode?: string | null,
  promoDiscount?: number,
  paymentMethod?: string,
  mobileNetwork?: string,
  deliveryType?: string,
  deliveryLocation?: string,
  orderNumber?: string,
  whatsappNumber?: string | null
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

  message += `💳 *Paiement:* ${paymentMethod === 'cash' ? 'Espèces' : `Mobile Money (${mobileNetwork?.toUpperCase()})`}\n`;
  message += `🚚 *Mode:* ${deliveryType === 'delivery' ? `Livraison à : ${deliveryLocation}` : 'Retrait en boutique'}\n\n`;

  if (orderNumber) {
    message += `🔖 *N° de commande:* ${orderNumber}\n\n`;
  }

  message += `Merci de confirmer cette commande 🙏`;

  return buildWhatsAppUrl(whatsappNumber, message);
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