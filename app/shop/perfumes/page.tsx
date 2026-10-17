import { Metadata } from 'next';
import { Suspense } from 'react';
import PerfumesShopClient from './PerfumesShopClient';
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
      const product = await productService.getProductById(productId, 'perfume');
      if (product) {
        const rawImage = product.image_principale || (product.images && product.images[0]) || '';
        const mainImage = rawImage
          ? resolveImageUrl(rawImage)
          : 'https://accessoiresexclusifs.com/og-image.svg';

        const productUrl = `https://accessoiresexclusifs.com/shop/perfumes?product=${encodeURIComponent(product.slug || product.id)}&type=perfume`;

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
    title: 'Parfums de marque, dupes et creations sur mesure',
    description: 'Découvrez des parfums de marque, des dupes de parfum et des creations olfactives sur mesure sur Accessoires Exclusifs.',
    alternates: {
      canonical: 'https://accessoiresexclusifs.com/shop/perfumes',
    },
    openGraph: {
      title: 'Parfums de marque, dupes et creations sur mesure',
      description: 'Parfums de marque, dupes de parfum et creations olfactives sur mesure avec atelier exclusif.',
      url: 'https://accessoiresexclusifs.com/shop/perfumes',
      type: 'website',
    },
  };
}

export default function PerfumesShop() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-foreground/30 font-mono text-xs uppercase tracking-widest">Chargement...</div>}>
      <PerfumesShopClient />
    </Suspense>
  );
}
