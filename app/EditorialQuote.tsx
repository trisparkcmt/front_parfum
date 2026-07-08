'use client';

import { useTranslation } from 'react-i18next';

export default function EditorialQuote() {
  const { t } = useTranslation();
  return (
    <section className="px-4 mb-15 mt-15 lg:px-10 py-20 lg:py-28 border-y border-foreground/10 
    bg-[linear-gradient(rgba(0,0,0,0.5)_0%,rgba(0,0,0,0.5)_100%),url('/hero.png')] bg-cover bg-center">
   
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase text-gold mb-6">
          {t('our_philosophy', { defaultValue: 'Notre philosophie' })}
        </p>
        <h2 className="font-serif text-3xl lg:text-5xl leading-tight text-foreground">
          {t('quote', {
            defaultValue:
              '« Le luxe n’est pas un prix. C’est une émotion, une signature, une manière d’habiter le quotidien. »',
          })}
        </h2>
      </div>
    </section>
  );
}
