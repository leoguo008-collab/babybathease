import { NextResponse } from "next/server";
import { createInquiry } from "@/lib/database";

export async function POST(request: Request) {
  try {
    const data = await request.json() as Record<string, unknown>;
    return NextResponse.json(createInquiry(data), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to submit inquiry." }, { status: 400 });
  }
}
