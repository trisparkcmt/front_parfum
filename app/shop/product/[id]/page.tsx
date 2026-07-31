import { Metadata } from 'next';
import { productService } from '@/services/productService';
import { resolveImageUrl } from '@/lib/utils';
import ProductDetailClient from './ProductDetailClient';

/**
 * Server-side metadata generation for social sharing.
 * NOTE: this can only live in a server component (no 'use client' in this file).
 */
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const product = await productService.getProductById(params.id);

    if (!product) {
      return {
        title: 'Produit introuvable',
        description: 'Erreur lors de la récupération du produit',
        openGraph: {
          title: 'Produit introuvable',
          description: 'Erreur lors de la récupération du produit',
          images: [],
        },
      };
    }

    const rawImage =
      product.image_principale ||
      (product.images && product.images[0]) ||
      '';
    const mainImage = rawImage
      ? resolveImageUrl(rawImage)
      : 'https://accessoires-exclusifs.vercel.app/og-image.svg';

    const productUrl = `https://accessoires-exclusifs.vercel.app/shop/product/${product.slug || product.id}`;

    return {
      title: {
        default: product.name,
        template: '%s | Accessoires Exclusifs',
      },
      description: product.description_courte || 'Produit de luxe',
      openGraph: {
        title: product.name,
        description: product.description_courte || 'Découvrez notre collection exclusive',
        url: productUrl,
        siteName: 'Accessoires Exclusifs',
        locale: 'fr_FR',
        type: 'website',
        images: [
          {
            url: mainImage,
            width: 1200,
            height: 630,
            alt: `Image de ${product.name}`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: product.description_courte || 'Découvrez notre collection exclusive',
        images: [mainImage],
      },
    };
  } catch (error) {
    console.error('Failed to generate metadata:', error);
    return {
      title: 'Erreur de chargement',
      description: 'Impossible de charger les détails du produit',
      openGraph: {
        title: 'Erreur de chargement',
        description: 'Impossible de charger les détails du produit',
        images: [],
      },
    };
  }
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  return <ProductDetailClient id={params.id} />;
}