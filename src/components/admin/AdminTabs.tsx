"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserRound,
  FolderPlus,
  CalendarPlus,
  Users,
  LogOut,
  ExternalLink,
  Image as ImageIcon,
  ClipboardList,
} from "lucide-react";
import type { AriesEvent, Member, Project, TeamData } from "@/lib/types";
import { ProfileEditor } from "./ProfileEditor";
import { ProjectForm } from "./ProjectForm";
import { EventForm } from "./EventForm";
import { MemberForm } from "./MemberForm";
import { ImageField } from "./ImageField";
import { ApprovalsPanel } from "./ApprovalsPanel";
import { useAuth } from "@/context/AuthContext";
import { canApprove } from "@/lib/roles";
import { cn } from "@/lib/utils";

const BASE_TABS = [
  { id: "members", label: "Members", icon: Users },
  { id: "projects", label: "Projects", icon: FolderPlus },
  { id: "events", label: "Events", icon: CalendarPlus },
  { id: "team-photo", label: "Team photo", icon: ImageIcon },
  { id: "profile", label: "My profile", icon: UserRound },
  { id: "approvals", label: "Approvals", icon: ClipboardList },
] as const;

type TabId = (typeof BASE_TABS)[number]["id"];

/**
 * Full CMS shell — create/edit members, projects, events, team photos.
 */
