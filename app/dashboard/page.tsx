'use client';

import Link from 'next/link';
import { Shield, Store, Truck, Users, ShoppingCart } from 'lucide-react';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { getRoleDashboardPath } from '@/lib/roleUtils';
import type { UserRole } from '@/types';

const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Superadmin',
  serveuse: 'Serveuse',
  partner: 'Prestataire',
  delivery: 'Livreur',
  client: 'Client',
};

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  superadmin: 'Gestion globale de la plateforme.',
  serveuse: 'Gestion boutique et catalogue.',
  partner: 'Suivi commissions et ventes affiliées.',
  delivery: 'Suivi et exécution des livraisons.',
  client: 'Commandes, favoris et profil client.',
};

const ROLE_ICONS: Record<UserRole, ReactNode> = {
  superadmin: <Shield size={18} />,
  serveuse: <Store size={18} />,
  partner: <Users size={18} />,
  delivery: <Truck size={18} />,
  client: <Store size={18} />,
};

export default function DashboardSelectorPage() {
  const { isAuthorized, isLoading } = useAuthGuard();
  const user = useAuthStore((s) => s.user);

  if (isLoading || !isAuthorized || !user) return null;

  const roles = user.roles || (user.role ? [user.role] : ['client']);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Vos espaces</h1>
        <p className="text-sm text-foreground/50 mt-1">Choisissez le dashboard correspondant a votre role.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => (
          <Link
            key={role}
            href={getRoleDashboardPath(role)}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3 text-gold mb-2">
              {ROLE_ICONS[role]}
              <span className="font-semibold">{ROLE_LABELS[role]}</span>
            </div>
            <p className="text-sm text-foreground/60">{ROLE_DESCRIPTIONS[role]}</p>
          </Link>
        ))}

        {/* POS Option - Show for serveuse only */}
        {roles.includes('serveuse') && (
          <Link
            href="/dashboard/pos"
            className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3 text-gold mb-2">
              <ShoppingCart size={18} />
              <span className="font-semibold">Point de Vente</span>
            </div>
            <p className="text-sm text-foreground/60">Interface de vente en direct (POS).</p>
          </Link>
        )}
      </div>
    </div>
  );
}
