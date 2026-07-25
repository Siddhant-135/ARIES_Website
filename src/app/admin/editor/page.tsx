import type { Metadata } from "next";
import { getEvents, getMembers, getProjects, getTeam } from "@/lib/content";
import { AdminTabs } from "@/components/admin/AdminTabs";

export const metadata: Metadata = { title: "Editor" };

export default function AdminEditorPage() {
  const members = getMembers();
  const projects = getProjects();
  const events = getEvents();
  const team = getTeam();

  return (
    <div className="min-h-screen bg-[#f4eff9]">
      <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10">
        <h1 className="text-2xl font-black text-ink">Content editor</h1>
        <p className="mt-2 text-sm text-ink/60">
          Add or edit members, projects, events, and team photos. Images upload into{" "}
          <code className="text-xs">public/images/</code>.
        </p>
        <div className="mt-8">
          <AdminTabs members={members} projects={projects} events={events} team={team} />
        </div>
      </div>
    </div>
  );
}
