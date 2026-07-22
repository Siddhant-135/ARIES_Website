import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, GraduationCap, MapPin } from "lucide-react";
import { getMember, getMembers, getProjects } from "@/lib/content";
import { BlockGrid } from "@/components/profile/BlockGrid";
import { BackToSource } from "@/components/profile/BackToSource";
import { initialsOf } from "@/components/cards/PersonCard";

/**
 * Member profile at the ROOT url: aries.xyz/<member-slug>.
 * Static routes (events, projects, team, ...) always take precedence,
 * so member slugs can never shadow real pages.
 *
 * The "Back to X" button is handled client-side by <BackToSource /> so the
 * page itself stays fully static (SSG).
 */

export function generateStaticParams() {
  return getMembers().map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const m = getMember(slug);
  return { title: m ? m.name : "Profile" };
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const member = getMember(slug);
  if (!member) notFound();

  const projectNames = Object.fromEntries(
    getProjects().map((p) => [p.slug, p.name]),
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(175deg,#c4b2ee_0%,#b5a0ea_35%,#cabcee_70%,#b9a6ea_100%)]">
      {/* Chrome: logo home + optional back button */}
      <header className="mx-auto flex max-w-[1200px] items-center justify-between px-6 pt-6 md:px-10">
        <Link href="/" aria-label="ARIES home" className="flex items-center gap-3">
          <Image
            src="/images/brand/logo-white.svg"
            alt=""
            width={40}
            height={47}
            className="h-10 w-auto"
          />
          <span className="leading-none text-white">
            <span className="block text-[15px] font-bold tracking-[0.4em]">ARIES</span>
            <span className="mt-1 block text-[10px] font-bold tracking-[0.28em]">IIT DELHI</span>
          </span>
        </Link>
        <BackToSource projectNames={projectNames} />
      </header>

      <div className="mx-auto max-w-[1200px] px-6 pb-20 md:px-10">
        {/* Hero */}
        <section className="grid items-center gap-10 pt-12 md:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="text-sm font-semibold text-[#31217a]">Hello, I&rsquo;m</p>
            <h1 className="mt-2 text-4xl font-black text-[#140b3c] md:text-5xl">
              {member.name}
            </h1>
            <p className="mt-3 text-lg font-bold text-purple-2">{member.role}</p>
            <p className="mt-4 max-w-md text-[15px] leading-7 text-[#2c2359]">
              {member.tagline}
            </p>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#2c2359]">
              {member.year && (
                <span className="flex items-center gap-2">
                  <GraduationCap size={16} /> {member.year}
                </span>
              )}
              {member.location && (
                <span className="flex items-center gap-2">
                  <MapPin size={16} /> {member.location}
                </span>
              )}
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {member.resumeUrl && (
                <a
                  href={member.resumeUrl}
                  className="flex items-center gap-2 rounded-full bg-navy-2 px-6 py-2.5 text-sm font-bold text-white shadow-cta transition-transform hover:scale-105"
                >
                  Resume <Download size={15} />
                </a>
              )}
              {member.socials.map((s) => (
                <a
                  key={s.label}
                  href={s.url}
                  title={s.label}
                  className="grid size-10 place-items-center rounded-full bg-white/80 text-xs font-black text-ink shadow-card-sm transition-transform hover:scale-110"
                >
                  {s.label.slice(0, 2).toLowerCase()}
                </a>
              ))}
            </div>
          </div>

          {/* Avatar */}
          <div className="relative mx-auto">
            <div className="grid size-48 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#7a50ff,#4711d9)] shadow-[0px_30px_60px_rgba(40,20,120,0.35)] md:size-56">
              {member.avatar ? (
                <Image
                  src={member.avatar}
                  alt={member.name}
                  fill
                  sizes="224px"
                  className="rounded-full object-cover"
                />
              ) : (
                <span className="text-6xl font-black text-white">
                  {initialsOf(member.name)}
                </span>
              )}
            </div>
            <span className="absolute -right-2 top-4 size-10 rounded-full border-2 border-white/50" />
          </div>
        </section>

        {/* Ordered content blocks */}
        <div className="mt-12">
          <BlockGrid blocks={member.blocks} />
        </div>
      </div>
    </div>
  );
}
