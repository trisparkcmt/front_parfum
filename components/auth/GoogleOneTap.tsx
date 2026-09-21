'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePathname } from 'next/navigation';
import { preloadGoogleIdentityScript } from '@/components/auth/GoogleAuthButton';

function decodeJwtPayload(token: string): Record<string, string> | null {
  try {
    const [, payload] = token.split('.');
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const isAuthPage = (pathname?: string | null) => {
  if (!pathname) return false;
  return /\/login|\/register|\/connexion|\/inscription|\/auth\//i.test(pathname);
};

export function GoogleOneTap() {
  const { isAuthenticated, loginWithGoogle } = useAuthStore();
  const pathname = usePathname();
  const clientId = useMemo(() => process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '', []);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated || !clientId || isAuthPage(pathname) || hasInitializedRef.current) {
      return;
    }

    const initializeOneTap = () => {
      if (!window.google?.accounts?.id) {
        console.warn('[GoogleOneTap] Google SDK not ready yet');
        return;
      }

      if (hasInitializedRef.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (oneTapResponse) => {
          if (!oneTapResponse?.credential) {
            console.warn('[GoogleOneTap] Missing credential from Google One Tap response');
            return;
          }

          try {
            const success = await loginWithGoogle('', undefined, oneTapResponse.credential);
            if (!success) {
              console.warn('[GoogleOneTap] One Tap login callback returned false');
            }
          } catch (err) {
            console.error('[GoogleOneTap] One Tap login failed:', err);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signin',
      });

      hasInitializedRef.current = true;

      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          console.log('[GoogleOneTap] Not displayed:', notification.getNotDisplayedReason());
        } else if (notification.isSkippedMoment()) {
          console.log('[GoogleOneTap] One Tap skipped by user action');
        } else if (notification.isDismissedMoment()) {
          console.log('[GoogleOneTap] One Tap dismissed');
        }
      });
    };

    const bootGoogleOneTap = () => {
      if (window.google?.accounts?.id && window.google?.accounts?.oauth2) {
        initializeOneTap();
        return;
      }

      preloadGoogleIdentityScript();
      const script = document.getElementById('google-identity-services') as HTMLScriptElement | null;
      if (!script) {
        return;
      }

      const onLoad = () => initializeOneTap();
      script.addEventListener('load', onLoad, { once: true });
      return () => script.removeEventListener('load', onLoad);
    };

    const cleanup = bootGoogleOneTap();
    return cleanup;
  }, [clientId, isAuthenticated, loginWithGoogle, pathname]);

  return null;
}
