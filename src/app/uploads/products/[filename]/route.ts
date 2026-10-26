import fs from "node:fs";
import path from "node:path";
import { uploadPath } from "@/lib/storage";
import { NextResponse } from "next/server";

const contentTypes: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };

export async function GET(_: Request, context: RouteContext<"/uploads/products/[filename]">) {
  const { filename } = await context.params;
  if (!/^[a-zA-Z0-9-]+\.(jpg|jpeg|png|webp|gif)$/i.test(filename)) return new NextResponse("Not found", { status: 404 });
  const filePath = uploadPath("products", filename);
  if (!fs.existsSync(filePath)) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(fs.readFileSync(filePath), { headers: { "Content-Type": contentTypes[path.extname(filename).toLowerCase()] || "application/octet-stream", "Cache-Control": "public, max-age=31536000, immutable" } });
}
