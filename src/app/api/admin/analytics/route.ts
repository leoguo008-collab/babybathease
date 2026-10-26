import { NextResponse } from "next/server";
import { analyticsSummary, currentAdmin } from "@/lib/database";

export async function GET() {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(analyticsSummary());
}
