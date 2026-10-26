import { NextResponse } from "next/server";
import { currentAdmin, getResource, list, remove, save } from "@/lib/database";

async function authorized() { return Boolean(await currentAdmin()); }

export async function GET(_: Request, context: RouteContext<"/api/admin/[resource]">) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { const { resource } = await context.params; return NextResponse.json({ resource: getResource(resource), items: list(resource) }); } catch { return NextResponse.json({ error: "Unknown resource" }, { status: 404 }); }
}

export async function POST(request: Request, context: RouteContext<"/api/admin/[resource]">) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { const { resource } = await context.params; return NextResponse.json(save(resource, await request.json())); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Save failed" }, { status: 400 }); }
}

export async function DELETE(request: Request, context: RouteContext<"/api/admin/[resource]">) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { const { resource } = await context.params; const { id } = await request.json(); remove(resource, Number(id)); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ error: "Delete failed" }, { status: 400 }); }
}
