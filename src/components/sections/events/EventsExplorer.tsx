"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, ChevronDown } from "lucide-react";
import type { AriesEvent } from "@/lib/types";
import { EventCard } from "@/components/cards/EventCard";
import { cn } from "@/lib/utils";

const TABS = ["All Events", "Workshops", "Talks", "Hackathons", "Flagship Events"] as const;

const tabMatches = (tab: (typeof TABS)[number], e: AriesEvent) => {
  switch (tab) {
    case "Workshops":
      return e.type === "Workshop";
    case "Talks":
      return e.type === "Talk";
    case "Hackathons":
      return e.type === "Hackathon";
    case "Flagship Events":
      return e.type === "Event";
    default:
      return true;
  }
};

/** Filterable upcoming/past event grids (client-side filter + sort). */
export function EventsExplorer({
  upcoming,
  past,
}: {
  upcoming: AriesEvent[];
  past: AriesEvent[];
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All Events");
  const [sortAsc, setSortAsc] = useState(true);

  const filteredUpcoming = useMemo(() => {
    const list = upcoming.filter((e) => tabMatches(tab, e));
    return sortAsc ? list : [...list].reverse();
  }, [upcoming, tab, sortAsc]);
  const filteredPast = useMemo(
    () => past.filter((e) => tabMatches(tab, e)),
    [past, tab],
  );

  return (
    <div>
      {/* Filter tabs + sort */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-b border-[#d9d1c6] pb-0">
        <div className="no-scrollbar flex items-center overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "relative shrink-0 border-r border-[#d9d1c6] px-7 pb-3 text-sm last:border-r-0",
                t === tab ? "font-bold text-[#081634]" : "text-[#081634]/80",
              )}
            >
              {t}
              {t === tab && (
                <span className="absolute inset-x-4 bottom-0 h-0.5 rounded bg-[#07122d]" />
              )}
            </button>
          ))}
        </div>
        <button
          onClick={() => setSortAsc((v) => !v)}
          className="mb-2 flex items-center gap-6 rounded-lg border border-[#eadfd3] bg-[#fff9f2] px-4 py-2.5 text-sm text-[#081634]"
        >
          Sort by: {sortAsc ? "Upcoming" : "Latest first"}
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Upcoming */}
      <section className="mt-10">
        <h2 className="text-base font-bold text-[#081634]">Upcoming Events</h2>
        {filteredUpcoming.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-[#d9d1c6] bg-white/50 p-10 text-center text-sm text-[#5b5e82]">
            No upcoming {tab === "All Events" ? "events" : tab.toLowerCase()} right
            now — check back soon or subscribe to the calendar below.
          </div>
        ) : (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {filteredUpcoming.map((e) => (
              <EventCard key={e.slug} event={e} />
            ))}
          </div>
        )}

        {/* Calendar strip */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-[#f4ecfb] px-6 py-4">
          <p className="text-sm text-[#081634]">
            <span className="font-bold">Don&rsquo;t miss out on any updates!</span>{" "}
            Subscribe to our calendar and stay in the loop.
          </p>
          <a
            href="#"
            className="flex items-center gap-2 rounded-full bg-navy-2 px-5 py-2.5 text-sm font-bold text-white shadow-cta"
          >
            <CalendarPlus size={16} /> Add to Calendar
          </a>
        </div>
      </section>

      {/* Past */}
      <section className="mt-14 pb-20">
        <h2 className="text-base font-bold text-[#081634]">Past Events</h2>
        {filteredPast.length === 0 ? (
          <p className="mt-5 text-sm text-[#5b5e82]">No past events in this category yet.</p>
        ) : (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {filteredPast.map((e) => (
              <EventCard key={e.slug} event={e} variant="past" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
