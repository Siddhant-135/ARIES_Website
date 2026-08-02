"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ClipboardList, LogOut, UserRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { canApprove } from "@/lib/roles";
import { cn } from "@/lib/utils";

/**
 * Nav account menu: Login when signed out; Profile / Approvals / Sign out when in.
 */
export function UserMenu({
  tone = "light",
  collapsed = false,
}: {
  tone?: "light" | "dark";
  collapsed?: boolean;
}) {
  const { session, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (loading) return null;

  if (!session) {
    return (
      <Link
        href="/admin"
        className={cn(
          "flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors",
          tone === "dark"
            ? "text-[#f5f3ff]/90 hover:bg-white/10"
            : "text-navy hover:text-purple",
          collapsed && "justify-center px-0",
        )}
      >
        <UserRound size={18} />
        {!collapsed && "Member Login"}
      </Link>
    );
  }

  const showApprovals = canApprove(session.level);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors",
          tone === "dark"
            ? "bg-white/10 text-white hover:bg-white/15"
            : "bg-lilac text-navy hover:bg-purple/15",
          collapsed && "justify-center px-0",
        )}
      >
        <UserRound size={18} />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 truncate text-left">{session.name}</span>
            <ChevronDown size={14} className={cn("transition", open && "rotate-180")} />
          </>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-2 min-w-[200px] overflow-hidden rounded-xl border border-ink/10 bg-white py-1 shadow-lg",
            collapsed ? "left-full top-0 ml-2" : "left-0 right-0",
          )}
        >
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-lilac"
          >
            <UserRound size={15} /> Profile
          </Link>
          {showApprovals && (
            <Link
              href="/profile?tab=approvals"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-lilac"
            >
              <ClipboardList size={15} /> Approvals
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void signOut().then(() => {
                window.location.href = "/";
              });
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
