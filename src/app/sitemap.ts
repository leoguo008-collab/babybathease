import type {MetadataRoute} from 'next';
import {locales} from '@/i18n/config';
import {getDictionary} from '@/i18n/dictionaries';
import {getCatalogue} from '@/lib/localized-content';
import {absoluteUrl,alternates} from '@/lib/seo';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const documents=await Promise.all(locales.map(async locale=>({locale,d:await getDictionary(locale)})));
  const result:MetadataRoute.Sitemap=[];
  for(const path of ['/','/products','/about','/contact'])for(const locale of locales)result.push({url:absoluteUrl(locale,path),alternates:{languages:alternates(path,locales)}});
  for(const product of getCatalogue().products){
    const path=`/products/${product.slug}`;
    const available=documents.filter(({locale,d})=>locale==='en'||Boolean(d.products[String(product.sku)])).map(item=>item.locale);
    for(const locale of available)result.push({url:absoluteUrl(locale,path),alternates:{languages:alternates(path,available)}});
  }
  return result;
}
