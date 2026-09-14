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

export default function HuileDetailPage() {
  return <ClientRedirect fallback="/shop/perfumes?tab=huile" />;
}
