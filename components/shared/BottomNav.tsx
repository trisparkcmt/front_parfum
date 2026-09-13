'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { HomeIcon, DiffuseurIcon, PerfumeIcon, LaptopIcon } from '@/components/icons/CustomIcons';
import { Watch, Video } from 'lucide-react';

type BottomNavLink = {
  href: string;
  icon: typeof HomeIcon | typeof Watch | typeof PerfumeIcon | typeof DiffuseurIcon | typeof LaptopIcon | typeof Video;
  label: string;
};

const BottomNav = () => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const links: BottomNavLink[] = [
    { href: '/',                  icon: HomeIcon,      label: t('nav_home', 'Accueil') },
    { href: '/shop/accessories',  icon: Watch,         label: t('nav_accessories', 'Accessoires') },
    { href: '/shop/perfumes',     icon: PerfumeIcon,   label: t('nav_perfumes', 'Parfum') },
    { href: '/shop/diffuseurs',   icon: DiffuseurIcon, label: t('nav_diffuseurs', 'Diffuseurs') },
    { href: '/numba',             icon: LaptopIcon,    label: t('nav_atelier', 'Atelier') },
  ];

  const reelsHref = '/reels';
  const reelsActive = pathname === reelsHref || pathname.startsWith(`${reelsHref}/`);

  // Avoid hydration mismatch: render a stable shell until i18n is ready client-side
  if (!mounted) {
    return (
      <nav
        className="fixed bottom-5 left-4 right-4 z-[100] flex items-center gap-2 md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="h-[72px] flex-1 rounded-[28px] border border-white/10 bg-deep-black/70 backdrop-blur-2xl" />
        <div className="h-[72px] w-[72px] shrink-0 rounded-[28px] border border-white/10 bg-deep-black/70 backdrop-blur-2xl" />
      </nav>
    );
  }

  return (
    <nav
      className="fixed bottom-5 left-4 right-4 z-[100] flex items-center gap-2 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Main glass pill */}
      <div
        className="relative flex h-[72px] flex-1 items-stretch justify-between gap-0.5 px-1.5
                   rounded-[28px] border border-white/10
                   bg-deep-black/70 backdrop-blur-2xl
                   shadow-[0_8px_32px_rgba(0,0,0,0.55)]
                   before:absolute before:inset-0 before:rounded-[28px]
                   before:bg-gradient-to-b before:from-white/[0.06] before:to-transparent
                   before:pointer-events-none"
      >
        <LayoutGroup id="bottom-nav">
          {links.map(({ href, icon: Icon, label }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className="relative z-10 flex flex-1 items-center justify-center"
              >
                <motion.div
                  layout
                  transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.7 }}
                  className="relative flex w-full flex-col items-center justify-center gap-1 rounded-2xl py-2"
                >
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavActivePill"
                      className="absolute inset-0 rounded-2xl bg-gold/95
                                 shadow-[0_2px_14px_rgba(212,175,55,0.35)]"
                      transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.7 }}
                    />
                  )}

                  <span
                    className={`relative shrink-0 transition-colors duration-200 ${
                      isActive ? 'text-black' : 'text-foreground/60'
                    }`}
                  >
                    <Icon size={19} strokeWidth={isActive ? 2.1 : 1.8} />
                  </span>

                  <span
                    className={`relative whitespace-nowrap text-[9px] font-semibold leading-none tracking-tight transition-colors duration-200 ${
                      isActive ? 'text-black' : 'text-foreground/50'
                    }`}
                  >
                    {label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </LayoutGroup>
      </div>

      {/* Detached Reels pill */}
      <Link
        href={reelsHref}
        aria-label={t('nav_reels', 'Reels')}
        aria-current={reelsActive ? 'page' : undefined}
        className="relative z-10 flex h-[72px] w-[72px] shrink-0 items-center justify-center
                   rounded-[28px] border border-white/10
                   bg-deep-black/70 backdrop-blur-2xl
                   shadow-[0_8px_32px_rgba(0,0,0,0.55)]
                   before:absolute before:inset-0 before:rounded-[28px]
                   before:bg-gradient-to-b before:from-white/[0.06] before:to-transparent
                   before:pointer-events-none"
      >
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.7 }}
          className="relative flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2"
        >
          {reelsActive && (
            <motion.div
              layoutId="bottomNavReelsPill"
              className="absolute inset-0 rounded-2xl bg-gold/95
                         shadow-[0_2px_14px_rgba(212,175,55,0.35)]"
              transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.7 }}
            />
          )}

          <span
            className={`relative shrink-0 transition-colors duration-200 ${
              reelsActive ? 'text-black' : 'text-foreground/60'
            }`}
          >
            <Video size={19} strokeWidth={reelsActive ? 2.1 : 1.8} />
          </span>

          <span
            className={`relative whitespace-nowrap text-[9px] font-semibold leading-none tracking-tight transition-colors duration-200 ${
              reelsActive ? 'text-black' : 'text-foreground/50'
            }`}
          >
            {t('nav_reels', 'Reels')}
          </span>
        </motion.div>
      </Link>
    </nav>
  );
};

export default BottomNav;