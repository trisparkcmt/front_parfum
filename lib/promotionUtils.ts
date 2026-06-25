/** Convert ISO datetime to value for `<input type="datetime-local" />`. */
export function toDatetimeLocalValue(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Convert datetime-local input value to ISO string for the API. */
export function fromDatetimeLocalValue(local?: string): string | null {
  if (!local) return null;
  const date = new Date(local);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function formatPromotionPeriod(dateDebut?: string | null, dateFin?: string | null): string {
  if (!dateDebut && !dateFin) return '';
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  if (dateDebut && dateFin) return `${fmt(dateDebut)} → ${fmt(dateFin)}`;
  if (dateDebut) return `À partir du ${fmt(dateDebut)}`;
  return `Jusqu'au ${fmt(dateFin!)}`;
}

export function isPromotionConfigured(fields: {
  taux_reduction?: string | number | null;
  prix_promotionnel?: string | number | null;
  date_debut?: string | null;
  date_fin?: string | null;
}): boolean {
  const rate = parseFloat(String(fields.taux_reduction ?? '0'));
  const promoPrice = parseFloat(String(fields.prix_promotionnel ?? '0'));
  return rate > 0 || promoPrice > 0 || Boolean(fields.date_debut) || Boolean(fields.date_fin);
}
