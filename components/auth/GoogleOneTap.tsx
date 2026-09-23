'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePathname } from 'next/navigation';
import { getAuthItem } from '@/services/api';

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

/** Check synchronously if the user is authenticated via store or stored token */
function isUserLoggedIn(isAuthenticated: boolean): boolean {
  if (isAuthenticated) return true;
  if (typeof window !== 'undefined') {
    const token = getAuthItem('auth_token');
    if (token) return true;
  }
  return false;
}

export function GoogleOneTap() {
  const { isAuthenticated, loginWithGoogle } = useAuthStore();
  const pathname = usePathname();
  const clientId = useMemo(() => process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '', []);
  const initialized = useRef(false);

  useEffect(() => {
    // 1. If user is logged in, cancel any active One Tap prompt immediately
    if (isUserLoggedIn(isAuthenticated)) {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel();
        } catch {
          // Ignore cancel error
        }
      }
      return;
    }

    // 2. Skip on auth pages or if no client ID
    if (!clientId || AUTH_PATHS.test(pathname ?? '')) return;
    if (initialized.current) return;

    let checkTimer: NodeJS.Timeout | null = null;

    function initOneTap() {
      // Re-verify login status right before initializing
      if (isUserLoggedIn(useAuthStore.getState().isAuthenticated)) return;
      if (!window.google?.accounts?.id || initialized.current) return;
      initialized.current = true;

      try {
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
              // Cancel prompt immediately on selection
              window.google?.accounts?.id?.cancel();
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
            console.info('[GoogleOneTap] Skipped – reason:', n.getSkippedReason?.());
          } else if (n.isDismissedMoment()) {
            console.info('[GoogleOneTap] Dismissed – reason:', n.getDismissedReason?.());
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
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel();
        } catch {
          // Ignore
        }
      }
    };
  }, [isAuthenticated, clientId, pathname, loginWithGoogle]);

  return null;
}
