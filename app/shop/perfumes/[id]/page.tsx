import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import ProductDetailClient from '../../product/[id]/ProductDetailClient';
import { createProductMetadata, fetchProductPageData } from '@/lib/productPageData';

type Props = { params: Promise<{ id: string }> };

async function loadProduct(params: Props['params']) {
  const { id } = await params;
  return { id, result: await fetchProductPageData('perfume', id) };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { id, result } = await loadProduct(props.params);
  if (result.status === 'unavailable') {
    console.error('Failed to fetch perfume metadata:', result.error);
    return {
      title: 'Parfum | Accessoires Exclusifs',
      description: 'Découvrez nos parfums sur Accessoires Exclusifs.',
      alternates: { canonical: `/shop/perfumes/${id}` },
    };
  }
  if (result.status === 'not-found') {
    return { title: 'Parfum introuvable | Accessoires Exclusifs' };
  }

  return createProductMetadata(
    result.product,
    `/shop/perfumes/${result.product.slug || result.product.id || id}`,
  );
}

export default async function PerfumeDetailPage(props: Props) {
  const { id, result } = await loadProduct(props.params);
  if (result.status === 'not-found') notFound();
  if (result.status === 'unavailable') {
    console.error('Failed to fetch perfume for server rendering:', result.error);
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ProductDetailClient
        id={id}
        preferredType="perfume"
        initialProduct={result.status === 'found' ? result.product : undefined}
      />
    </Suspense>
  );
}