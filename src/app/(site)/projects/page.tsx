import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getMembers, getProjects } from "@/lib/content";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ProjectsExplorer } from "@/components/sections/projects/ProjectsExplorer";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const [projects, members] = await Promise.all([getProjects(), getMembers()]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fbf7f0_35%,#b5a0ea_130%)]">
      {/* Hero band with deer artwork + mission card */}
      <section className="relative overflow-hidden">
        <Image
          src="/images/projects/hero-deer.jpg"
          alt=""
          width={1600}
          height={800}
          priority
          className="pointer-events-none absolute -top-4 right-0 hidden h-[420px] w-auto max-w-[65%] object-contain object-right lg:block"
        />
        <div className="relative mx-auto max-w-[1360px] px-6 pb-6 pt-12 md:px-14">
          <Eyebrow>Projects</Eyebrow>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-[#080b46] md:text-5xl">
                Explore. Learn.
                <br />
                Build the Future.
              </h1>
              <p className="mt-8 max-w-xl text-sm leading-6 text-[#626276] md:text-[15px]">
                From hands-on workshops to thought-provoking talks and intense
                hackathons — there&rsquo;s something for every AI enthusiast.
              </p>
            </div>
            <aside className="relative ml-auto w-full max-w-[240px] self-start rounded-2xl bg-[rgba(255,251,246,0.96)] p-6 shadow-[0px_23px_40px_rgba(35,24,100,0.22)]">
              <p className="text-lg text-[#080b46]">▣</p>
              <h2 className="mt-3 text-lg font-bold text-[#080b46]">Our Mission</h2>
              <p className="mt-3 text-sm leading-6 text-[#36364d]">
                To foster a community passionate about AI/ML and empower
                students to build impactful solutions.
              </p>
              <Link href="/#what-we-do" className="mt-5 block text-sm font-bold text-[#080b46]">
                Learn more about us →
              </Link>
            </aside>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1360px] px-6 md:px-14">
        <Eyebrow className="mb-2 mt-4">Projects</Eyebrow>
        <ProjectsExplorer projects={projects} members={members} />
      </div>
    </div>
  );
}
