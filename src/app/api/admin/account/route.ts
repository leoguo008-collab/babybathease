import { NextResponse } from "next/server";
import { changeAdminPassword, currentAdmin } from "@/lib/database";

export async function GET() {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ username: admin.username, displayName: admin.display_name, role: admin.role });
}

export async function POST(request: Request) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { currentPassword, newPassword } = await request.json() as { currentPassword?: string; newPassword?: string };
    changeAdminPassword(admin.id, String(currentPassword || ""), String(newPassword || ""));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to change password." }, { status: 400 });
  }
}
