'use client';

import Image from 'next/image';
import {Check, ChevronDown} from 'lucide-react';
import {closeOtherHeaderPanels} from './header-disclosure';
import {languageInfo, localePath, type Locale} from '@/i18n/config';

export default function LanguageSwitcher({locale, path, available, label}: {locale: Locale; path: string; available: readonly Locale[]; label: string}) {
  return <details className="language-picker" name="header-panel" onToggle={closeOtherHeaderPanels}>
    <summary className="language-trigger" aria-label={label}>
      <Image src={`/flags/${languageInfo[locale].flag}.svg`} width={24} height={16} alt="" /><span>{languageInfo[locale].name}</span><ChevronDown size={14}/>
    </summary>
    <nav aria-label={label} className="language-options">
      {available.map(target => <a key={target} href={localePath(target, path)} hrefLang={target} lang={target} aria-current={target === locale ? 'page' : undefined} onClick={event => {
        // Keep catalogue filters and anchors when switching the same page.
        event.currentTarget.href = localePath(target, path) + window.location.search + window.location.hash;
      }}><Image src={`/flags/${languageInfo[target].flag}.svg`} width={24} height={16} alt=""/><span dir={languageInfo[target].dir}>{languageInfo[target].name}</span>{target === locale && <Check size={15}/>}</a>)}
    </nav>
  </details>;
}
