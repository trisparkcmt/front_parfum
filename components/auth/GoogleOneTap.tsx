'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePathname } from 'next/navigation';

const AUTH_PATHS = /\/(login|register|connexion|inscription|auth)/i;
const GOOGLE_SCRIPT_ID = 'google-identity-services';

/** Clear the g_state cookie to prevent Google's exponential cooldown from suppressing One Tap */
function clearGoogleStateCookie() {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = 'g_state=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;sameSite=Lax';
  } catch {
    // Ignore cookie errors
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
    if (initialized.current) return;

    let checkTimer: NodeJS.Timeout | null = null;

    function initOneTap() {
      if (!window.google?.accounts?.id || initialized.current) return;
      initialized.current = true;

      try {
        // Clear g_state so Google doesn't suppress One Tap due to past dismissal
        clearGoogleStateCookie();

        window.google.accounts.id.initialize({
          client_id: clientId,
          itp_support: true,
          use_fedcm_for_prompt: true,
          auto_select: false,
          cancel_on_tap_outside: false,
          context: 'signin',
          callback: async (oneTapResponse) => {
            if (!oneTapResponse?.credential) return;
            try {
              await loginWithGoogle(undefined, undefined, oneTapResponse.credential);
            } catch (err) {
              console.error('[GoogleOneTap] Login failed:', err);
            }
          },
        });

        window.google.accounts.id.prompt((n) => {
          if (n.isNotDisplayed()) {
            console.info('[GoogleOneTap] Not displayed – reason:', n.getNotDisplayedReason());
          } else if (n.isSkippedMoment()) {
            console.info('[GoogleOneTap] Skipped – reason:', n.getSkippedReason());
          } else if (n.isDismissedMoment()) {
            console.info('[GoogleOneTap] Dismissed – reason:', n.getDismissedReason());
          }
        });
      } catch (err) {
        console.error('[GoogleOneTap] Initialization error:', err);
      }
    }

    if (window.google?.accounts?.id) {
      initOneTap();
    } else {
      let script = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = GOOGLE_SCRIPT_ID;
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }

      script.addEventListener('load', initOneTap, { once: true });

      checkTimer = setInterval(() => {
        if (window.google?.accounts?.id) {
          if (checkTimer) clearInterval(checkTimer);
          initOneTap();
        }
      }, 200);
    }

    return () => {
      if (checkTimer) clearInterval(checkTimer);
    };
  }, [isAuthenticated, clientId, pathname, loginWithGoogle]);

  return null;
}