export function AdminTabs({
  members: initialMembers,
  projects: initialProjects,
  events: initialEvents,
  team,
}: {
  members: Member[];
  projects: Project[];
  events: AriesEvent[];
  team: TeamData;
}) {
  const router = useRouter();
  const { session, signOut, role } = useAuth();
  const showApprovals = canApprove(session?.level); // OC / Co-OC / Research Lead only
  const TABS = showApprovals
    ? BASE_TABS
    : BASE_TABS.filter((t) => t.id !== "approvals");
  const [tab, setTab] = useState<TabId>("projects");
  const [members, setMembers] = useState(initialMembers);
  const [projects, setProjects] = useState(initialProjects);
  const [events, setEvents] = useState(initialEvents);
  const [editMember, setEditMember] = useState<string>("");
  const [editProject, setEditProject] = useState<string>("");
  const [editEvent, setEditEvent] = useState<string>("");
  const [projectFormKey, setProjectFormKey] = useState(0);
  const [eventFormKey, setEventFormKey] = useState(0);
  const [teamPhoto, setTeamPhoto] = useState(team.years[0]?.photo ?? "");
  const [teamStatus, setTeamStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    setMembers(initialMembers);
    setProjects(initialProjects);
    setEvents(initialEvents);
  }, [initialMembers, initialProjects, initialEvents]);

  const member = useMemo(
    () => members.find((m) => m.slug === (session?.memberSlug || members[0]?.slug)) ?? members[0],
    [members, session?.memberSlug],
  );

  const selectedMember = members.find((m) => m.slug === editMember);
  const selectedProject = projects.find((p) => p.slug === editProject);
  const knownTags = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) {
      for (const t of p.tags ?? []) if (t.trim()) set.add(t.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [projects]);
  const selectedEvent = events.find((e) => e.slug === editEvent);

  const saveTeamPhoto = async () => {
    if (!team.years[0]) return;
    setTeamStatus("saving");
    const next: TeamData = {
      ...team,
      years: team.years.map((y, i) => (i === 0 ? { ...y, photo: teamPhoto || undefined } : y)),
    };
    const res = await fetch("/api/admin/save", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "team", slug: "team", data: next }),
    });
    setTeamStatus(res.ok ? "saved" : "error");
    setTimeout(() => setTeamStatus("idle"), 2500);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-5 py-4 shadow-card-sm">
        <div>
          <p className="text-sm font-bold text-ink">{session?.name ?? "Editor"}</p>
          <p className="text-xs text-ink/50">
            Signed in · role {role}
            {session?.email ? ` · ${session.email}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {member && (
            <Link
              href={`/${member.slug}`}
              target="_blank"
              className="flex items-center gap-1.5 text-xs font-semibold text-purple hover:underline"
            >
              Public profile <ExternalLink size={12} />
            </Link>
          )}
          <button
            type="button"
            onClick={() => void signOut().then(() => (window.location.href = "/admin"))}
            className="flex items-center gap-1.5 rounded-full bg-lilac px-3 py-1.5 text-xs font-bold text-ink"
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors",
              tab === t.id ? "bg-purple text-white shadow-cta" : "bg-white text-ink hover:bg-lilac",
            )}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-6">
        {tab === "members" && (
          <>
            <label className="block max-w-md text-xs font-semibold text-ink">
              Edit existing member
              <select
                value={editMember}
                onChange={(e) => setEditMember(e.target.value)}
                className="mt-1.5 w-full rounded-lg bg-white px-3 py-2.5 text-sm shadow-card-sm"
              >
                <option value="">— create new —</option>
                {members.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.name} ({m.slug})
                  </option>
                ))}
              </select>
            </label>
            <MemberForm
              key={editMember || "new-member"}
              initial={
                selectedMember
                  ? {
                      slug: selectedMember.slug,
                      name: selectedMember.name,
                      role: selectedMember.role,
                      tagline: selectedMember.tagline,
                      year: selectedMember.year,
                      location: selectedMember.location,
                      photo: selectedMember.avatar,
                      about:
                        typeof selectedMember.blocks.find((b) => b.type === "text")?.data === "string"
                          ? (selectedMember.blocks.find((b) => b.type === "text")?.data as string)
                          : "",
                    }
                  : undefined
              }
            />
          </>
        )}

        {tab === "projects" && (
          <>
            <label className="block max-w-md text-xs font-semibold text-ink">
              Edit existing project
              <select
                value={editProject}
                onChange={(e) => {
                  setEditProject(e.target.value);
                  setProjectFormKey((k) => k + 1);
                }}
                className="mt-1.5 w-full rounded-lg bg-white px-3 py-2.5 text-sm shadow-card-sm"
              >
                <option value="">— create new —</option>
                {projects.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <ProjectForm
              key={`${editProject || "new-project"}-${projectFormKey}`}
              initial={selectedProject}
              members={members}
              knownTags={knownTags}
              onSaved={(project, mode) => {
                if (mode === "direct") {
                  setProjects((prev) => {
                    const i = prev.findIndex((p) => p.slug === project.slug);
                    if (i >= 0) {
                      const next = [...prev];
                      next[i] = { ...prev[i], ...project };
                      return next;
                    }
                    return [...prev, project];
                  });
                  setEditProject(project.slug);
                }
                setProjectFormKey((k) => k + 1);
                router.refresh();
              }}
              onDeleted={(slug, mode) => {
                if (mode === "direct") {
                  setProjects((prev) => prev.filter((p) => p.slug !== slug));
                  setEditProject("");
                }
                setProjectFormKey((k) => k + 1);
                router.refresh();
              }}
            />
          </>
        )}

        {tab === "events" && (
          <>
            <label className="block max-w-md text-xs font-semibold text-ink">
              Edit existing event
              <select
                value={editEvent}
                onChange={(e) => {
                  setEditEvent(e.target.value);
                  setEventFormKey((k) => k + 1);
                }}
                className="mt-1.5 w-full rounded-lg bg-white px-3 py-2.5 text-sm shadow-card-sm"
              >
                <option value="">— create new —</option>
                {events.map((ev) => (
                  <option key={ev.slug} value={ev.slug}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </label>
            <EventForm
              key={`${editEvent || "new-event"}-${eventFormKey}`}
              initial={
                selectedEvent
                  ? {
                      ...selectedEvent,
                      calendar: selectedEvent.links?.[0]?.url,
                    }
                  : undefined
              }
              onSaved={(event, mode) => {
                if (mode === "direct") {
                  setEvents((prev) => {
                    const i = prev.findIndex((e) => e.slug === event.slug);
                    if (i >= 0) {
                      const next = [...prev];
                      next[i] = { ...prev[i], ...event };
                      return next;
                    }
                    return [...prev, event];
                  });
                  setEditEvent(event.slug);
                }
                setEventFormKey((k) => k + 1);
                router.refresh();
              }}
              onDeleted={(slug, mode) => {
                if (mode === "direct") {
                  setEvents((prev) => prev.filter((e) => e.slug !== slug));
                  setEditEvent("");
                }
                setEventFormKey((k) => k + 1);
                router.refresh();
              }}
            />
          </>
        )}

        {tab === "team-photo" && (
          <div className="max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-card-sm">
            <h2 className="text-base font-bold text-ink">
              Full team photo · {team.years[0]?.year ?? "current year"}
            </h2>
            <ImageField label="Group photo" kind="team" value={teamPhoto} onChange={setTeamPhoto} />
            <button
              type="button"
              onClick={() => void saveTeamPhoto()}
              className="rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white"
            >
              {teamStatus === "saving"
                ? "Saving…"
                : teamStatus === "saved"
                  ? "Saved ✓"
                  : teamStatus === "error"
                    ? "Failed"
                    : "Save team photo"}
            </button>
          </div>
        )}

        {tab === "profile" && member && (
          <ProfileEditor
            member={member}
            onSaved={(updated) => {
              setMembers((prev) => prev.map((m) => (m.slug === updated.slug ? updated : m)));
              router.refresh();
            }}
          />
        )}
        {tab === "profile" && !member && (
          <p className="text-sm text-ink/60">No personal profile linked to this login.</p>
        )}

        {tab === "approvals" && showApprovals && <ApprovalsPanel />}
      </div>
    </div>
  );
}
