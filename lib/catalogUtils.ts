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
