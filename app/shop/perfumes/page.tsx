import { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import PerfumesShopClient from './PerfumesShopClient';
import { fetchPublicCatalogPage } from '@/lib/publicCatalog';
import { mapBackendPerfumeToProduct } from '@/services/productService';
import type { Product } from '@/types';

export const metadata: Metadata = {
  title: 'Parfums de marque, dupes et creations sur mesure',
  description: 'Découvrez des parfums de marque, des dupes de parfum et des creations olfactives sur mesure sur Accessoires Exclusifs.',
  alternates: {
    canonical: '/shop/perfumes',
  },
  openGraph: {
    title: 'Parfums de marque, dupes et creations sur mesure',
    description: 'Parfums de marque, dupes de parfum et creations olfactives sur mesure avec atelier exclusif.',
    url: 'https://accessoiresexclusifs.com/shop/perfumes',
    type: 'website',
  },
};

export default async function PerfumesShop() {
  await connection();
  let initialProducts: Product[] = [];
  try {
    const products = await fetchPublicCatalogPage('shop/parfums/');
    initialProducts = products.map(mapBackendPerfumeToProduct);
  } catch (error) {
    console.error('Failed to fetch initial perfume catalog for server rendering:', error);
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-foreground/30 font-mono text-xs uppercase tracking-widest">Chargement...</div>}>
      <PerfumesShopClient initialProducts={initialProducts} />
    </Suspense>
  );
}
