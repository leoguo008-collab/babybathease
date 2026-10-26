'use client';

import Image from 'next/image';
import {useEffect, useRef, useState, type PointerEvent} from 'react';
import {ChevronLeft, ChevronRight, Expand, Minus, Plus, X} from 'lucide-react';
import type {UI} from '@/i18n/dictionaries';
import styles from './product-image-viewer.module.css';

type Point = {x: number; y: number};
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

export default function ProductImageViewer({images, selected, onSelect, name, ui}: {
  images: string[]; selected: number; onSelect: (index: number) => void; name: string; ui: UI;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState({scale: 1, x: 0, y: 0});
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const inlineStart = useRef<Point | null>(null);
  const suppressClick = useRef(false);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef({start: {x: 0, y: 0}, distance: 0, scale: 1, x: 0, y: 0, multi: false});
  const currentView = useRef(view);
  const src = images[selected] || images[0] || '/images/product-accessories-v2.png';

  function updateView(scale: number, x = 0, y = 0) {
    const zoom = Math.max(1, Math.min(4, scale));
    const rect = stage.current?.getBoundingClientRect();
    const next = {scale: zoom, x: clamp(x, (rect?.width || 0) * (zoom - 1) / 2), y: clamp(y, (rect?.height || 0) * (zoom - 1) / 2)};
    currentView.current = next;
    setView(next);
  }
  function move(step: number) {
    onSelect((selected + step + images.length) % images.length);
    updateView(1);
  }
  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      pointers.current.clear();
      trigger.current?.focus({preventScroll: true});
    };
  }, [open]);

  function beginGesture() {
    const points = Array.from(pointers.current.values());
    const value = currentView.current;
    gesture.current = {start: points[0] || {x: 0, y: 0}, distance: points.length > 1 ? distance(points[0], points[1]) : 0, ...value, multi: points.length > 1};
  }
  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, {x: event.clientX, y: event.clientY});
    beginGesture();
  }
  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, {x: event.clientX, y: event.clientY});
    const points = Array.from(pointers.current.values());
    const initial = gesture.current;
    if (points.length > 1 && initial.distance > 0) {
      updateView(initial.scale * distance(points[0], points[1]) / initial.distance, initial.x, initial.y);
    } else if (currentView.current.scale > 1) {
      updateView(initial.scale, initial.x + event.clientX - initial.start.x, initial.y + event.clientY - initial.start.y);
    }
  }
  function pointerUp(event: PointerEvent<HTMLDivElement>) {
    const initial = gesture.current;
    if (!initial.multi && currentView.current.scale === 1 && pointers.current.size === 1) {
      const dx = event.clientX - initial.start.x;
      const dy = event.clientY - initial.start.y;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) move(dx < 0 ? 1 : -1);
    }
    pointers.current.delete(event.pointerId);
    if (pointers.current.size) { beginGesture(); gesture.current.multi = true; }
  }

  return <>
    <button ref={trigger} type="button" className={`localized-main-image ${styles.preview}`} aria-label={`${ui.gallery}: ${name}`} aria-haspopup="dialog"
      onPointerDown={event => { suppressClick.current = false; inlineStart.current = event.isPrimary ? {x: event.clientX, y: event.clientY} : null; }}
      onPointerCancel={() => {inlineStart.current = null; suppressClick.current = true;}}
      onPointerUp={event => {
        const start = inlineStart.current;
        inlineStart.current = null;
        if (!start) return;
        const dx = event.clientX - start.x, dy = event.clientY - start.y;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {suppressClick.current = true; move(dx < 0 ? 1 : -1);}
      }}
      onClick={() => {if (suppressClick.current) {suppressClick.current = false; return;} updateView(1); setOpen(true);}}>
      <Image src={src} alt={name} fill priority sizes="(max-width:760px) 100vw,50vw" draggable={false}/>
      <span className={styles.badge} aria-hidden="true"><Expand size={18}/>{selected + 1} / {images.length}</span>
    </button>
    {open && <dialog ref={dialog} className={styles.viewer} aria-label={`${ui.gallery}: ${name}`} onCancel={() => setOpen(false)} onKeyDown={event => {
      if (event.key === 'ArrowLeft') {event.preventDefault(); move(-1);}
      if (event.key === 'ArrowRight') {event.preventDefault(); move(1);}
    }}>
      <div className={styles.toolbar}>
        <span aria-live="polite">{selected + 1} / {images.length}</span>
        <button type="button" aria-label="Zoom out" disabled={view.scale <= 1} onClick={() => updateView(view.scale - 0.5)}><Minus/></button>
        <button type="button" aria-label="Reset zoom" onClick={() => updateView(1)}>{Math.round(view.scale * 100)}%</button>
        <button type="button" aria-label="Zoom in" disabled={view.scale >= 4} onClick={() => updateView(view.scale + 0.5)}><Plus/></button>
        <button type="button" aria-label={ui.close} onClick={() => setOpen(false)}><X/></button>
      </div>
      <div ref={stage} className={styles.stage} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp}
        onPointerCancel={() => {pointers.current.clear();}} onDoubleClick={() => updateView(view.scale > 1 ? 1 : 2)}>
        {/* Full resolution is only requested when the viewer opens. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={`${name} ${selected + 1}`} draggable={false} style={{transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`}}/>
      </div>
      {images.length > 1 && <div className={styles.navigation}>
        <button type="button" aria-label={ui.previous} onClick={() => move(-1)}><ChevronLeft/></button>
        <button type="button" aria-label={ui.next} onClick={() => move(1)}><ChevronRight/></button>
      </div>}
    </dialog>}
  </>;
}
