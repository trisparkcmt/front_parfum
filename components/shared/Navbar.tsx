'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { CartIcon, ProfileIcon } from '@/components/icons/CustomIcons';
import { Clapperboard, FlaskConical, Gem, Heart, House, Sparkles, Wind, type LucideIcon } from 'lucide-react';
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
import { MobileOfflineBanner } from './OfflineBanner';
import { useNotificationCountStore } from '@/store/useNotificationCountStore';

const NAV_LABEL_MAP: Record<string, { fr: string; en: string }> = {
  '/': { fr: 'Accueil', en: 'Home' },
  '/shop/accessories': { fr: 'Accessoires', en: 'Accessories' },
  '/shop/perfumes': { fr: 'Parfumerie', en: 'Perfumes' },
  '/shop/diffuseurs': { fr: 'Diffuseurs', en: 'Diffusers' },
  '/reels': { fr: 'Reels', en: 'Reels' },
  '/numba': { fr: 'Numba', en: 'Numba' },
};

const UI_DICT: Record<string, { fr: string; en: string }> = {
  profile: { fr: 'Profil', en: 'Profile' },
  login: { fr: 'Connexion', en: 'Login' },
  cart: { fr: 'Panier', en: 'Cart' },
  favorites: { fr: 'Favoris', en: 'Favorites' },
};

const NAV_ICONS: Record<string, LucideIcon> = {
  '/': House,
  '/shop/accessories': Gem,
  '/shop/perfumes': Sparkles,
  '/shop/diffuseurs': Wind,
  '/reels': Clapperboard,
  '/numba': FlaskConical,
};

