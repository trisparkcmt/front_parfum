'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import BottomNav from "@/components/shared/BottomNav";
import { useThemeStore } from '@/store/useThemeStore';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { initTheme } = useThemeStore();
  const { syncCart } = useCartStore();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Defer i18n initialization until after first paint
    const timer = setTimeout(() => {
      import("@/lib/i18n");
      setHydrated(true);
    }, 0);
    return () => clearTimeout(timer);
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

  return (
    <div className="flex flex-col min-h-screen">
      {!shouldHideNav && (
        <div className="hidden lg:block">
          <Navbar />
        </div>
      )}
      <main className={`flex-1 ${!shouldHideNav ? 'pb-28 lg:pb-0' : ''}`}>
        {children}
      </main>
      {!shouldHideNav && (
        <div className="lg:hidden">
          <BottomNav />
        </div>
      )}
      {!shouldHideFooter && hydrated && <Footer />}
    </div>
  );
}