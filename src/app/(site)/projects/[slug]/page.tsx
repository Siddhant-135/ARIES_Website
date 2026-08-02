import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Clock,
  Brain,
  ShieldCheck,
  BarChart3,
  Mic,
  MessagesSquare,
  Languages,
  Plug,
  LayoutDashboard,
  ExternalLink,
} from "lucide-react";
import { getProject, getProjects, getMembers } from "@/lib/content";
import { normalizeContributors } from "@/lib/contributors";
import { CategoryBadge } from "frontend/shared/ui/CategoryBadge";
import { Tag } from "frontend/shared/ui/Tag";
import { ContributorList } from "frontend/shared/projects/ContributorList";

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProject(slug);
  return { title: p ? `${p.name}${p.accent ? ` ${p.accent}` : ""}` : "Project" };
}

const highlightIcons = [Clock, Brain, ShieldCheck, BarChart3];
const featureIcons = [Mic, MessagesSquare, Languages, Plug, LayoutDashboard];

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const members = await getMembers();
  const contributors = normalizeContributors(project.contributors, members);
  const links = project.links ?? [];
  const highlights = project.highlights ?? [];
  const features = project.features ?? [];
  const screenshots = project.screenshots ?? [];
  const techStack = project.techStack ?? [];

  return (
    <div className="min-h-screen bg-[#fdf6ee]">
      <div className="mx-auto max-w-[1240px] px-6 pb-20 pt-14 md:px-12">
        {/* Hero */}
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div>
            {project.featured && (
              <span className="inline-block rounded-full bg-lilac px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-purple">
                Featured Project
              </span>
            )}
            <h1 className="mt-5 text-4xl font-black leading-tight text-ink md:text-6xl">
              {project.name}{" "}
              {project.accent && <span className="text-purple">{project.accent}</span>}
            </h1>
            <p className="mt-5 text-lg font-bold text-ink">{project.tagline}</p>
            <p className="mt-4 max-w-lg text-[15px] leading-7 text-ink/80">
              {project.description}
            </p>
            {links.length > 0 && (
              <div className="mt-7 flex flex-wrap gap-3">
                {links.map((l, i) => (
                  <a
                    key={l.label}
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className={
                      i === 0
                        ? "rounded-xl bg-purple px-6 py-3 text-sm font-bold text-white shadow-cta transition-transform hover:scale-105"
                        : "rounded-xl border border-[#d9d1c0] bg-white px-6 py-3 text-sm font-bold text-ink"
                    }
                  >
                    {l.label} {i === 0 ? "→" : ""}
                  </a>
                ))}
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-2">
              {project.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-[#e9e4fb] px-3 py-1.5 text-xs font-semibold text-[#3947b8]"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative aspect-[3/2] overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_50%_45%,#2c2069_0%,#161042_55%,#0d0a30_100%)] shadow-[0px_30px_60px_rgba(21,14,65,0.35)]">
              {project.image ? (
                <Image src={project.image} alt="" fill className="object-cover" sizes="560px" />
              ) : (
                <div className="grid h-full place-items-center">
                  <span className="grid size-24 place-items-center rounded-full bg-white/10">
                    <Mic size={44} className="text-white" />
                  </span>
                </div>
              )}
            </div>
            {project.video && (
              <video
                src={project.video}
                controls
                playsInline
                className="aspect-video w-full overflow-hidden rounded-3xl bg-black shadow-[0px_30px_60px_rgba(21,14,65,0.25)]"
              />
            )}
          </div>
        </div>

        {highlights.length > 0 && (
          <div className="mt-14 grid gap-6 rounded-2xl border border-[#eee4d6] bg-white/80 p-8 shadow-card-sm sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((h, i) => {
              const Icon = highlightIcons[i % highlightIcons.length];
              return (
                <div key={h.title} className="text-center">
                  <Icon size={28} className="mx-auto text-purple" />
                  <h3 className="mt-3 text-sm font-bold text-ink">{h.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-ink/70">{h.description}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-16 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            {(project.about || project.description) && (
              <>
                <SectionTitle>About the Project</SectionTitle>
                <p className="mt-6 text-[15px] font-medium leading-8 text-ink">
                  {project.about || project.description}
                </p>
              </>
            )}

            {techStack.length > 0 && (
              <>
                <SectionTitle className="mt-10">Tech Stack</SectionTitle>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  {techStack.map((t) => (
                    <Tag key={t} className="bg-white px-4 py-2 text-[13px] shadow-card-sm">
                      {t}
                    </Tag>
                  ))}
                </div>
              </>
            )}

            {contributors.length > 0 && (
              <>
                <SectionTitle className="mt-10">Team</SectionTitle>
                <ContributorList contributors={contributors} projectSlug={project.slug} members={members} />
              </>
            )}
          </div>

          {features.length > 0 && (
            <aside className="self-start rounded-2xl bg-[#f3ecfa] p-8">
              <h2 className="text-lg font-bold text-ink">Key Features</h2>
              <ul className="mt-6 space-y-6">
                {features.map((f, i) => {
                  const Icon = featureIcons[i % featureIcons.length];
                  return (
                    <li key={f.title} className="flex gap-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-purple text-white">
                        <Icon size={18} />
                      </span>
                      <span>
                        <span className="block text-sm font-bold text-ink">{f.title}</span>
                        <span className="mt-1 block text-xs leading-5 text-ink/70">
                          {f.description}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </aside>
          )}
        </div>

        {screenshots.length > 0 && (
          <div className="mt-16">
            <SectionTitle>Screenshots</SectionTitle>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {screenshots.map((s, i) => (
                <figure
                  key={s.title}
                  className="overflow-hidden rounded-xl border border-[#eee4d6] bg-white shadow-card-sm"
                >
                  <div
                    className={
                      i === 0
                        ? "grid h-32 place-items-center bg-[#161042]"
                        : "grid h-32 place-items-center bg-[#efe9fb]"
                    }
                  >
                    <ExternalLink
                      size={22}
                      className={i === 0 ? "text-white/70" : "text-purple/60"}
                    />
                  </div>
                  <figcaption className="px-4 py-4">
                    <p className="text-sm font-bold text-ink">{s.title}</p>
                    <p className="mt-1 text-xs leading-5 text-ink/70">{s.description}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        )}

        {/* Category footer chip */}
        <div className="mt-14">
          <CategoryBadge>{project.category}</CategoryBadge>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={`text-xl font-bold text-ink ${className ?? ""}`}>
      {children}
      <span className="mt-2 block h-1 w-8 rounded bg-purple" />
    </h2>
  );
}
