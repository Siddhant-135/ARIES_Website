import { NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/admin-session";

export async function GET(req: Request) {
  const header = req.headers.get("authorization") || "";
  const token = header.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
  const session = verifyAdminToken(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(session);
}
