import { API_BASE_URL } from '@/lib/constants';

const API_BASE_URL_WITH_VERSION = (() => {
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || API_BASE_URL).replace(/\/+$/, '');
  return baseUrl.endsWith('/api/v1') ? `${baseUrl}/` : `${baseUrl}/api/v1/`;
})();

export type PublicProductKind = 'perfume' | 'accessory' | 'diffuseur';

export type PublicProductResult =
  | { status: 'found'; product: Record<string, unknown> }
  | { status: 'not-found' }
  | { status: 'unavailable'; error: unknown };

function getItems(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object');
  }

  if (!payload || typeof payload !== 'object') return [];

  const data = payload as Record<string, unknown>;
  const items = Array.isArray(data.results) ? data.results : data.resultats;
  return Array.isArray(items)
    ? items.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    : [];
}

function catalogUrl(endpoint: string, page: number, limit: number): URL {
  const url = new URL(endpoint, API_BASE_URL_WITH_VERSION);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  return url;
}

export async function fetchPublicCatalogPage(
  endpoint: string,
  page = 1,
  limit = 24,
): Promise<Record<string, unknown>[]> {
  const response = await fetch(catalogUrl(endpoint, page, limit), {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Public catalog request failed (${response.status}): ${endpoint}`);
  }

  return getItems(await response.json());
}

export async function fetchAllPublicCatalogItems(
  endpoint: string,
  maxItems = 50_000,
): Promise<Record<string, unknown>[]> {
  const items: Record<string, unknown>[] = [];
  const limit = 100;
  let page = 1;
  let nextUrl: URL | null = null;
  const seenPageUrls = new Set<string>();

  while (items.length < maxItems) {
    const url: URL = nextUrl ?? catalogUrl(endpoint, page, limit);
    if (seenPageUrls.has(url.href)) {
      throw new Error(`Catalog pagination repeated a page URL: ${endpoint}`);
    }
    seenPageUrls.add(url.href);

    const response = await fetch(url, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`Public catalog request failed (${response.status}): ${endpoint}`);
    }

    const payload: unknown = await response.json();
    const pageItems = getItems(payload);
    items.push(...pageItems.slice(0, maxItems - items.length));

    if (!pageItems.length || items.length >= maxItems) break;

    const data = payload && typeof payload === 'object' && !Array.isArray(payload)
      ? payload as Record<string, unknown>
      : null;
    const next = data?.next;
    if (typeof next === 'string' && next.length > 0) {
      const candidate: URL = new URL(next, url);
      if (candidate.origin !== new URL(API_BASE_URL_WITH_VERSION).origin) {
        throw new Error(`Catalog pagination returned an unexpected origin: ${endpoint}`);
      }
      nextUrl = candidate;
      continue;
    }
    nextUrl = null;

    const totalPages = Number(data?.pages ?? data?.total_pages ?? 0);
    const count = Number(data?.count ?? data?.total_count ?? data?.total ?? 0);

    if (totalPages > 0) {
      if (page >= totalPages) break;
    } else if (count > 0) {
      if (items.length >= count) break;
    } else if (pageItems.length < limit) {
      break;
    }

    page += 1;
  }

  return items;
}

export async function fetchPublicProduct(
  kind: PublicProductKind,
  slug: string,
): Promise<PublicProductResult> {
  const endpoint = {
    perfume: 'shop/parfums/',
    accessory: 'shop/accessoires/',
    diffuseur: 'shop/diffuseurs/',
  }[kind];

  try {
    const response = await fetch(new URL(`${endpoint}${encodeURIComponent(slug)}/`, API_BASE_URL_WITH_VERSION), {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });

    if (response.status === 404) return { status: 'not-found' };
    if (!response.ok) {
      throw new Error(`Product request failed (${response.status}): ${endpoint}`);
    }

    const payload: unknown = await response.json();
    if (!payload || typeof payload !== 'object') {
      throw new Error(`Product response was invalid: ${endpoint}`);
    }

    const data = payload as Record<string, unknown>;
    const product = data.parfum ?? data.accessoire ?? data.diffuseur ?? data.produit ?? data;
    if (!product || typeof product !== 'object') {
      throw new Error(`Product response did not contain a product: ${endpoint}`);
    }

    return { status: 'found', product: product as Record<string, unknown> };
  } catch (error) {
    return { status: 'unavailable', error };
  }
}
