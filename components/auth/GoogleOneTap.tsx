'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePathname } from 'next/navigation';
import { preloadGoogleIdentityScript } from '@/components/auth/GoogleAuthButton';

const AUTH_PATHS = /\/(login|register|connexion|inscription|auth)/i;

/** Decode a JWT payload without verifying — only used to extract the email hint. */
function jwtEmail(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload?.email ?? null;
  } catch {
    return null;
  }
}

export function GoogleOneTap() {
  const { isAuthenticated, loginWithGoogle } = useAuthStore();
  const pathname = usePathname();
  const clientId = useMemo(() => process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '', []);
  const initialized = useRef(false);

  useEffect(() => {
    // Skip on auth pages, when already logged in, or if no client ID
    if (isAuthenticated || !clientId || AUTH_PATHS.test(pathname ?? '')) return;
    // Only run once per mount
    if (initialized.current) return;

    function boot() {
      if (!window.google?.accounts?.id) return;

      // ── 1. Initialize One Tap FIRST (so the prompt can show) ───────────────
      window.google.accounts.id.initialize({
        client_id: clientId,
        // itp_support enables the upgraded One Tap UX on ITP browsers (Safari)
        itp_support: true,
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signin',
        callback: (oneTapResponse) => {
          // One Tap gives us an ID-token (JWT). Our backend only accepts an
          // OAuth2 access_token, so we bridge by creating the token client
          // on demand here — AFTER One Tap has already shown — to avoid
          // the two flows interfering with each other.
          const email = jwtEmail(oneTapResponse.credential);
          if (!window.google?.accounts?.oauth2) return;

          const tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'openid email profile',
            callback: async (tokenResponse) => {
              if (tokenResponse?.access_token) {
                await loginWithGoogle(tokenResponse.access_token).catch(console.error);
              }
            },
            error_callback: (err) => {
              console.error('[GoogleOneTap] token error', err);
            },
          });

          // Request the access token.
          // - No prompt = Google decides: instant if consent already granted,
          //   brief consent popup if this is a new user.
          // - login_hint pre-selects the account so no extra picker appears.
          tokenClient.requestAccessToken({
            ...(email ? { login_hint: email } : {}),
          });
        },
      });

      initialized.current = true;

      // ── 2. Show the prompt ─────────────────────────────────────────────────
      window.google.accounts.id.prompt((n) => {
        if (n.isNotDisplayed()) {
          // Common reasons: 'suppressed_by_user', 'browser_not_supported',
          // 'invalid_client', 'missing_client_id', 'unregistered_origin'
          console.info('[GoogleOneTap] not displayed –', n.getNotDisplayedReason());
        }
      });
    }

    if (window.google?.accounts?.id) {
      boot();
    } else {
      // Load the script and boot once it's ready
      preloadGoogleIdentityScript();
      const script = document.getElementById('google-identity-services') as HTMLScriptElement | null;
      if (script) {
        script.addEventListener('load', boot, { once: true });
        return () => script.removeEventListener('load', boot);
      }
    }
  }, [isAuthenticated, clientId, pathname, loginWithGoogle]);

  return null;
}
