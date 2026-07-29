import { NextResponse } from "next/server";

export async function POST() {
  // Tokens are self-contained; client clears localStorage/cookie.
  return NextResponse.json({ ok: true });
}
