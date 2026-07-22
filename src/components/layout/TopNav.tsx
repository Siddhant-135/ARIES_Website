"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { topNavLinks } from "@/config/nav";
import { AriesLogo } from "./AriesLogo";

/**
 * Landing-page top navbar. Transparent, sits over the hero artwork.
 * Collapses to a hamburger drawer below lg.
 */
export function TopNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between px-6 py-5 lg:px-10">
        <AriesLogo tone="dark" />

        {/* Desktop links */}
        <nav className="hidden items-center gap-8 lg:flex">
          {topNavLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-navy transition-colors hover:text-purple"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="rounded-full bg-navy px-7 py-2.5 text-sm font-bold text-white shadow-cta transition-transform hover:scale-105"
          >
            Join Us →
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="rounded-lg p-2 text-navy lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <nav className="mx-4 rounded-2xl bg-white/95 p-4 shadow-card backdrop-blur lg:hidden">
          {topNavLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block rounded-lg px-4 py-3 text-base font-semibold text-navy hover:bg-lilac"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="mt-2 block rounded-full bg-navy px-6 py-3 text-center text-sm font-bold text-white"
            onClick={() => setOpen(false)}
          >
            Join Us →
          </Link>
        </nav>
      )}
    </header>
  );
}
