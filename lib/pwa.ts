/**
 * @file lib/pwa.ts
 * @description PWA install helpers and browser compatibility utilities.
 */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isClient = typeof window !== 'undefined';

export function isPWAInstalled(): boolean {
  if (!isClient) return false;
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean(navigatorWithStandalone.standalone)
  );
}

export function isIOS(): boolean {
  if (!isClient) return false;
  const ua = window.navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window);
}

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  if (!isClient) return null;
  return (window as any).__ae_deferred_install_prompt ?? null;
}

export function getPWAInstallHint(): string {
  if (!isClient) return 'Installer l’application PWA pour notifications et accès rapide';
  if (isPWAInstalled()) return 'Application déjà installée';
  if (isIOS()) {
    return 'iOS : ouvrez Safari puis Partager → Ajouter à l’écran d’accueil';
  }
  return 'Installer l’application PWA pour notifications et accès rapide';
}

export async function attemptPWAInstall(): Promise<
  'accepted' | 'dismissed' | 'fallback' | 'unsupported' | 'installed'
> {
  if (!isClient) return 'unsupported';
  if (isPWAInstalled()) return 'installed';

  const prompt = getDeferredInstallPrompt();
  if (prompt) {
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      delete (window as any).__ae_deferred_install_prompt;
      return choice.outcome === 'accepted' ? 'accepted' : 'dismissed';
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
      return 'unsupported';
    }
  }

  if (isIOS()) {
    return 'fallback';
  }

  return 'unsupported';
}
