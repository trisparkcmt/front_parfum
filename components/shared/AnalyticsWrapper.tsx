'use client';

import { useState, useEffect } from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';

interface AnalyticsWrapperProps {
  gaId: string;
}

export function AnalyticsWrapper({ gaId }: AnalyticsWrapperProps) {
  const [consentGranted, setConsentGranted] = useState(false);

  useEffect(() => {
    // Initial check
    const checkConsent = () => {
      const consent = localStorage.getItem('ae_cookie_consent');
      setConsentGranted(consent === 'accepted');
    };

    checkConsent();

    // Listen for custom event when consent changes
    window.addEventListener('cookie_consent_changed', checkConsent);
    return () => {
      window.removeEventListener('cookie_consent_changed', checkConsent);
    };
  }, []);

  if (!consentGranted) {
    return null;
  }

  return <GoogleAnalytics gaId={gaId} />;
}
