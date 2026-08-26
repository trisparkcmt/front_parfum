'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function OfflineBanner() {
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
    <>
      {/* Mobile: pinned above the navbar at the very top */}
      <div
        role="alert"
        className="sm:hidden fixed top-0 inset-x-0 z-[210] flex items-center justify-center gap-2 bg-red-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-lg"
      >
        <WifiOff size={16} />
        {t('offline_message', { defaultValue: 'Vous êtes hors ligne. Vérifiez votre connexion Internet.' })}
      </div>

      {/* Desktop: keep at bottom */}
      <div
        role="alert"
        className="hidden sm:flex fixed inset-x-0 bottom-0 z-[200] items-center justify-center gap-2 bg-red-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg"
      >
        <WifiOff size={17} />
        {t('offline_message', { defaultValue: 'Vous êtes hors ligne. Vérifiez votre connexion Internet.' })}
      </div>
    </>
  );
}
