import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canApprove } from "@/lib/roles";

async function requireApprover() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const level = String(user.app_metadata?.level ?? "");
  if (!canApprove(level)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { supabase, user, level };
}

export async function GET() {
  const gate = await requireApprover();
  if ("error" in gate && gate.error) return gate.error;
  const { supabase } = gate as Awaited<ReturnType<typeof requireApprover>> & {
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  };

  const [{ data: requests }, { data: log }] = await Promise.all([
    supabase
      .from("change_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("change_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return NextResponse.json({ requests: requests ?? [], log: log ?? [] });
}

export async function POST(req: Request) {
  const gate = await requireApprover();
  if ("error" in gate && gate.error) return gate.error;
  const { supabase } = gate as Awaited<ReturnType<typeof requireApprover>> & {
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  };

  const body = (await req.json()) as {
    requestId?: string;
    approve?: boolean;
    note?: string;
  };
  if (!body.requestId || typeof body.approve !== "boolean") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("review_change_request", {
    request_id: body.requestId,
    approve: body.approve,
    note: body.note ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, request: data });
}
