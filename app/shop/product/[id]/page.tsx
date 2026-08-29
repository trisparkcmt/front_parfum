import { Metadata } from 'next';
import { productService } from '@/services/productService';
import { resolveImageUrl } from '@/lib/utils';
import ProductDetailClient from './ProductDetailClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const product = await productService.getProductById(id);

    if (!product) {
      return {
        title: 'Produit introuvable',
        description: 'Erreur lors de la recuperation du produit',
        openGraph: { title: 'Produit introuvable', description: 'Erreur', images: [] },
      };
    }

    const rawImage = product.image_principale || (product.images && product.images[0]) || '';
    const mainImage = rawImage
      ? resolveImageUrl(rawImage)
      : 'https://accessoiresexclusifs.com/og-image.svg';

    const productUrl = `https://accessoiresexclusifs.com/shop/product/${product.slug || product.id}`;

    return {
      title: { default: product.name, template: '%s | Accessoires Exclusifs' },
      description: product.description_courte || 'Produit de luxe',
      openGraph: {
        title: product.name,
        description: product.description_courte || 'Decouvrez notre collection exclusive',
        url: productUrl,
        siteName: 'Accessoires Exclusifs',
        locale: 'fr_FR',
        type: 'website',
        images: [{ url: mainImage, width: 1200, height: 630, alt: product.name }],
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: product.description_courte || 'Decouvrez notre collection exclusive',
        images: [mainImage],
      },
    };
  } catch (error) {
    console.error('Failed to generate metadata:', error);
    return {
      title: 'Erreur de chargement',
      description: 'Impossible de charger les details du produit',
      openGraph: { title: 'Erreur de chargement', description: 'Erreur', images: [] },
    };
  }
}

// In Next.js 15+, params is a Promise - must be awaited in async server components
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductDetailClient id={id} />;
}