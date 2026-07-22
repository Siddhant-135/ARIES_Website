import type { Metadata } from "next";
import { getTeam } from "@/lib/content";
import { TeamExplorer } from "@/components/sections/team/TeamExplorer";
import { AlumniSection } from "@/components/sections/team/AlumniSection";

export const metadata: Metadata = { title: "Team" };

export default function TeamPage() {
  const team = getTeam();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#efe9f7_0%,#e6ddf5_45%,#f8f1e7_46%,#fbf4ec_100%)]">
      <div className="mx-auto max-w-[1360px] px-6 pt-14 md:px-14">
        <TeamExplorer team={team} />
        <AlumniSection alumni={team.alumni} />
      </div>
    </div>
  );
}
