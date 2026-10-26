import {notFound} from 'next/navigation';
import {isLocale} from '@/i18n/config';
import LocalizedSite, {metadataFor,validPath,type Search} from '@/components/localized-site';
export const dynamic = 'force-dynamic';
type Props={params:Promise<{locale:string;segments?:string[]}>;searchParams:Promise<Search>};
async function route(params:Props['params']) {
  const {locale,segments=[]}=await params;
  const path=segments.length?'/'+segments.join('/'):'/';
  if(!isLocale(locale)||locale==='en'||!validPath(path))notFound();
  return {locale,path};
}
export async function generateMetadata({params}:Props){const {locale,path}=await route(params);return metadataFor(locale,path);}
export default async function Page({params,searchParams}:Props){const {locale,path}=await route(params);return <LocalizedSite locale={locale} path={path} search={await searchParams}/>;}
