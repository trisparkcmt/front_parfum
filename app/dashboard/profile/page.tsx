'use client';

/**
 * @file app/profile/page.tsx
 * @description User profile management, security options, PWA install actions, and role-based dashboard access.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Mail, Phone, MapPin, Calendar, Edit2, Lock,
  Globe, Sun, Moon, Palette, ChevronRight, LogOut, Loader2,
  LayoutGrid, ShoppingCart, Sparkles, BadgeCheck, Download,
  Heart, Info, MoreHorizontal, ShieldCheck,
  X,
} from 'lucide-react';

import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useToastStore } from '@/store/useToastStore';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { api } from '@/services/api';
import { authService, partnerService } from '@/services/apiService';
import { attemptPWAInstall, isPWAInstalled as checkPWAInstalled, isIOS, isAndroid } from '@/lib/pwa';

import { BackButton } from '@/components/ui/BackButton';
import { Modal } from '@/components/ui/Modal';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import PasswordChangeModal from '@/components/shared/PasswordChangeModal';
import ProfileEditModal from '@/components/shared/ProfileEditModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { PWAInstallGuide } from '@/components/pwa/PWAInstallGuide';
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

function DeliveryTruckIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M311.069,130.515c-0.963-5.641-5.851-9.768-11.578-9.768H35.43c-7.61,0-13.772,6.169-13.772,13.765 c0,7.61,6.162,13.772,13.772,13.772h64.263c7.61,0,13.772,6.17,13.772,13.773c0,7.603-6.162,13.772-13.772,13.772H13.772 C6.169,175.829,0,181.998,0,189.601c0,7.603,6.169,13.764,13.772,13.764h117.114c6.72,0,12.172,5.46,12.172,12.18 c0,6.72-5.452,12.172-12.172,12.172H68.665c-7.61,0-13.772,6.17-13.772,13.773c0,7.602,6.162,13.772,13.772,13.772h45.857 c6.726,0,12.179,5.452,12.179,12.172c0,6.719-5.453,12.172-12.179,12.172H51.215c-7.61,0-13.772,6.169-13.772,13.772 c0,7.603,6.162,13.772,13.772,13.772h87.014l5.488,31.042h31.52c-1.854,4.504-2.911,9.421-2.911,14.598 c0,21.245,17.218,38.464,38.464,38.464c21.237,0,38.456-17.219,38.456-38.464c0-5.177-1.057-10.094-2.911-14.598h100.04 L311.069,130.515z M227.342,352.789c0,9.146-7.407,16.553-16.553,16.553c-9.152,0-16.56-7.407-16.56-16.553 c0-6.364,3.627-11.824,8.892-14.598h15.329C223.714,340.965,227.342,346.424,227.342,352.789z"/>
      <path d="M511.598,314.072l-15.799-77.941l-57.689-88.759H333.074l32.534,190.819h38.42 c-1.846,4.504-2.904,9.421-2.904,14.598c0,21.245,17.219,38.464,38.456,38.464c21.246,0,38.464-17.219,38.464-38.464 c0-5.177-1.057-10.094-2.91-14.598h16.741c6.039,0,11.759-2.708,15.582-7.386C511.273,326.136,512.8,319.988,511.598,314.072z M392.529,182.882h26.314l34.162,52.547h-51.512L392.529,182.882z M456.14,352.789c0,9.146-7.407,16.553-16.56,16.553 c-9.138,0-16.552-7.407-16.552-16.553c0-6.364,3.635-11.824,8.892-14.598h15.329C452.513,340.965,456.14,346.424,456.14,352.789z"/>
    </svg>
  );
}

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
  defaultTitleFr: string;
  descKey: string;
  defaultDesc: string;
  defaultDescFr: string;
  href: string;
  icon: ReactNode;
  roles: UserRole[];
}

const DASHBOARD_OPTIONS: DashboardOption[] = [
  {
    id: 'client',
    titleKey: 'dashboard_client_title',
    defaultTitle: 'Client Space',
    defaultTitleFr: 'Espace Client',
    descKey: 'dashboard_client_desc',
    defaultDesc: 'Track your orders, creations and favorites.',
    defaultDescFr: 'Suivi de vos commandes, créations et favoris.',
    href: '/dashboard/client',
    icon: '📦',
    roles: ['client'],
  },
  {
    id: 'delivery',
    titleKey: 'dashboard_delivery_title',
    defaultTitle: 'Courier Space',
    defaultTitleFr: 'Espace Livreur',
    descKey: 'dashboard_delivery_desc',
    defaultDesc: 'Track and complete your assigned deliveries.',
    defaultDescFr: 'Suivi et exécution de vos livraisons assignées.',
    href: '/dashboard/delivery',
    icon: <DeliveryTruckIcon className="h-6 w-6 text-gold" />,
    roles: ['delivery'],
  },
  {
    id: 'partner',
    titleKey: 'dashboard_partner_title',
    defaultTitle: 'Partner Space',
    defaultTitleFr: 'Espace Prestataire',
    descKey: 'dashboard_partner_desc',
    defaultDesc: 'Track your commissions and affiliated sales.',
    defaultDescFr: 'Suivi de vos commissions et ventes affiliées.',
    href: '/dashboard/partner',
    icon: <PartnerIcon className="h-6 w-6 text-gold" />,
    roles: ['partner'],
  },
  {
    id: 'serveuse',
    titleKey: 'dashboard_serveuse_title',
    defaultTitle: 'Boutique / Staff Space',
    defaultTitleFr: 'Espace Boutique / Serveuse',
    descKey: 'dashboard_serveuse_desc',
    defaultDesc: 'Manage orders, catalog and lab work.',
    defaultDescFr: 'Gestion des commandes, catalogue et laboratoire.',
    href: '/dashboard/serveuse/dashboard',
    icon: '🛒',
    roles: ['serveuse'],
  },
  {
    id: 'admin',
    titleKey: 'dashboard_admin_title',
    defaultTitle: 'Administration',
    defaultTitleFr: 'Administration',
    descKey: 'dashboard_admin_desc',
    defaultDesc: 'Overall platform management for users and drivers.',
    defaultDescFr: 'Gestion globale de la plateforme, utilisateurs et livreurs.',
    href: '/dashboard/admin/dashboard',
    icon: '👑',
    roles: ['superadmin'],
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function ProfilePage() {
  const { user, logout, setUser } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t, i18n } = useTranslation();
  const { addToast } = useToastStore();
  const router = useRouter();

  const isEn = i18n.language?.startsWith('en');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPWAHelp, setShowPWAHelp] = useState(false);
  const [showPartnerMenu, setShowPartnerMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isApplyingPartner, setIsApplyingPartner] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isInstallingPWA, setIsInstallingPWA] = useState(false);
  const partnerMenuRef = useRef<HTMLDivElement | null>(null);

  const isPWAInstalled = checkPWAInstalled();

  useEffect(() => {
    if (!showPartnerMenu) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (partnerMenuRef.current && !partnerMenuRef.current.contains(target)) {
        setShowPartnerMenu(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [showPartnerMenu]);

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
    } catch (err: unknown) {
      const errorDetails = err as {
        response?: { data?: { detail?: string } };
      };

      addToast(
        errorDetails.response?.data?.detail ||
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

  const handleProfilePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const photo = event.target.files?.[0];
    event.target.value = '';
    if (!photo || !user) return;

    if (!photo.type.startsWith('image/')) {
      addToast(isEn ? 'Please select an image file.' : 'Veuillez sélectionner une image.', 'error');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const response = await authService.uploadProfilePhoto(photo);
      const profile = response.user || response;
      const avatarUrl = profile.photo || profile.photo_url || profile.avatar_url || response.photo || response.photo_url;
      setUser({ ...user, avatarUrl: avatarUrl || user.avatarUrl });
      addToast(isEn ? 'Profile photo updated.' : 'Photo de profil mise à jour.', 'success');
    } catch (error: unknown) {
      const errorDetails = error as { response?: { data?: { detail?: string } } };
      addToast(
        errorDetails.response?.data?.detail ||
          (isEn ? 'Unable to update profile photo.' : 'Impossible de mettre à jour la photo.'),
        'error'
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleCancelPartnerApplication = async () => {
    if (!window.confirm(isEn ? 'Cancel your pending partner application?' : 'Annuler votre demande de partenariat ?')) return;

    try {
      await partnerService.cancelPartnerApplication();
      setShowPartnerMenu(false);
      addToast(isEn ? 'Partner application cancelled.' : 'Demande de partenariat annulée.', 'success');
    } catch (error: unknown) {
      const errorDetails = error as { response?: { data?: { detail?: string } } };
      addToast(
        errorDetails.response?.data?.detail ||
          (isEn ? 'Unable to cancel the application.' : 'Impossible d’annuler la demande.'),
        'error'
      );
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
      <div className="flex items-center justify-between">
        <BackButton href="/" />
        <NotificationCenter showBadge={true} pollIntervalMs={60000} />
      </div>

      {/* ============ DESKTOP MAIN GRID LAYOUT (12 Columns) ============ */}
      <div className="grid grid-cols-1 nav:grid-cols-12 gap-6 items-start">
        
        {/* ============================================================ */}
        {/* LEFT / SIDEBAR COLUMN (4 cols on Desktop) - Identity & Profile */}
        {/* ============================================================ */}
        <div className="nav:col-span-4 space-y-6 nav:sticky nav:top-6">
          {/* USER PROFILE CARD */}
          <Panel className="p-6 relative">
            {!isPartner && !isStaff && (
              <div className="absolute right-3 top-3 z-10">
                <div ref={partnerMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setShowPartnerMenu((prev) => !prev)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-foreground/10 bg-background text-foreground/60 transition hover:border-gold/30 hover:text-gold"
                    aria-label={isEn ? 'More profile actions' : 'Plus d’actions du profil'}
                  >
                    <MoreHorizontal size={16} />
                  </button>

                  {showPartnerMenu && (
                    <div className="absolute right-0 top-10 w-56 rounded-xl border border-foreground/10 bg-background/95 p-2 shadow-2xl shadow-black/20 backdrop-blur-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPartnerMenu(false);
                          handleBecomePartner();
                        }}
                        disabled={isApplyingPartner}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition hover:bg-foreground/5"
                      >
                        {isApplyingPartner ? (
                          <Loader2 size={14} className="animate-spin text-gold" />
                        ) : (
                          <Sparkles size={14} className="text-gold" />
                        )}
                        <span>{t('become_partner', { defaultValue: isEn ? 'Become a Partner' : 'Devenir Prestataire' })}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCancelPartnerApplication}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-400 transition hover:bg-red-500/5"
                      >
                        <X size={14} />
                        <span>{isEn ? 'Cancel partner application' : 'Annuler la demande'}</span>
                      </button>

                      
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col items-center text-center pt-2">
              {/* Avatar */}
              <div className="relative mb-4">
                <input
                  id="profile-photo-input"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleProfilePhotoChange}
                  disabled={isUploadingPhoto}
                />
                <div className="w-24 h-24 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold text-3xl font-bold">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-full w-full rounded-xl object-cover" />
                  ) : initials}
                </div>
                <button
                  type="button"
                  onClick={() => document.getElementById('profile-photo-input')?.click()}
                  disabled={isUploadingPhoto}
                  className="absolute -bottom-1 -right-1 rounded-lg p-1.5 border border-foreground/10 bg-background text-foreground/45 hover:text-gold hover:border-gold/30 transition-colors"
                  aria-label={isEn ? 'Edit avatar' : 'Modifier la photo'}
                >
                  {isUploadingPhoto ? <Loader2 size={13} className="animate-spin" /> : <Edit2 size={13} />}
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
            className="hidden nav:flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/95 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition-colors disabled:opacity-50 mt-4"
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
        <div className="nav:col-span-8 space-y-6">

          {/* ---------- ACCESSIBLE DASHBOARDS GRID ---------- */}
          {accessibleDashboards.length > 0 && (
            <div>
              <SectionLabel>
                {t('your_spaces', { defaultValue: isEn ? 'Your Workspaces & Dashboards' : 'Vos espaces & tableaux de bord' })}
              </SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {accessibleDashboards.map((opt) => {
                  const title = t(opt.titleKey, {
                    defaultValue: isEn ? opt.defaultTitle : opt.defaultTitleFr,
                  });
                  const desc = t(opt.descKey, {
                    defaultValue: isEn ? opt.defaultDesc : opt.defaultDescFr,
                  });

                  return (
                    <button
                      key={opt.id}
                      onClick={() => router.push(opt.href)}
                      className="shadow-black/30  shadow-sm group flex items-start gap-3.5 p-4 rounded-xl border border-foreground/10 bg-foreground/[0.03] hover:bg-foreground/[0.05] transition-colors text-left"
                    >
                      <span className="flex shrink-0 mt-0.5 items-center justify-center">{opt.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground group-hover:text-gold transition-colors truncate">
                          {title}
                        </p>
                        <p className="text-[11px] text-foreground/40 mt-1 line-clamp-2">
                          {desc}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-foreground/35 group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                    </button>
                  );
                })}

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

          {/* ---------- CONFIDENTIALITY & DATA ---------- */}
          <div className="pt-2">
            <SectionLabel>{t('privacy_data', { defaultValue: isEn ? 'Privacy & Data' : 'Confidentialité et Données' })}</SectionLabel>
            <Panel className="border-red-500/10 bg-transparent">
              <div className="divide-y divide-foreground/10">
                <button
                  onClick={() => addToast(isEn ? 'This feature is coming soon.' : 'Cette fonctionnalité sera bientôt disponible.', 'info')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-500/5 transition-colors text-left group rounded-md"
                >
                  <div className="flex items-center justify-center w-7 h-7 rounded-md border border-red-500/15 bg-red-500/5 text-red-500/75 group-hover:bg-red-500/10 transition-colors shrink-0">
                    <X size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-red-500/80">{isEn ? 'Delete my account' : 'Supprimer mon compte'}</p>
                    <p className="text-[11px] text-red-500/55 mt-0.5">{isEn ? 'Permanently remove your account and data' : 'Supprimer définitivement votre compte et vos données'}</p>
                  </div>
                </button>
              </div>
            </Panel>
          </div>

          {/* LOGOUT BUTTON (Mobile only) */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            disabled={isLoggingOut}
            className="nav:hidden w-full flex items-center justify-center gap-2 rounded-lg bg-red-500/95 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition-colors disabled:opacity-50 mt-2"
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
        <PWAInstallGuide isEn={Boolean(isEn)} />
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