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
    <div role="alert" className="fixed inset-x-0 bottom-0 z-[200] flex items-center justify-center gap-2 bg-red-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg">
      <WifiOff size={17} />
      {t('offline_message', { defaultValue: 'Vous êtes hors ligne. Vérifiez votre connexion Internet.' })}
    </div>
  );
}
