"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarPlus,
  ClipboardList,
  ExternalLink,
  FolderPlus,
  LogOut,
  UserRound,
} from "lucide-react";
import type { AriesEvent, Member, Project, TeamData } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { canDirectCreate, canApprove, isLeadership } from "@/lib/roles";
import { ApprovalsPanel } from "./ApprovalsPanel";
import { ProfileEditor } from "./ProfileEditor";
import { ProjectForm } from "./ProjectForm";
import { EventForm } from "./EventForm";
import { initialsOf } from "@/components/cards/PersonCard";
import { cn } from "@/lib/utils";

type DashTab = "profile" | "approvals" | "projects" | "events";

/**
 * Logged-in member home — same purple gradient as public profiles.
 * Leadership sees Approvals (change log + approve/reject → auto-applies).
 * Create project/event: coordinators+leadership; executives submit for approval.
 */
export function MemberDashboard({
  members,
  projects,
  events,
  team: _team,
}: {
  members: Member[];
  projects: Project[];
  events: AriesEvent[];
  team: TeamData;
}) {
  const { session, signOut } = useAuth();
  const level = session?.level ?? "";
  const showApprovals = canApprove(level);
  const showCreate = canDirectCreate(level) || level === "executive";

  const member = useMemo(
    () => members.find((m) => m.slug === session?.memberSlug) ?? null,
    [members, session?.memberSlug],
  );

  const [tab, setTab] = useState<DashTab>(showApprovals ? "approvals" : "profile");
  const [editProject, setEditProject] = useState("");
  const [editEvent, setEditEvent] = useState("");

  const tabs: { id: DashTab; label: string; icon: typeof UserRound; show: boolean }[] = [
    { id: "profile", label: "My profile", icon: UserRound, show: true },
    { id: "approvals", label: "Approvals", icon: ClipboardList, show: showApprovals },
    { id: "projects", label: "Projects", icon: FolderPlus, show: showCreate },
    { id: "events", label: "Events", icon: CalendarPlus, show: showCreate },
  ];

  const selectedProject = projects.find((p) => p.slug === editProject);
  const selectedEvent = events.find((e) => e.slug === editEvent);

  return (
    <div className="min-h-screen bg-[linear-gradient(175deg,#c4b2ee_0%,#b5a0ea_35%,#cabcee_70%,#b9a6ea_100%)]">
      <header className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-4 px-6 pt-8 md:px-10">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Image src="/images/brand/logo-white.svg" alt="ARIES" width={36} height={42} className="h-10 w-auto" />
          </Link>
          <div>
            <p className="text-sm font-black tracking-wide text-[#140b3c]">Member space</p>
            <p className="text-xs text-[#31217a]/60">
              {session?.name ?? "Member"}
              {level ? ` · ${level.replaceAll("_", " ")}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {member && (
            <Link
              href={`/${member.slug}`}
              target="_blank"
              className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-xs font-bold text-[#140b3c] backdrop-blur"
            >
              Public profile <ExternalLink size={12} />
            </Link>
          )}
          {isLeadership(level) && (
            <Link
              href="/admin/editor"
              className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-bold text-[#140b3c] backdrop-blur"
            >
              Full editor
            </Link>
          )}
          <button
            type="button"
            onClick={() => void signOut().then(() => (window.location.href = "/admin"))}
            className="flex items-center gap-1.5 rounded-full bg-[#140b3c] px-3 py-1.5 text-xs font-bold text-white"
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1100px] px-6 py-8 md:px-10">
        {member && (
          <div className="mb-8 flex items-center gap-4 rounded-3xl bg-white/55 p-5 shadow-[0_18px_40px_rgba(35,24,100,0.12)] backdrop-blur">
            <div className="relative size-16 overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_30%_20%,#7a50ff,#4711d9)]">
              {member.avatar ? (
                <Image src={member.avatar} alt="" fill className="object-cover" sizes="64px" />
              ) : (
                <span className="grid size-full place-items-center text-lg font-black text-white">
                  {initialsOf(member.name)}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#140b3c]">{member.name}</h1>
              <p className="text-sm text-[#31217a]/70">{member.role}</p>
              {member.tagline && <p className="mt-1 text-xs text-[#31217a]/55">{member.tagline}</p>}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {tabs
            .filter((t) => t.show)
            .map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors",
                  tab === t.id
                    ? "bg-[#140b3c] text-white shadow-cta"
                    : "bg-white/70 text-[#140b3c] backdrop-blur hover:bg-white",
                )}
              >
                <t.icon size={15} /> {t.label}
              </button>
            ))}
        </div>

        <div className="mt-8">
          {tab === "profile" && member && (
            <div className="rounded-3xl bg-white/80 p-2 shadow-[0_18px_40px_rgba(35,24,100,0.12)] backdrop-blur md:p-4">
              <ProfileEditor member={member} />
            </div>
          )}
          {tab === "profile" && !member && (
            <p className="rounded-2xl bg-white/70 px-5 py-4 text-sm text-[#31217a]">
              No personal profile is linked to this login yet. Leadership can link your account after
              credentials are imported.
            </p>
          )}

          {tab === "approvals" && showApprovals && (
            <div className="rounded-3xl bg-white/80 p-4 shadow-[0_18px_40px_rgba(35,24,100,0.12)] backdrop-blur md:p-6">
              <p className="mb-4 text-sm text-[#31217a]/75">
                Review pending project/event/team edits. Approving applies the change immediately.
              </p>
              <ApprovalsPanel />
            </div>
          )}

          {tab === "projects" && showCreate && (
            <div className="space-y-4 rounded-3xl bg-white/80 p-4 shadow-[0_18px_40px_rgba(35,24,100,0.12)] backdrop-blur md:p-6">
              <p className="text-xs text-[#31217a]/65">
                {level === "executive"
                  ? "Creates and edits are submitted for OC / Co-Overall Coordinator / Research Lead approval."
                  : "You can publish projects directly."}
              </p>
              <label className="block max-w-md text-xs font-semibold text-[#140b3c]">
                Edit existing project
                <select
                  value={editProject}
                  onChange={(e) => setEditProject(e.target.value)}
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
              <ProjectForm key={editProject || "new-project"} initial={selectedProject} />
            </div>
          )}

          {tab === "events" && showCreate && (
            <div className="space-y-4 rounded-3xl bg-white/80 p-4 shadow-[0_18px_40px_rgba(35,24,100,0.12)] backdrop-blur md:p-6">
              <p className="text-xs text-[#31217a]/65">
                {level === "executive"
                  ? "Creates and edits need leadership approval."
                  : "You can publish events directly."}
              </p>
              <label className="block max-w-md text-xs font-semibold text-[#140b3c]">
                Edit existing event
                <select
                  value={editEvent}
                  onChange={(e) => setEditEvent(e.target.value)}
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
                key={editEvent || "new-event"}
                initial={
                  selectedEvent
                    ? { ...selectedEvent, calendar: selectedEvent.links?.[0]?.url }
                    : undefined
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
