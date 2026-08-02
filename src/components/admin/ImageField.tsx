"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";

type MediaKind = "members" | "projects" | "events" | "team" | "misc";

/** Upload helper — images or short videos to Supabase Storage via /api/admin/upload. */
export function MediaField({
  label,
  kind,
  value,
  onChange,
  accept = "image",
}: {
  label: string;
  kind: MediaKind;
  value?: string;
  onChange: (url: string) => void;
  accept?: "image" | "video" | "both";
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptAttr =
    accept === "video"
      ? "video/mp4,video/webm,video/quicktime"
      : accept === "both"
        ? "image/*,video/mp4,video/webm,video/quicktime"
        : "image/*";

  const isVideo =
    !!value &&
    (/\.(mp4|webm|mov)(\?|$)/i.test(value) || value.includes("/video") || value.includes("video/"));

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", kind);
      const res = await fetch("/api/admin/upload", { method: "POST", body, credentials: "include" });
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
          {busy ? "Uploading…" : accept === "video" ? "Choose video" : "Choose file"}
          <input
            type="file"
            accept={acceptAttr}
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
            }}
          />
        </label>
        {value && isVideo && (
          <video src={value} className="h-12 w-20 rounded-lg object-cover bg-lilac" muted />
        )}
        {value && !isVideo && (
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

/** @deprecated use MediaField — kept for existing imports */
export function ImageField(props: {
  label: string;
  kind: MediaKind;
  value?: string;
  onChange: (url: string) => void;
}) {
  return <MediaField {...props} accept="image" />;
}
