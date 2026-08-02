import Image from "next/image";
import Link from "next/link";
import type { TeamMemberRef } from "@/lib/types";
import { memberProfileSlug } from "@/lib/utils";

/** Initials avatar used wherever no photo exists. */
export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Team member card. Links to /{slug} using an explicit slug or one derived from name.
 * Passes `?from=` so the profile can show a "Back to X" button.
 */
export function PersonCard({
  person,
  from = "team",
  showRole = true,
}: {
  person: TeamMemberRef;
  from?: string;
  /** Hide the role pill (coordinators, executives). Core team keeps tags. */
  showRole?: boolean;
}) {
  const slug = memberProfileSlug(person);

  const inner = (
    <article className="group overflow-hidden rounded-2xl bg-white shadow-card-sm transition-transform hover:-translate-y-1">
      <div className="relative grid h-44 place-items-center bg-[linear-gradient(135deg,#ded7f6_0%,#c9bdf0_100%)]">
        {person.photo ? (
          <Image src={person.photo} alt={person.name} fill sizes="220px" className="object-cover" />
        ) : (
          <span className="grid size-16 place-items-center rounded-full bg-navy-2 text-xl font-bold text-white">
            {initialsOf(person.name)}
          </span>
        )}
      </div>
      <div className="px-4 py-4 text-center">
        <h3 className="truncate text-sm font-bold text-ink">{person.name}</h3>
        {showRole && (
          <span className="mt-2 inline-block rounded-full bg-lilac px-3 py-1 text-[11px] font-bold text-purple">
            {person.role}
          </span>
        )}
      </div>
    </article>
  );

  return slug ? (
    <Link href={`/${slug}?from=${from}`}>{inner}</Link>
  ) : (
    inner
  );
}
