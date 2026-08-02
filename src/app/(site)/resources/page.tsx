import type { Metadata } from "next";
import { getResources } from "@/lib/content";
import { ResourcesExplorer } from "@/components/sections/resources/ResourcesExplorer";

export const metadata: Metadata = { title: "Resources" };

export default async function ResourcesPage() {
  const resources = await getResources();
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fbf4ec]">
      <div className="glow-circle absolute -left-24 top-4 size-72" />
      <div className="glow-circle absolute -right-28 top-60 size-96" />
      <div className="relative mx-auto max-w-[1240px] px-6 pt-14 md:px-12">
        <ResourcesExplorer resources={resources} />
      </div>
    </div>
  );
}
