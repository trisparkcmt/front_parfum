'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface GoogleAuthButtonProps {
  onTokenReceived: (accessToken: string) => Promise<void> | void;
  disabled?: boolean;
  label?: string;
}

const GOOGLE_SCRIPT_ID = 'google-identity-services';

/** Official Google "G" logo SVG */
function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export default function GoogleAuthButton({
  onTokenReceived,
  disabled = false,
  label = 'Continuer avec Google',
}: GoogleAuthButtonProps) {
  const [sdkReady, setSdkReady] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const tokenClientRef = useRef<{ requestAccessToken: (options?: { prompt?: string }) => void } | null>(null);
  const clientId = useMemo(() => process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '', []);

  useEffect(() => {
    if (!clientId) return;

    const initializeClient = () => {
      if (!window.google?.accounts?.oauth2) return;
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        callback: async (response) => {
          if (!response?.access_token) {
            setIsGoogleLoading(false);
            return;
          }
          try {
            await onTokenReceived(response.access_token);
          } finally {
            setIsGoogleLoading(false);
          }
        },
        error_callback: () => {
          setIsGoogleLoading(false);
        },
      });
      setSdkReady(true);
    };

    if (window.google?.accounts?.oauth2) {
      initializeClient();
      return;
    }

    let script = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = GOOGLE_SCRIPT_ID;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const onLoad = () => initializeClient();
    script.addEventListener('load', onLoad);
    return () => script?.removeEventListener('load', onLoad);
  }, [clientId, onTokenReceived]);

  const handleGoogleAuth = () => {
    if (!tokenClientRef.current || disabled || isGoogleLoading) return;
    setIsGoogleLoading(true);
    tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
  };

  const isDisabled = disabled || !sdkReady || !clientId || isGoogleLoading;

  return (
    <button
      type="button"
      id="google-auth-btn"
      onClick={handleGoogleAuth}
      disabled={isDisabled}
      aria-label={label}
      className={cn(
        // Base layout
        'w-full inline-flex items-center justify-center gap-3',
        'px-5 py-2.5 rounded-lg',
        'text-sm font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4285F4]/50',
        'border',
        // Light / dark adaptive styling
        'bg-white text-[#3c4043] border-[#dadce0]',
        'hover:bg-[#f8f9fa] hover:border-[#c6c9cc] hover:shadow-md',
        'dark:bg-[#1e1e1e] dark:text-[#e8eaed] dark:border-[#3c4043]',
        'dark:hover:bg-[#2a2a2a] dark:hover:border-[#5f6368]',
        // Disabled / loading
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
        'active:scale-[0.98] active:shadow-none',
      )}
    >
      {isGoogleLoading ? (
        <>
          {/* Spinner */}
          <svg
            className="animate-spin h-5 w-5 shrink-0 text-[#4285F4]"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Connexion en cours…</span>
        </>
      ) : (
        <>
          <GoogleLogo className="h-5 w-5 shrink-0" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
