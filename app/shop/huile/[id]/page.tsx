import { Metadata } from 'next';
import { productService } from '@/services/productService';
import { resolveImageUrl } from '@/lib/utils';
import HuileDetailClient from './HuileDetailClient';

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
        description: product.description || 'Découvrez notre collection d'huiles exclusives',
        url: productUrl,
        siteName: 'Accessoires Exclusifs',
        locale: 'fr_FR',
        type: 'website',
        images: [{ url: mainImage, width: 1200, height: 630, alt: product.name }],
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: product.description || 'Découvrez notre collection d'huiles exclusives',
        images: [mainImage],
      },
    };
  } catch {
    return { title: 'Huile' };
  }
}

export default async function HuilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HuileDetailClient id={id} />;
}
