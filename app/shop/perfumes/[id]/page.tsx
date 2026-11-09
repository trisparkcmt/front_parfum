import { Metadata } from 'next';
import { productService } from '@/services/productService';
import { resolveImageUrl } from '@/lib/utils';
import ProductDetailClient from '../../product/[id]/ProductDetailClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const product = await productService.getProductById(id, 'perfume');

    if (!product) {
      return { title: 'Parfum introuvable' };
    }

    const rawImage = product.image_principale || (product.images && product.images[0]) || '';
    const mainImage = rawImage
      ? resolveImageUrl(rawImage)
      : 'https://accessoiresexclusifs.com/og-image.svg';

    const productUrl = `https://accessoiresexclusifs.com/shop/perfumes/${encodeURIComponent(product.slug || product.id)}`;

    return {
      title: { default: product.name, template: '%s | Accessoires Exclusifs' },
      description: product.description || `Achetez ${product.name} sur Accessoires Exclusifs`,
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
  } catch {
    return { title: 'Parfum' };
  }
}

export default async function PerfumeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let product = null;
  try {
    product = await productService.getProductById(id, 'perfume');
  } catch (err) {
    console.error('Failed to pre-fetch perfume for SSR:', err);
  }

  const rawImage = product?.image_principale || (product?.images && product.images[0]) || '';
  const mainImage = rawImage
    ? resolveImageUrl(rawImage)
    : 'https://accessoiresexclusifs.com/og-image.svg';
  const productUrl = product
    ? `https://accessoiresexclusifs.com/shop/perfumes/${encodeURIComponent(product.slug || product.id)}`
    : '';

  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        image: [mainImage],
        description: product.description || `Achetez ${product.name} sur Accessoires Exclusifs`,
        sku: product.slug || String(product.id),
        brand: {
          '@type': 'Brand',
          name: product.brand || 'Accessoires Exclusifs',
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'XOF',
          price: product.price ?? 0,
          availability:
            product.inStock !== false
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          url: productUrl,
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailClient id={id} initialProduct={product} />
    </>
  );
}
