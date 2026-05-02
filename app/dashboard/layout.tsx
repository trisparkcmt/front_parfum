'use client';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthorized, isLoading } = useAuthGuard();
  const { user } = useAuthStore();

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-gold" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-charcoal border-b border-white/5 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="font-display text-xl font-bold">
            Tableau de Bord <span className="text-gold capitalize">{user?.role === 'delivery' ? 'Livreur' : user?.role}</span>
          </h1>
          <div className="text-sm text-foreground/60">
            Connecté en tant que <span className="text-white font-medium">{user?.firstName} {user?.lastName}</span>
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
