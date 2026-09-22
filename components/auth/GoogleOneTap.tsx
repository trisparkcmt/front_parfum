'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePathname } from 'next/navigation';
import { preloadGoogleIdentityScript } from '@/components/auth/GoogleAuthButton';

const AUTH_PATHS = /\/(login|register|connexion|inscription|auth)/i;



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
        callback: async (oneTapResponse) => {
          if (!oneTapResponse?.credential) return;
          try {
            // Pass the credential solely as the idToken parameter.
            // Leave accessToken and code as undefined.
            await loginWithGoogle(undefined, undefined, oneTapResponse.credential);
          } catch (err) {
            console.error('[GoogleOneTap] login failed:', err);
          }
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
