"use client";

import { useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import type { ProjectContributor } from "@/lib/types";
import { contributorLabel } from "@/lib/contributors";

type PersonOption = { slug: string; name: string };

/** Searchable people picker — pick members, or mark unmatched as alumni / non-ARIES. */
export function ContributorPicker({
  label,
  value,
  onChange,
  members,
  placeholder = "Search by name or slug…",
}: {
  label: string;
  value: ProjectContributor[];
  onChange: (next: ProjectContributor[]) => void;
  members: PersonOption[];
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedSlugs = useMemo(
    () => new Set(value.filter((c) => c.slug).map((c) => c.slug!)),
    [value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members
      .filter((m) => !selectedSlugs.has(m.slug))
      .filter(
        (m) =>
          !q ||
          m.name.toLowerCase().includes(q) ||
          m.slug.toLowerCase().includes(q),
      )
      .slice(0, 10);
  }, [members, selectedSlugs, query]);

  const exactMember = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return (
      members.find(
        (m) =>
          !selectedSlugs.has(m.slug) &&
          (m.slug.toLowerCase() === q || m.name.toLowerCase() === q),
      ) ?? null
    );
  }, [members, selectedSlugs, query]);

  const addMember = (m: PersonOption) => {
    if (selectedSlugs.has(m.slug)) return;
    onChange([...value, { slug: m.slug, name: m.name, kind: "member" }]);
    setQuery("");
    setOpen(false);
    setPending(null);
    inputRef.current?.focus();
  };

  const addNonMember = (kind: "alumni" | "external", name: string) => {
    const n = name.trim();
    if (!n) return;
    onChange([...value, { name: n, kind }]);
    setQuery("");
    setPending(null);
    setOpen(false);
    inputRef.current?.focus();
  };

  const tryCommitQuery = () => {
    const q = query.trim();
    if (!q) return;
    if (exactMember) {
      addMember(exactMember);
      return;
    }
    if (filtered.length === 1) {
      addMember(filtered[0]);
      return;
    }
    setPending(q);
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const kindBadge = (c: ProjectContributor) => {
    if (c.kind === "alumni") return "Alumni";
    if (c.kind === "external") return "Non-ARIES";
    return null;
  };

  return (
    <div className="block sm:col-span-2">
      <span className="text-xs font-semibold text-ink">{label}</span>
      <div className="relative mt-1.5">
        <div className="flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-lg bg-[#f3eef8] px-2.5 py-2 focus-within:ring-2 focus-within:ring-purple/40">
          {value.map((c, i) => {
            const badge = kindBadge(c);
            return (
              <span
                key={`${c.kind}-${c.slug ?? c.name}-${i}`}
                className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-ink shadow-sm"
              >
                {contributorLabel(c)}
                {badge && (
                  <span className="rounded bg-[#efe9fb] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple">
                    {badge}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="text-ink/40 hover:text-ink"
                  aria-label={`Remove ${contributorLabel(c)}`}
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              setTimeout(() => setOpen(false), 150);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                tryCommitQuery();
              } else if (e.key === "Backspace" && !query && value.length) {
                removeAt(value.length - 1);
              } else if (e.key === "Escape") {
                setPending(null);
                setOpen(false);
              }
            }}
            placeholder={value.length ? "" : placeholder}
            className="min-w-[10rem] flex-1 bg-transparent text-sm outline-none placeholder:text-ink/40"
          />
        </div>

        {open && !pending && (filtered.length > 0 || query.trim()) && (
          <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-[#e4dcf3] bg-white py-1 shadow-lg">
            {filtered.map((m) => (
              <li key={m.slug}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addMember(m)}
                  className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left hover:bg-[#f3eef8]"
                >
                  <span className="text-sm font-semibold text-ink">{m.name}</span>
                  <span className="text-xs text-ink/50">{m.slug}</span>
                </button>
              </li>
            ))}
            {query.trim() && !exactMember && (
              <li>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setPending(query.trim())}
                  className="block w-full px-3 py-2 text-left text-sm font-semibold text-purple hover:bg-[#f3eef8]"
                >
                  “{query.trim()}” isn’t on the roster — mark as alumni / non-ARIES…
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      {pending && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contributor-pending-title"
          onClick={() => setPending(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="contributor-pending-title" className="text-base font-bold text-ink">
              No ARIES member matched
            </h3>
            <p className="mt-2 text-sm leading-6 text-ink/70">
              We couldn’t find <span className="font-semibold text-ink">“{pending}”</span> in
              the people list. How should they appear on this project?
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => addNonMember("alumni", pending)}
                className="flex-1 rounded-lg bg-[#efe9fb] px-4 py-2.5 text-sm font-bold text-purple"
              >
                Alumni
              </button>
              <button
                type="button"
                onClick={() => addNonMember("external", pending)}
                className="flex-1 rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white"
              >
                Non-ARIES member
              </button>
              <button
                type="button"
                onClick={() => setPending(null)}
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-ink/60 hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
