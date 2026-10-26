'use client';
import Image from 'next/image';
import {useState} from 'react';
import {ChevronLeft,ChevronRight} from 'lucide-react';
import type {UI} from '@/i18n/dictionaries';
export default function LocalizedCarousel({ui}:{ui:UI}){
  const [active,setActive]=useState(0);
  const slides=[{src:'/images/hero-baby-bath.png',alt:ui.heroTitle},{src:'/images/product-bathtub.png',alt:ui.productsTitle},{src:'/images/factory-quality.png',alt:ui.oemTitle}];
  return <div className="hero-carousel" aria-label={ui.gallery}>{slides.map((s,i)=><Image key={s.src} src={s.src} alt={s.alt} fill priority={i===0} className={i===active?'slide-image active':'slide-image'} sizes="(max-width:760px) 100vw,55vw"/>)}<button className="carousel-arrow left" onClick={()=>setActive((active+2)%3)} aria-label={ui.previous}><ChevronLeft/></button><button className="carousel-arrow right" onClick={()=>setActive((active+1)%3)} aria-label={ui.next}><ChevronRight/></button><div className="carousel-pagination">{slides.map((s,i)=><button key={s.src} className={i===active?'dot active':'dot'} aria-label={`${ui.gallery} ${i+1}`} aria-pressed={active===i} onClick={()=>setActive(i)}/>)}<strong>{active+1} / 3</strong></div></div>;
}
