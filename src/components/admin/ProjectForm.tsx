"use client";

import { useState } from "react";
import { Save } from "lucide-react";

/**
 * Create/edit a project. Comma-separated fields keep the form compact;
 * they map to arrays in the project JSON.
 */
export function ProjectForm() {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

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

    const data = {
      name,
      tagline: f.get("tagline"),
      description: f.get("description"),
      about: f.get("about"),
      category: f.get("category"),
      tags: csv("tags"),
      techStack: csv("techStack"),
      contributors: csv("contributors"),
      links: [
        f.get("github") && { label: "GitHub", url: f.get("github") },
        f.get("demo") && { label: "Live Demo", url: f.get("demo") },
      ].filter(Boolean),
      highlights: [],
      features: [],
      screenshots: [],
    };

    setStatus("saving");
    const res = await fetch("/api/admin/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "projects", slug, data }),
    });
    setStatus(res.ok ? "saved" : "error");
    if (res.ok) (e.target as HTMLFormElement).reset();
    setTimeout(() => setStatus("idle"), 2500);
  };

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-card-sm">
      <h2 className="text-base font-bold text-ink">New project</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="name" label="Project name *" required />
        <Input name="slug" label="Slug (optional, auto from name)" />
        <Input name="category" label="Category *" placeholder="AI / ML, Hackathon, Research..." required />
        <Input name="tagline" label="Tagline *" required />
      </div>
      <TextArea name="description" label="Short description (cards) *" rows={2} required />
      <TextArea name="about" label="About the project (detail page)" rows={4} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="tags" label="Tags (comma separated)" placeholder="NLP, Computer vision" />
        <Input name="techStack" label="Tech stack (comma separated)" placeholder="Python, PyTorch" />
        <Input name="contributors" label="Contributor slugs (comma separated)" placeholder="harsheet-kaur" />
        <Input name="github" label="GitHub URL" />
        <Input name="demo" label="Demo URL" />
      </div>
      <button
        disabled={status === "saving"}
        className="flex items-center gap-2 rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        <Save size={15} />
        {status === "saving" ? "Saving..." : status === "saved" ? "Saved ✓" : status === "error" ? "Failed — retry" : "Create project"}
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
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
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
}: {
  label: string;
  name: string;
  rows: number;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink">{label}</span>
      <textarea
        name={name}
        rows={rows}
        required={required}
        className="mt-1.5 w-full rounded-lg bg-[#f3eef8] px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple/40"
      />
    </label>
  );
}
