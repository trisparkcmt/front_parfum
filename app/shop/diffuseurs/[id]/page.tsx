import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import ProductDetailClient from '../../product/[id]/ProductDetailClient';
import { createProductMetadata, fetchProductPageData } from '@/lib/productPageData';

type Props = { params: Promise<{ id: string }> };

async function loadProduct(params: Props['params']) {
  const { id } = await params;
  return { id, result: await fetchProductPageData('diffuseur', id) };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { id, result } = await loadProduct(props.params);
  if (result.status === 'unavailable') {
    console.error('Failed to fetch diffuser metadata:', result.error);
    return {
      title: 'Diffuseur | Accessoires Exclusifs',
      description: 'Découvrez nos diffuseurs de parfum sur Accessoires Exclusifs.',
      alternates: { canonical: `/shop/diffuseurs/${id}` },
    };
  }
  if (result.status === 'not-found') {
    return { title: 'Diffuseur introuvable | Accessoires Exclusifs' };
  }

  return createProductMetadata(
    result.product,
    `/shop/diffuseurs/${result.product.slug || result.product.id || id}`,
  );
}

export default async function DiffuseurDetailPage(props: Props) {
  const { id, result } = await loadProduct(props.params);
  if (result.status === 'not-found') notFound();
  if (result.status === 'unavailable') {
    console.error('Failed to fetch diffuser for server rendering:', result.error);
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ProductDetailClient
        id={id}
        preferredType="diffuseur"
        initialProduct={result.status === 'found' ? result.product : undefined}
      />
    </Suspense>
  );
}