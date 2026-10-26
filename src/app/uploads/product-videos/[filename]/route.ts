import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { uploadPath } from "@/lib/storage";
import { Readable } from "node:stream";

export const runtime = "nodejs";
const contentTypes: Record<string, string> = { ".mp4": "video/mp4", ".webm": "video/webm", ".ts": "video/mp2t", ".jpg": "image/jpeg", ".mp3": "audio/mpeg" };

async function serveVideo(request: Request, context: RouteContext<"/uploads/product-videos/[filename]">) {
  const { filename } = await context.params;
  if (!/^[a-zA-Z0-9-]+\.(mp4|webm|ts|jpg|mp3)$/i.test(filename)) return new Response("Not found", { status: 404 });
  const filePath = uploadPath("product-videos", filename);
  const info = await stat(filePath).catch(() => null);
  if (!info?.isFile()) return new Response("Not found", { status: 404 });

  const headers = new Headers({
    "Content-Type": contentTypes[path.extname(filename).toLowerCase()],
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  });
  let start = 0;
  let end = info.size - 1;
  const range = request.headers.get("range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
    if (!match[1]) start = Math.max(0, info.size - Number(match[2]));
    else {
      start = Number(match[1]);
      if (match[2]) end = Math.min(end, Number(match[2]));
    }
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= info.size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
    headers.set("Content-Range", `bytes ${start}-${end}/${info.size}`);
  }
  headers.set("Content-Length", String(end - start + 1));
  const body = request.method === "HEAD" ? null : Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream<Uint8Array>;
  return new Response(body, { status: range ? 206 : 200, headers });
}

export const GET = serveVideo;
export const HEAD = serveVideo;
