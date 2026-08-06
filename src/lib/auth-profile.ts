/**
 * Resolve display name + avatar from the live members row (not stale JWT metadata).
 */
export async function resolveMemberDisplay(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: { from: (t: string) => any },
  opts: {
    userId?: string | null;
    memberSlug?: string | null;
    fallbackName?: string | null;
  },
): Promise<{ memberSlug: string; name: string; avatar?: string; level?: string }> {
  const fallbackSlug = String(opts.memberSlug ?? "").trim();
  const fallbackName = String(opts.fallbackName || fallbackSlug || "Member");

  let row:
    | { slug: string; level?: string; data: { name?: string; avatar?: string } | null }
    | null
    | undefined;

  if (opts.userId) {
    const { data } = await supabase
      .from("members")
      .select("slug, level, data")
      .eq("auth_user_id", opts.userId)
      .maybeSingle();
    row = data;
  }

  if (!row && fallbackSlug) {
    const { data } = await supabase
      .from("members")
      .select("slug, level, data")
      .eq("slug", fallbackSlug)
      .maybeSingle();
    row = data;
  }

  if (!row) {
    return { memberSlug: fallbackSlug, name: fallbackName };
  }

  const data = (row.data ?? {}) as { name?: string; avatar?: string };
  return {
    memberSlug: String(row.slug || fallbackSlug),
    name: String(data.name || fallbackName),
    avatar: data.avatar ? String(data.avatar) : undefined,
    level: row.level ? String(row.level) : undefined,
  };
}
