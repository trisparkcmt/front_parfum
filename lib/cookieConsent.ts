export const COOKIE_CONSENT_KEY = 'ae_cookie_consent';

export interface CookiePreferences {
  necessary: true;
  analytics: boolean;
  preferences: boolean;
  marketing: boolean;
}

export const DEFAULT_COOKIE_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: false,
  preferences: false,
  marketing: false,
};

export function getCookiePreferences(): CookiePreferences {
  if (typeof window === 'undefined') return DEFAULT_COOKIE_PREFERENCES;

  try {
    const stored = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored === 'accepted') {
      return { ...DEFAULT_COOKIE_PREFERENCES, analytics: true, preferences: true, marketing: true };
    }
    if (stored === 'refused') return DEFAULT_COOKIE_PREFERENCES;

    const parsed = JSON.parse(stored || '{}') as Partial<CookiePreferences>;
    return {
      necessary: true,
      analytics: parsed.analytics === true,
      preferences: parsed.preferences === true,
      marketing: parsed.marketing === true,
    };
  } catch {
    return DEFAULT_COOKIE_PREFERENCES;
  }
}

export function saveCookiePreferences(preferences: Omit<CookiePreferences, 'necessary'>): void {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
    necessary: true,
    ...preferences,
  }));
  window.dispatchEvent(new Event('cookie_consent_changed'));
}
