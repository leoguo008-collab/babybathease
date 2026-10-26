import 'server-only';
import {cache} from 'react';
import {publishedCatalogue, publishedProductBySlug, publicSettings} from './database';
import {getDictionary} from '@/i18n/dictionaries';
import {locales, type Locale} from '@/i18n/config';

export type ProductRow = Record<string, unknown> & {sku:string;slug:string;name:string;category_id:number;category_slug:string;short_description:string;description?:string;cover_image:string};
export type ProductDetail = ProductRow & {images:{image_url:string;alt_text:string}[];videos:{video_url:string;title:string}[];options:{option_type:string;option_value:string;value_meta:string;images:{image_url:string;alt_text:string}[]}[];specifications:{spec_group:string;label:string;value:string}[]};
export const getCatalogue = cache(() => {
  const data=publishedCatalogue();
  return {...data,products:data.products as ProductRow[]};
});
export const getSettings = cache(() => publicSettings());
export const getProduct = cache((slug: string) => publishedProductBySlug(slug) as ProductDetail | null);
export const productLocales = cache(async (sku: string) => {
  const available = await Promise.all(locales.map(async locale => ({locale, exists: locale === 'en' || Boolean((await getDictionary(locale)).products[sku])})));
  return available.filter(item => item.exists).map(item => item.locale);
});
export function translatedProduct(locale: Locale, dictionary: Awaited<ReturnType<typeof getDictionary>>, product: Record<string, unknown>) {
  const translation = dictionary.products[String(product.sku)];
  if (locale !== 'en' && !translation) return null;
  return {
    ...product,
    name: locale === 'en' ? String(product.name) : translation.name,
    short_description: locale === 'en' ? String(product.short_description || '') : translation.shortDescription,
    description: locale === 'en' ? String(product.description || product.short_description || '') : translation.description,
    category: dictionary.categories[String(product.category_id)] || String(product.category || ''),
  };
}
