import { NextResponse } from "next/server";
import { publishedCatalogue } from "@/lib/database";

export async function GET() { return NextResponse.json(publishedCatalogue(), { headers: { "Cache-Control": "no-store" } }); }
