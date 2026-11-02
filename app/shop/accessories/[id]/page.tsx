import { Metadata } from 'next';
import { productService } from '@/services/productService';
import { resolveImageUrl } from '@/lib/utils';
import ClientRedirect from '../../ClientRedirect';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const product = await productService.getProductById(id, 'accessory');

    if (!product) {
      return { title: 'Accessoire introuvable' };
    }

    const rawImage = product.image_principale || (product.images && product.images[0]) || '';
    const mainImage = rawImage
      ? resolveImageUrl(rawImage)
      : 'https://accessoiresexclusifs.com/og-image.svg';

    const productUrl = `https://accessoiresexclusifs.com/shop/accessories?product=${encodeURIComponent(product.slug || product.id)}&type=accessory`;

    return {
      title: { default: product.name, template: '%s | Accessoires Exclusifs' },
      description: product.description || `Achetez ${product.name} sur Accessoires Exclusifs`,
      openGraph: {
        title: product.name,
        description: product.description || `Découvrez ${product.name}`,
        url: productUrl,
        images: [{ url: mainImage, width: 800, height: 600, alt: product.name }],
        type: 'website',
      },
    };
  } catch {
    return { title: 'Accessoire' };
  }
}

export default async function AccessoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClientRedirect fallback={`/shop/accessories?product=${encodeURIComponent(id)}&type=accessory`} />;
}