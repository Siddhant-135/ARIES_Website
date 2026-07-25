"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";

/** Upload helper — posts to /api/admin/upload and reports the public URL. */
export function ImageField({
  label,
  kind,
  value,
  onChange,
}: {
  label: string;
  kind: "members" | "projects" | "events" | "team" | "misc";
  value?: string;
  onChange: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", kind);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onChange(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className="text-xs font-semibold text-ink">{label}</span>
      <div className="mt-1.5 flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-ink/20 bg-[#f3eef8] px-3 py-2.5 text-xs font-semibold text-ink hover:border-purple/40">
          <Upload size={14} />
          {busy ? "Uploading…" : "Choose image"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
            }}
          />
        </label>
        {value && (
          <div className="relative size-12 overflow-hidden rounded-lg bg-lilac">
            <Image src={value} alt="" fill className="object-cover" sizes="48px" />
          </div>
        )}
      </div>
      {value && <p className="mt-1 truncate text-[11px] text-ink/45">{value}</p>}
      {error && <p className="mt-1 text-[11px] font-semibold text-red-600">{error}</p>}
    </div>
  );
}
