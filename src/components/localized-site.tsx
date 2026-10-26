import Image from 'next/image';
import Link from 'next/link';
import {ArrowLeft, ArrowRight, Award, Users, Phone, MapPin, Clock3, Download, Mail, ShieldCheck, Leaf, Globe2} from 'lucide-react';
import {notFound} from 'next/navigation';
import {getDictionary, type Dictionary} from '@/i18n/dictionaries';
import {locales, localePath, type Locale} from '@/i18n/config';
import {getCatalogue,getSettings,getProduct,productLocales,translatedProduct} from '@/lib/localized-content';
import {pageMetadata} from '@/lib/seo';
import OfficeGallery from './office-gallery';
import LocalizedHeader from './localized-header';
import LocalizedContactForm from './localized-contact-form';
import LocalizedProductPresentation from './localized-product-presentation';
import LocalizedCarousel from './localized-carousel';
import type {ProductDetail} from '@/lib/localized-content';
import styles from '@/app/products/products.module.css';
import aboutStyles from '@/app/about/about.module.css';
import contactStyles from '@/app/contact/contact.module.css';

const aboutFactIcons = [Award, Users, Globe2, ShieldCheck];
export type Search = Record<string,string|string[]|undefined>;
export const validStaticPaths = ['/', '/products', '/about', '/contact'];
export function validPath(path:string) {return validStaticPaths.includes(path)||/^\/products\/[^/]+$/.test(path);}
export async function metadataFor(locale:Locale,path:string) {
  const d=await getDictionary(locale);
  if(path.startsWith('/products/')) {
    const p=getProduct(decodeURIComponent(path.slice('/products/'.length)));if(!p)notFound();
    const tr=d.products[String(p.sku)];if(locale!=='en'&&!tr)notFound();
    return pageMetadata(locale,path,locale==='en'?`${p.name} (${p.sku}) | Baby Bath Ease`:tr.seoTitle,locale==='en'?String(p.short_description||p.name):tr.seoDescription,await productLocales(String(p.sku)),tr?.keywords);
  }
  const key=path==='/'?'home':path.slice(1) as 'products'|'about'|'contact';
  const seo=d.seo[key];if(!seo)notFound();
  return pageMetadata(locale,path,seo.title,seo.description,locales,`${d.ui.manufacturer}, OEM, ODM`);
}
export default async function LocalizedSite({locale,path,search={}}:{locale:Locale;path:string;search?:Search}) {
  if(!validPath(path))notFound();
  const d=await getDictionary(locale),u=d.ui,s=getSettings();
  const email=s?.email||'official@babybathease.com';
  const product=path.startsWith('/products/')?getProduct(decodeURIComponent(path.slice(10))):null;
  if(path.startsWith('/products/')&&(!product||!translatedProduct(locale,d,product)))notFound();
  const available=product?await productLocales(String(product.sku)):locales;
  const h=(p:string)=>localePath(locale,p);
  const catalogue=getCatalogue();
  const categories=catalogue.categories.map(c=>{
    const matching=catalogue.products.find(p=>p.category_slug===c.slug);
    const fallbackIds:Record<string,string>={'baby-bathtubs':'1','stands-seats':'2','bath-toys':'3','accessories':'4','baby-bath-towel':'5'};
    return {...c,name:d.categories[String(matching?.category_id||fallbackIds[c.slug.toLowerCase()])]||c.name};
  });
  const download=<a download href="/api/public/catalogue-file" className={styles.primary}><Download size={17}/><span>{u.download}<small className="catalogue-language">{u.downloadEnglish}</small></span></a>;
  const cta=<section className={styles.cta}><div className={`${styles.shell} ${styles.ctaInner}`}><div><span className={styles.eyebrow}>OEM / ODM</span><h2>{u.ctaTitle}</h2><p>{u.ctaIntro}</p></div><div className={styles.ctaActions}><Link href={h('/contact#quote')} className={styles.primary}>{u.quote}<ArrowRight size={17}/></Link>{download}</div></div></section>;
  const address=s?.address||'Shenzhen, China';
  const contactEmails = [...new Map([email,...(s?.sales_emails||'').split(/[\n,]/)].map(value=>value.trim()).filter(Boolean).map(value=>[value.toLowerCase(),value])).values()];
  return <><LocalizedHeader locale={locale} path={path} available={available} ui={u} email={email}/><main className={styles.page}>
    {path==='/'&&<>
      <section className="hero-section"><div className="shell hero-grid"><div className="hero-copy"><span className="eyebrow">{u.manufacturer}</span><h1>{u.heroTitle}<br/><em>{u.heroAccent}</em></h1><p>{u.heroIntro}</p><div className="hero-ctas"><Link href={h('/contact')} className="primary-button">{u.quote}<ArrowRight size={18}/></Link><Link href={h('/products')} className="secondary-button">{u.products}</Link></div><div className="value-points"><span><ShieldCheck/> OEM</span><span><Leaf/> ODM</span><span><Globe2/> {u.brands}</span></div></div><LocalizedCarousel ui={u}/></div><div className="hero-wave"/></section>
      <section className="categories-section shell"><div className="section-heading"><div><h2>{u.categories}</h2><p>{u.productsIntro}</p></div><Link className="outline-button" href={h('/products')}>{u.all}<ArrowRight size={18}/></Link></div><div className="category-grid">{categories.map(c=><Link key={c.slug} className="category-card" href={h(`/products?category=${encodeURIComponent(c.slug)}#catalogue`)}><div className="category-image"><Image src={c.cover_image||'/images/product-accessories-v2.png'} alt={c.name} fill sizes="(max-width:760px) 50vw,25vw"/></div><div className="category-meta"><h3>{c.name}</h3><ArrowRight size={19}/></div></Link>)}</div></section>
      <section className="oem-section"><div className="shell oem-grid"><div className="oem-copy"><span className="eyebrow">OEM / ODM</span><h2>{u.oemTitle}</h2><p>{u.oemIntro}</p><Link className="primary-button" href={h('/about')}>{u.about}<ArrowRight size={18}/></Link></div><div className="factory-image"><Image src="/images/factory-quality.png" alt={u.oemTitle} fill sizes="50vw"/></div></div><div className="shell metric-row">{[['40+',u.years],['500+',u.brands],['50,000+',u.capacity],['99%',u.delivery]].map(([v,l])=><div key={l}><b>{v}</b><span>{l}</span></div>)}</div></section>
      {cta}<section className="map-section"><div className="shell map-grid"><div className="map-copy"><h2>{u.visit}</h2><p dir="auto">{address}</p><a href="https://www.google.com/maps?cid=4388961792346205350" target="_blank" rel="noreferrer">{u.map}</a><OfficeGallery ui={u}/></div><div className="map-frame"><iframe title={u.address} src="https://www.google.com/maps?cid=4388961792346205350&z=17&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade"/></div></div></section>
    </>}
    {path==='/products'&&<><section className={styles.intro}><div className={styles.shell}><span className={styles.eyebrow}>{u.manufacturer}</span><h1>{u.productsTitle.includes('Baby Bath')?<>{u.productsTitle.split('Baby Bath')[0]}<em>Baby Bath</em>{u.productsTitle.split('Baby Bath')[1]}</>:u.productsTitle}</h1><p>{u.productsIntro}</p><div className={styles.introActions}>{download}<a href={`mailto:${email}`} className={styles.secondary}><Mail size={17}/>{u.talk}</a></div></div></section><section id="catalogue" className={styles.catalogue}><div className={styles.shell}><div className={styles.catalogueHeading}><div><span className={styles.eyebrow}>{u.library}</span><h2>{u.libraryTitle}</h2></div><p>{u.productsIntro}</p></div><nav className={`${styles.tabs} localized-category-tabs`} aria-label={u.categories}><Link href={h('/products#catalogue')} aria-current={!search.category?'page':undefined}>{u.all}</Link>{categories.map(c=><Link key={c.slug} href={h(`/products?category=${encodeURIComponent(c.slug)}#catalogue`)} aria-current={search.category===c.slug?'page':undefined}>{c.name}</Link>)}</nav><div className={styles.grid}>{catalogue.products.filter(p=>!search.category||p.category_slug===search.category).map(p=>{
      const local=translatedProduct(locale,d,p);if(!local)return null;
      return <article className={styles.card} key={String(p.sku)}><Link href={h(`/products/${p.slug}`)} className={styles.image} style={{display:'block'}}><Image src={String(p.cover_image||'/images/product-accessories-v2.png')} alt={local.name} fill sizes="(max-width:760px) 50vw,25vw"/></Link><div className={styles.cardBody}><span dir="ltr">{String(p.sku)}</span><h3>{local.name}</h3><p>{local.short_description}</p><Link href={h(`/products/${p.slug}`)}>{u.details}<ArrowRight size={15}/></Link></div></article>;
    })}</div></div></section>{cta}</>}
    {path==='/about'&&<><section className={aboutStyles.story}><div className={aboutStyles.copy}><span className={aboutStyles.eyebrow}>{u.about}</span><h1>{u.aboutTitle}</h1><p>{u.aboutIntro}</p><Link className={aboutStyles.primary} href={h('/products')}>{u.products}<ArrowRight size={18}/></Link></div></section><section className={aboutStyles.facts}><div className={`${aboutStyles.shell} ${aboutStyles.factGrid}`}>{d.aboutFacts.map((fact,index)=>{const Icon=aboutFactIcons[index];return <article className={aboutStyles.fact} key={fact.label}><span><Icon aria-hidden="true"/></span><small>{fact.label}</small><strong>{fact.value}</strong><p>{fact.note}</p></article>;})}</div></section>{cta}</>}
    {path==='/contact'&&<section className={contactStyles.hero}><div className={contactStyles.shell}><p className={contactStyles.kicker}>{u.contact}</p><h1>{u.contactTitle}</h1><p className={contactStyles.intro}>Shenzhen Quanpintong Technology Co., Ltd.</p><p className={contactStyles.support}>{u.contactIntro}</p><div className={contactStyles.columns}><section className={contactStyles.details} aria-label={u.contact}><ContactDetail icon={<Mail/>} label={u.email}>{contactEmails.map(value=><a key={value} href={`mailto:${value}`} dir="ltr">{value}</a>)}</ContactDetail><ContactDetail icon={<Phone/>} label="WhatsApp"><a href={`https://wa.me/${(s?.phone||'+8613802342316').replace(/\D/g,'')}`} dir="ltr">{s?.phone||'+86 13802342316'}</a></ContactDetail><ContactDetail icon={<Phone/>} label={u.officePhone}><a href={`tel:${(s?.phone||'+8613802342316').replace(/\s/g,'')}`} dir="ltr">{s?.phone||'+86 13802342316'}</a></ContactDetail><ContactDetail icon={<MapPin/>} label={u.address}><address dir="auto">{address}</address></ContactDetail><ContactDetail icon={<Clock3/>} label={u.response}><strong>{u.responseTime}</strong></ContactDetail></section><LocalizedContactForm ui={u}/></div></div></section>}
    {product&&<ProductBody locale={locale} d={d} raw={product}/>}
  </main><footer><div className="shell footer-main"><Link href={h('/')} className="brand footer-brand" aria-label="Baby Bath Ease"><span className="brand-mark"/></Link><p>{u.tagline}</p><nav>{[['/',u.home],['/products',u.products],['/about',u.about],['/contact',u.contact]].map(([p,l])=><Link key={p} href={h(p)}>{l}</Link>)}</nav><a className="footer-email" href={`mailto:${email}`}><Mail size={16}/><bdi>{email}</bdi></a></div><div className="shell footer-bottom">© {new Date().getFullYear()} Baby Bath Ease. {u.rights}</div></footer></>;
}
function ContactDetail({icon,label,children}:{icon:React.ReactNode;label:string;children:React.ReactNode}) {return <div className={contactStyles.detail}><span className={contactStyles.detailIcon}>{icon}</span><div><small>{label}</small><div>{children}</div></div></div>;}
function ProductBody({locale,d,raw}:{locale:Locale;d:Dictionary;raw:NonNullable<ReturnType<typeof getProduct>>}) {
  const p=translatedProduct(locale,d,raw)!;const u=d.ui;
  const categoryHref=raw.category_slug?`/products?category=${encodeURIComponent(raw.category_slug)}#catalogue`:'/products#catalogue';
  return <><div className="shell localized-breadcrumb"><Link href={localePath(locale,'/products')}><ArrowLeft size={15}/>{u.all}</Link><span>/</span><Link href={localePath(locale,categoryHref)}>{p.category}</Link><span>/</span><strong>{p.name}</strong></div><LocalizedProductPresentation locale={locale} ui={u} product={{...raw,...p} as ProductDetail} colorLabels={d.colors}/></>;
}
