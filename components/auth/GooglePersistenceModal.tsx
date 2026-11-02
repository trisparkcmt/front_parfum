'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { setAuthPersistence, getAuthItem } from '@/services/api';
import { ShieldCheck, CheckCircle2, Clock, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function GooglePersistenceModal() {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const router = useRouter();
  const pathname = usePathname();

  const showGooglePersistencePrompt = useAuthStore((s) => s.showGooglePersistencePrompt);
  const setShowGooglePersistencePrompt = useAuthStore((s) => s.setShowGooglePersistencePrompt);
  const googleLoginRedirectUrl = useAuthStore((s) => s.googleLoginRedirectUrl);
  const setGoogleLoginRedirectUrl = useAuthStore((s) => s.setGoogleLoginRedirectUrl);
  const user = useAuthStore((s) => s.user);

  if (!showGooglePersistencePrompt) return null;

  const handleChoice = (rememberMe: boolean) => {
    // 1. Configure persistence in storage
    setAuthPersistence(rememberMe);

    if (typeof window !== 'undefined') {
      const token = getAuthItem('auth_token') || localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (token) {
        if (rememberMe) {
          localStorage.setItem('auth_token', token);
          localStorage.setItem('auth_persistent', 'true');
        } else {
          sessionStorage.setItem('auth_token', token);
          localStorage.removeItem('auth_token');
          localStorage.setItem('auth_persistent', 'false');
          localStorage.removeItem('ae-auth');
        }
      }
    }

    // 2. Close the modal
    setShowGooglePersistencePrompt(false);

    // 3. Handle navigation if on auth page or if redirect URL is specified
    const targetUrl = googleLoginRedirectUrl;
    setGoogleLoginRedirectUrl(null);

    const isAuthPage = pathname ? /\/(login|register|connexion|inscription)/i.test(pathname) : false;
    if (targetUrl) {
      router.push(targetUrl);
    } else if (isAuthPage) {
      router.push('/');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative bg-background border border-gold/30 rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl shadow-black/60 text-center animate-in zoom-in-95 duration-200">
        {/* Close button (defaults to stay signed in) */}
        <button
          type="button"
          onClick={() => handleChoice(true)}
          className="absolute top-4 right-4 text-foreground/40 hover:text-foreground transition-colors p-1 rounded-lg hover:bg-white/5"
          aria-label={isEn ? 'Close' : 'Fermer'}
        >
          <X size={18} />
        </button>

        {/* Security / Persistence Icon */}
        <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4 text-gold shadow-lg shadow-gold/5">
          <ShieldCheck size={28} />
        </div>

        {/* Title & Description */}
        <h3 className="font-serif text-2xl font-normal text-foreground mb-1.5">
          {isEn ? 'Stay Signed In?' : 'Rester connecté ?'}
        </h3>
        <p className="text-xs text-foreground/60 leading-relaxed mb-5 max-w-xs mx-auto">
          {isEn
            ? 'Would you like to keep your session active on this device for future visits?'
            : 'Souhaitez-vous maintenir votre session active sur cet appareil pour vos prochaines visites ?'}
        </p>

        {/* User Profile Card */}
        {user && (
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 mb-5 text-left">
            <div className="w-10 h-10 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold font-serif text-sm font-bold shrink-0">
              {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email}
              </p>
              <p className="text-[11px] text-foreground/50 truncate">
                {user.email}
              </p>
            </div>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium shrink-0">
              Google
            </span>
          </div>
        )}

        {/* Action Choice 1: Stay Logged In (Primary) */}
        <button
          type="button"
          onClick={() => handleChoice(true)}
          className="w-full group p-4 rounded-xl border border-gold/40 bg-gold/10 hover:bg-gold/20 text-left transition-all duration-200 mb-3 hover:border-gold hover:shadow-md hover:shadow-gold/10 active:scale-[0.99]"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-gold shrink-0" />
              <span className="text-sm font-semibold text-foreground">
                {isEn ? 'Yes, stay signed in' : 'Oui, rester connecté'}
              </span>
            </div>
            <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-gold text-black font-bold shrink-0">
              {isEn ? 'Recommended' : 'Recommandé'}
            </span>
          </div>
          <p className="text-[11px] text-foreground/50 pl-6">
            {isEn
              ? 'Keep your session active on your personal phone or computer.'
              : 'Conserve votre session active sur votre appareil personnel.'}
          </p>
        </button>

        {/* Action Choice 2: Session Only (Secondary) */}
        <button
          type="button"
          onClick={() => handleChoice(false)}
          className="w-full group p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/5 text-left transition-all duration-200 active:scale-[0.99]"
        >
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} className="text-foreground/40 group-hover:text-foreground/70 transition-colors shrink-0" />
            <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
              {isEn ? 'No, this session only' : 'Non, pour cette session uniquement'}
            </span>
          </div>
          <p className="text-[11px] text-foreground/40 pl-6">
            {isEn
              ? 'Automatically sign out when your browser is closed.'
              : 'Déconnexion automatique à la fermeture du navigateur.'}
          </p>
        </button>
      </div>
    </div>
  );
}
export default GooglePersistenceModal;
