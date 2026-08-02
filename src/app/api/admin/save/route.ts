import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  canDirectPublish,
  canSubmitForApproval,
  isLeadership,
} from "@/lib/roles";
import { revalidateContent } from "@/lib/revalidate";

async function sessionInfo(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Prefer live members row (JWT app_metadata can be stale until refresh)
  const { data: member } = await supabase
    .from("members")
    .select("slug, level, data")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const level = String(member?.level || user.app_metadata?.level || "");
  const memberSlug = String(member?.slug || user.app_metadata?.member_slug || "");
  const name = String(
    (member?.data as { name?: string } | null)?.name ||
      user.user_metadata?.name ||
      memberSlug ||
      "Member",
  );

  return { user, level, memberSlug, name, email: user.email ?? "" };
}

async function publishDirect(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  kind: "projects" | "events" | "team",
  slug: string | undefined,
  payload: Record<string, unknown>,
  memberSlug: string,
  level: string,
) {
  const entitySlug = kind === "team" ? "team" : slug!;
  let before: unknown = null;

  if (kind === "projects") {
    const { data: row } = await supabase.from("projects").select("data").eq("slug", slug!).maybeSingle();
    before = row?.data ?? null;
    const { error } = await supabase.from("projects").upsert({
      slug: slug!,
      data: payload,
      featured: !!payload.featured,
      updated_at: new Date().toISOString(),
    });
    if (error) return { error: error.message };
  } else if (kind === "events") {
    const { data: row } = await supabase.from("events").select("data").eq("slug", slug!).maybeSingle();
    before = row?.data ?? null;
    const { error } = await supabase.from("events").upsert({
      slug: slug!,
      data: payload,
      date: (payload.date as string) || null,
      updated_at: new Date().toISOString(),
    });
    if (error) return { error: error.message };
  } else {
    const { data: row } = await supabase.from("team").select("data").eq("id", 1).maybeSingle();
    before = row?.data ?? null;
    const { error } = await supabase.from("team").upsert({
      id: 1,
      data: payload,
      updated_at: new Date().toISOString(),
    });
    if (error) return { error: error.message };
  }

  const { error: logErr } = await supabase.from("change_log").insert({
    entity_type: kind === "team" ? "team" : kind.slice(0, -1),
    entity_slug: entitySlug,
    actor_slug: memberSlug || "unknown",
    actor_level: level,
    source: "direct",
    summary: `Direct publish ${kind}`,
    before_data: before,
    after_data: payload,
  });
  // Don't fail the save if audit log insert fails
  if (logErr) console.warn("[admin/save] change_log:", logErr.message);

  return { ok: true as const };
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const session = await sessionInfo(supabase);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized — please sign in again" }, { status: 401 });
  }

  const { kind, slug, data, action } = (await req.json()) as {
    kind?: string;
    slug?: string;
    data?: Record<string, unknown>;
    action?: string;
  };

  const ALLOWED = new Set(["members", "projects", "events", "team"]);
  const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

  if (!kind || !ALLOWED.has(kind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  if (kind !== "team" && (typeof slug !== "string" || !SLUG_RE.test(slug))) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const { level, memberSlug } = session;

  // Delete project / event
  if (action === "delete" && (kind === "projects" || kind === "events")) {
    if (canDirectPublish(level)) {
      const table = kind === "projects" ? "projects" : "events";
      const { error } = await supabase.from(table).delete().eq("slug", slug!);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      await supabase.from("change_log").insert({
        entity_type: kind === "projects" ? "project" : "event",
        entity_slug: slug!,
        actor_slug: memberSlug || "unknown",
        actor_level: level,
        source: "direct",
        summary: `Deleted ${kind.slice(0, -1)} ${slug}`,
        before_data: null,
        after_data: null,
      });
      revalidateContent(kind, slug);
      return NextResponse.json({ ok: true, mode: "direct", deleted: true });
    }
    if (canSubmitForApproval(level)) {
      const entityType = kind === "projects" ? "project" : "event";
      const { error } = await supabase.from("change_requests").insert({
        entity_type: entityType,
        entity_slug: slug!,
        payload: { __delete: true },
        submitted_by: memberSlug,
        status: "pending",
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({
        ok: true,
        mode: "pending",
        message: "Delete submitted for approval",
      });
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!data || typeof data !== "object") {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const payload = kind === "team" ? data : { ...data, slug };

  if (kind === "members") {
    const isOwn = memberSlug === slug;
    if (!isOwn && !isLeadership(level) && level !== "coordinator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // SECURITY DEFINER RPC — reliable own-profile + leadership edits (bypasses INSERT RLS)
    const { error } = await supabase.rpc("save_member_profile", {
      p_slug: slug!,
      p_data: payload,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidateContent("members", slug!);
    return NextResponse.json({ ok: true, mode: "direct" });
  }

  if (kind === "projects" || kind === "events" || kind === "team") {
    if (canDirectPublish(level)) {
      const result = await publishDirect(supabase, kind, slug, payload, memberSlug, level);
      if ("error" in result && result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      revalidateContent(kind, slug);
      return NextResponse.json({ ok: true, mode: "direct" });
    }

    if (canSubmitForApproval(level)) {
      const entityType = kind === "projects" ? "project" : kind === "events" ? "event" : "team";
      const entitySlug = kind === "team" ? "team" : slug!;
      const { error } = await supabase.from("change_requests").insert({
        entity_type: entityType,
        entity_slug: entitySlug,
        payload,
        submitted_by: memberSlug,
        status: "pending",
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({
        ok: true,
        mode: "pending",
        message: "Submitted for approval by OC / Co-Overall Coordinator / Research Lead",
      });
    }

    return NextResponse.json(
      { error: `Forbidden — your role (${level || "none"}) cannot edit ${kind}` },
      { status: 403 },
    );
  }

  return NextResponse.json({ error: "Unhandled" }, { status: 400 });
}
