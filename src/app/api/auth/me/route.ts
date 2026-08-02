import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const level = String(user.app_metadata?.level ?? "");
  const memberSlug = String(user.app_metadata?.member_slug ?? "");
  return NextResponse.json({
    token: "",
    memberSlug,
    level,
    name: String(user.user_metadata?.name || memberSlug || "Member"),
    email: user.email ?? "",
    role: level,
  });
}
