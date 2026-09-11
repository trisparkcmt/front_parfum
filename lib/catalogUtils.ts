/** Normalize paginated or array API responses from shop/lab endpoints. */
export function extractCatalogList<T = unknown>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.results)) return obj.results as T[];
    if (Array.isArray(obj.resultats)) return obj.resultats as T[];
  }
  return [];
}

export function extractCatalogCount(data: unknown, fallbackLength = 0): number {
  if (data && typeof data === 'object' && 'count' in data) {
    const count = (data as { count?: number }).count;
    if (typeof count === 'number') return count;
  }
  return fallbackLength;
}

/**
 * Parse a server-side paginated envelope and return items + pagination metadata.
 * Handles the API shape: { count, pages, page_actuelle, resultats: [...] }
 */
export function extractCatalogMeta<T = unknown>(data: unknown): {
  items: T[];
  total: number;
  pages: number;
  currentPage: number;
} {
  const items = extractCatalogList<T>(data);
  if (!data || typeof data !== 'object') {
    return { items, total: items.length, pages: 1, currentPage: 1 };
  }
  const obj = data as Record<string, unknown>;
  const total = typeof obj.count === 'number' ? obj.count : items.length;
  const pages = typeof obj.pages === 'number' ? Math.max(1, obj.pages) : Math.max(1, Math.ceil(total / 50));
  const currentPage = typeof obj.page_actuelle === 'number' ? obj.page_actuelle : 1;
  return { items, total, pages, currentPage };
}

export async function fetchAllCatalogPages<T = unknown>(
  fetchPage: (page: number) => Promise<unknown>
): Promise<T[]> {
  const allItems: T[] = [];
  let page = 1;

  while (true) {
    const data = await fetchPage(page);
    const items = extractCatalogList<T>(data);
    allItems.push(...items);

    const nextUrl = data && typeof data === 'object' ? (data as Record<string, unknown>).next : null;
    if (Array.isArray(data) || !data || typeof data !== 'object' || !('next' in data) || !nextUrl || items.length === 0) {
      break;
    }

    page += 1;
  }

  return allItems;
}
