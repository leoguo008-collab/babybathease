import { NextResponse } from "next/server";
import { currentAdmin, listInquiries, permanentlyDeleteInquiry, restoreInquiry, trashInquiry } from "@/lib/database";

export async function GET(request: Request) {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const view = new URL(request.url).searchParams.get("view") === "trash" ? "trash" : "active";
  return NextResponse.json(listInquiries(view));
}

export async function POST(request: Request) {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, action } = await request.json() as { id?: number; action?: string };
  if (!Number.isInteger(Number(id))) return NextResponse.json({ error: "A valid inquiry is required." }, { status: 400 });
  if (action === "trash") trashInquiry(Number(id));
  else if (action === "restore") restoreInquiry(Number(id));
  else if (action === "permanent-delete") permanentlyDeleteInquiry(Number(id));
  else return NextResponse.json({ error: "Unknown inquiry action." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
