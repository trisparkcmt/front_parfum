import type { Metadata } from 'next';
import { connection } from 'next/server';
import DiffuseursShopClient from './DiffuseursShopClient';
import { fetchPublicCatalogPage } from '@/lib/publicCatalog';
import { mapBackendDiffuseurToProduct } from '@/services/productService';
import type { Product } from '@/types';

export const metadata: Metadata = {
  title: 'Diffuseurs de parfum',
  description: 'Découvrez nos diffuseurs de parfum pour créer une ambiance olfactive chez vous.',
  alternates: {
    canonical: '/shop/diffuseurs',
  },
};

export default async function DiffuseursShopPage() {
  await connection();
  let initialProducts: Product[] = [];
  try {
    const products = await fetchPublicCatalogPage('shop/diffuseurs/');
    initialProducts = products.map(mapBackendDiffuseurToProduct);
  } catch (error) {
    console.error('Failed to fetch initial diffuser catalog for server rendering:', error);
  }

  return <DiffuseursShopClient initialProducts={initialProducts} />;
}
