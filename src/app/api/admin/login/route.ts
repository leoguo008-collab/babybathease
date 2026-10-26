import { NextResponse } from "next/server";
import { createSession, login, recordAdminLogin } from "@/lib/database";

export async function POST(request: Request) {
  const { username, password } = await request.json();
  const loginName = String(username || "").trim();
  const user = login(loginName, String(password || ""));
  recordAdminLogin({ userId: user?.id, username: loginName, success: Boolean(user) });
  if (!user) return NextResponse.json({ error: "Invalid login name or password." }, { status: 401 });
  const session = createSession(user.id);
  const response = NextResponse.json({ ok: true, name: user.display_name });
  response.cookies.set("baby_bath_admin", session.token, { httpOnly: true, sameSite: "lax", path: "/", expires: new Date(session.expiresAt) });
  return response;
}
