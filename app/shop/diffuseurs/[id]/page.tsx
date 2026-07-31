'use client';
import ProductDetailClient from '../../product/[id]/ProductDetailClient';

export default function DiffuseurDetailPage({ params }: { params: { id: string } }) {
  return <ProductDetailClient id={params.id} />;
}
