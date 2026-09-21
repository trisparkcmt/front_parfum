'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePathname } from 'next/navigation';
import { preloadGoogleIdentityScript } from '@/components/auth/GoogleAuthButton';

/**
 * Decode the payload of a JWT without verifying the signature.
 * Safe to use on the client — we only need the user's email/sub for the login_hint.
 */
function decodeJwtPayload(token: string): Record<string, string> | null {
  try {
    const [, payload] = token.split('.');
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function GoogleOneTap() {
  const { isAuthenticated, loginWithGoogle } = useAuthStore();
  const pathname = usePathname();
  const clientId = useMemo(() => process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '', []);
  // Keep a ref to the OAuth2 token client so it isn't recreated on every render
  const tokenClientRef = useRef<{ requestAccessToken: (options?: { hint?: string; prompt?: string }) => void } | null>(null);

  useEffect(() => {
    if (isAuthenticated || !clientId) return;
    if (pathname?.includes('/login') || pathname?.includes('/register')) return;

    const initializeOneTap = () => {
      if (!window.google?.accounts?.id || !window.google?.accounts?.oauth2) return;

      // Step 1 — Build the OAuth2 token client used to get a proper access_token
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        callback: async (tokenResponse) => {
          if (!tokenResponse?.access_token) return;
          try {
            await loginWithGoogle(tokenResponse.access_token);
          } catch (err) {
            console.error('[GoogleOneTap] OAuth2 token login failed:', err);
          }
        },
        error_callback: () => {
          console.error('[GoogleOneTap] OAuth2 token request failed');
        },
      });

      // Step 2 — Initialize One Tap for the native popup UX
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (oneTapResponse) => {
          if (!oneTapResponse.credential) return;

          // One Tap gives us an ID token (JWT).
          // The backend expects an OAuth2 access_token, so we:
          //   a) decode the JWT to get the user's email
          //   b) use it as login_hint in the OAuth2 token flow
          //      so Google skips the account picker (seamless UX)
          const payload = decodeJwtPayload(oneTapResponse.credential);
          const hint = payload?.email || payload?.sub;

          if (tokenClientRef.current) {
            tokenClientRef.current.requestAccessToken({
              // Empty string prompt = skip consent screen if already granted
              prompt: '',
              ...(hint ? { hint } : {}),
            } as any);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: false,
        context: 'signin',
      });

      // Step 3 — Show the One Tap prompt
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          console.log('[GoogleOneTap] Not displayed:', notification.getNotDisplayedReason());
        }
      });
    };

    if (window.google?.accounts?.id && window.google?.accounts?.oauth2) {
      initializeOneTap();
    } else {
      preloadGoogleIdentityScript();
      const script = document.getElementById('google-identity-services') as HTMLScriptElement | null;
      if (script) {
        script.addEventListener('load', initializeOneTap);
        return () => script.removeEventListener('load', initializeOneTap);
      }
    }
  }, [isAuthenticated, clientId, pathname, loginWithGoogle]);

  return null;
}
