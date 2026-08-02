"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { MediaField } from "./ImageField";

/**
 * Simplified project create/edit — essentials + cover image + short video.
 */
export function ProjectForm({
  initial,
}: {
  initial?: {
    slug?: string;
    name?: string;
    tagline?: string;
    description?: string;
    about?: string;
    category?: string;
    tags?: string[];
    techStack?: string[];
    contributors?: string[];
    image?: string;
    video?: string;
    featured?: boolean;
    links?: { label: string; url: string }[];
  };
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [image, setImage] = useState(initial?.image ?? "");
  const [video, setVideo] = useState(initial?.video ?? "");
  const [featured, setFeatured] = useState(!!initial?.featured);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "").trim();
    const slug =
      String(f.get("slug") ?? "").trim() ||
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const csv = (key: string) =>
      String(f.get(key) ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const github = String(f.get("github") ?? "").trim();
    const demo = String(f.get("demo") ?? "").trim();

    const data = {
      slug,
      name,
      tagline: String(f.get("tagline") ?? ""),
      description: String(f.get("description") ?? ""),
      about: String(f.get("about") ?? ""),
      category: String(f.get("category") ?? "Project"),
      tags: csv("tags"),
      techStack: csv("techStack"),
      contributors: csv("contributors"),
      image: image || undefined,
      video: video || undefined,
      featured,
      links: [
        github && { label: "GitHub", url: github },
        demo && { label: "Live Demo", url: demo },
      ].filter(Boolean),
    };

    setStatus("saving");
    const res = await fetch("/api/admin/save", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "projects", slug, data }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.mode === "pending") setStatus("saved");
    else setStatus(res.ok ? "saved" : "error");
    if (res.ok && body.mode === "pending") {
      alert("Submitted for approval (OC / Co-Overall Coordinator / Research Lead).");
    }
    if (res.ok && !initial?.slug && body.mode !== "pending") (e.target as HTMLFormElement).reset();
    setTimeout(() => setStatus("idle"), 2500);
  };

  const linkUrl = (label: string) =>
    initial?.links?.find((l) => l.label.toLowerCase().includes(label))?.url ?? "";

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-card-sm">
      <h2 className="text-base font-bold text-ink">
        {initial?.slug ? `Edit project · ${initial.slug}` : "New project"}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="name" label="Project name *" required defaultValue={initial?.name} />
        <Input name="slug" label="Slug (optional)" defaultValue={initial?.slug} />
        <Input
          name="category"
          label="Category *"
          required
          defaultValue={initial?.category}
          placeholder="Hackathon, Research, Industry…"
        />
        <Input name="tagline" label="Tagline *" required defaultValue={initial?.tagline} />
      </div>
      <TextArea name="description" label="Short description (cards) *" rows={2} required defaultValue={initial?.description} />
      <TextArea name="about" label="About (detail page)" rows={4} defaultValue={initial?.about} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="tags" label="Tags (comma separated)" defaultValue={initial?.tags?.join(", ")} />
        <Input name="techStack" label="Tech stack (comma separated)" defaultValue={initial?.techStack?.join(", ")} />
        <Input
          name="contributors"
          label="Contributor slugs (comma separated)"
          defaultValue={initial?.contributors?.join(", ")}
          placeholder="preesha, sanidhya"
        />
        <Input name="github" label="GitHub URL" defaultValue={linkUrl("git")} />
        <Input name="demo" label="Demo / paper URL" defaultValue={linkUrl("demo") || linkUrl("arxiv")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <MediaField label="Cover image" kind="projects" value={image} onChange={setImage} accept="image" />
        <MediaField
          label="Short video (optional, max ~40MB)"
          kind="projects"
          value={video}
          onChange={setVideo}
          accept="video"
        />
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold text-ink">
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
        Featured on projects page
      </label>
      <button
        disabled={status === "saving"}
        className="flex items-center gap-2 rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        <Save size={15} />
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : status === "error" ? "Failed" : "Save project"}
      </button>
    </form>
  );
}

export function Input({
  label,
  name,
  required,
  placeholder,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="mt-1.5 w-full rounded-lg bg-[#f3eef8] px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple/40"
      />
    </label>
  );
}

export function TextArea({
  label,
  name,
  rows,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  rows: number;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink">{label}</span>
      <textarea
        name={name}
        rows={rows}
        required={required}
        defaultValue={defaultValue}
        className="mt-1.5 w-full rounded-lg bg-[#f3eef8] px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple/40"
      />
    </label>
  );
}
