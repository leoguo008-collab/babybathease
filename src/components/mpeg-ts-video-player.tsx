"use client";

import { useEffect, useRef, useState } from "react";

type PlayerHandle = {
  pause: () => void;
  unload: () => void;
  detachMediaElement: () => void;
  destroy: () => void;
  on: (event: string, listener: (...args: unknown[]) => void) => void;
  attachMediaElement: (element: HTMLMediaElement) => void;
  load: () => void;
  play: () => Promise<void> | void;
};

export default function MpegTsVideoPlayer({ src, autoPlay = true, muted = false, controls = true }: { src: string; autoPlay?: boolean; muted?: boolean; controls?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let player: PlayerHandle | null = null;
    void import("mpegts.js").then(({ default: mpegts }) => {
      if (cancelled) return;
      if (!mpegts.isSupported() || !videoRef.current) {
        setError("This browser does not support MPEG-TS playback.");
        return;
      }
      // The transmuxing worker has a blob URL, so it cannot resolve site-relative paths.
      const mediaUrl = new URL(src, window.location.href).href;
      player = mpegts.createPlayer({ type: "mpegts", isLive: false, url: mediaUrl }, { enableWorker: true });
      player.on("error", () => setError("This TS file could not be decoded. Check that it contains H.264 video and AAC audio."));
      player.attachMediaElement(videoRef.current);
      player.load();
      if (autoPlay) void Promise.resolve(player.play()).catch(() => { /* Keep controls available when autoplay is blocked. */ });
    }).catch(() => setError("Unable to load the MPEG-TS playback engine."));
    return () => {
      cancelled = true;
      player?.pause();
      player?.unload();
      player?.detachMediaElement();
      player?.destroy();
    };
  }, [src, autoPlay]);

  return <><video ref={videoRef} controls={controls} autoPlay={autoPlay} muted={muted} playsInline />{error ? <p role="status" style={{ margin: 0, padding: "10px 14px", background: "#fff", color: "#9b2632", fontSize: 13 }}>{error}</p> : null}</>;
}
