import ProductDetailClient from '../../product/[id]/ProductDetailClient';

export default async function PerfumeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductDetailClient id={id} />;
}