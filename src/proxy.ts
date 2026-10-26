import {NextResponse, type NextRequest} from 'next/server';
import {isLocale} from '@/i18n/config';
export function proxy(request:NextRequest){
  const path=request.nextUrl.pathname;
  const headers=new Headers(request.headers);
  // Always overwrite any caller-provided language header.
  const segment=path.split('/')[1];
  headers.set('x-site-locale',isLocale(segment)?segment:'en');
  if(path==='/en'||path.startsWith('/en/')){
    const url=request.nextUrl.clone();url.pathname=path.slice(3)||'/';
    return NextResponse.redirect(url,308);
  }
  const admin=path==='/admin-eric'||path.startsWith('/admin-eric/');
  if(admin&&path!=='/admin-eric'&&path!=='/admin-eric/'&&!request.cookies.get('baby_bath_admin'))return NextResponse.redirect(new URL('/admin-eric',request.url));
  const response=NextResponse.next({request:{headers}});
  if(admin||process.env.VERCEL_ENV==='preview')response.headers.set('X-Robots-Tag','noindex, nofollow');
  return response;
}
export const config={matcher:['/((?!api|_next|_vercel|uploads|images|flags|.*\\\\..*).*)']};
