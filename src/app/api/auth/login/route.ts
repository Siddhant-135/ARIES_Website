import { NextResponse } from "next/server";
import { issueAdminSession, tryBootstrapCredentials } from "@/lib/admin-session";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    entryNumber?: string;
    email?: string;
    password?: string;
  };
  const id = String(body.entryNumber || body.email || "");
  const password = String(body.password || "");
  if (!id || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }
  if (!tryBootstrapCredentials(id, password)) {
    return NextResponse.json({ error: "You're not a member" }, { status: 401 });
  }
  return NextResponse.json(issueAdminSession());
}
