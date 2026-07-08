'use client';

import { useTranslation } from 'react-i18next';

export default function EditorialQuote() {
  const { t } = useTranslation();
  return (
    <section className="px-4 lg:px-10 py-5 lg:py-5 border-y border-foreground/10 bg-foreground/[0.02]">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="font-serif text-3xl lg:text-5xl leading-tight text-foreground">
          {t('quote', {
            defaultValue:
              '« Bienvenue chez accessoires exclusifs. »',
          })}
        </h2>
      </div>
    </section>
  );
}