function DockLink({
  href,
  label,
  Icon,
  isActive,
  mouseX,
}: {
  href: string;
  label: string;
  Icon: LucideIcon;
  isActive: boolean;
  mouseX: MotionValue<number>;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const distance = useTransform(mouseX, (value) => {
    const bounds = ref.current?.getBoundingClientRect();
    return bounds ? value - bounds.left - bounds.width / 2 : Infinity;
  });
  const sizeSync = useTransform(distance, [-150, 0, 150], [44, 64, 44]);
  const size = useSpring(sizeSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <motion.div style={{ width: size, height: size }} className="relative flex shrink-0 items-center justify-center">
      <Link
        ref={ref}
        href={href}
        onClick={(event) => {
          if (isActive) {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
        className={`relative flex h-full w-full items-center justify-center rounded-xl transition-colors ${
          isActive ? 'bg-gold/15 text-gold' : 'text-foreground/70 hover:text-gold'
        }`}
      >
        <Icon size={22} strokeWidth={1.8} />
        <motion.span
          initial={{ opacity: 0, y: 8, scale: 0.9 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 8, scale: isHovered ? 1 : 0.9 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-foreground/10 bg-background/95 px-2.5 py-1 text-xs text-foreground shadow-lg backdrop-blur-md"
        >
          {label}
        </motion.span>
      </Link>
      {isActive && <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-gold" />}
    </motion.div>
  );
}

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const { i18n } = useTranslation();
  const isEn = mounted && i18n.language?.startsWith('en');

  const pathname = usePathname();
  const mouseX = useMotionValue(Infinity);

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const itemCount = useCartStore((s) => s.getItemCount());
  const openCartDrawer = useCartDrawerStore((s) => s.open);
  const unreadNotificationCount = useNotificationCountStore((s) => s.unreadNotificationCount);
  const fetchCounts = useNotificationCountStore((s) => s.fetchCounts);

  const theme = useThemeStore((s) => s.theme);
  const iconColor = theme === 'dark' ? 'text-white' : 'text-black';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchCounts();
  }, [fetchCounts, isAuthenticated]);

  const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/delivery') || pathname.startsWith('/partner') || pathname.startsWith('/client');
  if (isDashboard) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Mobile offline banner — sits between phone status bar and nav content */}
      <div className="nav:hidden">
        <MobileOfflineBanner />
      </div>
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gold opacity-0" />

      {/* MOBILE */}
      <div className="flex items-center nav:hidden bg-background border-b border-foreground/10 px-4 py-2.5 relative">
        <div className="flex items-center gap-3  flex-shrink-0">
          <LanguageSelector />
          {isAuthenticated && user ? (
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2 flex-shrink-0"
              aria-label={isEn ? UI_DICT.profile.en : UI_DICT.profile.fr}
            >
              <div className="flex items-center justify-center text-[10px] font-bold hover:scale-105 transition-transform">
                <ProfileIcon size={18} className={iconColor} />
              </div>
              {isAuthenticated && unreadNotificationCount > 0 && (
                <span className="min-w-4 h-4 px-1 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center leading-none shrink-0">
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </span>
              )}
            </Link>
          ) : (
            <Link href="/login" onClick={() => { preloadGoogleIdentityScript(); }} className="flex-shrink-0">
              <Button className="text-[0.65rem] rounded-full " variant="secondary" size="sm" suppressHydrationWarning>
                {isEn ? UI_DICT.login.en : UI_DICT.login.fr}
              </Button>
            </Link>
          )}
        </div>

        <div className="absolute left-1/2 -translate-x-1/2">
          <Link
            href="/"
            onClick={(e) => {
              if (pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="flex-shrink-0 flex items-center group relative z-10"
          >
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

      {/* DESKTOP DOCK */}
      <motion.nav
        aria-label={isEn ? 'Main navigation' : 'Navigation principale'}
        onMouseMove={(event) => mouseX.set(event.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
        className="fixed bottom-5 left-1/2 z-[100] hidden h-[76px] w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-end gap-1.5 rounded-2xl border border-foreground/15 bg-background/85 px-3 pb-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.35)] backdrop-blur-2xl nav:flex"
      >
        {PUBLIC_NAV_LINKS.map((link) => {
          const label = NAV_LABEL_MAP[link.href]
            ? (isEn ? NAV_LABEL_MAP[link.href].en : NAV_LABEL_MAP[link.href].fr)
            : link.label;
          const Icon = NAV_ICONS[link.href];
          const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);

          return Icon ? (
            <DockLink
              key={link.href}
              href={link.href}
              label={label}
              Icon={Icon}
              isActive={isActive}
              mouseX={mouseX}
            />
          ) : null;
        })}

        <span aria-hidden="true" className="mx-1 mb-2 h-8 w-px shrink-0 bg-foreground/15" />

        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center" title={isEn ? 'Shopping cart' : 'Panier'}>
          <button
            type="button"
            onClick={openCartDrawer}
            className="relative flex h-full w-full items-center justify-center rounded-xl text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-gold"
            aria-label={isEn ? UI_DICT.cart.en : UI_DICT.cart.fr}
          >
            <CartIcon size={21} />
            {itemCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-deep-black"
              >
                {itemCount}
              </motion.span>
            )}
          </button>
        </div>

        <Link
          href="/dashboard/client/favorites"
          aria-label={isEn ? UI_DICT.favorites.en : UI_DICT.favorites.fr}
          title={isEn ? UI_DICT.favorites.en : UI_DICT.favorites.fr}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-gold"
        >
          <Heart size={20} />
        </Link>

        <div className="flex h-11 shrink-0 items-center justify-center" title={isEn ? 'Language' : 'Langue'}>
          <LanguageSelector />
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center" title={isEn ? 'Change theme' : 'Changer de thème'}>
          <ThemeToggle />
        </div>

        {isAuthenticated && user ? (
          <Link
            href="/dashboard/profile"
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-gold"
            aria-label={isEn ? UI_DICT.profile.en : UI_DICT.profile.fr}
            title={isEn ? UI_DICT.profile.en : UI_DICT.profile.fr}
          >
            <ProfileIcon size={20} />
            {unreadNotificationCount > 0 && (
              <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
                {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
              </span>
            )}
          </Link>
        ) : (
          <Link
            href="/login"
            onClick={() => preloadGoogleIdentityScript()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-gold"
            aria-label={isEn ? UI_DICT.login.en : UI_DICT.login.fr}
            title={isEn ? UI_DICT.login.en : UI_DICT.login.fr}
          >
            <ProfileIcon size={20} />
          </Link>
        )}
      </motion.nav>
    </header>
  );
}