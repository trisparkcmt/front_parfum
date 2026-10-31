import type { Metadata } from 'next';
import {
  mapBackendAccessoryToProduct,
  mapBackendDiffuseurToProduct,
  mapBackendPerfumeToProduct,
} from '@/services/productService';
import { fetchPublicProduct, type PublicProductKind } from '@/lib/publicCatalog';
import type { Product } from '@/types';

export type ProductPageData =
  | { status: 'found'; product: Product }
  | { status: 'not-found' }
  | { status: 'unavailable'; error: unknown };

export function createProductMetadata(product: Product, canonicalPath: string): Metadata {
  const description = product.description || `Découvrez ${product.name} sur Accessoires Exclusifs.`;
  const image = product.image_principale || product.images?.[0];

  return {
    title: product.name,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: product.name,
      description,
      url: canonicalPath,
      images: image ? [{ url: image, alt: product.name }] : undefined,
      type: 'website',
    },
  };
}

export async function fetchProductPageData(
  kind: PublicProductKind,
  slug: string,
): Promise<ProductPageData> {
  const result = await fetchPublicProduct(kind, slug);
  if (result.status !== 'found') return result;

  const mapProduct = {
    perfume: mapBackendPerfumeToProduct,
    accessory: mapBackendAccessoryToProduct,
    diffuseur: mapBackendDiffuseurToProduct,
  }[kind];

  return {
    status: 'found',
    product: mapProduct(result.product),
  };
}
