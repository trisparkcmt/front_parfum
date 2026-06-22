'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {  Store, Truck, ShoppingCart } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useToastStore } from '@/store/useToastStore';
import { useOrderNotificationStore } from '@/store/useOrderNotificationStore';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { 
  User, Mail, Phone, Shield, Calendar, Edit2, Lock, 
  LayoutDashboard, Globe, Sun, Palette, ChevronRight, LogOut, Loader2, Grid
} from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import PasswordChangeModal from '@/components/shared/PasswordChangeModal';
import ProfileEditModal from '@/components/shared/ProfileEditModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { getRoleDashboardPath } from '@/lib/roleUtils';
import type { UserRole } from '@/types';

interface DashboardOption {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  roles: UserRole[];
}

const DASHBOARD_OPTIONS: DashboardOption[] = [
  {
    id: 'client',
    title: 'Espace Client',
    description: 'Suivi de vos commandes, créations et favoris.',
    href: '/dashboard/client',
    icon: '📦',
    roles: ['client'],
  },
  {
    id: 'delivery',
    title: 'Espace Livreur',
    description: 'Suivi et exécution de vos livraisons assignées.',
    href: '/dashboard/delivery',
    icon: '🚗',
    roles: ['delivery'],
  },
  {
    id: 'partner',
    title: 'Espace Prestataire',
    description: 'Suivi de vos commissions et ventes affiliées.',
    href: '/dashboard/partner',
    icon: '🤝',
    roles: ['partner'],
  },
  {
    id: 'serveuse',
    title: 'Espace Boutique / Serveuse',
    description: 'Gestion des commandes, catalogue et laboratoire.',
    href: '/dashboard/serveuse/dashboard',
    icon: '🛒',
    roles: ['serveuse'],
  },
  {
    id: 'admin',
    title: 'Administration',
    description: 'Gestion globale de la plateforme, utilisateurs et livreurs.',
    href: '/dashboard/admin/dashboard',
    icon: '👑',
    roles: ['superadmin'],
  },
];

