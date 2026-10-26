import fs from "node:fs";
import path from "node:path";
import { uploadPath } from "@/lib/storage";
import { NextResponse } from "next/server";
import { activeCatalogue } from "@/lib/database";

export const runtime = "nodejs";

export async function GET() {
  const catalogue = activeCatalogue();
  if (!catalogue || !catalogue.file_url.startsWith("/uploads/catalogues/")) return NextResponse.json({ error: "No catalogue is currently available." }, { status: 404 });
  const filename = path.basename(catalogue.file_url);
  const absolutePath = uploadPath("catalogues", filename);
  if (!fs.existsSync(absolutePath)) return NextResponse.json({ error: "The current catalogue file is unavailable." }, { status: 404 });
  return new NextResponse(fs.readFileSync(absolutePath), { headers: {
    "Content-Type": "application/pdf",
    "Content-Length": String(fs.statSync(absolutePath).size),
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
  } });
}
