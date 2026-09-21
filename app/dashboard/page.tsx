'use client';

import Link from 'next/link';
import { Shield, Store, Truck, ShoppingCart } from 'lucide-react';
import type { ReactNode } from 'react';

function PartnerIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M255.366,141.046c-7.4,3.583-14.732,8.548-21.533,15.357c-34.091,34.098-65.081,65.088-65.081,65.088 l0.013,0.02c-0.185,0.186-0.371,0.338-0.557,0.53c-8.824,8.831-9.174,22.909-1.025,32.146c0.323,0.371,0.668,0.736,1.025,1.086 c9.161,9.174,24.036,9.196,33.232,0l35.797-35.797c6.176,2.263,12.248,3.583,18.074,4.243c7.937,0.88,15.392,0.55,22.022-0.385 c16.162-2.29,14.47-1.623,23.844-4.704c9.353-3.068,19.862-9.354,19.862-9.354l6.362,6.355 c0.701,0.681,16.919,16.925,25.192,25.185c1.465,1.471,2.709,2.682,3.542,3.549c0.956,0.997,2.022,1.719,2.682,2.682l41.278,41.279 c11.898-13.35,25.488-33.232,23.81-56.058L320.763,129.14C320.763,129.14,285.062,126.589,255.366,141.046z"/>
      <path d="M261.115,394.362c-9.134-9.147-23.961-9.147-33.101,0l-6.794,6.794c9.119-9.132,9.112-23.926-0.021-33.066 c-9.14-9.126-23.947-9.126-33.087,0.007c9.14-9.133,9.14-23.94,0-33.087c-9.133-9.148-23.947-9.133-33.087,0 c9.14-9.133,9.14-23.947,0-33.095c-9.134-9.132-23.947-9.132-33.088,0.014l-20.46,20.453c-9.14,9.147-9.14,23.947,0,33.094 c9.133,9.134,23.941,9.134,33.08,0c-9.14,9.134-9.14,23.947,0,33.087c9.147,9.133,23.954,9.133,33.094,0 c-9.14,9.133-9.14,23.941,0,33.088c9.14,9.133,23.947,9.133,33.088,0l6.802-6.809c-9.119,9.147-9.113,23.94,0.02,33.081 c9.14,9.132,23.947,9.132,33.088,0l20.467-20.468C270.248,418.302,270.248,403.495,261.115,394.362z"/>
      <path d="M507.987,178.28L387.543,57.822c-5.351-5.337-14.002-5.337-19.339,0l-38.631,38.63 c-5.337,5.337-5.337,13.989,0,19.333l120.458,120.451c5.33,5.35,13.996,5.35,19.326,0l38.63-38.638 C513.338,192.276,513.338,183.624,507.987,178.28z M473.655,204.992c-5.75,5.736-15.048,5.736-20.777,0 c-5.735-5.743-5.735-15.041,0-20.777c5.729-5.736,15.027-5.736,20.777,0C479.391,189.951,479.384,199.249,473.655,204.992z"/>
      <path d="M182.417,99.864l-38.624-38.63c-5.336-5.337-13.995-5.337-19.332,0L4.003,181.691 c-5.337,5.323-5.337,13.989,0,19.319l38.631,38.644c5.33,5.331,14.002,5.331,19.325,0l120.458-120.458 C187.761,113.859,187.761,105.207,182.417,99.864z M59.118,208.403c-5.736,5.729-15.04,5.729-20.777,0 c-5.735-5.742-5.735-15.041,0-20.777c5.736-5.735,15.041-5.735,20.777,0C64.854,193.362,64.854,202.66,59.118,208.403z"/>
      <path d="M397.528,312.809l-7.468-7.482l-72.509-72.509l-4.883,2.166l-5.316,1.919l-0.384,0.117 c-0.936,0.296-9.684,2.971-26.932,5.412c-9.12,1.273-18.156,1.431-26.904,0.434c-3.459-0.385-6.898-0.95-10.296-1.692 l-27.757,27.744c-16.678,16.678-43.836,16.678-60.514,0c-0.585-0.591-1.149-1.19-1.671-1.781l-0.179-0.2 c-10.529-11.939-13.204-28.28-8.252-42.461l10.673-16.609l-0.02-0.02l65.081-65.074c2.647-2.641,5.426-5.103,8.314-7.428 c-20.281-3.982-37.296-2.806-37.296-2.806L88.093,235.679c-1.389,18.988,11.651,39.799,20.928,51.952 c16.692-15.963,43.239-15.756,59.641,0.654c6.107,6.1,9.952,13.617,11.574,21.498c7.895,1.637,15.406,5.475,21.513,11.582 c6.107,6.114,9.952,13.631,11.575,21.519c7.888,1.623,15.412,5.46,21.513,11.568c4.078,4.078,7.152,8.783,9.222,13.817 c11.1-0.137,22.242,4.016,30.688,12.455c16.65,16.636,16.643,43.733,0,60.363l-6.809,6.822l3.411,3.412 c9.148,9.147,23.954,9.147,33.095,0c9.14-9.134,9.14-23.947,0-33.088l6.808,6.83c9.147,9.133,23.947,9.133,33.087,0 c9.14-9.147,9.147-23.954,0-33.101c9.147,9.147,23.947,9.147,33.087,0c9.134-9.126,9.154-23.94,0-33.088 c9.154,9.148,23.954,9.148,33.088,0c9.147-9.132,9.147-23.947,0-33.08L397.528,312.809z"/>
    </svg>
  );
}
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
    partner: <PartnerIcon className="h-[18px] w-[18px]" />,
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
