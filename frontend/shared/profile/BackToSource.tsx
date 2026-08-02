"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * "Back to X" button on member profiles, driven by the `?from=` query param
 * (client-side so profile pages stay fully static):
 *   ?from=team           -> Back to Team
 *   ?from=project:<slug> -> Back to that project
 * Direct visits (no param) show nothing — profile acts as a personal site.
 *
 * `projectNames` maps project slug -> display name (passed from the server).
 */
export function BackToSource({ projectNames }: { projectNames: Record<string, string> }) {
  return (
    <Suspense fallback={null}>
      <BackToSourceInner projectNames={projectNames} />
    </Suspense>
  );
}

function BackToSourceInner({ projectNames }: { projectNames: Record<string, string> }) {
  const from = useSearchParams().get("from");

  let back: { href: string; label: string } | null = null;
  if (from === "team") back = { href: "/team", label: "Back to Team" };
  else if (from?.startsWith("project:")) {
    const slug = from.slice("project:".length);
    if (projectNames[slug])
      back = { href: `/projects/${slug}`, label: `Back to ${projectNames[slug]}` };
  }

  if (!back) return null;
  return (
    <Link
      href={back.href}
      className="flex items-center gap-2 rounded-full bg-white/90 px-5 py-2.5 text-sm font-bold text-ink shadow-card-sm backdrop-blur transition-transform hover:scale-105"
    >
      <ArrowLeft size={15} /> {back.label}
    </Link>
  );
}
