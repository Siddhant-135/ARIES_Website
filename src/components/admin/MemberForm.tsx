"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Input, TextArea } from "./ProjectForm";
import { ImageField } from "./ImageField";

/** Create / update a member profile JSON. */
export function MemberForm({
  initial,
}: {
  initial?: {
    slug?: string;
    name?: string;
    role?: string;
    tagline?: string;
    year?: string;
    location?: string;
    photo?: string;
    about?: string;
  };
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [photo, setPhoto] = useState(initial?.photo ?? "");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "").trim();
    const slug =
      String(f.get("slug") ?? "").trim() ||
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const about = String(f.get("about") ?? "").trim();

    const data = {
      slug,
      name,
      role: String(f.get("role") ?? ""),
      tagline: String(f.get("tagline") ?? ""),
      year: String(f.get("year") ?? "") || undefined,
      location: String(f.get("location") ?? "") || "IIT Delhi",
      avatar: photo || undefined,
      socials: [],
      blocks: about
        ? [{ id: "about", type: "text" as const, span: "full" as const, title: "About", data: about }]
        : [],
    };

    setStatus("saving");
    const res = await fetch("/api/admin/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "members", slug, data }),
    });
    setStatus(res.ok ? "saved" : "error");
    setTimeout(() => setStatus("idle"), 2500);
  };

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-card-sm">
      <h2 className="text-base font-bold text-ink">
        {initial?.slug ? `Edit member · ${initial.slug}` : "New member"}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="name" label="Name *" required defaultValue={initial?.name} />
        <Input name="slug" label="Slug" placeholder="auto from name" defaultValue={initial?.slug} />
        <Input name="role" label="Role *" required defaultValue={initial?.role} placeholder="Coordinator" />
        <Input name="year" label="Year / branch" defaultValue={initial?.year} placeholder="3rd Year, CSE" />
        <Input name="location" label="Location" defaultValue={initial?.location ?? "IIT Delhi"} />
        <Input name="tagline" label="Tagline" defaultValue={initial?.tagline} />
      </div>
      <ImageField label="Profile photo" kind="members" value={photo} onChange={setPhoto} />
      <TextArea name="about" label="About" rows={4} defaultValue={initial?.about} />
      <button
        disabled={status === "saving"}
        className="flex items-center gap-2 rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        <Save size={15} />
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : status === "error" ? "Failed" : "Save member"}
      </button>
    </form>
  );
}
