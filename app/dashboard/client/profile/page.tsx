'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  User, Mail, Phone, MapPin, 
  Languages, Banknote, Palette, 
  ChevronRight, Edit2, Shield, Bell, Loader2, Download
} from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import Link from 'next/link';
import { useThemeStore } from '@/store/useThemeStore';
import { useToastStore } from '@/store/useToastStore';
import { api } from '@/services/api';
import { attemptPWAInstall, getPWAInstallHint, isPWAInstalled } from '@/lib/pwa';
import PasswordChangeModal from '@/components/shared/PasswordChangeModal';
import ProfileEditModal from '@/components/shared/ProfileEditModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

export default function ClientProfilePage() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const router = useRouter();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isInstallingPWA, setIsInstallingPWA] = useState(false);

  const handleLanguageChange = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  const handleInstallPWA = async () => {
    setIsInstallingPWA(true);
    try {
      const result = await attemptPWAInstall();
      if (result === 'accepted') {
        addToast(t('pwa_install_success', { defaultValue: 'Installation en cours...' }), 'success');
      } else if (result === 'dismissed') {
        addToast(t('pwa_install_cancelled', { defaultValue: 'Installation annulée' }), 'info');
      } else if (result === 'installed') {
        addToast(t('pwa_already_installed', { defaultValue: 'L’application est déjà installée' }), 'info');
      } else if (result === 'fallback') {
        addToast(
          t('pwa_ios_fallback', { defaultValue: 'iOS : ouvrez Safari puis Partager → Ajouter à l’écran d’accueil.' }),
          'info',
        );
      } else {
        addToast(
          t('pwa_not_available', { defaultValue: 'PWA installation non disponible sur ce navigateur' }),
          'info',
        );
      }
    } catch (error) {
      console.error('PWA installation error:', error);
      addToast(t('pwa_install_failed', { defaultValue: 'Erreur lors de l\'installation' }), 'error');
    } finally {
      setIsInstallingPWA(false);
    }
  };

  const isInstalled = isPWAInstalled();

  const settingsOptions = [
    { 
      id: 'language', 
      label: t('language'), 
      value: i18n.language === 'fr' ? 'Français' : 'English', 
      icon: <Languages size={18} className="text-blue-400" />,
      bg: 'bg-blue-400/10',
      action: handleLanguageChange
    },
    { 
      id: 'currency', 
      label: t('currency'), 
      value: 'FCFA', 
      icon: <Banknote size={18} className="text-emerald-400" />,
      bg: 'bg-emerald-400/10'
    },
    { 
      id: 'appearance', 
      label: t('appearance'), 
      value: theme === 'dark' ? t('dark') : t('light'), 
      icon: <Palette size={18} className="text-purple-400" />,
      bg: 'bg-purple-400/10',
      action: toggleTheme
    },
    {
      id: 'install-pwa',
      label: t('install_app', { defaultValue: 'Installer l\'app' }),
      value: getPWAInstallHint(),
      icon: <Download size={18} className={isInstalled ? 'text-emerald-400' : 'text-gold'} />,
      bg: isInstalled ? 'bg-emerald-400/10' : 'bg-gold/10',
      action: handleInstallPWA,
      isLoading: isInstallingPWA,
    },
  ];

  const handleBecomePartner = async () => {
    try {
      const response = await api.post('/auth/prestataire/apply/');
      addToast(response.data.detail || t('become_partner_request_sent'), 'success');
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || "Une demande est déjà en cours ou vous êtes déjà prestataire.";
      addToast(errorMsg, 'error');
    }
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

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
      <BackButton />
      
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-foreground">{t('profile')}</h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleBecomePartner}
            className="bg-emerald-500 text-foreground px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all  shadow-emerald-500/20"
          >
            {t('become_partner')}
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-gray-800/5 rounded-2xl border border-white/10 p-6  flex items-center gap-4">
        <div className="shadow-sm  w-16 h-16 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-black text-xl font-bold  shadow-gold/20">
          {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-foreground">{user?.firstName} {user?.lastName}</h2>
          <p className="text-sm text-foreground/40">{user?.email}</p>
        </div>
        <button 
          onClick={() => setShowEditModal(true)}
          className="p-2 rounded-lg hover:bg-white/5 text-gold transition-colors">
          <Edit2 size={18} />
        </button>
      </div>

      {/* Information Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-foreground/40 uppercase tracking-widest px-1">{t('information')}</h3>
        <div className="bg-gray-800/5 rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/5 shadow-sm ">
        
          <Link href='/dashboard/client/'>
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-foreground/40">
               
              </div>
              <div>
                <p className="text-sm text-foreground">My dashboard</p>
              </div>
            </div>
          </div>
          </Link>
          <button 
            onClick={() => setShowEditModal(true)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-foreground/40">
                <Edit2 size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t('edit_profile', 'Edit Profile')}</p>
                <p className="text-[11px] text-foreground/40">{t('update_information')}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-foreground/20" />
          </button>
          <button 
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-foreground/40">
                <Shield size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t('change_password', 'Change Password')}</p>
                <p className="text-[11px] text-foreground/40">{t('update_security')}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-foreground/20" />
          </button>
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-foreground/40">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-foreground/40 uppercase">{t('email')}</p>
                <p className="text-sm text-foreground">{user?.email}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-foreground/40">
                <Phone size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-foreground/40 uppercase">{t('phone')}</p>
                <p className="text-sm text-foreground">{user?.phone || t('not_provided')}</p>
              </div>
            </div>
            <button className="text-xs text-gold font-medium">{t('edit')}</button>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-foreground/40">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-foreground/40 uppercase">{t('address')}</p>
                <p className="text-sm text-foreground truncate max-w-[200px]">Bastos, Yaoundé, Cameroun</p>
              </div>
            </div>
            <button className="text-xs text-gold font-medium">{t('change_btn')}</button>
          </div>
        </div>
      </div>

      {/* Preferences Section (As requested in image) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-foreground/40 uppercase tracking-widest px-1">{t('settings')}</h3>
        <div className="shadow-sm bg-gray-800/5 rounded-2xl border border-white/10  overflow-hidden divide-y divide-white/5">
          {settingsOptions.map((opt) => (
            <button 
              key={opt.id}
              onClick={opt.action}
              disabled={(opt as any).isLoading}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-500/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${opt.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  {(opt as any).isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    opt.icon
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                  <p className="text-[11px] text-foreground/40">{opt.value}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-foreground/20 group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>
      </div>

      {/* Security Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-foreground/40 uppercase tracking-widest px-1">{t('security_notifications')}</h3>
        <div className=" shadow-sm bg-gray-800/5 rounded-2xl border border-white/10  overflow-hidden divide-y divide-white/5">
          <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-800/5 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-400">
                <Shield size={18} />
              </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('account_security')}</p>
                    <p className="text-[11px] text-foreground/40">{t('password_2fa')}</p>
                  </div>
            </div>
            <ChevronRight size={16} className="text-foreground/20" />
          </button>
          <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-800/5 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-400/10 flex items-center justify-center text-emerald-400">
                <Bell size={18} />
              </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('notifications')}</p>
                    <p className="text-[11px] text-foreground/40">{t('notification_channels')}</p>
                  </div>
            </div>
            <ChevronRight size={16} className="text-foreground/20" />
          </button>
        </div>
      </div>

      <div className="pt-4">
        <button 
          onClick={() => setShowLogoutConfirm(true)}
          disabled={isLoggingOut}
          className="w-full py-4 text-sm font-bold text-red-400 hover:text-red-300 transition-colors border border-red-400/20 rounded-2xl hover:bg-red-400/5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoggingOut ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {t('logging_out', { defaultValue: 'Déconnexion...' })}
            </>
          ) : (
            t('logout')
          )}
        </button>
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
        title={t('confirm_logout_title', { defaultValue: 'Confirmation' })}
        message={t('confirm_logout', { defaultValue: 'Êtes-vous sûr de vouloir vous déconnecter ?' })}
        confirmText={t('logout_btn', { defaultValue: 'Déconnexion' })}
        cancelText={t('cancel', { defaultValue: 'Annuler' })}
        variant="danger"
        isLoading={isLoggingOut}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}


