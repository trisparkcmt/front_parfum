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
      return { title: 'Produit introuvable' };
    }

    const rawImage = product.image_principale || (product.images && product.images[0]) || '';
    const mainImage = rawImage
      ? resolveImageUrl(rawImage)
      : 'https://accessoiresexclusifs.com/og-image.svg';

    const productUrl = `https://accessoiresexclusifs.com/shop/product/${product.slug || product.id}`;

    return {
      title: { default: product.name, template: '%s | Accessoires Exclusifs' },
      description: product.description || `Achetez ${product.name} sur Accessoires Exclusifs`,
      openGraph: {
        title: product.name,
        description: product.description || `Decouvrez ${product.name}`,
        url: productUrl,
        images: [{ url: mainImage, width: 800, height: 600, alt: product.name }],
        type: 'website',
      },
    };
  } catch (error) {
    return { title: 'Produit' };
  }
}

export default async function ProductDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const fallback = type === 'accessory' ? '/shop/accessories' : '/shop/perfumes';
  
  return <ClientRedirect fallback={fallback} />;
}