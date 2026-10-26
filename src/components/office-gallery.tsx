"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type {UI} from "@/i18n/dictionaries";
import styles from "./office-gallery.module.css";

const officePhotos = [
  { src: "/images/office/fangda-exterior-day.webp", alt: "Fangda City office buildings in daylight" },
  { src: "/images/office/fangda-exterior-evening.webp", alt: "Fangda City office entrance in the evening" },
  { src: "/images/office/fangda-lobby.jpg", alt: "Fangda City building lobby" },
];

// Keep the supplied filenames in ascending order, from left to right.
const factoryPhotos = [
  { src: "/images/factory/codex-clipboard-8b9bf4fe-a667-4662-93ec-12581b3bfb4f.jpg", alt: "Factory production area with blue molding machines" },
  { src: "/images/factory/codex-clipboard-d7660cd7-8202-4f9c-b94a-bfb496835c04.jpg", alt: "Green injection molding machine in the factory" },
  { src: "/images/factory/codex-clipboard-e5c18d2c-cd12-4d03-9360-2e52370bb541.jpg", alt: "Factory warehouse shelves storing product components" },
];

export default function OfficeGallery({ui}: {ui?: UI}) {
  return <><PhotoGallery ui={ui} photos={officePhotos} label={ui?.officePhotos || "Office photos"}/><PhotoGallery ui={ui} photos={factoryPhotos} label="Factory photos"/></>;
}

function PhotoGallery({ui, photos, label}: {ui?: UI; photos: typeof officePhotos; label: string}) {
  const [selected, setSelected] = useState<number | null>(null);
  const active = selected === null ? null : photos[selected];
  const move = useCallback((direction: -1 | 1) => setSelected((current) => current === null ? 0 : (current + direction + photos.length) % photos.length), [photos.length]);
  useEffect(() => {
    if (selected === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
      if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [move, selected]);
  return <><div className={styles.thumbnails} dir="ltr" aria-label={label}>{photos.map((photo, index) => <button key={photo.src} type="button" onClick={() => setSelected(index)} aria-label={`${label} ${index + 1}`}><Image src={photo.src} alt={photo.alt} fill sizes="92px" /></button>)}</div>{active && <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={label} onClick={() => setSelected(null)}><div className={styles.viewer} onClick={(event) => event.stopPropagation()}><button className={`${styles.navigate} ${styles.previous}`} type="button" onClick={() => move(-1)} aria-label={ui?.previous || "Previous photo"}><ChevronLeft /></button><button className={`${styles.navigate} ${styles.next}`} type="button" onClick={() => move(1)} aria-label={ui?.next || "Next photo"}><ChevronRight /></button><button className={styles.close} type="button" onClick={() => setSelected(null)} aria-label={ui?.close || "Close image preview"}><X /></button><Image src={active.src} alt={active.alt} fill sizes="(max-width: 900px) 92vw, 960px" quality={100} loading="eager" /></div></div>}</>;
}
