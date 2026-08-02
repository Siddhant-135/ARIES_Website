import type { Member, ProjectContributor, ResourceAuthor } from "@/lib/types";
import { isVisitor } from "@/lib/supabase/env";

/** Normalize legacy string slugs and rich objects into ProjectContributor. */
export function normalizeContributor(
  c: string | ProjectContributor,
  members?: Pick<Member, "slug" | "name" | "level">[],
): ProjectContributor {
  if (typeof c !== "string") {
    if (c.kind === "member" && c.slug && !c.name) {
      const m = members?.find((x) => x.slug === c.slug);
      return { ...c, name: m?.name ?? c.slug };
    }
    return c;
  }

  const raw = c.trim();
  if (!raw) return { name: "", kind: "external" };

  if (raw.startsWith("alumni:")) {
    const name = raw.slice("alumni:".length).trim();
    return { name, kind: "alumni" };
  }
  if (raw.startsWith("external:") || raw.startsWith("ext:")) {
    const name = raw.replace(/^external:|^ext:/, "").trim();
    return { name, kind: "external" };
  }

  const m = members?.find((x) => x.slug === raw);
  return {
    slug: raw,
    name: m?.name ?? raw,
    kind: "member",
  };
}

export function normalizeContributors(
  list: Array<string | ProjectContributor> | undefined,
  members?: Pick<Member, "slug" | "name" | "level">[],
): ProjectContributor[] {
  return (list ?? [])
    .map((c) => normalizeContributor(c, members))
    .filter((c) => c.name.trim().length > 0 || (c.slug && c.slug.length > 0));
}

export function isVisitorMember(member?: Pick<Member, "level"> | null): boolean {
  return !!member && isVisitor(member.level);
}

export function memberLevelForSlug(
  slug: string | undefined,
  members?: Pick<Member, "slug" | "level">[],
): string | undefined {
  if (!slug) return undefined;
  return members?.find((m) => m.slug === slug)?.level;
}

export function contributorLabel(c: ProjectContributor): string {
  return c.name?.trim() || c.slug || "Unknown";
}

export function contributorSearchText(c: ProjectContributor): string {
  return [c.name, c.slug, c.kind].filter(Boolean).join(" ");
}

export function isProfileLinked(c: ProjectContributor): boolean {
  return c.kind === "member" && !!c.slug;
}

export function authorLabel(a: ResourceAuthor): string {
  return a.name?.trim() || a.slug || "Unknown";
}
