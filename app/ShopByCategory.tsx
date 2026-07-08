'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CATEGORIES = [
  { key: 'women', title: 'Parfums Femme', href: '/shop/perfumes?gender=feminine', img: '/categories/women.jpg' },
  { key: 'men', title: 'Parfums Homme', href: '/shop/perfumes?gender=masculine', img: '/categories/men.jpg' },
  { key: 'dupes', title: 'Nos Dupes', href: '/shop/perfumes?type=dupe', img: '/categories/dupes.jpg' },
  { key: 'access', title: 'Accessoires', href: '/shop/accessories', img: '/categories/access.jpg' },
];

export default function ShopByCategory() {
  const { t } = useTranslation();
  return (
    <section className="px-4 lg:px-10 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs tracking-[0.25em] uppercase text-foreground/50 mb-2">
              {t('shop_by_category', { defaultValue: 'Shop by category' })}
            </p>
            <h2 className="font-serif text-3xl lg:text-5xl text-foreground leading-tight">
              {t('find_your_style', { defaultValue: 'Trouvez votre style' })}
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden md:inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-gold transition-colors"
          >
            {t('view_all_categories', { defaultValue: 'Voir toutes les catégories' })}
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
          {CATEGORIES.map((c) => (
            <Link
              key={c.key}
              href={c.href}
              className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-foreground/10"
            >
              <Image
                src={c.img}
                alt={c.title}
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep-black/80 via-deep-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                <h3 className="font-serif text-lg lg:text-2xl text-white">{c.title}</h3>
                <span className="mt-2 inline-flex items-center gap-1.5 text-xs lg:text-sm text-gold">
                  {t('explore_now', { defaultValue: 'Découvrir' })}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
