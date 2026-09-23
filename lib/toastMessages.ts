import i18next from 'i18next';

export function getLocalizedToast(en: string, fr: string) {
  return i18next.language?.startsWith('en') ? en : fr;
}
