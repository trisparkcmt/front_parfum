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

const NOTCH_TRANSITION = { type: 'spring' as const, stiffness: 420, damping: 34, mass: 0.7 };

const BottomNav = () => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => cancelAnimationFrame(frame);
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
        <div className="h-16 flex-1 rounded-[28px] border border-white/10 bg-deep-black/70 backdrop-blur-2xl" />
        <div className="h-16 w-16 shrink-0 rounded-[28px] border border-white/10 bg-deep-black/70 backdrop-blur-2xl" />
      </nav>
    );
  }

  return (
    <nav
      className="fixed bottom-5 left-4 right-4 z-[100] flex items-end md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div
        className="relative flex h-16 w-full items-center justify-between gap-0.5 px-2
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
                className="relative z-10 flex h-full flex-1 items-center justify-center"
              >
                {isActive ? (
                  <motion.div
                    layoutId="bottomNavNotch"
                    transition={NOTCH_TRANSITION}
                    className="absolute -top-7 left-1/2 -translate-x-1/2 flex h-[52px] w-[52px]
                               items-center justify-center rounded-full
                               border border-white/10 bg-deep-black/90 backdrop-blur-2xl
                               shadow-[0_10px_24px_rgba(0,0,0,0.55)]"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold
                                      shadow-[0_2px_14px_rgba(212,175,55,0.45)]">
                      <Icon size={20} strokeWidth={2.1} className="text-black" />
                    </span>
                  </motion.div>
                ) : (
                  <span className="text-foreground/55 transition-colors duration-200">
                    <Icon size={20} strokeWidth={1.8} />
                  </span>
                )}

                {isActive && (
                  <motion.span
                    layout
                    className="relative whitespace-nowrap text-[11px] font-semibold text-gold"
                  >
                    {label}
                  </motion.span>
                )}
              </Link>
            );
          })}

          <Link
            href={reelsHref}
            aria-label={t('nav_reels', 'Reels')}
            aria-current={reelsActive ? 'page' : undefined}
            className="relative z-10 flex h-full flex-1 items-center justify-center"
          >
            {reelsActive ? (
              <motion.div
                layoutId="bottomNavNotch"
                transition={NOTCH_TRANSITION}
                className="absolute -top-7 left-1/2 -translate-x-1/2 flex h-[52px] w-[52px]
                           items-center justify-center rounded-full
                           border border-white/10 bg-deep-black/90 backdrop-blur-2xl
                           shadow-[0_10px_24px_rgba(0,0,0,0.55)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold
                                  shadow-[0_2px_14px_rgba(212,175,55,0.45)]">
                  <Video size={18} strokeWidth={2.1} className="text-black" />
                </span>
              </motion.div>
            ) : (
              <span className="text-foreground/55 transition-colors duration-200">
                <Video size={20} strokeWidth={1.8} />
              </span>
            )}

            {reelsActive && (
              <motion.span
                layout
                className="relative whitespace-nowrap text-[11px] font-semibold text-gold"
              >
                {t('nav_reels', 'Reels')}
              </motion.span>
            )}
          </Link>
        </LayoutGroup>
      </div>
    </nav>
  );
};

export default BottomNav;