'use client';
import {useEffect,useRef,useState} from 'react';
import {Play,X} from 'lucide-react';
import type {UI} from '@/i18n/dictionaries';
import ProductVideoPlayer from './product-video-player';
import MpegTsVideoPlayer from './mpeg-ts-video-player';
import ProductThumbnails from './product-thumbnails';
import ProductImageViewer from './product-image-viewer';
import {productVideoPoster} from '@/lib/video-assets';
import styles from '@/app/products/[slug]/product-video.module.css';

export default function LocalizedProductMedia({name,images,videos,ui,selected,setSelected}:{name:string;images:string[];videos:string[];ui:UI;selected:number;setSelected:(index:number)=>void}) {
  const [active,setActive]=useState<number|null>(null);
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    if(active===null)return;
    const element=dialog.current;
    const previous=document.activeElement as HTMLElement|null;
    element?.showModal();
    const overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    return ()=>{element?.close();document.body.style.overflow=overflow;previous?.focus();};
  },[active]);
  const rows=images.map(image_url=>({image_url,alt_text:name}));
  const current=active===null?null:videos[active];
  return <div className="localized-media-layout">
    <ProductThumbnails images={rows} selected={selected} onSelect={setSelected} ui={ui}/>
    <div className={styles.mediaColumn}>
      <ProductImageViewer images={images} selected={selected} onSelect={setSelected} name={name} ui={ui}/>
      {videos.length>0&&<section className={styles.section} aria-label={ui.videos}><div className={styles.sectionHead}><h2>{ui.videos}</h2><span>{videos.length} / 3</span></div><div className={styles.cards}>{videos.map((src,index)=><button type="button" className={styles.card} key={src} onClick={()=>setActive(index)} aria-label={`${ui.videos} ${index+1}`}><video src={src} poster={productVideoPoster(src)} muted playsInline preload="none" aria-hidden="true"/><span className={styles.play}><Play size={20} fill="currentColor"/></span><span className={styles.label}>{ui.videos} {index+1}</span></button>)}</div></section>}
    </div>
    {current&&<dialog ref={dialog} className={`${styles.modal} localized-video-dialog`} aria-label={ui.videos} onCancel={()=>setActive(null)} onClick={event=>{if(event.target===event.currentTarget)setActive(null);}}>
      <div className={styles.modalHead}><div><p>{ui.videos}</p><h2>{name}</h2></div><button type="button" onClick={()=>setActive(null)} aria-label={ui.close}><X/></button></div>
      <div className={styles.modalBody}><div className={styles.player}>{/\.ts(?:$|[?#])/i.test(current)?<MpegTsVideoPlayer key={current} src={current}/>:<ProductVideoPlayer key={current} src={current} autoPlay/>}</div><aside className={styles.playlist} aria-label={ui.videos}><h3>{ui.videos}</h3>{videos.map((src,index)=><button type="button" key={src} className={active===index?styles.selected:''} onClick={()=>setActive(index)} aria-pressed={active===index}><span className={styles.playlistPreview}><video src={src} poster={productVideoPoster(src)} muted playsInline preload="none" aria-hidden="true"/><Play size={16}/></span><span>{ui.videos} {index+1}</span></button>)}</aside></div>
    </dialog>}
  </div>;
}
