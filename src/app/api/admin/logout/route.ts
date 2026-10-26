import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("baby_bath_admin", "", { path: "/", expires: new Date(0) });
  return response;
}
