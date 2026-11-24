import { Metadata } from 'next';
import { productService } from '@/services/productService';
import { resolveImageUrl } from '@/lib/utils';
import HuileClientRedirect from './HuileClientRedirect';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const product = await productService.getProductById(id);

    if (!product) {
      return { title: 'Huile introuvable' };
    }

    const rawImage = product.image_principale || (product.images && product.images[0]) || '';
    const mainImage = rawImage
      ? resolveImageUrl(rawImage)
      : 'https://accessoiresexclusifs.com/og-image.svg';

    const productUrl = `https://accessoiresexclusifs.com/shop/huile/${product.slug || product.id}`;

    return {
      title: { default: product.name, template: '%s | Accessoires Exclusifs' },
      description: product.description || `Huile essentielle ${product.name}`,
      openGraph: {
        title: product.name,
        description: product.description || `Decouvrez l'huile ${product.name}`,
        url: productUrl,
        images: [{ url: mainImage, width: 800, height: 600, alt: product.name }],
        type: 'website',
      },
    };
  } catch (error) {
    return { title: 'Huile' };
  }
}

/**
 * When a user opens a shared /shop/huile/[id] link, redirect them to the
 * perfumes shop with the huile tab active and the modal pre-opened via ?huile=.
 */
export default async function HuileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HuileClientRedirect id={id} />;
}
