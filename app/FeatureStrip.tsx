'use client';

import { Truck, RotateCcw, ShieldCheck, Headphones } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function FeatureStrip() {
  const { t } = useTranslation();
  const items = [
    { icon: Truck, title: t('feat_ship', { defaultValue: 'Livraison offerte' }), desc: t('feat_ship_desc', { defaultValue: 'Dès 99€ d’achat' }) },
    { icon: RotateCcw, title: t('feat_ret', { defaultValue: 'Retours faciles' }), desc: t('feat_ret_desc', { defaultValue: '30 jours pour changer d’avis' }) },
    { icon: ShieldCheck, title: t('feat_pay', { defaultValue: 'Paiement sécurisé' }), desc: t('feat_pay_desc', { defaultValue: '100% protégé' }) },
    { icon: Headphones, title: t('feat_sup', { defaultValue: 'Support 24/7' }), desc: t('feat_sup_desc', { defaultValue: 'Une équipe à votre écoute' }) },
  ];
  return (
    <section className="px-4 lg:px-10 pb-16 lg:pb-24">
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
