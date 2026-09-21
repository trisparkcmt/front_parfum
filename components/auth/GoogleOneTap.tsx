'use client';

import { useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePathname } from 'next/navigation';
import { preloadGoogleIdentityScript } from '@/components/auth/GoogleAuthButton';

export function GoogleOneTap() {
  const { isAuthenticated, loginWithGoogle } = useAuthStore();
  const pathname = usePathname();
  const clientId = useMemo(() => process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '', []);

  useEffect(() => {
    // Don't show One Tap if already authenticated or if Client ID is missing
    if (isAuthenticated || !clientId) return;
    
    // Don't show One Tap on auth pages (login/register) where we already have prominent buttons
    if (pathname?.includes('/login') || pathname?.includes('/register')) return;

    const initializeOneTap = () => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          if (response.credential) {
            // One Tap returns an ID Token (credential)
            // We pass it as both accessToken and idToken since the backend might expect either
            try {
              await loginWithGoogle(response.credential, undefined, response.credential);
            } catch (error) {
              console.error('One Tap login failed', error);
            }
          }
        },
        auto_select: false, // Don't auto log in without user interaction if they logged out
        cancel_on_tap_outside: false, // Keep it visible even if they click elsewhere
        context: 'signin',
      });

      // Prompt One Tap
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          console.log('Google One Tap is not displayed:', notification.getNotDisplayedReason());
        }
      });
    };

    if (window.google?.accounts?.id) {
      initializeOneTap();
    } else {
      preloadGoogleIdentityScript();
      let script = document.getElementById('google-identity-services') as HTMLScriptElement;
      if (script) {
        script.addEventListener('load', initializeOneTap);
        return () => script.removeEventListener('load', initializeOneTap);
      }
    }
  }, [isAuthenticated, clientId, pathname, loginWithGoogle]);

  return null; // This is a headless component that just triggers the popup
}
