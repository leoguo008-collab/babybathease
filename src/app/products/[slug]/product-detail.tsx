"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Globe2, Mail, Menu, Play, Send, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "../adjustable-baby-shower-stand/product-detail.module.css";
import videoStyles from "./product-video.module.css";
import ProductThumbnails from "@/components/product-thumbnails";
import SiteFooter from "@/components/site-footer";
import MpegTsVideoPlayer from "@/components/mpeg-ts-video-player";
import ProductVideoPlayer from "@/components/product-video-player";
import { productVideoPoster } from "@/lib/video-assets";
import useContactEmail from "@/hooks/use-contact-email";

type ImageRow = { image_url: string; alt_text: string };
type VideoRow = { video_url: string; title: string };
type Option = { option_type: string; option_value: string; value_meta: string; images?: ImageRow[] };
type Specification = { spec_group: string; label: string; value: string };
const isTransportStream = (url: string) => /\.ts(?:$|[?#])/i.test(url);
export type ProductDetailRecord = Record<string, unknown> & { name: string; sku: string; category: string; category_slug?: string; short_description: string; description: string; cover_image: string; images: ImageRow[]; videos: VideoRow[]; options: Option[]; specifications: Specification[] };

export default function DynamicProductDetail({ product }: { product: ProductDetailRecord }) {
  const email = useContactEmail();
  const categoryHref = product.category_slug ? `/products?category=${encodeURIComponent(product.category_slug)}#catalogue` : "/products#catalogue";
  const images = product.images.length ? product.images : [{ image_url: product.cover_image, alt_text: product.name }];
  const videos = (product.videos || []).slice(0, 3);
  const colors = product.options.filter((option) => option.option_type === "Color");
  const sizes = product.options.filter((option) => option.option_type === "Size");
  const features = product.specifications.filter((item) => item.spec_group.toLowerCase().includes("feature"));
  const specifications = product.specifications.filter((item) => !item.spec_group.toLowerCase().includes("feature"));
  const [selectedImage, setSelectedImage] = useState(0);
  const [color, setColor] = useState(colors[0]?.option_value || "");
  const [size, setSize] = useState(sizes[0]?.option_value || "");
  const [tab, setTab] = useState<"overview" | "specifications" | "gallery">("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState<number | null>(null);
  const activeVideo = activeVideoIndex === null ? null : videos[activeVideoIndex];
  const selectedColor = colors.find((option) => option.option_value === color);
  const colorImages = selectedColor?.images?.length ? selectedColor.images : images;
  useEffect(() => {
    if (activeVideoIndex === null) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setActiveVideoIndex(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [activeVideoIndex]);
  return <main className={styles.page}>
    <div className={styles.utility}><div className={styles.shell}><span><ShieldCheck size={14} /> OEM / ODM Baby Bath Manufacturer</span><span className={styles.idea}>Your Ideas, Our Expertise</span><span className={styles.utilityRight}><Globe2 size={14} /> English <ChevronDown size={13} /><i /><Mail size={14} /> {email}</span></div></div>
    <header className={styles.header}><div className={`${styles.shell} ${styles.headerInner}`}>
      <Link href="/" className={styles.logo} aria-label="Baby Bath home"><Image src="/images/baby-bath-logo.png" alt="Baby Bath" width={218} height={104} priority /></Link>
      <nav className={menuOpen ? `${styles.nav} ${styles.open}` : styles.nav}><Link href="/">Home</Link><Link href="/products" className={styles.active}>Products</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link></nav>
      <div className={styles.actions}><span className="site-language"><Globe2 size={16} /> English <ChevronDown size={14} /></span><Link href="/contact#quote" className={styles.quote}>Request a Quote <ArrowRight size={17} /></Link><button className={styles.menu} aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button></div>
    </div></header>
    <section className={`${styles.shell} ${styles.breadcrumb}`}><Link href="/products"><ArrowLeft size={15} /> All Products</Link><span>/</span><Link href={categoryHref} className={styles.categoryLink}>{product.category}</Link><span>/</span><b>{product.name}</b></section>
    <section className={`${styles.shell} ${styles.productTop}`}>
      <div className={styles.galleryWrap}><ProductThumbnails images={colorImages} selected={selectedImage} onSelect={setSelectedImage} /><div className={videoStyles.mediaColumn}><div className={styles.mainImage}><Image src={colorImages[Math.min(selectedImage, colorImages.length - 1)].image_url} alt={colorImages[Math.min(selectedImage, colorImages.length - 1)].alt_text || product.name} fill priority sizes="(max-width:850px) 100vw,56vw" /></div>{videos.length > 0 ? <section className={videoStyles.section} aria-labelledby="product-videos-heading"><div className={videoStyles.sectionHead}><h2 id="product-videos-heading">Product videos</h2><span>{videos.length} of 3</span></div><div className={videoStyles.cards}>{videos.map((video, index) => <button type="button" className={videoStyles.card} key={`${video.video_url}-${index}`} onClick={() => setActiveVideoIndex(index)} aria-label={`Play ${video.title || `video ${index + 1}`}`}><video src={video.video_url} poster={productVideoPoster(video.video_url)} muted playsInline preload="none" aria-hidden="true" /><span className={videoStyles.play}><Play size={20} fill="currentColor" /></span><span className={videoStyles.label}>{video.title || `Product video ${index + 1}`}</span></button>)}</div></section> : null}</div></div>
      <article className={styles.info}><p className={styles.productType}>{product.category} <span>· {product.sku}</span></p><h1>{product.name}</h1><p className={styles.description}>{product.short_description}</p><div className={styles.rule} />{features.length > 0 && <><h2>Key features</h2><ul className={styles.featureList}>{features.map((feature, index) => <li key={`${feature.value}-${index}`}><Check size={15} /> {feature.value}</li>)}</ul></>}
        {colors.length > 0 && <div className={styles.choice}><h3>Color</h3><div className={styles.colorChoices}>{colors.map((option) => <button key={option.option_value} onClick={() => { setColor(option.option_value); setSelectedImage(0); }} className={color === option.option_value ? styles.choiceActive : ""}><i style={{ background: option.value_meta || "#d9edf7" }} />{option.option_value}</button>)}</div></div>}
        {sizes.length > 0 && <div className={styles.choice}><h3>Size</h3><div className={styles.sizeChoices}>{sizes.map((option) => <button key={option.option_value} onClick={() => setSize(option.option_value)} className={size === option.option_value ? styles.choiceActive : ""}>{option.option_value}</button>)}</div></div>}
        <Link href={`/contact#quote?product=${encodeURIComponent(product.sku)}&color=${encodeURIComponent(color)}&size=${encodeURIComponent(size)}`} className={styles.enquire}><Send size={17} /> Request a Quote</Link>
      </article>
    </section>
    {activeVideo ? <div className={videoStyles.backdrop} role="presentation" onMouseDown={() => setActiveVideoIndex(null)}><section className={videoStyles.modal} role="dialog" aria-modal="true" aria-labelledby="video-player-title" onMouseDown={(event) => event.stopPropagation()}><div className={videoStyles.modalHead}><div><p>Product videos</p><h2 id="video-player-title">{activeVideo.title || product.name}</h2></div><button type="button" onClick={() => setActiveVideoIndex(null)} aria-label="Close video player"><X /></button></div><div className={videoStyles.modalBody}><div className={videoStyles.player}>{isTransportStream(activeVideo.video_url) ? <MpegTsVideoPlayer key={activeVideo.video_url} src={activeVideo.video_url} /> : <ProductVideoPlayer key={activeVideo.video_url} src={activeVideo.video_url} autoPlay />}</div><aside className={videoStyles.playlist} aria-label="Product video playlist"><h3>Videos for this product</h3>{videos.map((video, index) => <button type="button" key={`${video.video_url}-${index}`} className={index === activeVideoIndex ? videoStyles.selected : ""} onClick={() => setActiveVideoIndex(index)}><span className={videoStyles.playlistPreview}><video src={video.video_url} poster={productVideoPoster(video.video_url)} muted playsInline preload="none" aria-hidden="true" /><Play size={16} fill="currentColor" /></span><span>{video.title || `Product video ${index + 1}`}</span></button>)}</aside></div></section></div> : null}
    <section className={`${styles.shell} ${styles.detailBlock}`}>
      <div className={styles.tabs} role="tablist"><button className={tab === "overview" ? styles.tabActive : ""} onClick={() => setTab("overview")}>Overview</button><button className={tab === "specifications" ? styles.tabActive : ""} onClick={() => setTab("specifications")}>Specifications</button><button className={tab === "gallery" ? styles.tabActive : ""} onClick={() => setTab("gallery")}>Gallery</button></div>
      {tab === "overview" && <div className={styles.overview}><div><h2>Product overview</h2><p>{product.description || product.short_description || "Product information is being prepared."}</p></div><SpecificationTable sku={product.sku} specifications={specifications} /></div>}
      {tab === "specifications" && <div className={styles.specOnly}><SpecificationTable sku={product.sku} specifications={specifications} /></div>}
      {tab === "gallery" && <div className={styles.galleryGrid}>{colorImages.map((image, index) => <button key={`${image.image_url}-${index}`} onClick={() => { setSelectedImage(index); setTab("overview"); }}><Image src={image.image_url} alt={image.alt_text || product.name} fill sizes="(max-width:700px) 50vw,25vw" /></button>)}</div>}
    </section>
    <SiteFooter />
  </main>;
}

function SpecificationTable({ sku, specifications }: { sku: string; specifications: Specification[] }) { return <div className={styles.specTable}><h2>Key specifications</h2><dl><div><dt>Model</dt><dd>{sku}</dd></div>{specifications.length ? specifications.map((item, index) => <div key={`${item.label}-${index}`}><dt>{item.label}</dt><dd>{item.value}</dd></div>) : <div><dt>Details</dt><dd>Contact us for full product specifications.</dd></div>}</dl></div>; }
