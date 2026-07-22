"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

/**
 * Stub login. No real auth yet — any input passes straight through to the
 * editor. Swap the submit handler for the real auth flow when it's decided.
 */
export default function AdminLoginPage() {
  const router = useRouter();

  return (
    <div className="grid min-h-screen place-items-center bg-[linear-gradient(160deg,#171743,#0b1035)] px-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          router.push("/admin/editor");
        }}
        className="w-full max-w-sm rounded-3xl bg-white/95 p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center">
          <Image
            src="/images/brand/logo-white.svg"
            alt=""
            width={48}
            height={56}
            className="h-14 w-auto"
            style={{ filter: "brightness(0) saturate(100%) invert(10%) sepia(70%) saturate(4000%) hue-rotate(235deg)" }}
          />
          <h1 className="mt-4 text-xl font-black text-ink">Member Login</h1>
          <p className="mt-1 text-center text-xs text-ink/60">
            Auth isn&rsquo;t wired up yet — any credentials open the editor.
          </p>
        </div>
        <label className="mt-6 block">
          <span className="text-xs font-semibold text-ink">Kerberos ID / Email</span>
          <input
            className="mt-2 w-full rounded-lg bg-[#f3eef8] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple/40"
            placeholder="you@iitd.ac.in"
          />
        </label>
        <label className="mt-4 block">
          <span className="text-xs font-semibold text-ink">Password</span>
          <input
            type="password"
            className="mt-2 w-full rounded-lg bg-[#f3eef8] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple/40"
            placeholder="••••••••"
          />
        </label>
        <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-purple px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.02]">
          <LogIn size={15} /> Sign in
        </button>
      </form>
    </div>
  );
}
