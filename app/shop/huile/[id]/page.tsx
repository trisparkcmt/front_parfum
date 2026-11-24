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
    const product = await productService.getProductById(id, 'essence');

    if (!product || product.category !== 'huile') {
      return {
        title: 'Huile de Parfum | Accessoires Exclusifs',
        description: "Découvrez notre collection d'huiles de parfum 100% pures.",
        openGraph: {
          title: 'Huile de Parfum',
          description: "Découvrez notre collection d'huiles de parfum 100% pures.",
          url: `https://accessoiresexclusifs.com/shop/huile/${encodeURIComponent(id)}`,
          images: [{ url: 'https://accessoiresexclusifs.com/huile.png', width: 800, height: 800, alt: 'Huile de Parfum' }],
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: 'Huile de Parfum',
          description: "Découvrez notre collection d'huiles de parfum 100% pures.",
          images: ['https://accessoiresexclusifs.com/huile.png'],
        },
      };
    }

    const rawImage = product.image_principale || (product.images && product.images[0]) || '';
    const mainImage = rawImage && !rawImage.includes('huile.png')
      ? resolveImageUrl(rawImage)
      : 'https://accessoiresexclusifs.com/huile.png';

    const productUrl = `https://accessoiresexclusifs.com/shop/huile/${encodeURIComponent(product.slug || product.id)}`;

    return {
      title: { default: product.name, template: '%s | Accessoires Exclusifs' },
      description: product.description || `Huile essentielle ${product.name}`,
      openGraph: {
        title: product.name,
        description: product.description || `Découvrez l'huile ${product.name}`,
        url: productUrl,
        images: [{ url: mainImage, width: 800, height: 800, alt: product.name }],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: product.description || `Découvrez l'huile ${product.name}`,
        images: [mainImage],
      },
    };
  } catch (error) {
    return {
      title: 'Huile de Parfum | Accessoires Exclusifs',
      openGraph: {
        title: 'Huile de Parfum',
        description: "Découvrez notre collection d'huiles de parfum 100% pures.",
        images: [{ url: 'https://accessoiresexclusifs.com/huile.png', width: 800, height: 800, alt: 'Huile de Parfum' }],
      },
      twitter: {
        card: 'summary_large_image',
        images: ['https://accessoiresexclusifs.com/huile.png'],
      },
    };
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
