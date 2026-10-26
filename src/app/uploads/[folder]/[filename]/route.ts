import fs from "node:fs";
import path from "node:path";
import { uploadPath } from "@/lib/storage";

const types: Record<string, string> = { ".jpg": "image/jpeg", ".mp3": "audio/mpeg", ".pdf": "application/pdf" };

export async function GET(_: Request, context: { params: Promise<{ folder: string; filename: string }> }) {
  const { folder, filename } = await context.params;
  if (!["product-video-posters", "product-video-audio", "catalogues"].includes(folder) || !/^[a-zA-Z0-9_-]+\.(jpg|mp3|pdf)$/i.test(filename)) return new Response("Not found", { status: 404 });
  const file = uploadPath(folder, filename);
  if (!fs.existsSync(file)) return new Response("Not found", { status: 404 });
  return new Response(fs.readFileSync(file), { headers: { "Content-Type": types[path.extname(filename).toLowerCase()], "X-Content-Type-Options": "nosniff", "Cache-Control": "public, max-age=3600" } });
}
