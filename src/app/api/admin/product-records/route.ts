import { NextResponse } from "next/server";
import { currentAdmin, deleteProduct, productEditorData, saveProduct } from "@/lib/database";

export async function GET() { if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); return NextResponse.json(productEditorData()); }
export async function POST(request: Request) { if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); try { return NextResponse.json(saveProduct(await request.json())); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Save failed" }, { status: 400 }); } }
export async function DELETE(request: Request) {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
  try {
    const { id } = await request.json();
    const productId = Number(id);
    if (!Number.isInteger(productId) || productId <= 0) return NextResponse.json({ error: "A valid product ID is required." }, { status: 400 });
    const deletedCount = deleteProduct(productId);
    if (!deletedCount) return NextResponse.json({ error: "This product no longer exists." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Delete failed." }, { status: 400 });
  }
}
