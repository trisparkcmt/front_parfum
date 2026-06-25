/** Normalize Django/DRF error payloads into a user-facing string. */
export function extractApiError(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (!data) return fallback;

  if (typeof data === 'string') return data;

  if (Array.isArray(data)) {
    const messages = data.filter((item): item is string => typeof item === 'string');
    if (messages.length > 0) return messages.join('\n');
  }

  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    if (typeof obj.detail === 'string') return obj.detail;
    if (Array.isArray(obj.detail)) {
      return obj.detail.map(String).join('\n');
    }
    if (Array.isArray(obj.non_field_errors)) {
      return obj.non_field_errors.map(String).join('\n');
    }

    const parts = Object.entries(obj).map(([key, val]) => {
      if (Array.isArray(val)) return `${key}: ${val.map(String).join(', ')}`;
      return `${key}: ${String(val)}`;
    });
    if (parts.length > 0) return parts.join(' · ');
  }

  return fallback;
}
