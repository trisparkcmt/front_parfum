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
  const tokenClientRef = useRef<{ requestAccessToken: (options?: { login_hint?: string; prompt?: string }) => void } | null>(null);

  useEffect(() => {
    if (isAuthenticated || !clientId || isAuthPage(pathname) || hasInitializedRef.current) {
      return;
    }

    const initializeOneTap = () => {
      if (!window.google?.accounts?.id || !window.google?.accounts?.oauth2) {
        console.warn('[GoogleOneTap] Google SDK not ready yet');
        return;
      }

      if (hasInitializedRef.current) {
        return;
      }

      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        callback: async (tokenResponse) => {
          if (!tokenResponse?.access_token) {
            console.warn('[GoogleOneTap] Missing access token from Google callback');
            return;
          }

          try {
            await loginWithGoogle(tokenResponse.access_token);
          } catch (err) {
            console.error('[GoogleOneTap] OAuth2 token login failed:', err);
          }
        },
        error_callback: (error) => {
          console.error('[GoogleOneTap] OAuth2 token request failed', error);
        },
      });

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (oneTapResponse) => {
          if (!oneTapResponse?.credential) return;

          const payload = decodeJwtPayload(oneTapResponse.credential);
          const loginHint = payload?.email || payload?.sub || '';

          if (tokenClientRef.current) {
            tokenClientRef.current.requestAccessToken({
              prompt: 'consent',
              ...(loginHint ? { login_hint: loginHint } : {}),
            });
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
