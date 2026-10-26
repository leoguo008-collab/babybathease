export const locales = ['en', 'de', 'fr', 'es', 'it', 'pt', 'ms', 'ko', 'ja', 'vi', 'ar', 'fa', 'zh-Hant'] as const;
export type Locale = typeof locales[number];
export const languageInfo: Record<Locale, {name: string; flag: string; dir: 'ltr' | 'rtl'}> = {
  en: {name: 'English', flag: 'gb', dir: 'ltr'}, de: {name: 'Deutsch', flag: 'de', dir: 'ltr'},
  fr: {name: 'Français', flag: 'fr', dir: 'ltr'}, es: {name: 'Español', flag: 'es', dir: 'ltr'},
  it: {name: 'Italiano', flag: 'it', dir: 'ltr'}, pt: {name: 'Português', flag: 'pt', dir: 'ltr'},
  ms: {name: 'Bahasa Melayu', flag: 'my', dir: 'ltr'}, ko: {name: '한국어', flag: 'kr', dir: 'ltr'},
  ja: {name: '日本語', flag: 'jp', dir: 'ltr'}, vi: {name: 'Tiếng Việt', flag: 'vn', dir: 'ltr'},
  ar: {name: 'العربية', flag: 'sa', dir: 'rtl'}, fa: {name: 'فارسی', flag: 'ir', dir: 'rtl'},
  'zh-Hant': {name: '繁體中文', flag: 'tw', dir: 'ltr'},
};
export function isLocale(value: string): value is Locale { return locales.some(locale => locale === value); }
export function localePath(locale: Locale, path = '/') {
  const prefix = locale === 'en' ? '' : `/${locale}`;
  return prefix + (path === '/' ? '' : path) || '/';
}
