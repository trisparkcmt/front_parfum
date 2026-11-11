'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import BottomNav from "@/components/shared/BottomNav";
import { TabletDock } from "@/components/shared/TabletDock";
import { CartDrawer } from "@/components/shared/CartDrawer";
import { CookieConsentBanner } from "@/components/shared/CookieConsentBanner";
import { useThemeStore } from '@/store/useThemeStore';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartDrawerStore } from '@/store/useCartDrawerStore';
import { PullToRefresh } from '@/components/pwa/PullToRefresh';
import '@/lib/i18n';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { initTheme } = useThemeStore();
  const { syncCart } = useCartStore();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const { isOpen: cartDrawerOpen, close: closeCartDrawer } = useCartDrawerStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  // Sync cart automatically on app/page mount/refresh if user is logged in
  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      syncCart().catch((e: unknown) => console.warn('Failed to auto-sync cart:', e));
    }
  }, [_hasHydrated, isAuthenticated, syncCart]);

  // Hide Navbar and Footer on dashboard and auth routes
  const isDashboard = pathname?.startsWith('/dashboard');
  const isAuth = pathname === '/login' || pathname === '/register';
  const isAtelier = pathname === '/numba/atelier';
  const isAiConsultant = pathname === '/numba/ai-consultant';
  const shouldHideNav = isDashboard || isAuth || isAtelier || isAiConsultant;
  const shouldHideFooter = shouldHideNav;
  const canPullToRefresh = !isDashboard && !isAuth;

  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col overflow-x-clip">
      <PullToRefresh enabled={canPullToRefresh} onRefresh={() => window.location.reload()} />
      {!shouldHideNav && (
        <header className="hidden h-32 w-full shrink-0 items-center justify-center border-b border-foreground/10 bg-background px-4 py-0 tablet:flex nav:hidden">
          <Link href="/" aria-label="Accessoires Exclusifs - Accueil" className="flex items-center justify-center">
            <img
              src="/logo/Longo only2.svg"
              alt="Accessoires Exclusifs"
              className="h-28 w-auto object-contain"
            />
          </Link>
        </header>
      )}
      {!shouldHideNav && (
        <Navbar />
      )}
      <main className={`w-full min-w-0 flex-1 ${!shouldHideNav ? 'pb-32 tablet:pb-24 nav:pb-0' : ''}`}>
        {children}
      </main>
      {!shouldHideNav && (
        <div className="tablet:hidden nav:hidden">
          <BottomNav />
        </div>
      )}
      {!shouldHideNav && <TabletDock />}
      {!shouldHideFooter && hydrated && <Footer />}
      {/* Cookie Consent Banner — only on public pages */}
      {!shouldHideNav && <CookieConsentBanner />}
      {/* Global Cart Drawer — available on all pages */}
      <CartDrawer isOpen={cartDrawerOpen} onClose={closeCartDrawer} />
    </div>
  );
}