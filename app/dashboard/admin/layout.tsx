'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import Header from '@/components/admin/Header';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Loader2 } from 'lucide-react';
import { useOrderNotificationStore } from '@/store/useOrderNotificationStore';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthorized, isLoading } = useAuthGuard(['superadmin']);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { fetchPendingOrders, requestNotificationPermission } = useOrderNotificationStore();

  useEffect(() => {
    if (isAuthorized && !isLoading) {
      requestNotificationPermission();
      fetchPendingOrders();
      const interval = setInterval(fetchPendingOrders, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthorized, isLoading, fetchPendingOrders, requestNotificationPermission]);

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-gold" size={32} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background font-[family-name:var(--font-geist-sans)]">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
