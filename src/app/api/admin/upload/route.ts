import fs from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { uploadsDirectory } from "@/lib/storage";
import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/database";
import { prepareProductVideo } from "@/lib/video-processing";

export const runtime = "nodejs";
export const maxDuration = 300;

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const videoTypes = new Set(["video/mp4", "video/webm", "video/mp2t"]);
const tsTypes = new Set(["video/mp2t", "video/vnd.dlna.mpeg-tts"]);
const extensionByType: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "video/mp4": ".mp4", "video/webm": ".webm", "video/mp2t": ".ts" };
const maxImageBytes = 8 * 1024 * 1024;
const maxVideoBytes = 100 * 1024 * 1024;

function filenamePart(value: string, fallback: string) {
  const normalized = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

function skuPart(value: string) {
  const normalized = value.trim().replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized || "product";
}

function uniqueFilename(folder: string, prefix: string, extension: string) {
  let number = 1;
  let filename = `${prefix}${extension}`;
  while (fs.existsSync(path.join(folder, filename))) filename = `${prefix}-${++number}${extension}`;
  return filename;
}

async function hasTransportStreamPackets(file: File) {
  // Windows and browsers disagree on the MIME type of .ts files. Check the
  // MPEG transport packet sync bytes instead of trusting that MIME label.
  const bytes = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
  for (const packetSize of [188, 192, 204]) {
    for (let offset = 0; offset < packetSize; offset++) {
      if (offset + packetSize * 4 >= bytes.length) break;
      if ([0, 1, 2, 3, 4].every((index) => bytes[offset + packetSize * index] === 0x47)) return true;
    }
  }
  return false;
}

export async function POST(request: Request) {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const formData = await request.formData();
  const assetType = String(formData.get("assetType") || "image");
  const productSku = skuPart(String(formData.get("productSku") || ""));
  const assetLabel = filenamePart(String(formData.get("assetLabel") || ""), "");
  if (assetType !== "image" && assetType !== "video") return NextResponse.json({ error: "Unsupported upload type." }, { status: 400 });
  const files = formData.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
  const allowedTypes = assetType === "video" ? videoTypes : imageTypes;
  const maxFileBytes = assetType === "video" ? maxVideoBytes : maxImageBytes;
  const maxFiles = assetType === "video" ? 3 : 12;
  if (!files.length) return NextResponse.json({ error: `Please select at least one ${assetType}.` }, { status: 400 });
  if (files.length > maxFiles) return NextResponse.json({ error: assetType === "video" ? "You can upload up to 3 videos at a time." : "You can upload up to 12 images at a time." }, { status: 400 });
  for (const file of files) {
    if (file.size > maxFileBytes) return NextResponse.json({ error: assetType === "video" ? "Each video must be 100 MB or smaller." : "Each image must be 8 MB or smaller." }, { status: 400 });
    const isTsFile = assetType === "video" && (path.extname(file.name).toLowerCase() === ".ts" || tsTypes.has(file.type));
    if (!allowedTypes.has(file.type) && !isTsFile) return NextResponse.json({ error: assetType === "video" ? "Only MP4, WebM, and MPEG-TS (.ts) videos are supported." : "Only JPG, PNG, WebP, and GIF images are supported." }, { status: 400 });
    if (isTsFile && !(await hasTransportStreamPackets(file))) return NextResponse.json({ error: "This .ts file does not contain valid MPEG-TS video data." }, { status: 400 });
  }
  const relativeFolder = assetType === "video" ? "/uploads/product-videos" : "/uploads/products";
  const uploadFolder = path.join(uploadsDirectory, assetType === "video" ? "product-videos" : "products");
  fs.mkdirSync(uploadFolder, { recursive: true });
  const uploaded: { url: string; name: string; posterUrl?: string }[] = [];
  try {
    for (const file of files) {
    const extension = assetType === "video" && (path.extname(file.name).toLowerCase() === ".ts" || tsTypes.has(file.type)) ? ".ts" : extensionByType[file.type] || path.extname(file.name).toLowerCase();
      const originalName = assetLabel || filenamePart(path.basename(file.name, path.extname(file.name)), assetType === "video" ? "product-video" : "product-image");
      // Sources are removed after transcoding, but playback assets remain.
      // Give every video its own namespace so a re-upload cannot reuse an old
      // MP4, poster, or soundtrack (including concurrent uploads).
      const prefix = `${productSku}-${originalName}${assetType === "video" ? `-${randomUUID()}` : ""}`;
      const filename = uniqueFilename(uploadFolder, prefix, extension);
      const sourcePath = path.join(uploadFolder, filename);
    fs.writeFileSync(sourcePath, Buffer.from(await file.arrayBuffer()), { flag: "wx" });
      const asset = assetType === "video" ? await prepareProductVideo(sourcePath) : { url: `${relativeFolder}/${filename}` };
      if (assetType === "video") fs.unlinkSync(sourcePath);
      uploaded.push({ ...asset, name: file.name.replace(/\.[^.]+$/, "") });
    }
  } catch (error) {
    console.error("Video preparation failed", error);
    return NextResponse.json({ error: "The video could not be prepared for playback. Please check that the file plays correctly and try again." }, { status: 422 });
  }
  return NextResponse.json({ files: uploaded });
}

