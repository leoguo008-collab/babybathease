import 'server-only';
import {cache} from 'react';
import type {Locale} from './config';
import type english from '../../locales/en.json';

export type ProductTranslation = {name: string; description: string; shortDescription: string; seoTitle: string; seoDescription: string; keywords: string; sourceUpdatedAt: string};
export type Dictionary = Omit<typeof english, 'products' | 'categories'> & {products: Record<string, ProductTranslation>; categories: Record<string, string>};
export type UI = Dictionary['ui'];
const loaders = {
  en: () => import('../../locales/en.json'), de: () => import('../../locales/de.json'),
  fr: () => import('../../locales/fr.json'), es: () => import('../../locales/es.json'),
  it: () => import('../../locales/it.json'), pt: () => import('../../locales/pt.json'),
  ms: () => import('../../locales/ms.json'), ko: () => import('../../locales/ko.json'),
  ja: () => import('../../locales/ja.json'), vi: () => import('../../locales/vi.json'),
  ar: () => import('../../locales/ar.json'), fa: () => import('../../locales/fa.json'),
  'zh-Hant': () => import('../../locales/zh-Hant.json'),
};
export const getDictionary = cache(async (locale: Locale): Promise<Dictionary> => (await loaders[locale]()).default);
