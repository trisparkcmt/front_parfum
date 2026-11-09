import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { productService } from '@/services/productService';
import { resolveImageUrl } from '@/lib/utils';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const { type } = await searchParams;
    const preferredType = type === 'accessory' ? 'accessory' : type === 'diffuseur' ? 'diffuseur' : 'perfume';
    const product = await productService.getProductById(id, preferredType);

    if (!product) {
      return { title: 'Produit introuvable' };
    }

    const rawImage = product.image_principale || (product.images && product.images[0]) || '';
    const mainImage = rawImage
      ? resolveImageUrl(rawImage)
      : 'https://accessoiresexclusifs.com/og-image.svg';

    const categoryPath = preferredType === 'accessory' ? 'accessories' : preferredType === 'diffuseur' ? 'diffuseurs' : 'perfumes';
    const productUrl = `https://accessoiresexclusifs.com/shop/${categoryPath}/${encodeURIComponent(product.slug || product.id)}`;

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
    return { title: 'Produit' };
  }
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const { id } = await params;
  const encodedId = encodeURIComponent(id);
  const destination = type === 'accessory'
    ? `/shop/accessories/${encodedId}`
    : type === 'diffuseur'
      ? `/shop/diffuseurs/${encodedId}`
      : `/shop/perfumes/${encodedId}`;
  
  redirect(destination);
}
