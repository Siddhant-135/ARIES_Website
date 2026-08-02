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

function supabasePublic() {
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
    // Next.js may cache fetch(); always read live content from Supabase
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

/* Members */
export async function getMembers(): Promise<Member[]> {
  const { data, error } = await supabasePublic()
    .from("members")
    .select("data")
    .neq("slug", "admin")
    .order("slug");
  if (error) throw error;
  return (data ?? []).map((row) => row.data as Member);
}

export async function getMember(slug: string): Promise<Member | undefined> {
  const { data, error } = await supabasePublic()
    .from("members")
    .select("data")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data?.data as Member | undefined;
}

/* Projects */
export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabasePublic().from("projects").select("data").order("slug");
  if (error) throw error;
  return (data ?? []).map((row) => row.data as Project);
}

export async function getProject(slug: string): Promise<Project | undefined> {
  const { data, error } = await supabasePublic()
    .from("projects")
    .select("data")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data?.data as Project | undefined;
}

/* Events */
export async function getEvents(): Promise<AriesEvent[]> {
  const { data, error } = await supabasePublic()
    .from("events")
    .select("data")
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => row.data as AriesEvent);
}

export async function getEvent(slug: string): Promise<AriesEvent | undefined> {
  const { data, error } = await supabasePublic()
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
  const { data, error } = await supabasePublic()
    .from("resources")
    .select("data")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return (data?.data as Resource[]) ?? [];
}

/* Team */
export async function getTeam(): Promise<TeamData> {
  const { data, error } = await supabasePublic()
    .from("team")
    .select("data")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return (data?.data as TeamData) ?? { years: [], alumni: [] };
}
