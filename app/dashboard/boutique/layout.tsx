'use client';

import { useEffect, useState } from 'react';
import BoutiqueSidebar from '@/components/admin/BoutiqueSidebar';
import Header from '@/components/admin/Header';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAuthStore } from '@/store/useAuthStore';
import { boutiqueService } from '@/services/apiService';
import { Loader2 } from 'lucide-react';

export default function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  const { isAuthorized, isLoading } = useAuthGuard();
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [boutiqueAccess, setBoutiqueAccess] = useState<{ userId: string; allowed: boolean } | null>(null);
  const pathname = usePathname();
  const userRoles = user?.roles || (user?.role ? [user.role] : []);
  const hasPrivilegedRole = userRoles.includes('partner') || userRoles.includes('superadmin');
  const isClient = userRoles.includes('client');

  useEffect(() => {
    if (!isAuthorized || !user?.id || hasPrivilegedRole || !isClient) return;
    let isCurrent = true;
    boutiqueService.getPortefeuille()
      .then(() => {
        if (isCurrent) setBoutiqueAccess({ userId: user.id, allowed: true });
      })
      .catch(() => {
        if (isCurrent) setBoutiqueAccess({ userId: user.id, allowed: false });
      });
    return () => { isCurrent = false; };
  }, [isAuthorized, user?.id, hasPrivilegedRole, isClient]);

  const accessChecked = boutiqueAccess?.userId === user?.id;
  const ownsBoutique = accessChecked && boutiqueAccess?.allowed === true;
  const isCheckingBoutique = !hasPrivilegedRole && isClient && !accessChecked;
  const canAccessBoutique = hasPrivilegedRole || ownsBoutique;

  useEffect(() => {
    if (!isLoading && isAuthorized && !isCheckingBoutique && !canAccessBoutique) {
      router.replace('/dashboard/profile');
    }
  }, [isLoading, isAuthorized, isCheckingBoutique, canAccessBoutique, router]);

  if (isLoading || !isAuthorized || isCheckingBoutique || !canAccessBoutique) {
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
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
