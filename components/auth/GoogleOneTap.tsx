'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePathname } from 'next/navigation';
import { preloadGoogleIdentityScript } from '@/components/auth/GoogleAuthButton';

const AUTH_PATHS = /\/(login|register|connexion|inscription|auth)/i;
const MOBILE_RETRY_MS = 1800;

function isMobileBrowser() {
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}

function shouldRetry(reason: string | undefined, attempt: number) {
  if (attempt >= 3 || !isMobileBrowser()) return false;
  const normalized = String(reason || '').toLowerCase();
  return (
    normalized.includes('suppressed') ||
    normalized.includes('not_displayed') ||
    normalized.includes('tap_outside') ||
    normalized.includes('cancelled') ||
    normalized.includes('unhandled')
  );
}

export function GoogleOneTap() {
  const { isAuthenticated, loginWithGoogle } = useAuthStore();
  const pathname = usePathname();
  const clientId = useMemo(() => process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '', []);
  const initialized = useRef(false);
  const attemptRef = useRef(0);

  useEffect(() => {
    // Skip on auth pages, when already logged in, or if no client ID
    if (isAuthenticated || !clientId || AUTH_PATHS.test(pathname ?? '')) return;
    // Only run once per mount
    if (initialized.current) return;

    function promptOneTap() {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        itp_support: true,
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signin',
        callback: async (oneTapResponse) => {
          if (!oneTapResponse?.credential) return;
          try {
            await loginWithGoogle(undefined, undefined, oneTapResponse.credential);
          } catch (err) {
            console.error('[GoogleOneTap] login failed:', err);
          }
        },
      });

      window.google.accounts.id.prompt((n) => {
        const reason = n.getNotDisplayedReason?.();
        if (n.isNotDisplayed()) {
          console.info('[GoogleOneTap] not displayed –', reason);
          if (shouldRetry(reason, attemptRef.current)) {
            attemptRef.current += 1;
            const delay = MOBILE_RETRY_MS * attemptRef.current;
            console.info('[GoogleOneTap] retrying in', delay, 'ms for mobile browser');
            setTimeout(() => {
              if (!document.hidden) {
                window.google?.accounts?.id?.prompt((retryNotification) => {
                  const retryReason = retryNotification.getNotDisplayedReason?.();
                  if (retryNotification.isNotDisplayed()) {
                    console.info('[GoogleOneTap] retry not displayed –', retryReason);
                  }
                });
              }
            }, delay);
          }
        }
      });
    }

    function boot() {
      if (!window.google?.accounts?.id) return;
      initialized.current = true;
      promptOneTap();
    }

    if (window.google?.accounts?.id) {
      boot();
    } else {
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
