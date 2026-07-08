'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function DualPromoBanners() {
  const { t } = useTranslation();

  const banners = [
    {
      tag: t('limited_offer', { defaultValue: 'Offre limitée' }),
      title: t('spring_sale', { defaultValue: 'Soldes Printemps\nJusqu’à -50%' }),
      cta: t('shop_sale', { defaultValue: 'Voir les soldes' }),
      href: '/shop?promo=1',
      img: '/promo/spring.jpg',
    },
    {
      tag: t('new_arrivals', { defaultValue: 'Nouveautés' }),
      title: t('fresh_styles', { defaultValue: 'Nouvelles créations\ndéjà en boutique' }),
      cta: t('explore_new', { defaultValue: 'Explorer' }),
      href: '/shop?sort=newest',
      img: '/promo/new.jpg',
    },
  ];

  return (
    <section className="px-4 lg:px-10 pb-16 lg:pb-24">
      <div className="mx-auto max-w-7xl grid md:grid-cols-2 gap-3 lg:gap-5">
        {banners.map((b, i) => (
          <div key={i} className="relative overflow-hidden rounded-xl border border-foreground/10 aspect-[16/10] group">
            <Image src={b.img} alt="" fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
            <div className="relative h-full flex flex-col justify-center p-6 lg:p-10 max-w-[60%]">
              <span className="text-[10px] tracking-[0.25em] uppercase text-foreground/60 mb-3">{b.tag}</span>
              <h3 className="font-serif text-2xl lg:text-4xl text-foreground whitespace-pre-line leading-tight mb-6">{b.title}</h3>
              <Link
                href={b.href}
                className="inline-flex w-fit items-center gap-2 rounded-full bg-deep-black text-white px-5 py-2.5 text-sm hover:bg-gold hover:text-deep-black transition-colors"
              >
                {b.cta}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
