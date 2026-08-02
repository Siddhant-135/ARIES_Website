"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Search } from "lucide-react";
import type { Project } from "@/lib/types";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { useAuth } from "@/context/AuthContext";
import { canDirectCreate, canSubmitForApproval } from "@/lib/roles";

/** Search + grid; logged-in members can create/edit from this page. */
export function ProjectsExplorer({ projects: initialProjects }: { projects: Project[] }) {
  const router = useRouter();
  const { session } = useAuth();
  const canEdit =
    !!session && (canDirectCreate(session.level) || canSubmitForApproval(session.level));
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState(initialProjects);
  const [editing, setEditing] = useState<string | null>(null); // slug or "" for new
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

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

  const selected = editing ? projects.find((p) => p.slug === editing) : undefined;

  const openNew = () => {
    setEditing("");
    setFormKey((k) => k + 1);
  };

  const openEdit = (slug: string) => {
    setEditing(slug);
    setFormKey((k) => k + 1);
  };

  const upsertLocal = (project: Project) => {
    setProjects((prev) => {
      const i = prev.findIndex((p) => p.slug === project.slug);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...prev[i], ...project };
        return next;
      }
      return [...prev, project];
    });
  };

  return (
    <div className="pb-24">
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <label className="flex max-w-md flex-1 items-center gap-2 rounded-lg border border-[#d9d1c0] bg-white px-4 py-2.5">
          <Search size={16} className="text-[#8a8daa]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects by name, tag, or description"
            className="w-full bg-transparent text-sm text-[#11154a] placeholder-[#8a8daa] outline-none"
          />
        </label>
        {canEdit && (
          <button
            type="button"
            onClick={openNew}
            className="flex items-center gap-1.5 rounded-full bg-navy px-4 py-2.5 text-xs font-bold text-white"
          >
            <Plus size={14} /> New project
          </button>
        )}
        {!session && (
          <Link href="/admin" className="text-xs font-bold text-purple hover:underline">
            Sign in to create / edit
          </Link>
        )}
      </div>

      {editing !== null && canEdit && (
        <div className="mt-6 rounded-2xl border border-purple/20 bg-white/90 p-4 shadow-card-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-ink">
              {editing === "" ? "Create project" : `Edit · ${editing}`}
            </p>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="text-xs font-semibold text-ink/50 hover:text-ink"
            >
              Close
            </button>
          </div>
          <ProjectForm
            key={`${editing || "new"}-${formKey}`}
            initial={selected}
            onSaved={(project, mode) => {
              if (mode === "direct") upsertLocal(project);
              setEditing(null);
              setFormKey((k) => k + 1);
              router.refresh();
            }}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-[#d9d1c0] bg-white/60 p-12 text-center text-sm text-[#5b5e82]">
          No projects match &ldquo;{query}&rdquo; — try a different name or tag.
        </div>
      ) : (
        <div className="mt-8 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <div key={p.slug} className="relative">
              <ProjectCard project={p} />
              {canEdit && (
                <button
                  type="button"
                  onClick={() => openEdit(p.slug)}
                  className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-ink shadow"
                >
                  <Pencil size={11} /> Edit
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
