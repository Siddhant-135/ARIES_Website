import type { MemberLevel } from "@/lib/supabase/env";

export type UiRole = "admin" | "coordinator" | "member" | "viewer";

export function levelToUiRole(level: string | null | undefined): UiRole {
  if (level === "oc" || level === "co_overall_coordinator" || level === "research_lead") {
    return "admin";
  }
  if (level === "coordinator") return "coordinator";
  if (level === "executive" || level === "member") return "member";
  return "viewer";
}

/** OC / Co-Overall Coordinator / Research Lead */
export function isLeadership(level: string | null | undefined) {
  return (
    level === "oc" ||
    level === "co_overall_coordinator" ||
    level === "research_lead"
  );
}

/**
 * Direct create/edit of projects, events, team — leadership + coordinators.
 * Executives submit change_requests instead.
 */
export function canDirectPublish(level: string | null | undefined) {
  return isLeadership(level) || level === "coordinator";
}

export function canDirectCreate(level: string | null | undefined) {
  return canDirectPublish(level);
}

/** Approve/reject pending requests — leadership only. */
export function canApprove(level: string | null | undefined) {
  return isLeadership(level);
}

/** May submit project/event/team changes into the approval queue. */
export function canSubmitForApproval(level: string | null | undefined) {
  return level === "executive";
}

export function mapTeamRoleToLevel(role: string): MemberLevel | null {
  const r = role.trim().toLowerCase();
  if (r === "oc") return "oc";
  if (r === "co-overall coordinator" || r === "co overall coordinator") {
    return "co_overall_coordinator";
  }
  if (r === "research lead") return "research_lead";
  if (r.includes("coordinator")) return "coordinator";
  if (r.includes("executive")) return "executive";
  if (r.includes("alumni") || r.includes("alumn")) return "alumni";
  return null;
}
