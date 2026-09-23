export function isMobileBrowser(userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '') {
  return /android|iphone|ipad|ipod|mobile/i.test(userAgent);
}

export function getRetryDelayMs(userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '') {
  return isMobileBrowser(userAgent) ? 1800 : 500;
}

export function shouldRetryGoogleOneTapPrompt(reason, userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '', attemptNumber = 0) {
  const normalizedReason = String(reason || '').toLowerCase();

  if (!normalizedReason || attemptNumber >= 3) return false;

  if (!isMobileBrowser(userAgent)) return false;

  return (
    normalizedReason.includes('suppressed') ||
    normalizedReason.includes('not_displayed') ||
    normalizedReason.includes('tap_outside') ||
    normalizedReason.includes('unhandled') ||
    normalizedReason.includes('cancelled')
  );
}
