'use client';

/**
 * @file app/profile/page.tsx
 * @description User profile management, security options, PWA install actions, and role-based dashboard access.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Mail, Phone, MapPin, Shield, Calendar, Edit2, Lock,
  Globe, Sun, Moon, Palette, ChevronRight, LogOut, Loader2,
  LayoutGrid, ShoppingCart, Bell, Sparkles, BadgeCheck, Download,
  Heart, Info,
} from 'lucide-react';

import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useToastStore } from '@/store/useToastStore';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { api } from '@/services/api';
import { attemptPWAInstall, isPWAInstalled as checkPWAInstalled, isIOS, isAndroid } from '@/lib/pwa';
import { triggerTestNotification } from '@/services/notifications';

import { BackButton } from '@/components/ui/BackButton';
import { Modal } from '@/components/ui/Modal';
import PasswordChangeModal from '@/components/shared/PasswordChangeModal';
import ProfileEditModal from '@/components/shared/ProfileEditModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import type { UserRole } from '@/types';
import { ThemeToggle } from '@/app/Toggle';

/* ------------------------------------------------------------------ */
/*  Helpers & Shared Primitives                                       */
/* ------------------------------------------------------------------ */

function cx(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-1 mb-3">
      <span className="text-[10px] font-semibold text-foreground/35 uppercase tracking-wider">
        {children}
      </span>
      <span className="h-px flex-1 bg-foreground/10" />
    </div>
  );
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cx('rounded-xl shadow-black/30  shadow-sm border border-foreground/10 bg-foreground/[0.03]', className)}>
      {children}
    </div>
  );
}

