import { NextResponse } from "next/server";
import { publicSettings } from "@/lib/database";

export async function GET() {
  return NextResponse.json(publicSettings() || {});
}
