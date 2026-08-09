'use client';

import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/store/useThemeStore';

export default function EditorialQuote() {
  const { t } = useTranslation();
  const theme = useThemeStore((s) => s.theme);

  return (
    <section
      className="relative px-4 my-15 lg:px-10 pt-20 pb-10 lg:pt-28 lg:pb-16 border-y border-foreground/10 bg-cover bg-center overflow-hidden min-h-[400px] flex flex-col justify-end"
      style={{
        backgroundImage: "url('/hero.png')",
      }}
    >
      {/* Vertical gradient overlay (Transparent at top -> Black at bottom) */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/90 pointer-events-none" />

      {/* Content wrapper aligned to the bottom */}
      <div className="relative z-10 mx-auto max-w-4xl text-center w-full">
        <p className="text-[10px] tracking-[0.3em] uppercase text-gold mb-6">
          {t('our_philosophy', { defaultValue: 'Notre philosophie' })}
        </p>
        <h2 className="font-serif text-3xl lg:text-5xl leading-tight text-gold">
          {t('quote', {
            defaultValue:
              '« Le luxe n\'est pas un prix. C\'est une émotion, une signature, une manière d\'habiter le quotidien. »',
          })}
        </h2>
      </div>
    </section>
  );
}