export default function UnifiedProfilePage() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const router = useRouter();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLanguageChange = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      addToast(t('logout_error', { defaultValue: 'Erreur lors de la déconnexion' }), 'error');
      setIsLoggingOut(false);
    }
  };

  // Get active roles for the user
  const userRoles = user?.roles || (user?.role ? [user.role] : ['client']);

  // Filter dashboard options based on user's roles
  const accessibleDashboards = DASHBOARD_OPTIONS.filter((dashboard) =>
    dashboard.roles.some((role) => userRoles.includes(role))
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      <BackButton />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('profile', 'Mon Profil')}</h1>
          <p className="text-sm text-foreground/50 mt-0.5">
            Gérez vos informations personnelles et accédez à vos différents espaces
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Basic Info Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 text-center shadow-xl backdrop-blur-md">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-black text-3xl font-bold shadow-xl shadow-gold/20">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <button 
                onClick={() => setShowEditModal(true)}
                className="absolute bottom-0 right-0 p-1.5 bg-background rounded-full border border-white/10 text-foreground/40 hover:text-gold shadow-sm transition-colors"
              >
                <Edit2 size={14} className="text-foreground/50" />
              </button>
            </div>
            
            <h2 className="text-lg font-bold text-foreground">{user?.firstName} {user?.lastName}</h2>
            <div className="flex flex-wrap gap-1.5 justify-center mt-2">
              {userRoles.map((role) => (
                <span 
                  key={role} 
                  className="text-[10px] font-semibold text-gold bg-gold/10 px-2.5 py-1 rounded-full uppercase tracking-tight"
                >
                  {role === 'superadmin' ? 'Admin' : role}
                </span>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 text-left space-y-4 text-sm">
              <div className="flex items-center gap-3 text-foreground/70">
                <Mail size={16} className="text-foreground/50 shrink-0" />
                <span className="truncate">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-foreground/70">
                <Phone size={16} className="text-foreground/50 shrink-0" />
                <span>{user?.phone || t('not_provided', 'Non fourni')}</span>
              </div>
              {user?.createdAt && (
                <div className="flex items-center gap-3 text-foreground/70">
                  <Calendar size={16} className="text-foreground/50 shrink-0" />
                  <span>
                    Depuis le {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                    })}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              disabled={isLoggingOut}
              className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/10 transition-all disabled:opacity-50"
            >
              <LogOut size={16} />
              {t('logout', 'Déconnexion')}
            </button>
          </div>
        </div>

        {/* Right Column: Dashboards List & Settings Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Dashboard Spaces selection */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-xl backdrop-blur-md">
            <h3 className="font-bold text-foreground text-lg mb-4 flex items-center gap-2">
              <Grid size={18} className="text-gold" />
              Vos Espaces & Tableaux de Bord
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              {accessibleDashboards.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => router.push(opt.href)}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:border-gold/30 hover:bg-white/[0.05] transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{opt.icon}</span>
                    <div>
                      <p className="font-semibold text-sm text-foreground group-hover:text-gold transition-colors">
                        {opt.title}
                      </p>
                      <p className="text-xs text-foreground/50 mt-0.5">
                        {opt.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-foreground/20 group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
              {/* POS Option - Show for serveuse only */}
        {userRoles.includes('serveuse') && (
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

          {/* Preferences and settings */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-xl backdrop-blur-md">
            <h3 className="font-semibold text-foreground text-lg mb-4">{t('settings', 'Préférences')}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-gold border border-white/5">
                    <Globe size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('language', 'Langue')}</p>
                    <p className="text-xs text-foreground/50">Choisissez votre langue / Language</p>
                  </div>
                </div>
                <button 
                  onClick={handleLanguageChange}
                  className="text-xs bg-white/5 text-foreground px-3 py-1.5 rounded-lg font-medium hover:bg-white/10 border border-white/10 transition-colors"
                >
                  {i18n.language === 'fr' ? 'Français' : 'English'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-gold border border-white/5">
                    {theme === 'dark' ? <Sun size={18} /> : <Palette size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('appearance', 'Apparence')}</p>
                    <p className="text-xs text-foreground/50">Basculez entre le mode clair et sombre</p>
                  </div>
                </div>
                <button 
                  onClick={toggleTheme}
                  className="text-xs bg-white/5 text-foreground px-3 py-1.5 rounded-lg font-medium hover:bg-white/10 border border-white/10 transition-colors"
                >
                  {theme === 'dark' ? 'Mode Sombre' : 'Mode Clair'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-gold border border-white/5">
                    <Lock size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('change_password', 'Changer le mot de passe')}</p>
                    <p className="text-xs text-foreground/45">Mettez à jour la sécurité de votre compte</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="text-xs bg-white/5 text-foreground px-3 py-1.5 rounded-lg font-medium hover:bg-white/10 border border-white/10 transition-colors"
                >
                  Modifier
                </button>
              </div>

              {/* Order Notification Toggle */}
              <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-gold border border-white/5 bg-opacity-5">
                    🔔
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Notifications des Commandes</p>
                    <p className="text-xs text-foreground/50">Activer les alertes sonores et push de nouvelles commandes</p>
                  </div>
                </div>
                <button 
                  onClick={() => useOrderNotificationStore.getState().toggleNotifications()}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
                    useOrderNotificationStore(state => state.notificationsEnabled)
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                      : 'bg-white/5 text-foreground/40 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {useOrderNotificationStore(state => state.notificationsEnabled) ? 'Activé' : 'Désactivé'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
      <ProfileEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title={t('confirm_logout_title', 'Déconnexion')}
        message={t('confirm_logout', 'Êtes-vous sûr de vouloir vous déconnecter ?')}
        confirmText={t('logout_btn', 'Déconnexion')}
        cancelText={t('cancel', 'Annuler')}
        variant="danger"
        isLoading={isLoggingOut}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
