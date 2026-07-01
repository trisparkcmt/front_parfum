'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import BottomNav from "@/components/shared/BottomNav";
import { useThemeStore } from '@/store/useThemeStore';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import "@/lib/i18n";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { initTheme } = useThemeStore();
  const { syncCart } = useCartStore();
  const { isAuthenticated, _hasHydrated } = useAuthStore();

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

  return (
    <div className="flex flex-col min-h-screen">
      {/*
        Navbar is rendered ONLY from the `lg` breakpoint upward.
        Navbar.tsx still contains its own internal `lg:hidden` mobile grid
        (kept intact, non-destructive per request), but wrapping the whole
        component in `hidden lg:block` here means that mobile grid never
        actually mounts — BottomNav remains the only nav surface on mobile.
      */}
      {!shouldHideNav && (
        <div className="hidden lg:block">
          <Navbar />
        </div>
      )}

      {/*
        Navbar is `fixed top-0`, so on desktop the page content needs top
        padding to clear it (its own inner height is h-15/h-16 depending on
        scroll state). This padding only applies at `lg`+, mobile is
        untouched since Navbar never renders there.
        On mobile, we also add pb-28 to clear the floating BottomNav.
      */}
      <main className={`flex-1 ${!shouldHideNav ? 'lg:pt-16 pb-28 lg:pb-0' : ''}`}>
        {children}
      </main>

      {!shouldHideNav && (
        <div className="lg:hidden">
          <BottomNav />
        </div>
      )}
      {!shouldHideFooter && <Footer />}
    </div>
  );
}