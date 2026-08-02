"use client";

import { useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

/** Searchable chip picker — choose from suggestions or add a new tag. */
export function TagPicker({
  label,
  value,
  onChange,
  suggestions = [],
  placeholder = "Search or add…",
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => new Set(value.map((t) => t.toLowerCase())),
    [value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = [...new Set(suggestions.map((t) => t.trim()).filter(Boolean))];
    return pool
      .filter((t) => !selected.has(t.toLowerCase()))
      .filter((t) => !q || t.toLowerCase().includes(q))
      .slice(0, 12);
  }, [suggestions, selected, query]);

  const canAddNew =
    query.trim().length > 0 && !selected.has(query.trim().toLowerCase());

  const add = (tag: string) => {
    const t = tag.trim();
    if (!t || selected.has(t.toLowerCase())) return;
    onChange([...value, t]);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const remove = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className="block sm:col-span-2">
      <span className="text-xs font-semibold text-ink">{label}</span>
      <div className="relative mt-1.5">
        <div className="flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-lg bg-[#f3eef8] px-2.5 py-2 focus-within:ring-2 focus-within:ring-purple/40">
          {value.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-ink shadow-sm"
            >
              {t}
              <button
                type="button"
                onClick={() => remove(t)}
                className="text-ink/40 hover:text-ink"
                aria-label={`Remove ${t}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              // Delay so option click registers
              setTimeout(() => setOpen(false), 150);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (filtered[0]) add(filtered[0]);
                else if (canAddNew) add(query);
              } else if (e.key === "Backspace" && !query && value.length) {
                remove(value[value.length - 1]);
              }
            }}
            placeholder={value.length ? "" : placeholder}
            className="min-w-[8rem] flex-1 bg-transparent text-sm outline-none placeholder:text-ink/40"
          />
        </div>

        {open && (filtered.length > 0 || canAddNew) && (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-[#e4dcf3] bg-white py-1 shadow-lg">
            {filtered.map((t) => (
              <li key={t}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => add(t)}
                  className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-[#f3eef8]"
                >
                  {t}
                </button>
              </li>
            ))}
            {canAddNew &&
              !filtered.some((t) => t.toLowerCase() === query.trim().toLowerCase()) && (
                <li>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => add(query)}
                    className="block w-full px-3 py-2 text-left text-sm font-semibold text-purple hover:bg-[#f3eef8]"
                  >
                    Add “{query.trim()}”
                  </button>
                </li>
              )}
          </ul>
        )}
      </div>
    </div>
  );
}
