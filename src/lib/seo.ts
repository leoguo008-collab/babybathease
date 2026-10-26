import type {Metadata} from 'next';
import {localePath, type Locale} from '@/i18n/config';

// Configure the verified production domain in SITE_URL before publishing.
export const siteUrl = new URL(process.env.SITE_URL || 'http://localhost:3001').origin;
export const indexable = Boolean(process.env.SITE_URL?.startsWith('https://')) && process.env.VERCEL_ENV !== 'preview' && process.env.SEO_INDEXABLE !== 'false';
export function absoluteUrl(locale: Locale, path: string) { return new URL(localePath(locale, path), siteUrl).href; }
export function alternates(path: string, available: readonly Locale[]) {
  const result: Record<string, string> = Object.fromEntries(available.map(locale => [locale, absoluteUrl(locale, path)]));
  if (available.includes('en')) result['x-default'] = absoluteUrl('en', path);
  return result;
}
export function pageMetadata(locale: Locale, path: string, title: string, description: string, available: readonly Locale[], keywords?: string): Metadata {
  return {
    title, description, keywords, metadataBase: new URL(siteUrl),
    alternates: {canonical: absoluteUrl(locale, path), languages: alternates(path, available)},
    robots: {index: indexable, follow: true},
    openGraph: {type: 'website', title, description, url: absoluteUrl(locale, path), siteName: 'Baby Bath Ease'},
    twitter: {card: 'summary_large_image', title, description},
  };
}
