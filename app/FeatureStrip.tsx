'use client';

import { Truck, RotateCcw, ShieldCheck, Headphones,Star,Medal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function FeatureStrip() {
  const { t } = useTranslation();
  const items = [
    { icon: Truck, title: t('feat_ship', { defaultValue: 'Livraison ultra rapide' }), desc: t('feat_ship_desc', { defaultValue: '' }) },
    { icon: RotateCcw, title: t('feat_ret', { defaultValue: 'Retours faciles' }), desc: t('feat_ret_desc', { defaultValue: '30 jours pour changer d’avis' }) },
    { icon: Headphones, title: t('feat_sup', { defaultValue: 'Support 24/7' }), desc: t('feat_sup_desc', { defaultValue: 'Une équipe à votre écoute' }) },
    { icon: Medal, title: t('feat_rev', { defaultValue: 'Programme de fidélité' }), desc: t('feat_rev_desc', { defaultValue: 'points fidélité' }) },
  ];
  return (
    <section className="px-4 lg:px-10 pb-7 lg:pb-10">
      <div className="mx-auto max-w-7xl grid grid-cols-2 lg:grid-cols-4 gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6 lg:p-8">
        {items.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-center gap-4">
            <div className="size-11 rounded-full bg-gold/10 text-gold flex items-center justify-center shrink-0">
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="text-xs text-foreground/60">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
