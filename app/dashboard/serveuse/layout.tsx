'use client';

import { useState, useEffect } from 'react';
import ServeuseSidebar from '@/components/admin/ServeuseSidebar';
import Header from '@/components/admin/Header';
import { usePathname } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Loader2 } from 'lucide-react';
import { useOrderNotificationStore } from '@/store/useOrderNotificationStore';

export default function ServeuseLayout({ children }: { children: React.ReactNode }) {
  const { isAuthorized, isLoading } = useAuthGuard(['superadmin', 'serveuse']);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { fetchPendingOrders, requestNotificationPermission } = useOrderNotificationStore();

  useEffect(() => {
    if (isAuthorized && !isLoading) {
      requestNotificationPermission();
      fetchPendingOrders();
      const interval = setInterval(fetchPendingOrders, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthorized, isLoading, fetchPendingOrders, requestNotificationPermission]);
  const pathname = usePathname();

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-gold" size={32} />
      </div>
    );
  }
  
  const isProfilePage = pathname === '/dashboard/serveuse/profile';

  if (isProfilePage) {
    return (
      <div className="min-h-screen bg-background p-6 overflow-y-auto">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background font-[family-name:var(--font-geist-sans)]">
      <ServeuseSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
