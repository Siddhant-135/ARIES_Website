/**
 * Content readers. Source of truth: Supabase (ARIES_Website project).
 * content/*.json is retained as a backup; refresh with `npm run content:export`.
 */
import type {
  AriesEvent,
  Member,
  Project,
  Resource,
  TeamData,
} from "./types";
import { createClient } from "@supabase/supabase-js";

function taggedFetch(tags: string[]) {
  return (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, {
      ...init,
      cache: "force-cache",
      next: { revalidate: 30, tags: ["content", ...tags] },
    });
}

function supabaseTagged(tags: string[]) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase env missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    // ISR-friendly caching (no-store breaks generateStaticParams for /[slug]).
    // Tags are busted via revalidateTag in revalidateContent after CMS writes.
    global: { fetch: taggedFetch(tags) },
  });
}

/* Members */
export async function getMembers(): Promise<Member[]> {
  const { data, error } = await supabaseTagged(["members"])
    .from("members")
    .select("slug, data, level, entry_number, email")
    .neq("slug", "admin")
    .order("slug");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...(row.data as Member),
    level: row.level as Member["level"],
    entryNumber: (row.entry_number as string | null) ?? undefined,
    email: (row.email as string | null) ?? undefined,
  }));
}

export async function getMember(slug: string): Promise<Member | undefined> {
  const { data, error } = await supabaseTagged(["members"])
    .from("members")
    .select("data, level")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  return { ...(data.data as Member), level: data.level as Member["level"] };
}

/* Projects */
export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabaseTagged(["projects"])
    .from("projects")
    .select("data")
    .order("slug");
  if (error) throw error;
  return (data ?? []).map((row) => row.data as Project);
}

export async function getProject(slug: string): Promise<Project | undefined> {
  const { data, error } = await supabaseTagged(["projects"])
    .from("projects")
    .select("data")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data?.data as Project | undefined;
}

/* Events */
export async function getEvents(): Promise<AriesEvent[]> {
  const { data, error } = await supabaseTagged(["events"])
    .from("events")
    .select("data")
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => row.data as AriesEvent);
}

export async function getEvent(slug: string): Promise<AriesEvent | undefined> {
  const { data, error } = await supabaseTagged(["events"])
    .from("events")
    .select("data")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data?.data as AriesEvent | undefined;
}

export async function splitEvents(now = new Date()) {
  const all = await getEvents();
  const today = now.toISOString().slice(0, 10);
  return {
    upcoming: all.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)),
    past: all.filter((e) => e.date < today),
  };
}

/* Resources */
export async function getResources(): Promise<Resource[]> {
  const { data, error } = await supabaseTagged(["resources"])
    .from("resources")
    .select("data")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return (data?.data as Resource[]) ?? [];
}

export async function getResource(slug: string): Promise<Resource | undefined> {
  const all = await getResources();
  return all.find((r) => r.slug === slug);
}

/* Team */
export async function getTeam(): Promise<TeamData> {
  const { data, error } = await supabaseTagged(["team"])
    .from("team")
    .select("data")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return (data?.data as TeamData) ?? { years: [], alumni: [] };
}
