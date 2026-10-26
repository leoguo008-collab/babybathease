import { NextResponse } from "next/server";
import { publishedProducts } from "@/lib/database";

export async function GET() { return NextResponse.json({ products: publishedProducts() }, { headers: { "Cache-Control": "no-store" } }); }
