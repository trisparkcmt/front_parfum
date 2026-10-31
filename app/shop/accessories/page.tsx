import type { Metadata } from 'next';
import { connection } from 'next/server';
import AccessoriesCatalogClient from './AccessoriesCatalogClient';
import { fetchPublicCatalogPage } from '@/lib/publicCatalog';
import { mapBackendAccessoryToProduct } from '@/services/productService';
import type { Product } from '@/types';

export const metadata: Metadata = {
  title: 'Accessoires de luxe',
  description: 'Découvrez notre sélection de sacs, bijoux, montres et accessoires de luxe.',
  alternates: {
    canonical: '/shop/accessories',
  },
};

export default async function AccessoriesShopPage() {
  await connection();
  let initialProducts: Product[] = [];
  try {
    const products = await fetchPublicCatalogPage('shop/accessoires/');
    initialProducts = products.map(mapBackendAccessoryToProduct);
  } catch (error) {
    console.error('Failed to fetch initial accessories catalog for server rendering:', error);
  }

  return <AccessoriesCatalogClient initialProducts={initialProducts} />;
}
