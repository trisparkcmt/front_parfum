'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import BottomNav from "@/components/shared/BottomNav";
import { useThemeStore } from '@/store/useThemeStore';
import "@/lib/i18n";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  // Hide Navbar and Footer on dashboard and auth routes
  const isDashboard = pathname?.startsWith('/dashboard');
  const isAuth = pathname === '/login' || pathname === '/register';
  const isAtelier = pathname === '/numba/atelier';
  const isAiConsultant = pathname === '/numba/ai-consultant';
  const shouldHideNav = isDashboard || isAuth || isAtelier || isAiConsultant;
  const shouldHideFooter = shouldHideNav;

  return (
    <div className="flex flex-col min-h-screen">
      {!shouldHideNav && !isAtelier && <Navbar />}
      <main className="flex-1">
        {children}
      </main>
      {!shouldHideNav && <BottomNav />}
      {!shouldHideFooter && <Footer />}
    </div>
  );
}