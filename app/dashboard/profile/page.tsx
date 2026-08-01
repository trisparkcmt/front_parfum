'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Mail, Phone, MapPin, Shield, Calendar, Edit2, Lock,
  Globe, Sun, Moon, Palette, ChevronRight, LogOut, Loader2,
  LayoutGrid, ShoppingCart, Bell, Sparkles, BadgeCheck, Download,
  Heart,
} from 'lucide-react';

import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useToastStore } from '@/store/useToastStore';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { api } from '@/services/api';
import { attemptPWAInstall, isPWAInstalled as checkPWAInstalled } from '@/lib/pwa';
import { triggerTestNotification } from '@/services/notifications';

import { BackButton } from '@/components/ui/BackButton';
import { Modal } from '@/components/ui/Modal';
import PasswordChangeModal from '@/components/shared/PasswordChangeModal';
import ProfileEditModal from '@/components/shared/ProfileEditModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import type { UserRole } from '@/types';

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
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cx('rounded-xl border border-white/10 bg-white/[0.02]', className)}>
      {children}
    </div>
  );
}

function StatusBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset text-gold bg-gold/10 ring-gold/20 uppercase tracking-wider">
      <span className="h-1.5 w-1.5 rounded-full bg-gold" />
      {role === 'superadmin' ? 'Admin' : role}
    </span>
  );
}

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
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const router = useRouter();

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
        addToast('Application installée, ouvrez-la depuis l’écran d’accueil', 'success');
      } else if (result === 'installed') {
        addToast('L’application est déjà installée', 'info');
      } else if (result === 'dismissed') {
        addToast('Installation annulée', 'info');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
      <BackButton />

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
                  className="absolute -bottom-1 -right-1 rounded-lg p-1.5 border border-white/10 bg-background text-foreground/45 hover:text-gold hover:border-gold/30 transition-colors"
                  aria-label="Edit avatar"
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
                  <Calendar size={12} /> Membre depuis {memberSince}
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
                  {t('become_partner', 'Devenir Prestataire')}
                </button>
              )}
            </div>
          </Panel>

          {/* CONTACT INFO PANEL */}
          <div>
            <SectionLabel>{t('information', 'Informations')}</SectionLabel>
            <Panel>
              <div className="divide-y divide-white/5">
                <InfoRow icon={<Mail size={16} />} label={t('email', 'Email')} value={user?.email || '—'} />
                <InfoRow icon={<Phone size={16} />} label={t('phone', 'Téléphone')} value={user?.phone || t('not_provided', 'Non fourni')} />
              </div>
            </Panel>
          </div>

          {/* QUICK ACCOUNT ACTIONS */}
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

          {/* LOGOUT BUTTON */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-500/90 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition-colors disabled:opacity-50"
          >
            {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
            {isLoggingOut ? t('logging_out', 'Déconnexion...') : t('logout', 'Déconnexion')}
          </button>
        </div>

        {/* ============================================================ */}
        {/* RIGHT / MAIN CONTENT COLUMN (8 cols on Desktop) - Dashboards & Settings */}
        {/* ============================================================ */}
        <div className="lg:col-span-8 space-y-6">

          {/* ---------- ACCESSIBLE DASHBOARDS GRID ---------- */}
          {accessibleDashboards.length > 0 && (
            <div>
              <SectionLabel>{t('your_spaces', 'Vos espaces & tableaux de bord')}</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {accessibleDashboards.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => router.push(opt.href)}
                    className="group flex items-start gap-3.5 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.03] transition-colors text-left"
                  >
                    <span className="text-2xl shrink-0 mt-0.5">{opt.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground group-hover:text-gold transition-colors truncate">
                        {opt.title}
                      </p>
                      <p className="text-[11px] text-foreground/40 mt-1 line-clamp-2">
                        {opt.description}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-foreground/35 group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                  </button>
                ))}

                {/* FAVORITES CARD */}
                <Link
                  href="/dashboard/client/favorites"
                  className="group flex items-start gap-3.5 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.03] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-rose-400 shrink-0">
                    <Heart size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground group-hover:text-gold transition-colors truncate">Mes Favoris</p>
                    <p className="text-[11px] text-foreground/40 mt-1 truncate">Créations et parfums sauvegardés</p>
                  </div>
                  <ChevronRight size={16} className="text-foreground/35 group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                </Link>

                {/* POS CARD (IF SERVEUSE) */}
                {userRoles.includes('serveuse') && (
                  <Link
                    href="/dashboard/pos"
                    className="group flex items-start gap-3.5 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-gold shrink-0">
                      <ShoppingCart size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground group-hover:text-gold transition-colors truncate">Point de Vente</p>
                      <p className="text-[11px] text-foreground/40 mt-1 truncate">Interface de vente en direct (POS)</p>
                    </div>
                    <ChevronRight size={16} className="text-foreground/35 group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* ---------- PREFERENCES ---------- */}
          <div>
            <SectionLabel>{t('settings', 'Préférences')}</SectionLabel>
            <Panel>
              <div className="divide-y divide-white/5">
                <SettingRow
                  icon={<Globe size={16} />}
                  label={t('language', 'Langue')}
                  hint="Choisissez votre langue / Language"
                  control={
                    <ButtonPill onClick={handleLanguageChange}>
                      {i18n.language === 'fr' ? 'Français' : 'English'}
                    </ButtonPill>
                  }
                />
                <SettingRow
                  icon={theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                  label={t('appearance', 'Apparence')}
                  hint="Mode clair ou sombre"
                  control={
                    <ButtonPill onClick={toggleTheme}>
                      {theme === 'dark' ? 'Sombre' : 'Clair'}
                    </ButtonPill>
                  }
                />
                {typeof window !== 'undefined' && (
                  <SettingRow
                    icon={<Download size={16} />}
                    label="Application PWA"
                    hint={isPWAInstalled ? 'Application déjà installée' : 'Installer l’application pour accès rapide'}
                    control={
                      <ButtonPill onClick={handleInstallPWA}>
                        {isInstallingPWA ? 'Installation...' : isPWAInstalled ? 'Installée' : 'Installer'}
                      </ButtonPill>
                    }
                  />
                )}
              </div>
            </Panel>
          </div>

          {/* ---------- SECURITY & NOTIFICATIONS ---------- */}
          <div>
            <SectionLabel>{t('security_notifications', 'Sécurité & notifications')}</SectionLabel>
            <Panel>
              <div className="divide-y divide-white/5">
                <ActionRow
                  icon={<Shield size={16} />}
                  label={t('account_security', 'Sécurité du compte')}
                  hint={t('password_2fa', 'Mot de passe et authentification')}
                  onClick={() => setShowPasswordModal(true)}
                />
                <ActionRow
                  icon={<Bell size={16} />}
                  label={t('notifications', 'Notifications')}
                  hint={t('notification_channels', 'Canaux de notification')}
                />
                <div className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Tester le système Push</p>
                    <p className="text-xs text-foreground/40">Vérifier le bon fonctionnement des notifications du navigateur</p>
                  </div>
                  <button
                    onClick={handleTestNotification}
                    disabled={isSendingTestNotification}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-foreground/60 hover:bg-white/5 transition-colors disabled:opacity-60 shrink-0"
                  >
                    {isSendingTestNotification ? (
                      <Loader2 size={14} className="animate-spin text-gold" />
                    ) : (
                      <Bell size={14} />
                    )}
                    {isSendingTestNotification ? 'Envoi...' : 'Tester'}
                  </button>
                </div>
              </div>
            </Panel>
          </div>

        </div>

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
      <Modal
        isOpen={showPWAHelp}
        onClose={() => setShowPWAHelp(false)}
        title="Ajouter à l’écran d’accueil"
        size="lg"
      >
        <div className="space-y-4 text-sm text-foreground/90">
          <p>
            Pour installer l’application sur votre téléphone, suivez les étapes ci-dessous selon votre appareil.
          </p>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">iPhone</h3>
            <ol className="list-decimal list-inside space-y-2 text-[13px] leading-6 text-foreground/70">
              <li>Ouvrez Safari et rendez-vous sur ce site.</li>
              <li>Tapez sur l’icône Partager en bas de l’écran.</li>
              <li>Choisissez « Ajouter à l’écran d’accueil ».</li>
              <li>Confirmez en appuyant sur « Ajouter ».</li>
              <li>Ouvrez l’application depuis votre écran d’accueil.</li>
            </ol>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Android</h3>
            <ol className="list-decimal list-inside space-y-2 text-[13px] leading-6 text-foreground/70">
              <li>Ouvrez le menu du navigateur (trois points ou barre de menu).</li>
              <li>Choisissez « Ajouter à l’écran d’accueil » ou « Installer l’application ». </li>
              <li>Confirmez la demande d’ajout.</li>
              <li>Ouvrez l’application depuis votre écran d’accueil.</li>
            </ol>
          </div>
          <p className="text-xs text-foreground/40">
            Si votre navigateur ne propose pas d’installation automatique, utilisez le menu de partage ou d’options pour ajouter manuellement ce site à l’écran d’accueil.
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
  icon, label, hint, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left group"
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
  icon, label, hint, control,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="rounded-md p-1.5 text-foreground/45 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {hint && <p className="text-xs text-foreground/40">{hint}</p>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

function ButtonPill({
  children, onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-foreground/60 hover:bg-white/5 transition-colors"
    >
      {children}
    </button>
  );
}