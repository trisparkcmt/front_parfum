'use client';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

import { BackButton } from '@/components/ui/BackButton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthorized, isLoading } = useAuthGuard();
  const { user } = useAuthStore();

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-gold" size={32} />
          <p className="text-sm text-foreground/40">Chargement...</p>
        </div>
      </div>
    );
  }

  // Admin and Serveuse have their own layouts with sidebars, so just pass through
  const userRoles = user?.roles || (user?.role ? [user.role] : []);
  if (userRoles.includes('superadmin') || userRoles.includes('serveuse')) {
    return <>{children}</>;
  }

  // Client, Partner, Delivery get a simple dark layout
  return (
    <div className="min-h-screen bg-background">
      {/* <div className="bg-foreground/5 backdrop-blur-xl border-b border-[var(--t-border)] py-4 shadow-2xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="font-bold text-foreground text-lg">
              Tableau de Bord{' '}
              <span className="text-gold capitalize">
                {user?.role === 'delivery' ? 'Livreur' : user?.role === 'partner' ? 'Prestataire' : 'Client'}
              </span>
            </h1>
          </div>
          <Link 
            href={`/dashboard/${user?.role}/profile`}
            className="flex items-center gap-3 hover:bg-foreground/5 p-1.5 rounded-xl transition-colors group"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground group-hover:text-gold transition-colors">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-foreground/40">{user?.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-black text-xs font-bold shadow-lg shadow-gold/20 group-hover:scale-105 transition-transform">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
          </Link>
        </div>
      </div> */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}


