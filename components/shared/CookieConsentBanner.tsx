'use client';

/**
 * @file components/shared/CookieConsentBanner.tsx
 * @description Cookie consent banner for GDPR/privacy compliance.
 *
 * Appears on the user's first visit. Stores choice in localStorage under
 * `ae_cookie_consent` ('accepted' | 'refused'). Shows above the mobile
 * BottomNav (which is fixed at bottom-5) to avoid overlap.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';

const CONSENT_KEY = 'ae_cookie_consent';

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkConsent = () => {
      try {
        const stored = localStorage.getItem(CONSENT_KEY);
        if (!stored) setVisible(true);
      } catch {
        // localStorage unavailable — do not show banner
      }
    };

    checkConsent();

    const handleOpen = () => setVisible(true);
    window.addEventListener('open_cookie_banner', handleOpen);

    return () => {
      window.removeEventListener('open_cookie_banner', handleOpen);
    };
  }, []);

  const handleChoice = (choice: 'accepted' | 'refused') => {
    try {
      localStorage.setItem(CONSENT_KEY, choice);
      window.dispatchEvent(new Event('cookie_consent_changed'));
    } catch {
      // ignore write errors
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Consentement aux cookies"
      className={[
        // Position: sits above the mobile BottomNav (bottom-5 + h-16 + margin ≈ 90px)
        // On desktop (nav: breakpoint), sits near the bottom edge
        'fixed z-[200] left-0 right-0',
        'bottom-[90px] nav:bottom-4',
        'mx-3 nav:mx-auto nav:max-w-2xl',
        // Glass-dark aesthetic matching the rest of the site
        'rounded-2xl border border-white/10',
        'bg-deep-black/90 backdrop-blur-2xl',
        'shadow-[0_8px_32px_rgba(0,0,0,0.6)]',
        'p-4 flex flex-col gap-3',
        'text-foreground',
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cookie size={18} className="text-gold shrink-0 mt-0.5" />
          <p className="text-sm font-semibold leading-snug">
            Cookies &amp; confidentialité
          </p>
        </div>
        {/* Dismiss without choosing — treated as "Refuser" */}
        <button
          onClick={() => handleChoice('refused')}
          aria-label="Fermer"
          className="text-foreground/40 hover:text-foreground/80 transition-colors shrink-0 -mt-0.5"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <p className="text-xs leading-relaxed text-foreground/70">
        Nous utilisons des cookies pour améliorer votre expérience, analyser le
        trafic et personnaliser le contenu. En cliquant sur &laquo;&nbsp;Accepter&nbsp;&raquo;,
        vous consentez à leur utilisation.{' '}
        <Link
          href="/privacy#cookies"
          className="text-gold underline-offset-2 hover:underline"
        >
          En savoir plus
        </Link>
        .
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={() => handleChoice('refused')}
          className="px-4 py-1.5 text-xs font-medium rounded-xl
                     border border-white/10 bg-white/5 hover:bg-white/10
                     transition-colors"
        >
          Refuser
        </button>
        <button
          onClick={() => handleChoice('accepted')}
          className="px-4 py-1.5 text-xs font-semibold rounded-xl
                     bg-gold text-black hover:brightness-110
                     transition-all"
        >
          Accepter
        </button>
      </div>
    </div>
  );
}
