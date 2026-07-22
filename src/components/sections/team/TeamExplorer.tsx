"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { TeamData } from "@/lib/types";
import { PersonCard } from "@/components/cards/PersonCard";

/**
 * Team page body: year switcher (photo + rosters change per year),
 * core team, coordinators, executive groups.
 */
export function TeamExplorer({ team }: { team: TeamData }) {
  const [yearIdx, setYearIdx] = useState(0);
  const year = team.years[yearIdx];
  const prev = () => setYearIdx((i) => Math.min(team.years.length - 1, i + 1));
  const next = () => setYearIdx((i) => Math.max(0, i - 1));

  return (
    <div>
      {/* Full team photo + year switcher */}
      <section className="mx-auto max-w-4xl">
        <div className="relative grid aspect-[16/9] w-full place-items-center overflow-hidden rounded-3xl bg-[#e6e0d6] shadow-card">
          {year.photo ? (
            <Image src={year.photo} alt={`ARIES full team ${year.year}`} fill className="object-cover" />
          ) : (
            <p className="px-10 text-center text-2xl font-bold uppercase tracking-wide text-[#a49f93] md:text-4xl">
              Full team photo of {year.year}
            </p>
          )}
        </div>
        <div className="mt-5 flex items-center justify-center gap-4">
          <button
            onClick={prev}
            disabled={yearIdx === team.years.length - 1}
            aria-label="Earlier year"
            className="grid size-8 place-items-center rounded-full bg-white shadow-card-sm disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <p className="text-lg font-bold text-ink">{year.year}</p>
          <button
            onClick={next}
            disabled={yearIdx === 0}
            aria-label="Later year"
            className="grid size-8 place-items-center rounded-full bg-white shadow-card-sm disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </section>

      {/* Core team */}
      <RoleSection title="Core Team" people={year.coreTeam} />

      {/* Coordinators */}
      <RoleSection title="Coordinators" people={year.coordinators} />

      {/* Executives */}
      {year.executives.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-ink">Executives</h2>
          {year.executives.map((g) => (
            <div key={g.group} className="mt-8">
              <h3 className="text-sm font-bold uppercase tracking-[0.25em] text-ink/50">
                {g.group}
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
                {g.members.map((m) => (
                  <PersonCard key={m.name} person={m} />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function RoleSection({
  title,
  people,
}: {
  title: string;
  people: TeamData["years"][number]["coreTeam"];
}) {
  if (people.length === 0) return null;
  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold text-ink">{title}</h2>
      <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {people.map((p) => (
          <PersonCard key={p.name + p.role} person={p} />
        ))}
      </div>
    </section>
  );
}
