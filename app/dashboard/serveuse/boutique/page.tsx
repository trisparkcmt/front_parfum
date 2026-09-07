'use client';

import { useTranslation } from 'react-i18next';

export default function BoutiquePage() {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl w-full rounded-3xl border border-white/10 bg-background/80 p-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">{t('shop_page_title', { defaultValue: i18n.language?.startsWith('en') ? 'Shop' : 'Boutique' })}</h1>
        <p className="mt-3 text-sm text-foreground/60">{t('page_coming_soon', { defaultValue: i18n.language?.startsWith('en') ? 'This page will be available soon.' : 'Cette page sera bientôt disponible.' })}</p>
      </div>
    </div>
  );
}
