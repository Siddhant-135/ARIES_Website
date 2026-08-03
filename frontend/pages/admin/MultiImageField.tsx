"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";

type MediaKind = "members" | "projects" | "events" | "team" | "misc";

/** Multi-select image uploader — gallery photos for projects/events. */
export function MultiImageField({
  label,
  kind,
  value,
  onChange,
  hint,
}: {
  label: string;
  kind: MediaKind;
  value: string[];
  onChange: (urls: string[]) => void;
  hint?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadMany = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) {
      setError("Please choose image files (jpg/png/webp/gif)");
      return;
    }
    setBusy(true);
    setError(null);
    const uploaded: string[] = [];
    try {
      for (const file of list) {
        const body = new FormData();
        body.append("file", file);
        body.append("kind", kind);
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body,
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        uploaded.push(data.url as string);
      }
      onChange([...value, ...uploaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div>
      <span className="text-xs font-semibold text-ink">{label}</span>
      {hint && <p className="mt-0.5 text-[11px] text-ink/50">{hint}</p>}
      <div className="mt-1.5">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-ink/20 bg-[#f3eef8] px-3 py-2.5 text-xs font-semibold text-ink hover:border-purple/40">
          <Upload size={14} />
          {busy ? "Uploading…" : "Upload images"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const files = e.target.files;
              if (files?.length) void uploadMany(files);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {value.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((url, i) => (
            <li key={`${url}-${i}`} className="group relative aspect-square overflow-hidden rounded-lg bg-lilac">
              <Image src={url} alt="" fill className="object-cover" sizes="120px" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-red-600 opacity-90 shadow hover:bg-white"
                aria-label="Remove image"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-1 text-[11px] font-semibold text-red-600">{error}</p>}
    </div>
  );
}