function StatusBadge({ role }: { role: string }) {
  const isEn = i18n.language?.startsWith('en');
  
  const getRoleLabel = (r: string) => {
    switch (r) {
      case 'superadmin':
        return 'Admin';
      case 'client':
        return isEn ? 'Client' : 'Client';
      case 'delivery':
        return isEn ? 'Courier' : 'Livreur';
      case 'partner':
        return isEn ? 'Partner' : 'Prestataire';
      case 'serveuse':
        return isEn ? 'Store Staff' : 'Boutique';
      default:
        return r;
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset text-gold bg-gold/10 ring-gold/20 uppercase tracking-wider">
      <span className="h-1.5 w-1.5 rounded-full bg-gold" />
      {getRoleLabel(role)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboards                                                        */
/* ------------------------------------------------------------------ */

interface DashboardOption {
  id: string;
  titleKey: string;
  defaultTitle: string;
  descKey: string;
  defaultDesc: string;
  href: string;
  icon: string;
  roles: UserRole[];
}

const DASHBOARD_OPTIONS: DashboardOption[] = [
  {
    id: 'client',
    titleKey: 'dashboard_client_title',
    defaultTitle: 'Espace Client',
    descKey: 'dashboard_client_desc',
    defaultDesc: 'Suivi de vos commandes, créations et favoris.',
    href: '/dashboard/client',
    icon: '📦',
    roles: ['client'],
  },
  {
    id: 'delivery',
    titleKey: 'dashboard_delivery_title',
    defaultTitle: 'Espace Livreur',
    descKey: 'dashboard_delivery_desc',
    defaultDesc: 'Suivi et exécution de vos livraisons assignées.',
    href: '/dashboard/delivery',
    icon: '🚗',
    roles: ['delivery'],
  },
  {
    id: 'partner',
    titleKey: 'dashboard_partner_title',
    defaultTitle: 'Espace Prestataire',
    descKey: 'dashboard_partner_desc',
    defaultDesc: 'Suivi de vos commissions et ventes affiliées.',
    href: '/dashboard/partner',
    icon: '🤝',
    roles: ['partner'],
  },
  {
    id: 'serveuse',
    titleKey: 'dashboard_serveuse_title',
    defaultTitle: 'Espace Boutique / Serveuse',
    descKey: 'dashboard_serveuse_desc',
    defaultDesc: 'Gestion des commandes, catalogue et laboratoire.',
    href: '/dashboard/serveuse/dashboard',
    icon: '🛒',
    roles: ['serveuse'],
  },
  {
    id: 'admin',
    titleKey: 'dashboard_admin_title',
    defaultTitle: 'Administration',
    descKey: 'dashboard_admin_desc',
    defaultDesc: 'Gestion globale de la plateforme, utilisateurs et livreurs.',
    href: '/dashboard/admin/dashboard',
    icon: '👑',
    roles: ['superadmin'],
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t, i18n } = useTranslation();
  const { addToast } = useToastStore();
  const router = useRouter();

  const isEn = i18n.language?.startsWith('en');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPWAHelp, setShowPWAHelp] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isApplyingPartner, setIsApplyingPartner] = useState(false);
  const [isInstallingPWA, setIsInstallingPWA] = useState(false);
  const [isSendingTestNotification, setIsSendingTestNotification] = useState(false);

  const isPWAInstalled = checkPWAInstalled();

  const handleInstallPWA = async () => {
    setIsInstallingPWA(true);
    try {
      const result = await attemptPWAInstall();
      if (result === 'accepted') {
        addToast(
          t('pwa_install_success', {
            defaultValue: isEn
              ? 'App installed! Open it from your home screen.'
              : 'Application installée, ouvrez-la depuis l’écran d’accueil',
          }),
          'success'
        );
      } else if (result === 'installed') {
        addToast(
          t('pwa_already_installed', {
            defaultValue: isEn ? 'App is already installed' : 'L’application est déjà installée',
          }),
          'info'
        );
      } else if (result === 'dismissed') {
        addToast(
          t('pwa_install_cancelled', {
            defaultValue: isEn ? 'Installation cancelled' : 'Installation annulée',
          }),
          'info'
        );
      } else {
        setShowPWAHelp(true);
      }
    } catch (error) {
      console.error('PWA install error:', error);
      setShowPWAHelp(true);
    } finally {
      setIsInstallingPWA(false);
    }
  };

  const userRoles: UserRole[] =
    user?.roles || (user?.role ? [user.role] : (['client'] as UserRole[]));
  const isPartner = userRoles.includes('partner');
  const isStaff = userRoles.some((r) => ['serveuse', 'superadmin', 'delivery'].includes(r));

  const accessibleDashboards = DASHBOARD_OPTIONS.filter((d) =>
    d.roles.some((role) => userRoles.includes(role))
  );

  /* ----- handlers ----- */
  const handleLanguageChange = () => {
    i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr');
  };

  const handleBecomePartner = async () => {
    setIsApplyingPartner(true);
    try {
      const res = await api.post('/auth/prestataire/apply/');
      addToast(
        res.data.detail ||
          t('become_partner_request_sent', {
            defaultValue: isEn
              ? 'Partner application submitted successfully.'
              : 'Demande de partenariat envoyée avec succès.',
          }),
        'success'
      );
    } catch (err: any) {
      addToast(
        err.response?.data?.detail ||
          t('become_partner_error', {
            defaultValue: isEn
              ? 'An application is already pending or you are already a partner.'
              : 'Une demande est déjà en cours ou vous êtes déjà prestataire.',
          }),
        'error'
      );
    } finally {
      setIsApplyingPartner(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/');
    } catch (err) {
      console.error(err);
      addToast(
        t('logout_error', { defaultValue: isEn ? 'Error during logout' : 'Erreur lors de la déconnexion' }),
        'error'
      );
      setIsLoggingOut(false);
    }
  };

  const handleTestNotification = async () => {
    setIsSendingTestNotification(true);
    try {
      const sent = await triggerTestNotification(
        isEn ? 'Notification Test' : 'Test de notification',
        isEn
          ? 'This notification confirms push messaging is correctly configured.'
          : 'Cette notification confirme que l’affichage push est bien prêt.'
      );

      if (sent) {
        addToast(
          t('notification_sent', {
            defaultValue: isEn ? 'Test notification sent.' : 'Notification de test envoyée.',
          }),
          'success'
        );
      } else {
        addToast(
          t('notification_permission_denied', {
            defaultValue: isEn
              ? 'Notification permission was not granted.'
              : 'La permission de notification n’a pas été accordée.',
          }),
          'error'
        );
      }
    } catch (error) {
      console.error(error);
      addToast(
        t('notification_error', {
          defaultValue: isEn
            ? 'Unable to send test notification.'
            : 'Impossible d’envoyer la notification de test.',
        }),
        'error'
      );
    } finally {
      setIsSendingTestNotification(false);
    }
  };

  /* ----- derived ----- */
  const initials =
    `${user?.firstName?.charAt(0) ?? ''}${user?.lastName?.charAt(0) ?? ''}`.toUpperCase() || 'U';
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(isEn ? 'en-US' : 'fr-FR', {
        year: 'numeric',
        month: 'long',
      })
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
      <BackButton href="/" />

      {/* ============ DESKTOP MAIN GRID LAYOUT (12 Columns) ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ============================================================ */}
        {/* LEFT / SIDEBAR COLUMN (4 cols on Desktop) - Identity & Profile */}
        {/* ============================================================ */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          {/* USER PROFILE CARD */}
          <Panel className="p-6">
            <div className="flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold text-3xl font-bold">
                  {initials}
                </div>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="absolute -bottom-1 -right-1 rounded-lg p-1.5 border border-foreground/10 bg-background text-foreground/45 hover:text-gold hover:border-gold/30 transition-colors"
                  aria-label={isEn ? 'Edit avatar' : 'Modifier la photo'}
                >
                  <Edit2 size={13} />
                </button>
              </div>

              {/* Identity Info */}
              <div className="flex items-center gap-1.5 justify-center">
                <h1 className="text-xl font-semibold text-foreground">
                  {user?.firstName} {user?.lastName}
                </h1>
                {isPartner && <BadgeCheck size={18} className="text-gold shrink-0" />}
              </div>
              <p className="text-xs text-foreground/40 mt-1">{user?.email}</p>

              {/* Roles */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4">
                {userRoles.map((role) => (
                  <StatusBadge key={role} role={role} />
                ))}
              </div>

              {memberSince && (
                <p className="text-[11px] font-medium text-foreground/35 flex items-center gap-1.5 mt-4">
                  <Calendar size={12} /> {isEn ? `Member since ${memberSince}` : `Membre depuis ${memberSince}`}
                </p>
              )}

              {/* Become Partner CTA (if applicable) */}
              {!isPartner && !isStaff && (
                <button
                  onClick={handleBecomePartner}
                  disabled={isApplyingPartner}
                  className="w-full mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-black hover:bg-gold/90 transition-colors disabled:opacity-60"
                >
                  {isApplyingPartner ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Sparkles size={16} />
                  )}
                  {t('become_partner', { defaultValue: isEn ? 'Become a Partner' : 'Devenir Prestataire' })}
                </button>
              )}
            </div>
          </Panel>

          {/* CONTACT INFO PANEL */}
          <div>
            <SectionLabel>{t('information', { defaultValue: isEn ? 'Information' : 'Informations' })}</SectionLabel>
            <Panel>
              <div className="divide-y   divide-foreground/10">
                <InfoRow
                  icon={<Mail size={16} />}
                  label={t('email', { defaultValue: 'Email' })}
                  value={user?.email || '—'}
                />
                <InfoRow
                  icon={<Phone size={16} />}
                  label={t('phone', { defaultValue: isEn ? 'Phone Number' : 'Téléphone' })}
                  value={user?.phone || t('not_provided', { defaultValue: isEn ? 'Not provided' : 'Non fourni' })}
                />
              </div>
            </Panel>
          </div>

          {/* QUICK ACCOUNT ACTIONS */}
          <div>
            <SectionLabel>{t('account', { defaultValue: isEn ? 'Account' : 'Compte' })}</SectionLabel>
            <Panel>
              <div className="divide-y divide-foreground/10">
                <ActionRow
                  icon={<Edit2 size={16} />}
                  label={t('edit_profile', { defaultValue: isEn ? 'Edit Profile' : 'Modifier le profil' })}
                  hint={t('update_information', { defaultValue: isEn ? 'Update your personal details' : 'Mettre à jour vos informations' })}
                  onClick={() => setShowEditModal(true)}
                />
                <ActionRow
                  icon={<Lock size={16} />}
                  label={t('change_password', { defaultValue: isEn ? 'Change Password' : 'Changer le mot de passe' })}
                  hint={t('update_security', { defaultValue: isEn ? 'Account security & credentials' : 'Sécurité de votre compte' })}
                  onClick={() => setShowPasswordModal(true)}
                />
              </div>
            </Panel>
          </div>

          {/* LOGOUT BUTTON (Desktop only) */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            disabled={isLoggingOut}
            className="hidden lg:flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/95 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition-colors disabled:opacity-50 mt-4"
          >
            {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
            {isLoggingOut
              ? t('logging_out', { defaultValue: isEn ? 'Logging out...' : 'Déconnexion...' })
              : t('logout', { defaultValue: isEn ? 'Log Out' : 'Déconnexion' })}
          </button>
        </div>

        {/* ============================================================ */}
        {/* RIGHT / MAIN CONTENT COLUMN (8 cols on Desktop) - Dashboards & Settings */}
        {/* ============================================================ */}
        <div className="lg:col-span-8 space-y-6">

          {/* ---------- ACCESSIBLE DASHBOARDS GRID ---------- */}
          {accessibleDashboards.length > 0 && (
            <div>
              <SectionLabel>
                {t('your_spaces', { defaultValue: isEn ? 'Your Workspaces & Dashboards' : 'Vos espaces & tableaux de bord' })}
              </SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {accessibleDashboards.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => router.push(opt.href)}
                    className="shadow-black/30  shadow-sm group flex items-start gap-3.5 p-4 rounded-xl border border-foreground/10 bg-foreground/[0.03] hover:bg-foreground/[0.05] transition-colors text-left"
                  >
                    <span className="text-2xl shrink-0 mt-0.5">{opt.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground group-hover:text-gold transition-colors truncate">
                        {t(opt.titleKey, { defaultValue: opt.defaultTitle })}
                      </p>
                      <p className="text-[11px] text-foreground/40 mt-1 line-clamp-2">
                        {t(opt.descKey, { defaultValue: opt.defaultDesc })}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-foreground/35 group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                  </button>
                ))}

                {/* FAVORITES CARD */}
                <Link
                  href="/dashboard/client/favorites"
                  className="shadow-black/30  shadow-sm group flex items-start gap-3.5 p-4 rounded-xl border border-foreground/10 bg-foreground/[0.03] hover:bg-foreground/[0.05] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg border border-foreground/10 bg-foreground/5 flex items-center justify-center text-rose-400 shrink-0">
                    <Heart size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground group-hover:text-gold transition-colors truncate">
                      {isEn ? 'My Wishlist' : 'Mes Favoris'}
                    </p>
                    <p className="text-[11px] text-foreground/40 mt-1 truncate">
                      {isEn ? 'Saved fragrances & creations' : 'Créations et parfums sauvegardés'}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-foreground/35 group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                </Link>

                {/* POS CARD (IF SERVEUSE) */}
                {userRoles.includes('serveuse') && (
                  <Link
                    href="/dashboard/pos"
                    className="shadow-black/30  shadow-sm group flex items-start gap-3.5 p-4 rounded-xl border border-foreground/10 bg-foreground/[0.03] hover:bg-foreground/[0.05] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg border border-foreground/10 bg-foreground/5 flex items-center justify-center text-gold shrink-0">
                      <ShoppingCart size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground group-hover:text-gold transition-colors truncate">
                        {isEn ? 'Point of Sale (POS)' : 'Point de Vente'}
                      </p>
                      <p className="text-[11px] text-foreground/40 mt-1 truncate">
                        {isEn ? 'In-store checkout interface' : 'Interface de vente en direct (POS)'}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-foreground/35 group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* ---------- PREFERENCES ---------- */}
          <div>
            <SectionLabel>{t('settings', { defaultValue: isEn ? 'Preferences' : 'Préférences' })}</SectionLabel>
            <Panel>
              <div className="divide-y divide-foreground/10">
                <SettingRow
                  icon={<Globe size={16} />}
                  label={t('language', { defaultValue: isEn ? 'Language' : 'Langue' })}
                  hint={isEn ? 'Choose display language' : 'Choisissez votre langue / Language'}
                  control={
                    <select
                      value={isEn ? 'en' : 'fr'}
                      onChange={(event) => i18n.changeLanguage(event.target.value)}
                      className="rounded-lg border border-foreground/10 bg-background px-2.5 py-1.5 text-xs text-foreground"
                      aria-label={t('language', { defaultValue: isEn ? 'Language' : 'Langue' })}
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                    </select>
                  }
                />
                <SettingRow
                  icon={theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                  label={t('appearance', { defaultValue: isEn ? 'Appearance' : 'Apparence' })}
                  hint={isEn ? 'Light or dark theme' : 'Mode clair ou sombre'}
                  control={<ThemeToggle checked={theme === 'dark'} onChange={toggleTheme} />}
                />
                {typeof window !== 'undefined' && !isPWAInstalled && (
                  <SettingRow
                    icon={<Download size={16} />}
                    label={isEn ? 'Web App (PWA)' : 'Application PWA'}
                    hint={
                      isEn
                        ? 'Install application for rapid access'
                        : 'Installer l’application pour accès rapide'
                    }
                    control={
                      <div className="flex items-center gap-2">
                        <button onClick={handleInstallPWA} className="inline-flex items-center gap-2 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-black hover:bg-gold/90 transition-colors">
                          <Download size={14} />
                          {isInstallingPWA
                            ? (isEn ? 'Installing...' : 'Installation...')
                            : (isEn ? 'Install the app' : 'Installer l’application')}
                        </button>
                        <button
                          onClick={() => setShowPWAHelp(true)}
                          aria-label={isEn ? 'PWA Help' : 'Aide PWA'}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-foreground/10 text-foreground/45 hover:bg-foreground/5 transition-colors"
                        >
                          <Info size={14} />
                        </button>
                      </div>
                    }
                  />
                )}
              </div>
            </Panel>
          </div>

          {/* ---------- SECURITY & NOTIFICATIONS ---------- */}
          <div>
            <SectionLabel>
              {t('security_notifications', { defaultValue: isEn ? 'Security & Push Notifications' : 'Sécurité & notifications' })}
            </SectionLabel>
            <Panel>
              <div className="divide-y divide-foreground/10">
                <ActionRow
                  icon={<Shield size={16} />}
                  label={t('account_security', { defaultValue: isEn ? 'Account Security' : 'Sécurité du compte' })}
                  hint={t('password_2fa', { defaultValue: isEn ? 'Password & credentials' : 'Mot de passe et authentification' })}
                  onClick={() => setShowPasswordModal(true)}
                />
                <ActionRow
                  icon={<Bell size={16} />}
                  label={t('notifications', { defaultValue: isEn ? 'Notifications' : 'Notifications' })}
                  hint={t('notification_channels', { defaultValue: isEn ? 'Push messaging channels' : 'Canaux de notification' })}
                />
                <div className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {isEn ? 'Test Push System' : 'Tester le système Push'}
                    </p>
                    <p className="text-xs text-foreground/40">
                      {isEn ? 'Verify browser notification readiness' : 'Vérifier le bon fonctionnement des notifications du navigateur'}
                    </p>
                  </div>
                  <button
                    onClick={handleTestNotification}
                    disabled={isSendingTestNotification}
                    className="inline-flex items-center gap-2 rounded-lg border border-foreground/10 px-3 py-1.5 text-xs font-semibold text-foreground/60 hover:bg-foreground/5 transition-colors disabled:opacity-60 shrink-0"
                  >
                    {isSendingTestNotification ? (
                      <Loader2 size={14} className="animate-spin text-gold" />
                    ) : (
                      <Bell size={14} />
                    )}
                    {isSendingTestNotification ? (isEn ? 'Sending...' : 'Envoi...') : (isEn ? 'Test' : 'Tester')}
                  </button>
                </div>
              </div>
            </Panel>
          </div>

          {/* LOGOUT BUTTON (Mobile only) */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            disabled={isLoggingOut}
            className="lg:hidden w-full flex items-center justify-center gap-2 rounded-lg bg-red-500/95 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition-colors disabled:opacity-50 mt-2"
          >
            {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
            {isLoggingOut
              ? t('logging_out', { defaultValue: isEn ? 'Logging out...' : 'Déconnexion...' })
              : t('logout', { defaultValue: isEn ? 'Log Out' : 'Déconnexion' })}
          </button>

        </div>

      </div>

      {/* ============ MODALS ============ */}
      <PasswordChangeModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
      <ProfileEditModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} />
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title={t('confirm_logout_title', { defaultValue: isEn ? 'Log Out' : 'Déconnexion' })}
        message={t('confirm_logout', { defaultValue: isEn ? 'Are you sure you want to log out?' : 'Êtes-vous sûr de vouloir vous déconnecter ?' })}
        confirmText={t('logout_btn', { defaultValue: isEn ? 'Log Out' : 'Déconnexion' })}
        cancelText={t('cancel', { defaultValue: isEn ? 'Cancel' : 'Annuler' })}
        variant="danger"
        isLoading={isLoggingOut}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
      <Modal
        isOpen={showPWAHelp}
        onClose={() => setShowPWAHelp(false)}
        title={isEn ? 'Add to Home Screen' : 'Ajouter à l’écran d’accueil'}
        size="lg"
      >
        <div className="space-y-4 text-sm text-foreground/90">
          <p>
            {isEn
              ? 'To install this application on your mobile device, follow the steps for your operating system below.'
              : 'Pour installer l’application sur votre téléphone, suivez les étapes ci-dessous selon votre appareil.'}
          </p>
          <div className="rounded-xl border border-foreground/10 bg-foreground/[0.03] p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">iPhone (iOS)</h3>
            <ol className="list-decimal list-inside space-y-2 text-[13px] leading-6 text-foreground/70">
              {isEn ? (
                <>
                  <li>Open Safari and visit this website.</li>
                  <li>Tap the Share icon at the bottom of the screen.</li>
                  <li>Select "Add to Home Screen".</li>
                  <li>Confirm by tapping "Add".</li>
                  <li>Launch the application directly from your home screen.</li>
                </>
              ) : (
                <>
                  <li>Ouvrez Safari et rendez-vous sur ce site.</li>
                  <li>Tapez sur l’icône Partager en bas de l’écran.</li>
                  <li>Choisissez « Ajouter à l’écran d’accueil ».</li>
                  <li>Confirmez en appuyant sur « Ajouter ».</li>
                  <li>Ouvrez l’application depuis votre écran d’accueil.</li>
                </>
              )}
            </ol>
          </div>
          <div className="rounded-xl border border-foreground/10 bg-foreground/[0.03] p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Android</h3>
            <ol className="list-decimal list-inside space-y-2 text-[13px] leading-6 text-foreground/70">
              {isEn ? (
                <>
                  <li>Open your browser menu (three dots or menu icon).</li>
                  <li>Select "Add to Home screen" or "Install app".</li>
                  <li>Confirm the installation prompt.</li>
                  <li>Launch the application directly from your home screen.</li>
                </>
              ) : (
                <>
                  <li>Ouvrez le menu du navigateur (trois points ou barre de menu).</li>
                  <li>Choisissez « Ajouter à l’écran d’accueil » ou « Installer l’application ».</li>
                  <li>Confirmez la demande d’ajout.</li>
                  <li>Ouvrez l’application depuis votre écran d’accueil.</li>
                </>
              )}
            </ol>
          </div>
          <p className="text-xs text-foreground/40">
            {isEn
              ? 'If your browser does not trigger an automatic prompt, use the share or browser settings menu to manually add this app to your home screen.'
              : 'Si votre navigateur ne propose pas d’installation automatique, utilisez le menu de partage ou d’options pour ajouter manuellement ce site à l’écran d’accueil.'}
          </p>
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="rounded-md p-1.5 text-foreground/45 shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-foreground/35 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

function ActionRow({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-foreground/[0.04] transition-colors text-left group"
    >
      <div className="rounded-md p-1.5 text-foreground/45 group-hover:text-gold transition-colors shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {hint && <p className="text-xs text-foreground/40">{hint}</p>}
      </div>
      <ChevronRight size={16} className="text-foreground/35 group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0" />
    </button>
  );
}

function SettingRow({
  icon,
  label,
  hint,
  control,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-foreground/[0.03] transition-colors text-left group">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg border border-foreground/10 bg-foreground/[0.03] text-foreground/45 group-hover:text-gold group-hover:border-gold/20 transition-colors shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {hint && <p className="text-xs text-foreground/40 mt-0.5">{hint}</p>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

function ButtonPill({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-foreground/10 px-3 py-1.5 text-xs font-semibold text-foreground/60 hover:bg-foreground/5 transition-colors"
    >
      {children}
    </button>
  );
}