'use client';

import { useState } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import Header from '@/components/admin/Header';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  
  const isProfilePage = pathname === '/dashboard/admin/profile';

  if (isProfilePage) {
    return (
      <div className="min-h-screen bg-background p-6 overflow-y-auto">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background font-[family-name:var(--font-geist-sans)]">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

