export function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  return url;
}

export function getSupabaseAnonKey() {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return key;
}

export function getSupabaseServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return key;
}

export const LOGIN_EMAIL_DOMAIN = "ariesiitd.com";

export function syntheticLoginEmail(usernameOrEntry: string) {
  return `${usernameOrEntry.trim().toLowerCase()}@${LOGIN_EMAIL_DOMAIN}`;
}

export const PUBLISH_LEVELS = [
  "oc",
  "co_overall_coordinator",
  "research_lead",
  "coordinator",
] as const;

export type MemberLevel =
  | "oc"
  | "co_overall_coordinator"
  | "research_lead"
  | "coordinator"
  | "executive"
  | "member"
  | "alumni";

export function canDirectPublish(level: string | null | undefined) {
  return PUBLISH_LEVELS.includes(level as (typeof PUBLISH_LEVELS)[number]);
}

export function canApprove(level: string | null | undefined) {
  return canDirectPublish(level);
}

export function isLeadership(level: string | null | undefined) {
  return (
    level === "oc" ||
    level === "co_overall_coordinator" ||
    level === "research_lead"
  );
}
