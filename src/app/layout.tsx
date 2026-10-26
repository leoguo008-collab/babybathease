import type { Metadata } from 'next';
import {headers} from 'next/headers';
import './globals.css';
import './i18n.css';
import AnalyticsTracker from '@/components/analytics-tracker';
import {isLocale,languageInfo} from '@/i18n/config';
export const metadata:Metadata={icons:{icon:'/images/baby-bath-favicon.png',apple:'/images/baby-bath-favicon.png'}};
export default async function RootLayout({children}:{children:React.ReactNode}){
  const value=(await headers()).get('x-site-locale')||'en';
  const locale=isLocale(value)?value:'en';
  return <html lang={locale} dir={languageInfo[locale].dir}><body><AnalyticsTracker/>{children}</body></html>;
}
