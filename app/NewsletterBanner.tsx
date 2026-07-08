'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function NewsletterBanner() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');

  return (
    <section className="px-4 lg:px-10 pb-20 lg:pb-28">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.03] grid md:grid-cols-2">
        <div className="relative aspect-[4/3] md:aspect-auto min-h-[280px]">
          <Image src="/promo/newsletter.jpg" alt="" fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" />
        </div>
        <div className="p-8 lg:p-14 flex flex-col justify-center">
          <span className="text-[10px] tracking-[0.25em] uppercase text-foreground/60 mb-3">
            {t('news_tag', { defaultValue: '-10% sur votre 1ère commande' })}
          </span>
          <h3 className="font-serif text-3xl lg:text-4xl text-foreground mb-3">
            {t('news_title', { defaultValue: 'Rejoignez notre univers' })}
          </h3>
          <p className="text-sm text-foreground/60 mb-6 max-w-md">
            {t('news_desc', { defaultValue: 'Inscrivez-vous pour recevoir en avant-première nos nouveautés, offres exclusives et inspirations.' })}
          </p>
          <form
            onSubmit={(e) => { e.preventDefault(); /* wire to your service */ }}
            className="flex flex-col sm:flex-row gap-2 max-w-md"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('news_placeholder', { defaultValue: 'Votre email' })}
              className="flex-1 h-11 rounded-full px-5 bg-background border border-foreground/15 text-sm text-foreground focus:outline-none focus:border-gold"
            />
            <button
              type="submit"
              className="h-11 rounded-full px-6 bg-deep-black text-white text-sm hover:bg-gold hover:text-deep-black transition-colors"
            >
              {t('subscribe', { defaultValue: 'S’inscrire' })}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
