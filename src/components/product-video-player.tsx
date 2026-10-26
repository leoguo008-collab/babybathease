"use client";

import { useEffect, useRef, useState } from "react";
import { productVideoAudio, productVideoPoster } from "@/lib/video-assets";
import styles from "./product-video-player.module.css";

// Mount with key={src}: each playlist item has independent playback state.
export default function ProductVideoPlayer({ src, autoPlay = false }: { src: string; autoPlay?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTimeRef = useRef(0);
  const canUseSilent = /^\/uploads\/product-videos\/[a-zA-Z0-9-]+-web\.mp4$/.test(src);
  const audioSrc = productVideoAudio(src);
  const [stalled, setStalled] = useState(false);
  // Prefer the MP4's embedded soundtrack. This keeps the browser's native
  // volume control and the playback track together. The silent version stays
  // available only as an explicit compatibility fallback.
  const [silent, setSilent] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const activeSrc = silent ? src.replace(/\.mp4$/, "-silent.mp4") : src;

  function clearWatchdog() {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
  }
  function watchPlayback() {
    clearWatchdog();
    timerRef.current = setTimeout(() => setStalled(true), 8000);
  }
  useEffect(() => () => { if (timerRef.current !== null) clearTimeout(timerRef.current); }, []);

  function switchMode(withoutSound: boolean) {
    clearWatchdog();
    videoRef.current?.pause();
    audioRef.current?.pause();
    setStalled(false);
    lastTimeRef.current = 0;
    setSilent(withoutSound);
    setAttempt((value) => value + 1);
  }

  async function syncAudio(video: HTMLVideoElement) {
    const audio = audioRef.current;
    if (!audio || !silent) return;
    if (Math.abs(audio.currentTime - video.currentTime) > 0.35) audio.currentTime = video.currentTime;
    try {
      await audio.play();
      setAudioBlocked(false);
    } catch {
      setAudioBlocked(true);
    }
  }

  return <div className={styles.wrapper}>
    {audioSrc && silent ? <audio ref={audioRef} src={audioSrc} preload="auto" /> : null}
    <video key={`${activeSrc}-${attempt}`} ref={videoRef} src={activeSrc} poster={productVideoPoster(src)} controls playsInline preload="metadata"
      autoPlay={autoPlay || attempt > 0}
      onPlay={(event) => { watchPlayback(); void syncAudio(event.currentTarget); }} onWaiting={watchPlayback}
      onSeeking={(event) => { watchPlayback(); if (audioRef.current) audioRef.current.currentTime = event.currentTarget.currentTime; }}
      onTimeUpdate={(event) => {
        const video = event.currentTarget;
        if (Math.abs(video.currentTime - lastTimeRef.current) > 0.05 && !video.seeking) {
          lastTimeRef.current = video.currentTime;
          setStalled(false);
          clearWatchdog();
          if (!video.paused && !video.ended) watchPlayback();
        }
      }}
      onPause={() => { clearWatchdog(); audioRef.current?.pause(); }} onEnded={() => { clearWatchdog(); audioRef.current?.pause(); }}
      onError={() => { clearWatchdog(); setStalled(true); }} />
    {(canUseSilent || stalled) && <div className={styles.notice} role={stalled || silent ? "status" : undefined}>
      {(stalled || silent) && <span>{stalled ? "Playback could not start or has stalled." : audioBlocked ? "Click Enable sound to start the soundtrack." : "Playing in compatibility mode with sound."}</span>}
      {silent && audioBlocked && <button type="button" onClick={() => { const video = videoRef.current; if (video) void syncAudio(video); }}>Enable sound</button>}
      {canUseSilent && !silent && <button type="button" onClick={() => switchMode(true)}>Use compatibility playback</button>}
      {silent && <button type="button" onClick={() => switchMode(false)}>Try playback with sound</button>}
      {stalled && !silent && <button type="button" onClick={() => switchMode(false)}>Retry playback</button>}
      {stalled && <a href={src} download>Download video</a>}
    </div>}
  </div>;
}
