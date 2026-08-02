import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseUrl, syntheticLoginEmail } from "@/lib/supabase/env";
import { levelsForSecret } from "@/lib/signup-secrets";

/**
 * Signup: secret code + kerberos + password.
 * Links to existing member row (entry_number / username = kerberos).
 * Requires SUPABASE_SERVICE_ROLE_KEY to set app_metadata + link auth_user_id.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    secret?: string;
    kerberos?: string;
    password?: string;
    confirmPassword?: string;
  };

  const secret = String(body.secret || "").trim();
  const kerberos = String(body.kerberos || "").trim().toLowerCase();
  const password = String(body.password || "");
  const confirm = String(body.confirmPassword || "");

  const allowedLevels = levelsForSecret(secret);
  if (!allowedLevels) {
    return NextResponse.json({ error: "Invalid secret code" }, { status: 400 });
  }
  if (!kerberos || !/^[a-z0-9._-]+$/i.test(kerberos)) {
    return NextResponse.json({ error: "Invalid Kerberos ID" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }
  if (password !== confirm) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "Server misconfigured: missing SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 },
    );
  }

  const admin = createClient(getSupabaseUrl(), serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: member, error: mErr } = await admin
    .from("members")
    .select("slug, level, email, entry_number, username, auth_user_id, data")
    .or(`entry_number.eq.${kerberos},username.eq.${kerberos}`)
    .maybeSingle();

  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 400 });
  if (!member) {
    return NextResponse.json(
      {
        error:
          "No club profile found for this Kerberos ID. IITD mail may not be on the roster yet — ask OC to add it.",
      },
      { status: 404 },
    );
  }
  if (member.auth_user_id) {
    return NextResponse.json({ error: "Account already exists — please sign in" }, { status: 409 });
  }
  if (!allowedLevels.includes(member.level)) {
    return NextResponse.json(
      {
        error: `Secret code does not match your club role (${member.level}). Use the code for your role.`,
      },
      { status: 403 },
    );
  }

  const email = (member.email && member.email.includes("@")
    ? member.email
    : syntheticLoginEmail(kerberos)
  ).toLowerCase();

  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { level: member.level, member_slug: member.slug },
    user_metadata: { name: (member.data as { name?: string })?.name || member.slug },
  });
  if (cErr || !created.user) {
    return NextResponse.json({ error: cErr?.message ?? "Could not create account" }, { status: 400 });
  }

  const { error: uErr } = await admin
    .from("members")
    .update({
      auth_user_id: created.user.id,
      entry_number: kerberos,
      username: kerberos,
      email,
    })
    .eq("slug", member.slug);
  if (uErr) {
    return NextResponse.json({ error: uErr.message }, { status: 400 });
  }

  // Sign them in via cookie session
  const supabase = await createSupabaseServerClient();
  const { error: sErr } = await supabase.auth.signInWithPassword({ email, password });
  if (sErr) {
    return NextResponse.json({
      ok: true,
      message: "Account created — please sign in",
      memberSlug: member.slug,
    });
  }

  return NextResponse.json({
    ok: true,
    memberSlug: member.slug,
    level: member.level,
    name: (member.data as { name?: string })?.name || member.slug,
    email,
  });
}
