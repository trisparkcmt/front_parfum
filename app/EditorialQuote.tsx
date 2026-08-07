'use client';

import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/store/useThemeStore';

export default function EditorialQuote() {
  const { t } = useTranslation();
  const theme = useThemeStore((s) => s.theme);

  return (
    <section
      className="px-4 mb-15 mt-15 lg:px-10 py-20 lg:py-28 border-y border-foreground/10 bg-cover bg-center"
      style={{
        backgroundImage: "url('/hero.png')",
      }}
    >
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase text-gold mb-6">
          {t('our_philosophy', { defaultValue: 'Notre philosophie' })}
        </p>
        <h2 className="font-serif text-3xl lg:text-5xl leading-tight text-gold">
          {t('quote', {
            defaultValue:
              `'« Le luxe n'est pas un prix. C'est une émotion, une signature, une manière d'habiter le quotidien. »'`,
          })}
        </h2>
      </div>
    </section>
  );
}
