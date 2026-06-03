'use client';

/**
 * @file components/shared/Footer.tsx
 * @description Global Application Footer.
 *
 * This component provides site-wide brand information, navigation links, 
 * and trust-building elements for the Accessories Exclusif platform.
 * 
 * **Main Modules**:
 * - **Brand Identity**: Displays the logo and a short localized description of the "Exclusif" luxury philosophy.
 * - **Navigation Columns**: Organizes links into logical groups (Boutique, Atelier, Service Client, Légal).
 * - **Contact & Social**: Provides direct access to the brand's social media profiles and customer support email.
 * - **Localization**: Displays current copyright information and ensures all text is in French.
 * 
 * **UI Design**: Uses a `glass-dark` aesthetic with subtle gold accents to maintain the platform's high-end feel.
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gem, Camera, Globe, MessageCircle, Mail, MapPin, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <footer className="hidden md:block bg-[var(--t-footer-bg)] h-[400px]" />;

  return (
    <footer className="hidden md:block bg-[var(--t-footer-bg)] text-foreground border-t border-[var(--t-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Gem className="h-7 w-7 text-gold" />
              <span className="font-display text-lg font-bold">
                <span className="text-gold">Accessories</span>{' '}
                <span className="text-zinc-900 dark:text-zinc-100">Exclusif</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t('brand_description', 'Votre destination luxe pour accessoires premium et parfums d\'exception.')}
            </p>
            <div className="flex gap-3">
          <a href="https://www.instagram.com/accessories_exclusif" target="_blank" rel="noopener noreferrer" className="p-2 bg-foreground/5 hover:bg-gold/10 hover:text-gold transition-colors" aria-label="Instagram">
                <Camera size={18} />
              </a>
          <a href="https://www.facebook.com/accessories.exclusif" target="_blank" rel="noopener noreferrer" className="p-2 bg-foreground/5 hover:bg-gold/10 hover:text-gold transition-colors" aria-label="Facebook">
                <Globe size={18} />
              </a>
              <a href="https://wa.me/237680254243" target="_blank" rel="noopener noreferrer" className="p-2 bg-foreground/5 hover:bg-gold/10 hover:text-gold transition-colors">
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className='flex flex-col'>
            <h4 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 uppercase tracking-wider">{t('navigation', 'Navigation')}</h4>
            <ul className="space-y-3">
              {[
                { label: t('nav_home'), href: '/' },
                { label: t('nav_accessories'), href: '/shop/accessories' },
                { label: t('nav_perfumes'), href: '/shop/perfumes' },
                { label: t('nav_atelier'), href: '/numba' },
                { label: t('cart'), href: '/cart' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 uppercase tracking-wider">Services</h4>
            <ul className="space-y-3 text-zinc-600 dark:text-zinc-400">
              {[
                t('perfume_brand', 'Parfums de Marque'),
                t('perfume_dupe', 'Dupes Premium'),
                t('numba_creation', 'Créations Numba'),
                t('custom_perfume', 'Parfum sur Mesure'),
                t('ai_advisor', 'Sommelier IA'),
              ].map((item) => (
                <li key={item} className="text-sm">{item}</li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 uppercase tracking-wider">Contact</h4>
            <ul className="space-y-3 text-zinc-600 dark:text-zinc-400">
              <li className="flex items-center gap-2 text-sm">
                <Phone size={14} className="text-gold" />
                <span>+237 680 254 243</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Mail size={14} className="text-gold" />
                <a href="mailto:contact@accessoiresexclusif.cm" className="hover:text-gold transition-colors">contact@accessoiresexclusif.cm</a>
              </li>
              <li className="flex items-start gap-2 text-sm ">
                <MapPin size={14} className="text-gold mt-0.5" />
                <span>Douala, Cameroun</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500">
            © {new Date().getFullYear()} Accessories Exclusif. {t('all_rights_reserved', 'Tous droits réservés.')}
          </p>
          <p className="text-xs text-zinc-500">
            {t('made_with', 'Fait avec')} ✨ {t('in_cameroon', 'au Cameroun')}
          </p>
        </div>
      </div>
    </footer>
  );
}
