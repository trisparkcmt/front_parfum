'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Mail, Phone, MapPin, Shield, Calendar, Edit2, Lock,
  Globe, Sun, Moon, Palette, ChevronRight, LogOut, Loader2,
  LayoutGrid, ShoppingCart, Bell, Sparkles, BadgeCheck, Download,
} from 'lucide-react';

import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useToastStore } from '@/store/useToastStore';
import { useOrderNotificationStore } from '@/store/useOrderNotificationStore';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { api } from '@/services/api';
import { attemptPWAInstall, getPWAInstallHint, isPWAInstalled as checkPWAInstalled } from '@/lib/pwa';
import { triggerTestNotification } from '@/services/notifications';

import { BackButton } from '@/components/ui/BackButton';
import PasswordChangeModal from '@/components/shared/PasswordChangeModal';
import ProfileEditModal from '@/components/shared/ProfileEditModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import type { UserRole } from '@/types';

/* ------------------------------------------------------------------ */
/*  Dashboards                                                        */
/* ------------------------------------------------------------------ */

interface DashboardOption {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  roles: UserRole[];
}

const DASHBOARD_OPTIONS: DashboardOption[] = [
  { id: 'client',    title: 'Espace Client',             description: 'Suivi de vos commandes, créations et favoris.',          href: '/dashboard/client',          icon: '📦', roles: ['client'] },
  { id: 'delivery',  title: 'Espace Livreur',            description: 'Suivi et exécution de vos livraisons assignées.',         href: '/dashboard/delivery',         icon: '🚗', roles: ['delivery'] },
  { id: 'partner',   title: 'Espace Prestataire',        description: 'Suivi de vos commissions et ventes affiliées.',           href: '/dashboard/partner',           icon: '🤝', roles: ['partner'] },
  { id: 'serveuse',  title: 'Espace Boutique / Serveuse', description: 'Gestion des commandes, catalogue et laboratoire.',       href: '/dashboard/serveuse/dashboard', icon: '🛒', roles: ['serveuse'] },
  { id: 'admin',     title: 'Administration',            description: 'Gestion globale de la plateforme, utilisateurs et livreurs.', href: '/dashboard/admin/dashboard', icon: '👑', roles: ['superadmin'] },
];

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-1 mb-3">
      <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.18em]">
        {children}
      </span>
      <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
    </div>
  );
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={
        'relative rounded-2xl border border-white/10 bg-white/[0.03] ' +
        'backdrop-blur-md shadow-[0_8px_30px_-12px_rgba(0,0,0,0.4)] ' +
        className
      }
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const router = useRouter();

  const notificationsEnabled = useOrderNotificationStore((s) => s.notificationsEnabled);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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
        addToast('Application installée, ouvrez-la depuis l’écran d’accueil', 'success');
      } else if (result === 'dismissed') {
        addToast('Installation annulée', 'info');
      } else if (result === 'installed') {
        addToast('L’application est déjà installée', 'info');
      } else if (result === 'fallback') {
        addToast(
          'iOS : ouvrez Safari puis utilisez Partager → Ajouter à l’écran d’accueil.',
          'info',
        );
      } else {
        addToast(
          'Aucune option d’installation PWA disponible pour ce navigateur. Utilisez le menu du navigateur pour ajouter l’application à l’écran d’accueil.',
          'info',
        );
      }
    } catch (error) {
      console.error('PWA install error:', error);
      addToast('Erreur lors de l’installation de la PWA', 'error');
    } finally {
      setIsInstallingPWA(false);
    }
  };

  const userRoles: UserRole[] =
    user?.roles || (user?.role ? [user.role] : (['client'] as UserRole[]));
  const isPartner = userRoles.includes('partner');
  const isStaff   = userRoles.some((r) => ['serveuse', 'superadmin', 'delivery'].includes(r));

  const accessibleDashboards = DASHBOARD_OPTIONS.filter((d) =>
    d.roles.some((role) => userRoles.includes(role)),
  );

  /* ----- handlers ----- */
  const handleLanguageChange = () => {
    i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr');
  };

  const handleBecomePartner = async () => {
    setIsApplyingPartner(true);
    try {
      const res = await api.post('/auth/prestataire/apply/');
      addToast(res.data.detail || t('become_partner_request_sent'), 'success');
    } catch (err: any) {
      addToast(
        err.response?.data?.detail ||
          'Une demande est déjà en cours ou vous êtes déjà prestataire.',
        'error',
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
      addToast(t('logout_error', { defaultValue: 'Erreur lors de la déconnexion' }), 'error');
      setIsLoggingOut(false);
    }
  };

  const handleTestNotification = async () => {
    setIsSendingTestNotification(true);
    try {
      const sent = await triggerTestNotification(
        'Test de notification',
        'Cette notification confirme que l’affichage push est bien prêt.'
      );

      if (sent) {
        addToast('Notification de test envoyée.', 'success');
      } else {
        addToast('La permission de notification n’a pas été accordée.', 'error');
      }
    } catch (error) {
      console.error(error);
      addToast('Impossible d’envoyer la notification de test.', 'error');
    } finally {
      setIsSendingTestNotification(false);
    }
  };

  /* ----- derived ----- */
  const initials =
    `${user?.firstName?.charAt(0) ?? ''}${user?.lastName?.charAt(0) ?? ''}`.toUpperCase() || 'U';
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6 flex flex-col">
      <BackButton />

      {/* ============ HERO ============ */}
      <Panel className="overflow-hidden">
        {/* decorative cover */}
        <div className="relative h-28 sm:h-36 bg-gradient-to-br from-gold/25 via-gold/5 to-transparent">
          <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_30%_50%,white,transparent_55%)]" />
          <div className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </div>

        <div className="px-5 sm:px-8 pb-6 -mt-12 sm:-mt-14">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            {/* avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-black text-3xl sm:text-4xl font-black shadow-xl shadow-gold/30 ring-4 ring-background">
                {initials}
              </div>
              <button
                onClick={() => setShowEditModal(true)}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-background border border-white/15 flex items-center justify-center text-foreground/70 hover:text-gold hover:border-gold/40 transition-colors"
                aria-label="Edit avatar"
              >
                <Edit2 size={14} />
              </button>
            </div>

            {/* identity */}
            <div className="flex-1 min-w-0 sm:pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">
                  {user?.firstName} {user?.lastName}
                </h1>
                {isPartner && (
                  <BadgeCheck size={20} className="text-gold shrink-0" />
                )}
              </div>
              <p className="text-sm text-foreground/50 mt-1 truncate">{user?.email}</p>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {userRoles.map((role) => (
                  <span
                    key={role}
                    className="text-[10px] font-semibold text-gold bg-gold/10 border border-gold/20 px-2.5 py-1 rounded-full uppercase tracking-wider"
                  >
                    {role === 'superadmin' ? 'Admin' : role}
                  </span>
                ))}
                {memberSince && (
                  <span className="text-[10px] font-medium text-foreground/50 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Calendar size={11} /> Depuis {memberSince}
                  </span>
                )}
              </div>
            </div>

            {/* CTA: become partner (only if not already partner/staff) */}
            {!isPartner && !isStaff && (
              <button
                onClick={handleBecomePartner}
                disabled={isApplyingPartner}
                className="sm:pb-2 group inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-gold to-gold-dark text-black text-sm font-bold shadow-lg shadow-gold/20 hover:shadow-gold/40 hover:-translate-y-0.5 transition-all disabled:opacity-60"
              >
                {isApplyingPartner ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
                )}
                {t('become_partner', 'Devenir Prestataire')}
              </button>
            )}
          </div>
        </div>
      </Panel>

      {/* ============ GRID ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ---------- INFORMATIONS SECTION ---------- */}
        <div className="order-1 lg:col-span-1 space-y-6">
          <div>
            <SectionLabel>{t('information', 'Informations')}</SectionLabel>
            <Panel>
              <div className="divide-y divide-white/5">
                <InfoRow icon={<Mail size={16} />}  label={t('email', 'Email')}   value={user?.email || '—'} />
                <InfoRow icon={<Phone size={16} />} label={t('phone', 'Téléphone')} value={user?.phone || t('not_provided', 'Non fourni')} />
              </div>
            </Panel>
          </div>
        </div>

        {/* ---------- MY SPACES / DASHBOARDS (2nd section on mobile) ---------- */}
        {accessibleDashboards.length > 0 && (
          <div className="order-2 lg:order-none lg:col-span-2">
            <SectionLabel>
              <span className="inline-flex items-center gap-1.5">
                <LayoutGrid size={11} className="text-gold" />
                {t('your_spaces', 'Vos espaces & tableaux de bord')}
              </span>
            </SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {accessibleDashboards.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => router.push(opt.href)}
                  className="group relative overflow-hidden flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-gold/30 hover:bg-gold/[0.04] transition-all text-left"
                >
                  <span className="text-2xl shrink-0">{opt.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground group-hover:text-gold transition-colors truncate">
                      {opt.title}
                    </p>
                    <p className="text-[11px] text-foreground/50 mt-0.5 line-clamp-2">
                      {opt.description}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-foreground/20 group-hover:text-gold group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              ))}

              {userRoles.includes('serveuse') && (
                <Link
                  href="/dashboard/pos"
                  className="group relative overflow-hidden flex items-center gap-4 p-4 rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/10 to-transparent hover:border-gold/40 transition-all"
                >
                  <span className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center text-gold shrink-0">
                    <ShoppingCart size={18} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gold truncate">Point de Vente</p>
                    <p className="text-[11px] text-foreground/60 mt-0.5">Interface de vente en direct (POS).</p>
                  </div>
                  <ChevronRight size={16} className="text-gold/50 group-hover:translate-x-1 transition-all shrink-0" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ---------- ACCOUNT OPTIONS ---------- */}
        <div className="order-3 lg:col-span-1 space-y-6">
          <div>
            <SectionLabel>{t('account', 'Compte')}</SectionLabel>
            <Panel>
              <div className="divide-y divide-white/5">
                <ActionRow
                  icon={<Edit2 size={16} />}
                  label={t('edit_profile', 'Modifier le profil')}
                  hint={t('update_information', 'Mettre à jour vos informations')}
                  onClick={() => setShowEditModal(true)}
                />
                <ActionRow
                  icon={<Lock size={16} />}
                  label={t('change_password', 'Changer le mot de passe')}
                  hint={t('update_security', 'Sécurité de votre compte')}
                  onClick={() => setShowPasswordModal(true)}
                />
              </div>
            </Panel>
          </div>
        </div>

        {/* ---------- PREFERENCES & SECURITY SETTINGS ---------- */}
        <div className="order-4 lg:col-span-2 space-y-6">
          {/* preferences */}
          <div>
            <SectionLabel>{t('settings', 'Préférences')}</SectionLabel>
            <Panel>
              <div className="divide-y divide-white/5">
                <SettingRow
                  icon={<Globe size={16} />}
                  iconBg="bg-blue-400/10 text-blue-400"
                  label={t('language', 'Langue')}
                  hint="Choisissez votre langue / Language"
                  control={
                    <Pill onClick={handleLanguageChange}>
                      {i18n.language === 'fr' ? 'Français' : 'English'}
                    </Pill>
                  }
                />
                <SettingRow
                  icon={theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                  iconBg="bg-purple-400/10 text-purple-400"
                  label={t('appearance', 'Apparence')}
                  hint="Mode clair ou sombre"
                  control={
                    <Pill onClick={toggleTheme}>
                      {theme === 'dark' ? 'Sombre' : 'Clair'}
                    </Pill>
                  }
                />
                <SettingRow
                  icon={<Bell size={16} />}
                  iconBg="bg-emerald-400/10 text-emerald-400"
                  label="Notifications des commandes"
                  hint="Alertes sonores et push de nouvelles commandes"
                  control={
                    <Pill
                      active={notificationsEnabled}
                      onClick={() => useOrderNotificationStore.getState().toggleNotifications()}
                    >
                      {notificationsEnabled ? 'Activé' : 'Désactivé'}
                    </Pill>
                  }
                />
                {typeof window !== 'undefined' && (
                  <SettingRow
                    icon={<Download size={16} />}
                    iconBg={isPWAInstalled ? 'bg-emerald-400/10 text-emerald-400' : 'bg-gold/10 text-gold'}
                    label="Installer l’application"
                    hint={isPWAInstalled ? 'Application déjà installée' : 'Installer l’application PWA pour notifications et accès rapide'}
                    control={
                      <Pill onClick={handleInstallPWA}>
                        {isInstallingPWA ? 'Installation...' : isPWAInstalled ? 'Installée' : 'Installer'}
                      </Pill>
                    }
                  />
                )}
              </div>
            </Panel>
          </div>

          {/* security */}
          <div>
            <SectionLabel>{t('security_notifications', 'Sécurité & notifications')}</SectionLabel>
            <Panel>
              <div className="divide-y divide-white/5">
                <ActionRow
                  icon={<Shield size={16} />}
                  iconBg="bg-amber-400/10 text-amber-400"
                  label={t('account_security', 'Sécurité du compte')}
                  hint={t('password_2fa', 'Mot de passe et authentification à deux facteurs')}
                  onClick={() => setShowPasswordModal(true)}
                />
                <ActionRow
                  icon={<Bell size={16} />}
                  iconBg="bg-sky-400/10 text-sky-400"
                  label={t('notifications', 'Notifications')}
                  hint={t('notification_channels', 'Canaux de notification')}
                />
                <div className="px-5 py-3">
                  <button
                    onClick={handleTestNotification}
                    disabled={isSendingTestNotification}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-gold/20 bg-gold/10 px-3 py-2.5 text-sm font-semibold text-gold transition-colors hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSendingTestNotification ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Bell size={16} />
                    )}
                    {isSendingTestNotification ? 'Envoi...' : 'Tester la notification'}
                  </button>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>

      {/* ============ BOTTOM LOGOUT BUTTON CONTAINER ============ */}
      <div className="mt-4">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm font-bold hover:bg-red-500/10 hover:border-red-500/40 transition-all disabled:opacity-50"
        >
          {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
          {isLoggingOut ? t('logging_out', 'Déconnexion...') : t('logout', 'Déconnexion')}
        </button>
      </div>

      {/* ============ MODALS ============ */}
      <PasswordChangeModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
      <ProfileEditModal    isOpen={showEditModal}     onClose={() => setShowEditModal(false)} />
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

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-foreground/50 shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

function ActionRow({
  icon, iconBg = 'bg-white/5 text-foreground/60', label, hint, onClick,
}: {
  icon: React.ReactNode;
  iconBg?: string;
  label: string;
  hint?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.04] transition-colors text-left group"
    >
      <div className={`w-9 h-9 rounded-lg border border-white/5 flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {hint && <p className="text-[11px] text-foreground/45">{hint}</p>}
      </div>
      <ChevronRight size={16} className="text-foreground/20 group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0" />
    </button>
  );
}

function SettingRow({
  icon, iconBg, label, hint, control,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  hint?: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <div className={`w-9 h-9 rounded-lg border border-white/5 flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {hint && <p className="text-[11px] text-foreground/45">{hint}</p>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

function Pill({
  children, onClick, active,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={
        'text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors ' +
        (active
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
          : 'bg-white/5 text-foreground border-white/10 hover:bg-white/10 hover:border-gold/30')
      }
    >
      {children}
    </button>
  );
}