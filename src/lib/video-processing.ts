import { execFile } from "node:child_process";
import { mkdir, rename, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";

const execute = promisify(execFile);

export async function prepareProductVideo(sourcePath: string) {
  if (!ffmpegPath) throw new Error("Video processing is unavailable on this server.");
  const executable = ffmpegPath;
  const basename = path.basename(sourcePath, path.extname(sourcePath));
  const stem = path.join(path.dirname(sourcePath), `${basename}-web`);
  const playbackPath = `${stem}.mp4`;
  const uploadsPath = path.dirname(path.dirname(sourcePath));
  const posterDirectory = path.join(uploadsPath, "product-video-posters");
  const audioDirectory = path.join(uploadsPath, "product-video-audio");
  const posterPath = path.join(posterDirectory, `${basename}-web.jpg`);
  const silentPath = `${stem}-silent.mp4`;
  const audioPath = path.join(audioDirectory, `${basename}-web.mp3`);
  const temporaryVideo = `${stem}.pending.mp4`;
  const temporaryPoster = path.join(posterDirectory, `${basename}-web.pending.jpg`);
  const temporarySilent = `${stem}-silent.pending.mp4`;
  const temporaryAudio = path.join(audioDirectory, `${basename}-web.pending.mp3`);
  const run = (args: string[]) => execute(executable, ["-hide_banner", "-loglevel", "error", "-nostdin", "-y", ...args], { windowsHide: true, timeout: 300_000, maxBuffer: 1024 * 1024 });

  try {
    await Promise.all([mkdir(posterDirectory, { recursive: true }), mkdir(audioDirectory, { recursive: true })]);
    if (!(await stat(playbackPath).catch(() => null))?.size) {
      // Normalize both timestamps and codecs; HE-AAC in TS is not reliably
      // supported by all browser MediaSource implementations.
      await run(["-fflags", "+genpts", "-i", sourcePath, "-map", "0:v:0", "-map", "0:a:0?", "-sn", "-dn", "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2,setsar=1", "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-pix_fmt", "yuv420p", "-c:a", "aac", "-profile:a", "aac_low", "-b:a", "128k", "-ar", "48000", "-movflags", "+faststart", "-avoid_negative_ts", "make_zero", "-threads", "2", temporaryVideo]);
      await rename(temporaryVideo, playbackPath);
    }
    if (!(await stat(silentPath).catch(() => null))?.size) {
      // Optional, explicitly labelled fallback for devices with a blocked audio sink.
      // The normal MP4 and original source always retain their audio.
      await run(["-i", playbackPath, "-map", "0:v:0", "-c:v", "copy", "-an", "-movflags", "+faststart", temporarySilent]);
      await rename(temporarySilent, silentPath);
    }
    if (!(await stat(audioPath).catch(() => null))?.size) {
      // Keep the soundtrack separate so an audio-driver issue cannot freeze
      // the visual stream. MP3 is broadly playable without MediaSource.
      await run(["-i", playbackPath, "-map", "0:a:0", "-c:a", "libmp3lame", "-b:a", "128k", temporaryAudio]);
      await rename(temporaryAudio, audioPath);
    }
    if (!(await stat(posterPath).catch(() => null))?.size) {
      await run(["-i", playbackPath, "-vf", "thumbnail=120,scale=640:-2", "-frames:v", "1", "-q:v", "2", "-threads", "2", temporaryPoster]);
      if (!(await stat(temporaryPoster).catch(() => null))?.size) throw new Error("Could not create a video thumbnail.");
      await rename(temporaryPoster, posterPath);
    }
    return { url: `/uploads/product-videos/${basename}-web.mp4`, posterUrl: `/uploads/product-video-posters/${basename}-web.jpg` };
  } finally {
    await Promise.all([temporaryVideo, temporaryPoster, temporarySilent, temporaryAudio].map((file) => unlink(file).catch(() => undefined)));
  }
}
