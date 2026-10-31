import type { MetadataRoute } from 'next';
import { fetchAllPublicCatalogItems } from '@/lib/publicCatalog';

export const revalidate = 3600;

const BASE_URL = 'https://accessoiresexclusifs.com';

function getStaticEntries(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL },
    { url: `${BASE_URL}/shop/perfumes` },
    { url: `${BASE_URL}/shop/accessories` },
    { url: `${BASE_URL}/shop/diffuseurs` },
    { url: `${BASE_URL}/numba` },
    { url: `${BASE_URL}/numba/ai-consultant` },
    { url: `${BASE_URL}/numba/atelier` },
    { url: `${BASE_URL}/terms` },
  ];
}

function getProductEntries(
  products: Record<string, unknown>[],
  category: 'perfumes' | 'accessories',
  availableSlots: number,
): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const seenUrls = new Set<string>();

  for (const product of products) {
    if (entries.length >= availableSlots) break;

    const slug = product.slug || product.id;
    if (typeof slug !== 'string' && typeof slug !== 'number') continue;

    const url = `${BASE_URL}/shop/${category}/${encodeURIComponent(String(slug))}`;
    if (seenUrls.has(url)) continue;
    seenUrls.add(url);

    const entry: MetadataRoute.Sitemap[number] = { url };
    const updateDate = product.date_modification || product.date_updated || product.updated_at;
    if (typeof updateDate === 'string' || typeof updateDate === 'number') {
      const parsedDate = new Date(updateDate);
      if (!Number.isNaN(parsedDate.getTime())) entry.lastModified = parsedDate;
    }

    entries.push(entry);
  }

  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = getStaticEntries();

  try {
    const [perfumes, accessories] = await Promise.all([
      fetchAllPublicCatalogItems('shop/parfums/'),
      fetchAllPublicCatalogItems('shop/accessoires/'),
    ]);

    const productSlots = 49_999 - staticEntries.length;
    const perfumeSlots = Math.min(perfumes.length, productSlots);
    const accessorySlots = Math.min(accessories.length, productSlots - perfumeSlots);

    return [
      ...staticEntries,
      ...getProductEntries(perfumes, 'perfumes', perfumeSlots),
      ...getProductEntries(accessories, 'accessories', accessorySlots),
    ];
  } catch (error) {
    console.error('Failed to build product sitemap; returning static URLs only:', error);
    return staticEntries;
  }
}
