'use client';

import ClientRedirect from '../../ClientRedirect';

/**
 * Client component that reads the huile [id] passed from the server page
 * and forwards the user to the perfumes shop with:
 * - `tab=huile`  → switches the shop to the oils tab
 * - `huile={id}` → PerfumesShopClient opens HuileDetailModal for this product
 */
export default function HuileClientRedirect({ id }: { id: string }) {
  const destination = `/shop/perfumes?tab=huile&huile=${encodeURIComponent(id)}`;
  return <ClientRedirect fallback={destination} />;
}
