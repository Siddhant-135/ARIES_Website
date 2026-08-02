import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { syntheticLoginEmail } from "@/lib/supabase/env";

/**
 * Login with username / entry number + password.
 * Resolves identifier → synthetic auth email via RPC, then signInWithPassword.
 * Bootstrap admin works once seeded (username admin, password from ADMIN_PASSWORD).
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    entryNumber?: string;
    email?: string;
    password?: string;
  };
  const id = String(body.entryNumber || body.email || "").trim();
  const password = String(body.password || "");
  if (!id || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  // Prefer DB resolver (only returns email when auth_user_id is set)
  const { data: resolved } = await supabase.rpc("resolve_login_email", {
    identifier: id,
  });

  const BLOGGER_USER = process.env.BLOGGER_USER || "blogger";
  const email =
    (typeof resolved === "string" && resolved) ||
    // Fallback for bootstrap before/during seed: admin → synthetic email
    (id.toLowerCase() === (process.env.ADMIN_USER || "admin").toLowerCase()
      ? syntheticLoginEmail(process.env.ADMIN_USER || "admin")
      : id.toLowerCase() === BLOGGER_USER.toLowerCase()
        ? syntheticLoginEmail(BLOGGER_USER)
        : null);

  if (!email) {
    return NextResponse.json({ error: "You're not a member" }, { status: 401 });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return NextResponse.json({ error: "You're not a member" }, { status: 401 });
  }

  const level = String(data.user.app_metadata?.level ?? "member");
  const memberSlug = String(data.user.app_metadata?.member_slug ?? "");
  const name = String(data.user.user_metadata?.name || memberSlug || "Member");

  return NextResponse.json({
    token: data.session?.access_token ?? "",
    memberSlug,
    level,
    name,
    email: data.user.email ?? email,
  });
}
