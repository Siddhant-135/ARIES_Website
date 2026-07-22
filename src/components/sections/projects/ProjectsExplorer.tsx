"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Project } from "@/lib/types";
import { ProjectCard } from "@/components/cards/ProjectCard";

/** Search + grid of all projects (client-side filtering). */
export function ProjectsExplorer({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) =>
      [p.name, p.accent, p.description, p.category, ...p.tags]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [projects, query]);

  return (
    <div className="pb-24">
      <label className="mt-2 flex max-w-md items-center gap-2 rounded-lg border border-[#d9d1c0] bg-white px-4 py-2.5">
        <Search size={16} className="text-[#8a8daa]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects by name, tag, or description"
          className="w-full bg-transparent text-sm text-[#11154a] placeholder-[#8a8daa] outline-none"
        />
      </label>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-[#d9d1c0] bg-white/60 p-12 text-center text-sm text-[#5b5e82]">
          No projects match &ldquo;{query}&rdquo; — try a different name or tag.
        </div>
      ) : (
        <div className="mt-8 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
