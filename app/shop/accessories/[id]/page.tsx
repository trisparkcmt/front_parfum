import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import ProductDetailClient from '../../product/[id]/ProductDetailClient';
import { createProductMetadata, fetchProductPageData } from '@/lib/productPageData';

type Props = { params: Promise<{ id: string }> };

async function loadProduct(params: Props['params']) {
  const { id } = await params;
  return { id, result: await fetchProductPageData('accessory', id) };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { id, result } = await loadProduct(props.params);
  if (result.status === 'unavailable') {
    console.error('Failed to fetch accessory metadata:', result.error);
    return {
      title: 'Accessoire | Accessoires Exclusifs',
      description: 'Découvrez nos accessoires de luxe sur Accessoires Exclusifs.',
      alternates: { canonical: `/shop/accessories/${id}` },
    };
  }
  if (result.status === 'not-found') {
    return { title: 'Accessoire introuvable | Accessoires Exclusifs' };
  }

  return createProductMetadata(
    result.product,
    `/shop/accessories/${result.product.slug || result.product.id || id}`,
  );
}

export default async function AccessoryDetailPage(props: Props) {
  const { id, result } = await loadProduct(props.params);
  if (result.status === 'not-found') notFound();
  if (result.status === 'unavailable') {
    console.error('Failed to fetch accessory for server rendering:', result.error);
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ProductDetailClient
        id={id}
        preferredType="accessory"
        initialProduct={result.status === 'found' ? result.product : undefined}
      />
    </Suspense>
  );
}