/**
 * @file app/shop/diffuseurs/page.tsx
 * @description Server entry-point for the Diffuseurs shop.
 *
 * Kept as a Server Component so Next.js can export `metadata` (including the
 * canonical URL that fixes the "Duplicate without user-selected canonical"
 * errors in Google Search Console).  The interactive UI lives in the
 * `DiffuseursShopClient` Client Component.
 */
import { Metadata } from 'next';
import DiffuseursShopClient from './DiffuseursShopClient';
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
      const product = await productService.getProductById(productId, 'diffuseur');
      if (product) {
        const rawImage = product.image_principale || (product.images && product.images[0]) || '';
        const mainImage = rawImage
          ? resolveImageUrl(rawImage)
          : 'https://accessoiresexclusifs.com/og-image.svg';

        const productUrl = `https://accessoiresexclusifs.com/shop/diffuseurs?product=${encodeURIComponent(product.slug || product.id)}&type=diffuseur`;

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
    title: 'Diffuseurs de parfum ultrasoniques & haute technologie',
    description:
      'Découvrez notre sélection de diffuseurs de parfum ultrasoniques et haute technologie pour sublimer votre intérieur.',
    alternates: {
      canonical: 'https://accessoiresexclusifs.com/shop/diffuseurs',
    },
    openGraph: {
      title: 'Diffuseurs de parfum ultrasoniques & haute technologie',
      description:
        'Diffuseurs ultrasoniques, nébulisation et chaleur douce disponibles sur Accessoires Exclusifs.',
      url: 'https://accessoiresexclusifs.com/shop/diffuseurs',
      type: 'website',
    },
  };
}

export default function DiffuseursShopPage() {
  return <DiffuseursShopClient />;
}
