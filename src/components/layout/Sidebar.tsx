"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { sidebarLinks } from "@/config/nav";
import { UserMenu } from "@/components/layout/UserMenu";
import { cn } from "@/lib/utils";

/**
 * Collapsible left sidebar shared by all inner pages.
 * - Desktop: fixed rail, collapse to icons with the chevron button.
 * - Mobile (<lg): hidden; a floating hamburger opens it as an overlay drawer.
 * Nav items come from src/config/nav.ts.
 */

const SidebarCtx = createContext<{ collapsed: boolean }>({ collapsed: false });
export const useSidebar = () => useContext(SidebarCtx);

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Persist collapse preference.
  useEffect(() => {
    setCollapsed(localStorage.getItem("aries.sidebar") === "collapsed");
  }, []);
  const toggleCollapsed = () => {
    setCollapsed((v) => {
      localStorage.setItem("aries.sidebar", v ? "open" : "collapsed");
      return !v;
    });
  };

  // Close the mobile drawer on navigation.
  useEffect(() => setMobileOpen(false), [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const rail = (
    <div
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-br-3xl bg-gradient-to-b from-[#02083d] via-[#050944] via-60% to-[#111a64] transition-[width] duration-300",
        collapsed ? "w-[76px]" : "w-[210px]",
      )}
    >
      {/* Night-sky / mountain artwork */}
      <Image
        src="/images/sidebar/night-sky.jpg"
        alt=""
        fill
        sizes="210px"
        className="pointer-events-none object-cover opacity-70"
        priority
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#02083d]/60 via-transparent to-[#0a0f3d]/30" />

      <div className="relative z-10 flex h-full flex-col px-4 pb-6 pt-8">
        {/* Logo */}
        <Link href="/" aria-label="ARIES home" className="flex flex-col items-center gap-2">
          <Image
            src="/images/brand/logo-white.svg"
            alt=""
            width={56}
            height={66}
            className={cn("h-14 w-auto transition-all", collapsed && "h-10")}
          />
          {!collapsed && (
            <span className="text-center leading-none text-white">
              <span className="block text-[19px] font-bold tracking-[0.35em]">ARIES</span>
              <span className="mt-1.5 block text-[11px] font-bold tracking-[0.3em]">IIT DELHI</span>
            </span>
          )}
        </Link>

        {/* Nav */}
        <nav className="mt-10 flex flex-col gap-1.5">
          {sidebarLinks.map((l) => {
            const active = isActive(l.href);
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                title={l.label}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-[#e8f0f1] text-[#040851] shadow-[0px_13px_13px_rgba(40,24,160,0.36)]"
                    : "text-[#f5f3ff]/90 hover:bg-white/10",
                )}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && l.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4">
          <UserMenu tone="dark" collapsed={collapsed} />
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="mt-auto hidden items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white lg:flex"
        >
          {collapsed ? <ChevronRight size={18} /> : (
            <>
              <ChevronLeft size={18} /> Collapse
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <SidebarCtx.Provider value={{ collapsed }}>
      {/* Desktop rail */}
      <aside className="sticky top-0 z-30 hidden h-screen shrink-0 py-0 lg:block">
        {rail}
      </aside>

      {/* Mobile: floating hamburger + overlay drawer */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
        className="fixed left-4 top-4 z-40 rounded-full bg-navy-2 p-3 text-white shadow-cta lg:hidden"
      >
        <Menu size={20} />
      </button>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[240px]">
            {rail}
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-3 z-20 rounded-full bg-white/10 p-2 text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </SidebarCtx.Provider>
  );
}
