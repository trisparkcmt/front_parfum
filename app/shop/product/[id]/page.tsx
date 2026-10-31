import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import ProductDetailClient from './ProductDetailClient';
import { createProductMetadata, fetchProductPageData } from '@/lib/productPageData';
import type { PublicProductKind } from '@/lib/publicCatalog';
import type { Product } from '@/types';

type ProductPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
};

function getProductKind(type?: string): PublicProductKind {
  if (type === 'accessory' || type === 'diffuseur') return type;
  return 'perfume';
}

async function loadProduct(
  params: ProductPageProps['params'],
  searchParams: ProductPageProps['searchParams'],
) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const kind = getProductKind(query.type);
  const result = await fetchProductPageData(kind, id);
  return { id, kind, result };
}

export async function generateMetadata(props: ProductPageProps): Promise<Metadata> {
  const { kind, result } = await loadProduct(props.params, props.searchParams);
  if (result.status === 'unavailable') {
    console.error('Failed to fetch product metadata:', result.error);
    const { id } = await props.params;
    const canonicalPath = kind === 'accessory'
      ? `/shop/accessories/${id}`
      : kind === 'diffuseur'
        ? `/shop/diffuseurs/${id}`
        : `/shop/perfumes/${id}`;
    return {
      title: 'Produit | Accessoires Exclusifs',
      description: 'Découvrez nos produits sur Accessoires Exclusifs.',
      alternates: { canonical: canonicalPath },
    };
  }
  if (result.status === 'not-found') {
    return { title: 'Produit introuvable | Accessoires Exclusifs' };
  }

  const product = result.product;
  const canonicalPath = kind === 'accessory'
    ? `/shop/accessories/${product.slug || product.id}`
    : kind === 'diffuseur'
      ? `/shop/diffuseurs/${product.slug || product.id}`
      : `/shop/perfumes/${product.slug || product.id}`;
  return createProductMetadata(product, canonicalPath);
}

export default async function ProductDetailPage(props: ProductPageProps) {
  const { id, kind, result } = await loadProduct(props.params, props.searchParams);
  if (result.status === 'not-found') notFound();
  if (result.status === 'unavailable') {
    console.error('Failed to fetch product for server rendering:', result.error);
  }

  const initialProduct: Product | undefined = result.status === 'found' ? result.product : undefined;
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ProductDetailClient id={id} preferredType={kind} initialProduct={initialProduct} />
    </Suspense>
  );
}