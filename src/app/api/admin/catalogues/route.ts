import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { uploadsDirectory } from "@/lib/storage";
import { NextResponse } from "next/server";
import { addCatalogue, catalogueFiles, currentAdmin, removeCatalogue } from "@/lib/database";

export const runtime = "nodejs";

const maxCatalogueBytes = 50 * 1024 * 1024;
const catalogueFolder = path.join(uploadsDirectory, "catalogues");

function safeTitle(value: FormDataEntryValue | null, fallback: string) {
  const title = String(value || "").trim().replace(/\s+/g, " ").slice(0, 160);
  return title || fallback;
}

function isPdf(file: File, bytes: Uint8Array) {
  return path.extname(file.name).toLowerCase() === ".pdf" && (file.type === "application/pdf" || !file.type || String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-");
}

export async function GET() {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ files: catalogueFiles() });
}

export async function POST(request: Request) {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "Choose a PDF catalogue to upload." }, { status: 400 });
  if (file.size > maxCatalogueBytes) return NextResponse.json({ error: "The catalogue must be 50 MB or smaller." }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isPdf(file, bytes)) return NextResponse.json({ error: "Only valid PDF files can be uploaded." }, { status: 400 });

  fs.mkdirSync(catalogueFolder, { recursive: true });
  const storedName = `catalogue-${Date.now()}-${crypto.randomUUID()}.pdf`;
  const absolutePath = path.join(catalogueFolder, storedName);
  fs.writeFileSync(absolutePath, bytes);
  const fileUrl = `/uploads/catalogues/${storedName}`;
  try {
    const id = addCatalogue({ title: safeTitle(formData.get("title"), path.basename(file.name, ".pdf")), originalName: file.name.slice(0, 240), fileUrl, fileSize: file.size });
    return NextResponse.json({ id, fileUrl });
  } catch (error) {
    fs.unlinkSync(absolutePath);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Catalogue upload failed." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await request.json();
  const catalogue = removeCatalogue(Number(id));
  if (!catalogue) return NextResponse.json({ error: "This catalogue no longer exists." }, { status: 404 });
  const filename = path.basename(catalogue.file_url);
  const absolutePath = path.join(catalogueFolder, filename);
  if (catalogue.file_url.startsWith("/uploads/catalogues/") && fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
  return NextResponse.json({ ok: true });
}
