'use client';

import Link from 'next/link';
import {useRef} from 'react';
import {ArrowRight, Mail, Menu, ShieldCheck} from 'lucide-react';
import LanguageSwitcher from './language-switcher';
import {closeOtherHeaderPanels} from './header-disclosure';
import {localePath, type Locale} from '@/i18n/config';
import type {UI} from '@/i18n/dictionaries';

export default function LocalizedHeader({locale, path, available, ui, email}: {locale: Locale; path: string; available: readonly Locale[]; ui: UI; email: string}) {
  const mobileMenu = useRef<HTMLDetailsElement>(null);
  const links = [['/',ui.home],['/products',ui.products],['/about',ui.about],['/contact',ui.contact]];
  return <>
    <div className="utility-bar"><div className="shell utility-inner"><span><ShieldCheck size={14}/>{ui.manufacturer}</span><span className="utility-idea">{ui.tagline}</span><div className="utility-contact"><a href={`mailto:${email}`}><Mail size={14}/><bdi>{email}</bdi></a></div></div></div>
    <header className="site-header localized-header"><div className="shell header-inner">
      <Link href={localePath(locale)} className="brand" aria-label={`Baby Bath Ease — ${ui.home}`}><span className="brand-mark"/></Link>
      <nav className="desktop-nav" aria-label={ui.menu}>{links.map(([href, title]) => <Link key={href} href={localePath(locale,href)} className={path === href || href === '/products' && path.startsWith('/products/') ? 'nav-active' : undefined}>{title}</Link>)}</nav>
      <div className="header-actions"><LanguageSwitcher locale={locale} path={path} available={available} label={ui.language}/><Link href={localePath(locale,'/contact#quote')} className="quote-button header-quote">{ui.quote}<ArrowRight size={17}/></Link><details ref={mobileMenu} className="mobile-menu" name="header-panel" onToggle={closeOtherHeaderPanels}><summary className="menu-button" aria-label={ui.menu}><Menu/></summary><nav aria-label={ui.menu}>{links.map(([href, title]) => <Link key={href} href={localePath(locale,href)} onClick={() => {if (mobileMenu.current) mobileMenu.current.open = false;}}>{title}</Link>)}</nav></details></div>
    </div></header>
  </>;
}
