'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  User, Mail, Phone, MapPin, 
  Languages, Banknote, Palette, 
  ChevronRight, Edit2, Shield, Bell, TrendingUp, Download
} from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { useThemeStore } from '@/store/useThemeStore';
import { attemptPWAInstall, getPWAInstallHint, isPWAInstalled } from '@/lib/pwa';
import PasswordChangeModal from '@/components/shared/PasswordChangeModal';
import ProfileEditModal from '@/components/shared/ProfileEditModal';

export default function PartnerProfilePage() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t } = useTranslation();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isInstallingPWA, setIsInstallingPWA] = useState(false);

  const isInstalled = isPWAInstalled();

  const handleLanguageChange = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  const handleInstallPWA = async () => {
    setIsInstallingPWA(true);
    try {
      const result = await attemptPWAInstall();
      if (result === 'accepted') {
        alert('Application installée, ouvrez-la depuis l’écran d’accueil');
      } else if (result === 'dismissed') {
        alert('Installation annulée');
      } else if (result === 'installed') {
        alert('L’application est déjà installée');
      } else if (result === 'fallback') {
        alert('iOS : ouvrez Safari puis utilisez Partager → Ajouter à l’écran d’accueil.');
      } else {
        alert('Aucune option d’installation PWA disponible pour ce navigateur. Utilisez le menu du navigateur pour ajouter l’application à l’écran d’accueil.');
      }
    } catch (error) {
      console.error('PWA install error:', error);
      alert('Erreur lors de l’installation de la PWA');
    } finally {
      setIsInstallingPWA(false);
    }
  };

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

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
      <BackButton />
      
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-foreground">{t('partner_profile')}</h1>
        <button 
          onClick={() => logout()}
          className="bg-red-500/10 text-red-400 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all border border-red-500/20"
        >
          {t('logout')}
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-2xl flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-black text-xl font-bold shadow-lg shadow-gold/20">
          {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-foreground">{user?.firstName} {user?.lastName}</h2>
          <p className="text-sm text-foreground/40">{user?.email}</p>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded mt-1 inline-block uppercase tracking-wider">{t('official_partner')}</span>
        </div>
        <button 
          onClick={() => setShowEditModal(true)}
          className="p-2 rounded-lg hover:bg-white/5 text-gold transition-colors">
          <Edit2 size={18} />
        </button>
      </div>

      {/* Information Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-foreground/40 uppercase tracking-widest px-1">{t('partner_info')}</h3>
        <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden divide-y divide-white/5">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-foreground/40">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-foreground/40 uppercase">{t('contact_email')}</p>
                <p className="text-sm text-foreground">{user?.email}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-foreground/40">
                <TrendingUp size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-foreground/40 uppercase">{t('referral_code')}</p>
                <p className="text-sm text-gold font-mono font-bold">EXCLUSIF-{user?.lastName?.toUpperCase()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

       {/* Preferences Section */}
       <div className="space-y-3">
         <h3 className="text-xs font-bold text-foreground/40 uppercase tracking-widest px-1">{t('settings')}</h3>
         <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden divide-y divide-white/5">
           <button 
             onClick={() => setShowPasswordModal(true)}
             className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-all group">
             <div className="flex items-center gap-3">
               <div className="w-9 h-9 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-400">
                 <Shield size={18} />
               </div>
               <div className="text-left">
                 <p className="text-sm font-semibold text-foreground">{t('change_password', 'Change Password')}</p>
                 <p className="text-[11px] text-foreground/40">{t('update_security')}</p>
               </div>
             </div>
             <ChevronRight size={16} className="text-foreground/20 group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
           </button>
           {settingsOptions.map((opt) => (
             <button 
               key={opt.id}
               onClick={opt.action}
               className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-all group"
             >
               <div className="flex items-center gap-3">
                 <div className={`w-9 h-9 rounded-lg ${opt.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                   {opt.icon}
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

      <div className="pt-4">
        <button 
          onClick={() => logout()}
          className="w-full py-4 text-sm font-bold text-red-400 hover:text-red-300 transition-colors border border-red-400/20 rounded-2xl hover:bg-red-400/5"
        >
          {t('logout')}
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
    </div>
  );
}


