/**
 * @file app/shop/accessories/page.tsx
 * @description Server entry-point for the Accessories shop.
 *
 * Kept as a Server Component so Next.js can export `metadata` (including the
 * canonical URL that fixes the "Duplicate without user-selected canonical"
 * errors in Google Search Console).  The interactive UI lives in the
 * `AccessoriesShopClient` Client Component.
 */
import { Metadata } from 'next';
import { Suspense } from 'react';
import AccessoriesShopClient from './AccessoriesShopClient';
import { productService } from '@/services/productService';
import { resolveImageUrl } from '@/lib/utils';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; type?: string }>;
}): Promise<Metadata> {
  const { product: productId } = await searchParams;

  if (productId) {
    try {
      const product = await productService.getProductById(productId, 'accessory');
      if (product) {
        const rawImage = product.image_principale || (product.images && product.images[0]) || '';
        const mainImage = rawImage
          ? resolveImageUrl(rawImage)
          : 'https://accessoiresexclusifs.com/og-image.svg';

        const productUrl = `https://accessoiresexclusifs.com/shop/accessories?product=${encodeURIComponent(product.slug || product.id)}&type=accessory`;

        return {
          title: { default: product.name, template: '%s | Accessoires Exclusifs' },
          description: product.description || `Découvrez ${product.name} sur Accessoires Exclusifs.`,
          alternates: {
            canonical: productUrl,
          },
          openGraph: {
            title: product.name,
            description: product.description || `Découvrez ${product.name}`,
            url: productUrl,
            images: [{ url: mainImage, width: 800, height: 600, alt: product.name }],
            type: 'website',
          },
        };
      }
    } catch {
      // Fall through to catalog defaults
    }
  }

  return {
    title: 'Accessoires de luxe – sacs, montres & bijoux',
    description:
      'Découvrez notre collection d\'accessoires de luxe : sacs, montres, bijoux et plus encore sur Accessoires Exclusifs.',
    alternates: {
      canonical: 'https://accessoiresexclusifs.com/shop/accessories',
    },
    openGraph: {
      title: 'Accessoires de luxe – sacs, montres & bijoux',
      description:
        'Sacs, montres, bijoux et accessoires de marque disponibles sur Accessoires Exclusifs.',
      url: 'https://accessoiresexclusifs.com/shop/accessories',
      type: 'website',
    },
  };
}

export default function AccessoriesShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AccessoriesShopClient />
    </Suspense>
  );
}