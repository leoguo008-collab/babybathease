"use client";

import Image from "next/image";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type {UI} from "@/i18n/dictionaries";
import styles from "./product-thumbnails.module.css";

export default function ProductThumbnails({ images, selected, onSelect, ui }: {
  images: { image_url: string; alt_text: string }[];
  selected: number;
  ui?: UI;
  onSelect: (index: number) => void;
}) {
  const list = useRef<HTMLDivElement>(null);
  const id = useId();
  const [edges, setEdges] = useState({ start: true, end: true });

  useEffect(() => {
    const element = list.current;
    if (!element) return;
    const update = () => {
      const horizontal = window.matchMedia("(max-width: 760px)").matches;
      const position = horizontal ? element.scrollLeft : element.scrollTop;
      const maximum = horizontal ? element.scrollWidth - element.clientWidth : element.scrollHeight - element.clientHeight;
      setEdges({ start: position <= 1, end: position >= maximum - 1 });
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener("scroll", update, { passive: true });
    update();
    return () => { observer.disconnect(); element.removeEventListener("scroll", update); };
  }, [images]);

  useEffect(() => {
    const element = list.current;
    const button = element?.children[selected] as HTMLElement | undefined;
    if (!element || !button) return;
    const horizontal = window.matchMedia("(max-width: 760px)").matches;
    const offset = horizontal ? button.offsetLeft : button.offsetTop;
    const length = horizontal ? button.offsetWidth : button.offsetHeight;
    const position = horizontal ? element.scrollLeft : element.scrollTop;
    const viewport = horizontal ? element.clientWidth : element.clientHeight;
    const target = offset < position ? offset : offset + length > position + viewport ? offset + length - viewport : position;
    element.scrollTo(horizontal ? { left: target } : { top: target });
  }, [selected, images]);

  function scroll(direction: number) {
    const element = list.current;
    if (!element) return;
    const horizontal = window.matchMedia("(max-width: 760px)").matches;
    const distance = direction * (horizontal ? element.clientWidth : element.clientHeight) * 0.75;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
    element.scrollBy(horizontal ? { left: distance, behavior } : { top: distance, behavior });
  }

  return <div className={styles.slot}><div className={styles.rail}>
    <button type="button" className={styles.arrow} aria-label={ui?.previous || "Scroll to previous product images"} aria-controls={id} disabled={edges.start} onClick={() => scroll(-1)}><ChevronUp size={20} /></button>
    <div ref={list} id={id} className={styles.list} aria-label={ui?.gallery || "Product images"}>
      {images.map((image, index) => <button type="button" key={`${image.image_url}-${index}`} className={styles.thumbnail} aria-label={`${ui?.gallery || "View product image"} ${index + 1}`} aria-pressed={selected === index} onClick={() => onSelect(index)}><Image src={image.image_url} alt={image.alt_text || ""} fill sizes="90px" /></button>)}
    </div>
    <button type="button" className={styles.arrow} aria-label={ui?.next || "Scroll to next product images"} aria-controls={id} disabled={edges.end} onClick={() => scroll(1)}><ChevronDown size={20} /></button>
  </div></div>;
}
