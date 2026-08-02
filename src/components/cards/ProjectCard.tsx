import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/types";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { Tag } from "@/components/ui/Tag";

/** Project card: image, category badge, name, description, tags. */
export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-[#d9d1c0] bg-white transition-transform hover:-translate-y-1 hover:shadow-card"
    >
      <div className="relative h-48 shrink-0 bg-[linear-gradient(135deg,#ede6d8_0%,#e8e2d6_100%)]">
        {project.image && (
          <Image
            src={project.image}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
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
        {(project.contributors?.length ?? 0) > 0 && (
          <p className="text-xs italic text-[#8a8daa]">
            with{" "}
            {project.contributors!
              .map((c) =>
                c
                  .split("-")
                  .map((w) => w[0]?.toUpperCase() + w.slice(1))
                  .join(" "),
              )
              .join(", ")}
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
