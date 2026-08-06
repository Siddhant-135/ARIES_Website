import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveMemberDisplay } from "@/lib/auth-profile";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const metaSlug = String(user.app_metadata?.member_slug ?? "");
  const metaLevel = String(user.app_metadata?.level ?? "");
  const display = await resolveMemberDisplay(supabase, {
    userId: user.id,
    memberSlug: metaSlug,
    fallbackName: String(user.user_metadata?.name || metaSlug || "Member"),
  });

  return NextResponse.json({
    token: "",
    memberSlug: display.memberSlug || metaSlug,
    level: display.level || metaLevel,
    name: display.name,
    avatar: display.avatar ?? "",
    email: user.email ?? "",
    role: display.level || metaLevel,
  });
}
