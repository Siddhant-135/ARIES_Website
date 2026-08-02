import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/types";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { Tag } from "@/components/ui/Tag";
import { contributorLabel, normalizeContributors } from "@/lib/contributors";

/** Project card: cover (image or event-style gradient), category, name, description, tags. */
export function ProjectCard({ project }: { project: Project }) {
  const contributors = normalizeContributors(project.contributors);
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-[#d9d1c0] bg-white transition-transform hover:-translate-y-1 hover:shadow-card"
    >
      <div
        className="relative h-48 shrink-0"
        style={
          project.image
            ? undefined
            : {
                backgroundImage:
                  "radial-gradient(260px 200px at 20% 85%, rgba(125,91,184,1), transparent 55%), linear-gradient(90deg, #080d24, #10172b)",
              }
        }
      >
        {project.image ? (
          <Image
            src={project.image}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-end p-4">
            <span className="rounded-md bg-[#fffaf4]/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#081634]">
              {project.category || "Project"}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-5 py-5">
        <div>
          <CategoryBadge>{project.category}</CategoryBadge>
        </div>
        <h3 className="text-base font-semibold text-[#11154a]">
          {project.name}
          {project.accent ? ` ${project.accent}` : ""}
        </h3>
        {contributors.length > 0 && (
          <p className="text-xs italic text-[#8a8daa]">
            with {contributors.map(contributorLabel).join(", ")}
          </p>
        )}
        <p className="line-clamp-2 text-sm leading-6 text-[#5b5e82]">
          {project.description}
        </p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
          {(project.tags ?? []).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      </div>
    </Link>
  );
}
