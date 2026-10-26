'use client';
import {useId,useState} from 'react';
import Image from 'next/image';
import styles from '@/app/products/adjustable-baby-shower-stand/product-detail.module.css';
import Link from 'next/link';
import {ArrowRight,Check} from 'lucide-react';
import LocalizedProductMedia from './localized-product-media';
import {localePath,type Locale} from '@/i18n/config';
import type {UI} from '@/i18n/dictionaries';
import type {ProductDetail} from '@/lib/localized-content';

export default function LocalizedProductPresentation({locale,ui,product,colorLabels}:{locale:Locale;ui:UI;product:ProductDetail;colorLabels:Record<string,string>}) {
  const [tab,setTab]=useState<'overview'|'specifications'|'gallery'>('overview');
  const [selected,setSelected]=useState(0);
  const tabId=useId();
  const features=product.specifications.filter(item=>item.spec_group.toLowerCase().includes('feature'));
  const specs=product.specifications.filter(item=>!item.spec_group.toLowerCase().includes('feature'));
  const specTable=<div className={styles.specTable}><h2>{locale==='en'?ui.specifications:ui.originalSpecs}</h2><dl><div><dt>{ui.model}</dt><dd>{product.sku}</dd></div>{specs.map((item,index)=><div key={index} lang="en" dir="ltr"><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl></div>;
  const colors=product.options.filter(option=>option.option_type==='Color');
  const sizes=product.options.filter(option=>option.option_type==='Size');
  const [color,setColor]=useState(colors[0]?.option_value||'');
  const [size,setSize]=useState(sizes[0]?.option_value||'');
  const selectedColor=colors.find(option=>option.option_value===color);
  const gallery=selectedColor?.images?.length?selectedColor.images:product.images;
  const images=gallery.length?gallery.map(item=>item.image_url):[product.cover_image||'/images/product-accessories-v2.png'];
  const query=new URLSearchParams({product:product.sku,color,size});
  return <><section className="shell localized-product-grid"><LocalizedProductMedia key={color} selected={selected} setSelected={setSelected} name={product.name} images={images} videos={product.videos.slice(0,3).map(v=>v.video_url)} ui={ui}/><article className="localized-product-copy"><p className="eyebrow">{String(product.category)}</p><h1>{product.name}</h1><p>{product.short_description}</p><p><b>{ui.model}: </b><bdi>{product.sku}</bdi></p>{features.length>0&&<><h2>{ui.features}</h2><ul className={styles.featureList}>{features.map((item,index)=><li key={index} lang="en"><Check size={15}/>{item.value}</li>)}</ul></>}
    {colors.length>0&&<fieldset className="localized-options"><legend>{ui.color}</legend>{colors.map(option=><button type="button" key={option.option_value} aria-pressed={color===option.option_value} onClick={()=>{setColor(option.option_value);setSelected(0);}}><i style={{background:option.value_meta||'#eee'}}/>{colorLabels[option.option_value.toLowerCase()]||option.option_value}</button>)}</fieldset>}
    {sizes.length>0&&<fieldset className="localized-options"><legend>{ui.size}</legend>{sizes.map(option=><button type="button" key={option.option_value} aria-pressed={size===option.option_value} onClick={()=>setSize(option.option_value)}>{option.option_value}</button>)}</fieldset>}
    <Link className="primary-button" href={localePath(locale,`/contact?${query}#quote`)}>{ui.quote}<ArrowRight size={17}/></Link><p className="localized-safety">{ui.safety}</p></article></section>
    <section className={`shell ${styles.detailBlock} localized-detail-block`}>
      <div className={styles.tabs} role="tablist" aria-label={ui.details}>{(['overview','specifications','gallery'] as const).map(key=><button type="button" role="tab" key={key} id={`${tabId}-${key}`} aria-controls={`${tabId}-panel`} aria-selected={tab===key} className={tab===key?styles.tabActive:''} onClick={()=>setTab(key)}>{ui[key]}</button>)}</div>
      <div role="tabpanel" id={`${tabId}-panel`} aria-labelledby={`${tabId}-${tab}`}>
        {tab==='overview'&&<div className={styles.overview}><div><h2>{ui.overview}</h2><p>{product.description||product.short_description}</p></div>{specTable}</div>}
        {tab==='specifications'&&<div className={styles.specOnly}>{specTable}</div>}
        {tab==='gallery'&&<div className={styles.galleryGrid}>{images.map((src,index)=><button type="button" key={`${src}-${index}`} aria-label={`${ui.gallery} ${index+1}`} onClick={()=>{setSelected(index);setTab('overview');}}><Image src={src} alt={`${product.name} ${index+1}`} fill sizes="(max-width:700px) 50vw,25vw"/></button>)}</div>}
      </div>
    </section></>;
}
