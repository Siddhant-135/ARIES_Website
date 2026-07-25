"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/**
 * Member login — navy/cream shell matching the older portal UI.
 * Permissions are enforced in the session layer; we don't list them here.
 * Temporary credentials: admin / testpwd
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const { signIn, session, loading } = useAuth();
  const [entryNumber, setEntryNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) router.replace("/admin/editor");
  }, [loading, session, router]);

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0b1035] px-6">
      <div className="pointer-events-none absolute -left-24 top-16 size-72 rounded-full bg-purple/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 size-80 rounded-full bg-sky/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3 text-white/90">
          <Image
            src="/images/brand/logo-white.svg"
            alt="ARIES"
            width={40}
            height={48}
            className="h-12 w-auto"
          />
          <span className="text-sm font-bold tracking-[0.2em]">ARIES · IIT DELHI</span>
        </Link>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setSubmitting(true);
            try {
              await signIn(entryNumber.trim(), password);
              router.push("/admin/editor");
            } catch (err) {
              setError(err instanceof Error ? err.message : "You're not a member");
            } finally {
              setSubmitting(false);
            }
          }}
          className="rounded-3xl bg-[#fbf4ec] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
        >
          <h1 className="text-center text-2xl font-black text-ink">Member Login</h1>
          <p className="mt-2 text-center text-xs leading-5 text-ink/55">
            Sign in with your club credentials to manage site content.
          </p>

          <label className="mt-8 block">
            <span className="text-xs font-semibold text-ink">Entry number / username</span>
            <input
              value={entryNumber}
              onChange={(e) => setEntryNumber(e.target.value)}
              className="mt-2 w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple/35"
              placeholder="admin"
              autoComplete="username"
              required
            />
          </label>

          <label className="mt-4 block">
            <span className="text-xs font-semibold text-ink">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple/35"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-700">
              {error}
            </p>
          )}

          <button
            disabled={submitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-6 py-3.5 text-sm font-bold text-white transition hover:bg-purple disabled:opacity-60"
          >
            <LogIn size={16} />
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
