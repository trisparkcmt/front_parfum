'use client';
import ProductDetailClient from '../../product/[id]/ProductDetailClient';

export default function PerfumeDetailPage({ params }: { params: { id: string } }) {
  return <ProductDetailClient id={params.id} />;
}
