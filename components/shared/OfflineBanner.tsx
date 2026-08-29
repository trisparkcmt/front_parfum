'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * OfflineBanner — desktop-only global fixed banner (bottom of screen).
 * The mobile variant is rendered inside <Navbar> so it sits naturally
 * between the phone status bar and the navbar content row.
 */
export function OfflineBanner() {
  const { t } = useTranslation();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => {
      const isOffline = !navigator.onLine;
      setOffline(isOffline);
      if (isOffline) {
        document.documentElement.classList.add('is-offline');
      } else {
        document.documentElement.classList.remove('is-offline');
      }
    };
    update();
    window.addEventListener('offline', update);
    window.addEventListener('online', update);
    return () => {
      window.removeEventListener('offline', update);
      window.removeEventListener('online', update);
      document.documentElement.classList.remove('is-offline');
    };
  }, []);

  if (!offline) return null;

  // Desktop only — sits at the bottom of the viewport
  return (
    <div
      role="alert"
      className="hidden sm:flex fixed inset-x-0 bottom-0 z-[200] items-center justify-center gap-2 bg-red-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg"
    >
      <WifiOff size={17} />
      {t('offline_message', { defaultValue: 'Vous êtes hors ligne. Vérifiez votre connexion Internet.' })}
    </div>
  );
}

/**
 * MobileOfflineBanner — rendered inside the Navbar header on mobile.
 * It naturally appears between the phone status bar and the nav content.
 * Only manages the is-offline class — OfflineBanner handles the actual
 * class toggle for desktop; this component only renders the mobile strip.
 */
export function MobileOfflineBanner() {
  const { t } = useTranslation();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('offline', update);
    window.addEventListener('online', update);
    return () => {
      window.removeEventListener('offline', update);
      window.removeEventListener('online', update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-center justify-center gap-2 bg-red-600 px-4 py-2 text-center text-xs font-semibold text-white w-full"
    >
      <WifiOff size={14} />
      {t('offline_message', { defaultValue: 'Vous êtes hors ligne. Vérifiez votre connexion Internet.' })}
    </div>
  );
}
