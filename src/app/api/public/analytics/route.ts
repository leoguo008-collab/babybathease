import { NextResponse } from "next/server";
import { recordAnalyticsPageView } from "@/lib/database";

export async function POST(request: Request) {
  try {
    return NextResponse.json(recordAnalyticsPageView(await request.json() as Record<string, unknown>), { status: 201 });
  } catch {
    return NextResponse.json({ recorded: false }, { status: 400 });
  }
}
