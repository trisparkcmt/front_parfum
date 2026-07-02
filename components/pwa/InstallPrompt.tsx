'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AppImage from '@/components/ui/AppImage';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * PWA Install Prompt Banner
 * Intercepts the browser's beforeinstallprompt event and shows a custom
 * install banner. When user clicks "Install", triggers the native
 * browser install dialog.
 */
export function InstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      // Prevent the default mini-infobar
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Check if user previously dismissed
      const dismissed = localStorage.getItem('ae-pwa-dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    // Show the native install prompt
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Remember dismissal for 7 days
    localStorage.setItem('ae-pwa-dismissed', Date.now().toString());
    setTimeout(() => {
      localStorage.removeItem('ae-pwa-dismissed');
    }, 7 * 24 * 60 * 60 * 1000);
  };

  if (isInstalled || !showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] mx-auto max-w-md animate-fade-in-up">
      <div className="relative bg-gradient-to-r from-charcoal to-deep-black border border-gold/30 rounded-2xl p-4 shadow-2xl shadow-gold/10 backdrop-blur-xl">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-foreground/40 hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-4">
          {/* App Icon */}
          <div className="w-14 h-14 rounded-xl overflow-hidden border border-gold/20 shadow-lg shadow-gold/10 shrink-0">
            <AppImage src="/icons/icon-192x192.jpeg" alt="Accessoires Exclusifs" width={56} height={56} className="w-full h-full object-cover" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground text-sm truncate">
              Accessoires Exclusifs
            </p>
            <p className="text-xs text-foreground/50 mt-0.5">
              {t('install_pwa_desc', { defaultValue: "Installez l'app pour une meilleure expérience" })}
            </p>
          </div>
        </div>

        {/* Install Button */}
        <button
          onClick={handleInstall}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-gold text-black font-bold text-sm py-2.5 rounded-xl hover:bg-gold-light transition-all active:scale-[0.98]"
        >
          <Download size={16} />
          {t('install_action', { defaultValue: 'Installer' })}
        </button>
      </div>
    </div>
  );
}
