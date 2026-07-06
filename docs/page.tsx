'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { User, Mail, Phone, Shield, Calendar, Edit2, Lock, LayoutDashboard, Globe, Sun } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { BackButton } from '@/components/ui/BackButton';
import { LanguageSelector } from '@/components/shared/LanguageSelector';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import PasswordChangeModal from '@/components/shared/PasswordChangeModal';
import ProfileEditModal from '@/components/shared/ProfileEditModal';

export default function AdminProfilePage() {
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('profile')}</h1>
          <p className="text-sm text-foreground/70 mt-0.5">{t('profile_subtitle', 'Gérez vos informations personnelles et de sécurité')}</p>
        </div>
        <Link
          href="/dashboard/admin/dashboard"
          className="bg-gold text-black px-4 py-2 rounded-xl text-sm font-bold hover:bg-gold/80 transition-all flex items-center gap-2"
        >
          <LayoutDashboard size={18} />
          {t('access_dashboard', 'Accéder au Dashboard')}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col: Avatar & Basic Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 shadow-sm text-center">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-black text-3xl font-bold shadow-xl shadow-gold/20">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <button className="absolute bottom-0 right-0 p-1.5 bg-background rounded-full border border-white/10 text-foreground/40 hover:text-gold shadow-sm transition-colors">
                <Edit2 size={14} className="text-foreground/50" />
              </button>
            </div>
            <h2 className="text-lg font-bold text-foreground">{user?.firstName} {user?.lastName}</h2>
            <p className="text-xs font-semibold text-gold bg-gold/10 px-2.5 py-1 rounded-full mt-2 inline-block capitalize">
              {t('admin_role', 'Administrateur')}
            </p>
            <div className="mt-6 pt-6 border-t border-white/5 text-left space-y-4">
              <div className="flex items-center gap-3 text-sm text-foreground/70">
                <Mail size={16} className="text-foreground/50" />
                <span className="truncate">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-foreground/70">
                <Phone size={16} className="text-foreground/50" />
                <span>{user?.phone || t('not_provided')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-foreground/70">
                <Calendar size={16} className="text-foreground/50" />
                <span>{t('member_since')}</span>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/10 transition-all"
            >
              <Lock size={16} />
              {t('logout')}
            </button>
          </div>
        </div>

        {/* Right Col: Details & Security */}
        <div className="md:col-span-2 space-y-6">
          {/* Details */}
          <div className="bg-white/5 rounded-2xl border border-white/10 shadow-sm overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">{t('information')}</h3>
              <button
                onClick={() => setShowEditModal(true)}
                className="text-sm text-gold font-medium hover:underline flex items-center gap-1.5"
              >
                <Edit2 size={14} /> {t('edit')}
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-foreground/50 uppercase mb-1.5">{t('first_name', 'Prénom')}</label>
                <div className="p-2.5 bg-white/5 rounded-lg text-sm text-foreground">
                  {user?.firstName}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/50 uppercase mb-1.5">{t('last_name', 'Nom')}</label>
                <div className="p-2.5 bg-white/5 rounded-lg text-sm text-foreground">
                  {user?.lastName}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/50 uppercase mb-1.5">{t('email')}</label>
                <div className="p-2.5 bg-white/5 rounded-lg text-sm text-foreground">
                  {user?.email}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/50 uppercase mb-1.5">{t('phone')}</label>
                <div className="p-2.5 bg-white/5 rounded-lg text-sm text-foreground">
                  {user?.phone || t('not_provided')}
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white/5 rounded-2xl border border-white/10 shadow-sm overflow-hidden">
            <div className="px-6 py-4">
              <h3 className="font-semibold text-foreground">{t('settings')}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-gold shadow-sm">
                    <Globe size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('language')}</p>
                    <p className="text-xs text-foreground/50">{t('choose_language_desc', 'Choisissez votre langue préférée')}</p>
                  </div>
                </div>
                <LanguageSelector />
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-gold shadow-sm">
                    <Sun size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('theme', 'Apparence')}</p>
                    <p className="text-xs text-foreground/50">{t('theme_desc', 'Basculez entre le mode clair et sombre')}</p>
                  </div>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white/5 rounded-2xl border border-white/10 shadow-sm overflow-hidden">
            <div className="px-6 py-4">
              <h3 className="font-semibold text-foreground">{t('account_security')}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-gold shadow-sm">
                    <Lock size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('password', 'Mot de passe')}</p>
                    <p className="text-xs text-foreground/40">{t('last_modified', 'Dernière modification il y a 3 mois')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="text-xs bg-white/5 text-foreground px-3 py-1.5 rounded-lg font-medium hover:bg-white/10 transition-colors"
                >
                  {t('change', 'Changer')}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-gold shadow-sm border border-white/10">
                    <Shield size={18} className="text-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('password_2fa')}</p>
                    <p className="text-xs text-red-400 font-medium text-red-400">{t('not_activated', 'Non activée')}</p>
                  </div>
                </div>
                <button className="text-xs bg-gold text-black px-3 py-1.5 rounded-lg font-bold hover:bg-gold/80 transition-colors">
                  {t('activate', 'Activer')}
                </button>
              </div>
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
    </>
  );
}
