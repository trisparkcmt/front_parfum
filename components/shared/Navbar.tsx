'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { CartIcon, ProfileIcon } from '@/components/icons/CustomIcons';
import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { PUBLIC_NAV_LINKS } from '@/lib/constants';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartDrawerStore } from '@/store/useCartDrawerStore';
import { useThemeStore } from '@/store/useThemeStore';
import { Button } from '@/components/ui/Button';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ThemeToggle';
import { preloadGoogleIdentityScript } from '@/components/auth/GoogleAuthButton';

const NAV_LABEL_MAP: Record<string, { fr: string; en: string }> = {
  '/': { fr: 'Accueil', en: 'Home' },
  '/shop/accessories': { fr: 'Accessoires', en: 'Accessories' },
  '/shop/perfumes': { fr: 'Parfumerie', en: 'Perfumes' },
  '/shop/diffuseurs': { fr: 'Diffuseurs', en: 'Diffusers' },
  '/numba': { fr: 'Atelier Numba', en: 'Numba Workshop' },
};

const UI_DICT: Record<string, { fr: string; en: string }> = {
  profile: { fr: 'Profil', en: 'Profile' },
  login: { fr: 'Connexion', en: 'Login' },
  cart: { fr: 'Panier', en: 'Cart' },
  favorites: { fr: 'Favoris', en: 'Favorites' },
};

export function Navbar() {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const itemCount = useCartStore((s) => s.getItemCount());
  const openCartDrawer = useCartDrawerStore((s) => s.open);

  const theme = useThemeStore((s) => s.theme);
  const iconColor = theme === 'dark' ? 'text-white' : 'text-black';

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/delivery') || pathname.startsWith('/partner') || pathname.startsWith('/client');
  if (isDashboard || !mounted) return null;

  const glass = cn(
    'rounded-full border backdrop-blur-xl backdrop-saturate-150 shadow-md shadow-black/5 transition-colors duration-300',
    scrolled
      ? 'bg-white/90 border-black/15 shadow-lg dark:bg-zinc-900/70 dark:border-white/10'
      : 'bg-white/70 border-white/70 dark:bg-zinc-900/60 dark:border-white/10'
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className={cn('absolute inset-x-0 top-0 h-0.5 bg-gold transition-opacity duration-200', isNavigating ? 'opacity-100' : 'opacity-0')} />

      {/* MOBILE */}
      <div className="flex items-center lg:hidden bg-background border-b border-foreground/10 px-4 py-2.5 relative">
        <div className="flex items-center gap-1 flex-shrink-0">
          <LanguageSelector />
          {isAuthenticated && user ? (
            <Link
              href="/dashboard/profile"
              onClick={() => setIsNavigating(true)}
              className="flex items-center flex-shrink-0"
              aria-label={isEn ? UI_DICT.profile.en : UI_DICT.profile.fr}
            >
              <div className="flex items-center justify-center text-[10px] font-bold hover:scale-105 transition-transform">
                <ProfileIcon size={18} className={iconColor} />
              </div>
            </Link>
          ) : (
            <Link href="/login" onClick={() => { setIsNavigating(true); preloadGoogleIdentityScript(); }} className="flex-shrink-0">
              <Button className="text-[0.65rem] rounded-full " variant="secondary" size="sm">
                {isEn ? UI_DICT.login.en : UI_DICT.login.fr}
              </Button>
            </Link>
          )}
        </div>

        <div className="absolute left-1/2 -translate-x-1/2">
          <Link href="/" className="flex items-center group">
            <img
              src="/logo/Logo Accessoirs Exclusifs gold transparent.svg"
              alt="Accessoires Exclusifs"
              className="h-20 w-auto object-contain  group-hover:scale-105 transition-transform duration-300"
            />
          </Link>
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0 ml-auto">
          <ThemeToggle />
          <button
            onClick={openCartDrawer}
            className="relative p-1.5 flex items-center hover:bg-foreground/5 rounded-full transition-colors group"
            aria-label={isEn ? UI_DICT.cart.en : UI_DICT.cart.fr}
          >
            <CartIcon size={19} className={cn(iconColor, 'group-hover:text-gold transition-colors')} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gold text-deep-black text-[9px] font-bold flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* DESKTOP */}
      <nav className={cn('hidden lg:block transition-all duration-300', scrolled ? 'py-2.5' : 'py-4')}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between relative">
            <Link href="/" className={cn(glass, 'flex items-center gap-2 group flex-shrink-0 z-10 px-2')}>
              <img
                src="/logo/Logo only.svg"
                alt="Accessoires Exclusifs"
                className="h-24 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </Link>

            <div className={cn(glass, 'flex items-center gap-1 p-1.5 mx-auto')}>
              {PUBLIC_NAV_LINKS.map((link) => {
                const localizedLabel = NAV_LABEL_MAP[link.href]
                  ? (isEn ? NAV_LABEL_MAP[link.href].en : NAV_LABEL_MAP[link.href].fr)
                  : link.label;
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'relative px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200',
                      isActive ? 'text-gold' : 'text-zinc-900 dark:text-zinc-100 hover:text-gold'
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="navbar-active-pill"
                        className="absolute inset-0 rounded-full bg-gold/15 border border-gold/20"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative">{localizedLabel}</span>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2 z-10">
              <div className={cn(glass, 'p-1.5 flex items-center')}>
                <ThemeToggle />
              </div>

              <div className={cn(glass, 'p-1.5 flex items-center gap-0.5')}>
                <button
                  onClick={() => openCartDrawer()}
                  className="relative p-1.5 flex items-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  aria-label={isEn ? UI_DICT.cart.en : UI_DICT.cart.fr}
                >
                  <CartIcon size={19} className="text-zinc-900 dark:text-zinc-100 group-hover:text-gold transition-colors" />
                  {itemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gold text-deep-black text-[10px] font-bold flex items-center justify-center"
                    >
                      {itemCount}
                    </motion.span>
                  )}
                </button>

                <Link
                  href="/dashboard/client/favorites"
                  aria-label={isEn ? UI_DICT.favorites.en : UI_DICT.favorites.fr}
                  className="p-1.5 flex items-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <Heart size={19} className="text-zinc-900 dark:text-zinc-100 hover:text-gold transition-colors" />
                </Link>
              </div>

              <div className={cn(glass, 'p-1.5 flex items-center')}>
                <LanguageSelector />
              </div>

              {isAuthenticated && user ? (
                <Link
                  href="/dashboard/profile"
                  onClick={() => setIsNavigating(true)}
                  className={cn(glass, 'flex items-center justify-center p-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors group')}
                  aria-label={isEn ? UI_DICT.profile.en : UI_DICT.profile.fr}
                >
                  <div className="h-8 w-8 rounded-full bg-foreground/5 border border-foreground/10 dark:bg-white/10 dark:border-white/10 flex items-center justify-center text-foreground/80 group-hover:scale-105 transition-transform">
                    <ProfileIcon size={18} className="text-zinc-900 dark:text-zinc-100 group-hover:text-gold transition-colors" />
                  </div>
                </Link>
              ) : (
                <Link href="/login" onClick={() => { setIsNavigating(true); preloadGoogleIdentityScript(); }}>
                  <Button variant="secondary" size="sm" className={cn(glass, 'border-gold/30 text-gold hover:bg-gold/10')}>
                    {isEn ? UI_DICT.login.en : UI_DICT.login.fr}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}