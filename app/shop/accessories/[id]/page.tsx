import ClientRedirect from '../../ClientRedirect';

export default async function AccessoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClientRedirect fallback={`/shop/accessories?product=${encodeURIComponent(id)}&type=accessory`} />;
}