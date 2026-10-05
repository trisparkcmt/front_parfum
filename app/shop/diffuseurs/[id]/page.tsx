import ClientRedirect from '../../ClientRedirect';

export default async function DiffuseurDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClientRedirect fallback={`/shop/diffuseurs?product=${encodeURIComponent(id)}&type=diffuseur`} />;
}