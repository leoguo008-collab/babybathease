export function productVideoPoster(url: string): string | undefined {
  return /^\/uploads\/product-videos\/[a-zA-Z0-9-]+-web\.mp4$/.test(url) ? url.replace("/uploads/product-videos/", "/uploads/product-video-posters/").replace(/\.mp4$/, ".jpg") : undefined;
}

export function productVideoAudio(url: string): string | undefined {
  return /^\/uploads\/product-videos\/[a-zA-Z0-9-]+-web\.mp4$/.test(url) ? url.replace("/uploads/product-videos/", "/uploads/product-video-audio/").replace(/\.mp4$/, ".mp3") : undefined;
}
