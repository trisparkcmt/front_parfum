'use client';

import Link from 'next/link';
import { Shield, Store, Truck, Users, ShoppingCart } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { getRoleDashboardPath } from '@/lib/roleUtils';
import type { UserRole } from '@/types';

export default function DashboardSelectorPage() {
  const { t, i18n } = useTranslation();
  const { isAuthorized, isLoading } = useAuthGuard();
  const user = useAuthStore((s) => s.user);

  const ROLE_LABELS: Record<UserRole, string> = {
    superadmin: t('dashboard_role_superadmin', { defaultValue: i18n.language?.startsWith('en') ? 'Superadmin' : 'Superadmin' }),
    serveuse: t('dashboard_role_serveuse', { defaultValue: i18n.language?.startsWith('en') ? 'Sales Associate' : 'Serveuse' }),
    partner: t('dashboard_role_partner', { defaultValue: i18n.language?.startsWith('en') ? 'Partner' : 'Prestataire' }),
    delivery: t('dashboard_role_delivery', { defaultValue: i18n.language?.startsWith('en') ? 'Delivery Agent' : 'Livreur' }),
    client: t('dashboard_role_client', { defaultValue: i18n.language?.startsWith('en') ? 'Client' : 'Client' }),
  };

  const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
    superadmin: t('dashboard_role_superadmin_desc', { defaultValue: i18n.language?.startsWith('en') ? 'Overall platform management.' : 'Gestion globale de la plateforme.' }),
    serveuse: t('dashboard_role_serveuse_desc', { defaultValue: i18n.language?.startsWith('en') ? 'Store and catalog management.' : 'Gestion boutique et catalogue.' }),
    partner: t('dashboard_role_partner_desc', { defaultValue: i18n.language?.startsWith('en') ? 'Track commissions and affiliate sales.' : 'Suivi commissions et ventes affiliées.' }),
    delivery: t('dashboard_role_delivery_desc', { defaultValue: i18n.language?.startsWith('en') ? 'Track and execute deliveries.' : 'Suivi et exécution des livraisons.' }),
    client: t('dashboard_role_client_desc', { defaultValue: i18n.language?.startsWith('en') ? 'Orders, favorites and client profile.' : 'Commandes, favoris et profil client.' }),
  };

  const ROLE_ICONS: Record<UserRole, ReactNode> = {
    superadmin: <Shield size={18} />,
    serveuse: <Store size={18} />,
    partner: <Users size={18} />,
    delivery: <Truck size={18} />,
    client: <Store size={18} />,
  };

  if (isLoading || !isAuthorized || !user) return null;

  const roles = user.roles || (user.role ? [user.role] : ['client']);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('dashboard_spaces', { defaultValue: i18n.language?.startsWith('en') ? 'Your spaces' : 'Vos espaces' })}</h1>
        <p className="text-sm text-foreground/50 mt-1">{t('dashboard_choose_role', { defaultValue: i18n.language?.startsWith('en') ? 'Choose the dashboard that matches your role.' : 'Choisissez le dashboard correspondant à votre rôle.' })}</p>
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

        {roles.includes('serveuse') && (
          <Link
            href="/dashboard/pos"
            className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3 text-gold mb-2">
              <ShoppingCart size={18} />
              <span className="font-semibold">{t('dashboard_pos', { defaultValue: i18n.language?.startsWith('en') ? 'Point of Sale' : 'Point de Vente' })}</span>
            </div>
            <p className="text-sm text-foreground/60">{t('dashboard_pos_desc', { defaultValue: i18n.language?.startsWith('en') ? 'Direct sales interface (POS).' : 'Interface de vente en direct (POS).' })}</p>
          </Link>
        )}
      </div>
    </div>
  );
}
