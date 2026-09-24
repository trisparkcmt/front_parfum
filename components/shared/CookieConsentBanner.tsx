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
import { Check, Settings, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  COOKIE_CONSENT_KEY,
  DEFAULT_COOKIE_PREFERENCES,
  getCookiePreferences,
  saveCookiePreferences,
  type CookiePreferences,
} from '@/lib/cookieConsent';

export function CookieIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g id="🔍-Product-Icons" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g id="ic_fluent_cookies_24_regular" fill="currentColor" fillRule="nonzero">
          <path d="M12,2 C12.7139344,2 13.4186669,2.07493649 14.1058513,2.22228153 C14.6865234,2.34678839 14.8990219,3.06470877 14.4796691,3.48521478 C14.0147885,3.95137375 13.75,4.57867916 13.75,5.25 C13.75,6.42043414 14.5611837,7.42718287 15.6858365,7.68625206 C16.0559035,7.77149876 16.3038519,8.11989963 16.2631619,8.49747198 C16.2544079,8.57870262 16.25,8.66307444 16.25,8.75 C16.25,10.1307119 17.3692881,11.25 18.75,11.25 C19.4766017,11.25 20.151276,10.9392994 20.6235262,10.4053218 C21.0526462,9.92011177 21.8536336,10.1704416 21.9300905,10.8136579 C21.9765784,11.2047517 22,11.6008646 22,12 C22,17.5228475 17.5228475,22 12,22 C6.4771525,22 2,17.5228475 2,12 C2,6.4771525 6.4771525,2 12,2 Z M12,3.5 C7.30557963,3.5 3.5,7.30557963 3.5,12 C3.5,16.6944204 7.30557963,20.5 12,20.5 C16.4367197,20.5 20.0795061,17.1007677 20.4660785,12.7645841 L20.4850437,12.5084524 L20.492,12.351 L20.2985099,12.4390561 C19.9679152,12.5778546 19.6173377,12.672508 19.2549465,12.7182945 L18.9810657,12.743398 L18.75,12.75 C16.7439233,12.75 15.0827631,11.2732368 14.7943277,9.34751855 L14.7694285,9.14674696 L14.755,8.96 L14.6100904,8.89964226 C13.3259006,8.32272189 12.4198681,7.0959893 12.2714595,5.6656449 L12.2549278,5.44962193 L12.25,5.25 C12.25,4.80312661 12.3237894,4.36763736 12.4635899,3.95776709 L12.5553294,3.71503308 L12.64,3.525 L12.363736,3.50762946 L12,3.5 Z M15,16 C15.5522847,16 16,16.4477153 16,17 C16,17.5522847 15.5522847,18 15,18 C14.4477153,18 14,17.5522847 14,17 C14,16.4477153 14.4477153,16 15,16 Z M8,15 C8.55228475,15 9,15.4477153 9,16 C9,16.5522847 8.55228475,17 8,17 C7.44771525,17 7,16.5522847 7,16 C7,15.4477153 7.44771525,15 8,15 Z M12,11 C12.5522847,11 13,11.4477153 13,12 C13,12.5522847 12.5522847,13 12,13 C11.4477153,13 11,12.5522847 11,12 C11,11.4477153 11.4477153,11 12,11 Z M7,8 C7.55228475,8 8,8.44771525 8,9 C8,9.55228475 7.55228475,10 7,10 C6.44771525,10 6,9.55228475 6,9 C6,8.44771525 6.44771525,8 7,8 Z" id="🎨-Color" />
        </g>
      </g>
    </svg>
  );
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_COOKIE_PREFERENCES);
  const { t } = useTranslation();

  useEffect(() => {
    const checkConsent = () => {
      try {
        const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!stored) setVisible(true);
      } catch {
        // localStorage unavailable — do not show banner
      }
    };

    checkConsent();

    const handleOpen = () => {
      setPreferences(getCookiePreferences());
      setVisible(true);
    };
    window.addEventListener('open_cookie_banner', handleOpen);

    return () => {
      window.removeEventListener('open_cookie_banner', handleOpen);
    };
  }, []);

  const handleChoice = (choice: 'accepted' | 'refused') => {
    saveCookiePreferences({
      analytics: choice === 'accepted',
      preferences: choice === 'accepted',
      marketing: choice === 'accepted',
    });
    setVisible(false);
    setShowSettings(false);
  };

  const openSettings = () => {
    setPreferences(getCookiePreferences());
    setShowSettings(true);
  };

  const saveSettings = () => {
    saveCookiePreferences(preferences);
    setVisible(false);
    setShowSettings(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t('cookie_consent_aria', 'Cookie consent')}
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
          <CookieIcon className="h-[18px] w-[18px] text-gold shrink-0 mt-0.5" />
          <p className="text-sm font-semibold leading-snug">
            {t('cookie_banner_title', 'Cookies & privacy')}
          </p>
        </div>
        {/* Dismiss without choosing — treated as "Refuse" */}
        <button
          onClick={() => handleChoice('refused')}
          aria-label={t('cookie_banner_close', 'Close')}
          className="text-foreground/40 hover:text-foreground/80 transition-colors shrink-0 -mt-0.5"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <p className="text-xs leading-relaxed text-foreground/70">
        {t(
          'cookie_banner_message',
          'We use cookies to improve your experience, analyze traffic, and personalize content. By clicking “Accept”, you consent to their use.'
        )}{' '}
        <Link
          href="/privacy#cookies"
          className="text-gold underline-offset-2 hover:underline"
        >
          {t('cookie_banner_learn_more', 'Learn more')}
        </Link>
        .
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={openSettings}
          className="px-4 py-1.5 text-xs font-semibold rounded-xl
                     border border-white/10 bg-white/5 hover:bg-white/10
                     transition-colors"
        >
          <span className="inline-flex items-center gap-1.5">
            <Settings size={13} />
            {t('cookie_banner_configure', 'Configure cookies')}
          </span>
        </button>
        <button
          onClick={() => handleChoice('accepted')}
          className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-gold text-black hover:brightness-110 transition-all"
        >
          {t('cookie_banner_accept', 'Accept')}
        </button>
      </div>

      {showSettings && createPortal(
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/70 p-4" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-settings-title"
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-deep-black p-5 text-foreground shadow-[0_12px_48px_rgba(0,0,0,0.7)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="cookie-settings-title" className="text-base font-semibold">
                  {t('cookie_settings_title', 'Configure cookies')}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-foreground/60">
                  {t('cookie_settings_message', 'Choose which optional cookies you allow. Necessary cookies are always active.')}
                </p>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                aria-label={t('cookie_banner_close', 'Close')}
                className="text-foreground/40 transition-colors hover:text-foreground/80"
              >
                <X size={17} />
              </button>
            </div>

            <div className="mt-5 space-y-2">
              {([
                ['necessary', 'cookie_necessary_title', 'cookie_necessary_description', true],
                ['analytics', 'cookie_analytics_title', 'cookie_analytics_description', preferences.analytics],
                ['preferences', 'cookie_preferences_title', 'cookie_preferences_description', preferences.preferences],
                ['marketing', 'cookie_marketing_title', 'cookie_marketing_description', preferences.marketing],
              ] as const).map(([category, titleKey, descriptionKey, enabled]) => {
                const isNecessary = category === 'necessary';
                return (
                  <div key={category} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{t(titleKey, category)}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-foreground/55">{t(descriptionKey, '')}</p>
                    </div>
                    <label
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors ${enabled ? 'border-gold bg-gold text-black' : 'border-white/25 bg-white/5 text-transparent'} ${isNecessary ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-gold/70'}`}
                    >
                      <input
                        type="checkbox"
                        checked={enabled}
                        disabled={isNecessary}
                        aria-label={t(titleKey, category)}
                        onChange={() => {
                          if (isNecessary) return;
                          setPreferences(current => ({ ...current, [category]: !current[category] }));
                        }}
                        className="sr-only"
                      />
                      <Check size={15} aria-hidden="true" />
                    </label>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => handleChoice('refused')}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium transition-colors hover:bg-white/10"
              >
                {t('cookie_banner_reject', 'Decline')}
              </button>
              <button
                onClick={saveSettings}
                className="rounded-xl bg-gold px-4 py-2 text-xs font-semibold text-black transition-all hover:brightness-110"
              >
                {t('cookie_settings_save', 'Save preferences')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
