'use client';

import { useState } from 'react';
import BoutiqueSidebar from '@/components/admin/BoutiqueSidebar';
import Header from '@/components/admin/Header';
import { usePathname } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Loader2 } from 'lucide-react';

export default function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  const { isAuthorized, isLoading } = useAuthGuard(['partner', 'superadmin']);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-gold" size={32} />
      </div>
    );
  }

  const isProfilePage = pathname === '/dashboard/boutique/profile';

  if (isProfilePage) {
    return (
      <div className="min-h-screen bg-background p-6 overflow-y-auto">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background font-[family-name:var(--font-geist-sans)]">
      <BoutiqueSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
