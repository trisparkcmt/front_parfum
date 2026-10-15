/**
 * @file app/shop/accessories/page.tsx
 * @description Server entry-point for the Accessories shop.
 *
 * Kept as a Server Component so Next.js can export `metadata` (including the
 * canonical URL that fixes the "Duplicate without user-selected canonical"
 * errors in Google Search Console).  The interactive UI lives in the
 * `AccessoriesShopClient` Client Component.
 */
import { Metadata } from 'next';
import { Suspense } from 'react';
import AccessoriesShopClient from './AccessoriesShopClient';

export const metadata: Metadata = {
  title: 'Accessoires de luxe – sacs, montres & bijoux',
  description:
    'Découvrez notre collection d\'accessoires de luxe : sacs, montres, bijoux et plus encore sur Accessoires Exclusifs.',
  alternates: {
    canonical: 'https://accessoiresexclusifs.com/shop/accessories',
  },
  openGraph: {
    title: 'Accessoires de luxe – sacs, montres & bijoux',
    description:
      'Sacs, montres, bijoux et accessoires de marque disponibles sur Accessoires Exclusifs.',
    url: 'https://accessoiresexclusifs.com/shop/accessories',
    type: 'website',
  },
};

export default function AccessoriesShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AccessoriesShopClient />
    </Suspense>
  );
}