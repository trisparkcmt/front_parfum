'use client';

import { useTranslation } from 'react-i18next';

export default function EditorialQuote() {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

  return (
    <section
      className="relative px-4 my-15 lg:px-10 pt-20 pb-10 lg:pt-28 lg:pb-16 border-y border-foreground/10 bg-cover bg-center overflow-hidden min-h-[400px] flex flex-col justify-end"
      style={{
        backgroundImage: "url('/hero.png')",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/90 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-4xl text-center w-full">
        <p className="text-[10px] tracking-[0.3em] uppercase text-gold mb-6">
          {isEn ? 'Our Philosophy' : 'Notre philosophie'}
        </p>
        <h2 className="font-serif text-3xl lg:text-5xl leading-tight text-gold">
          {isEn
            ? '“Luxury isn’t a price tag—it’s an emotion, a signature, an elevated way of life.”'
            : '« Le luxe n\'est pas un prix. C\'est une émotion, une signature, une manière d\'habiter le quotidien. »'}
        </h2>
      </div>
    </section>
  );
}