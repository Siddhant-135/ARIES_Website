"use client";

import Link from "next/link";
import { useState } from "react";
import { UserRound, FolderPlus, CalendarPlus, ExternalLink } from "lucide-react";
import type { Member } from "@/lib/types";
import { ProfileEditor } from "./ProfileEditor";
import { ProjectForm } from "./ProjectForm";
import { EventForm } from "./EventForm";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "profile", label: "My Profile", icon: UserRound },
  { id: "project", label: "New Project", icon: FolderPlus },
  { id: "event", label: "New Event", icon: CalendarPlus },
] as const;

/** Admin editor shell: tab switcher between profile / project / event. */
export function AdminTabs({ member }: { member: Member }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("profile");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors",
                tab === t.id
                  ? "bg-purple text-white shadow-cta"
                  : "bg-white text-ink hover:bg-lilac",
              )}
            >
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>
        <Link
          href={`/${member.slug}`}
          target="_blank"
          className="flex items-center gap-2 text-sm font-semibold text-purple hover:underline"
        >
          View my public profile <ExternalLink size={14} />
        </Link>
      </div>

      <div className="mt-8">
        {tab === "profile" && <ProfileEditor member={member} />}
        {tab === "project" && <ProjectForm />}
        {tab === "event" && <EventForm />}
      </div>
    </div>
  );
}
