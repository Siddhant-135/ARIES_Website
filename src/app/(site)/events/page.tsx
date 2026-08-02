import type { Metadata } from "next";
import { splitEvents } from "@/lib/content";
import { PageHero } from "@/components/ui/PageHero";
import { EventsExplorer } from "@/components/sections/events/EventsExplorer";

export const metadata: Metadata = { title: "Events" };

export default async function EventsPage() {
  const { upcoming, past } = await splitEvents();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(178deg,#fffaf3_1%,#fbf5ec_64%,#8378ff_140%)]">
      <div className="glow-circle absolute -right-24 top-16 size-[380px]" />
      <div className="mx-auto max-w-[1360px] px-6 md:px-16">
        <PageHero
          eyebrow="Events"
          title="Ideas spark."
          accent="Impact"
          titleSuffix="follows."
          subtitle="Explore conversations, collaborations and creations that move the ARIES community forward."
        />
        <EventsExplorer upcoming={upcoming} past={past} />
      </div>
    </div>
  );
}
