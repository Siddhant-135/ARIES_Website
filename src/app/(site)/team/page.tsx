import type { Metadata } from "next";
import { getMembers, getTeam } from "@/lib/content";
import { hydrateTeamData } from "@/lib/member-hydrate";
import { TeamExplorer } from "frontend/pages/team/TeamExplorer";
import { AlumniSection } from "frontend/pages/team/AlumniSection";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const [teamRaw, members] = await Promise.all([getTeam(), getMembers()]);
  const team = hydrateTeamData(teamRaw, members);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#efe9f7_0%,#e6ddf5_45%,#f8f1e7_46%,#fbf4ec_100%)]">
      <div className="mx-auto max-w-[1360px] px-6 pt-14 md:px-14">
        <TeamExplorer team={team} />
        <AlumniSection alumni={team.alumni} />
      </div>
    </div>
  );
}
