/**
 * @file app/shop/diffuseurs/page.tsx
 * @description Server entry-point for the Diffuseurs shop.
 *
 * Kept as a Server Component so Next.js can export `metadata` (including the
 * canonical URL that fixes the "Duplicate without user-selected canonical"
 * errors in Google Search Console).  The interactive UI lives in the
 * `DiffuseursShopClient` Client Component.
 */
import { Metadata } from 'next';
import DiffuseursShopClient from './DiffuseursShopClient';

export const metadata: Metadata = {
  title: 'Diffuseurs de parfum ultrasoniques & haute technologie',
  description:
    'Découvrez notre sélection de diffuseurs de parfum ultrasoniques et haute technologie pour sublimer votre intérieur.',
  alternates: {
    canonical: 'https://accessoiresexclusifs.com/shop/diffuseurs',
  },
  openGraph: {
    title: 'Diffuseurs de parfum ultrasoniques & haute technologie',
    description:
      'Diffuseurs ultrasoniques, nébulisation et chaleur douce disponibles sur Accessoires Exclusifs.',
    url: 'https://accessoiresexclusifs.com/shop/diffuseurs',
    type: 'website',
  },
};

export default function DiffuseursShopPage() {
  return <DiffuseursShopClient />;
}
