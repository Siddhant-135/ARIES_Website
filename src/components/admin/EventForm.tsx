"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Input, TextArea } from "./ProjectForm";
import { MediaField } from "./ImageField";

/** Create/edit an event with optional cover image + short video. */
export function EventForm({
  initial,
}: {
  initial?: {
    slug?: string;
    title?: string;
    type?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    venue?: string;
    description?: string;
    body?: string;
    image?: string;
    video?: string;
    calendar?: string;
  };
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [image, setImage] = useState(initial?.image ?? "");
  const [video, setVideo] = useState(initial?.video ?? "");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const title = String(f.get("title") ?? "").trim();
    const slug =
      String(f.get("slug") ?? "").trim() ||
      title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const calendar = String(f.get("calendar") ?? "").trim();

    const data = {
      slug,
      title,
      type: String(f.get("type") ?? "Workshop"),
      date: String(f.get("date") ?? ""),
      startTime: String(f.get("startTime") ?? "") || undefined,
      endTime: String(f.get("endTime") ?? "") || undefined,
      venue: String(f.get("venue") ?? "") || undefined,
      description: String(f.get("description") ?? ""),
      body: String(f.get("body") ?? ""),
      image: image || undefined,
      video: video || undefined,
      links: calendar ? [{ label: "Save to Google Calendar", url: calendar }] : [],
    };

    setStatus("saving");
    const res = await fetch("/api/admin/save", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "events", slug, data }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.mode === "pending") {
      alert("Submitted for approval.");
      setStatus("saved");
    } else {
      setStatus(res.ok ? "saved" : "error");
    }
    if (res.ok && !initial?.slug) (e.target as HTMLFormElement).reset();
    setTimeout(() => setStatus("idle"), 2500);
  };

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-card-sm">
      <h2 className="text-base font-bold text-ink">
        {initial?.slug ? `Edit event · ${initial.slug}` : "New event"}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="title" label="Event title *" required defaultValue={initial?.title} />
        <Input name="slug" label="Slug (optional)" defaultValue={initial?.slug} />
        <label className="block">
          <span className="text-xs font-semibold text-ink">Type *</span>
          <select
            name="type"
            required
            defaultValue={initial?.type ?? "Workshop"}
            className="mt-1.5 w-full rounded-lg bg-[#f3eef8] px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple/40"
          >
            <option>Workshop</option>
            <option>Talk</option>
            <option>Hackathon</option>
            <option>External</option>
          </select>
        </label>
        <Input name="date" label="Date *" type="date" required defaultValue={initial?.date} />
        <Input name="startTime" label="Start time" placeholder="11:00 AM" defaultValue={initial?.startTime} />
        <Input name="endTime" label="End time" placeholder="01:00 PM" defaultValue={initial?.endTime} />
        <Input name="venue" label="Venue" placeholder="LH 114, IIT Delhi" defaultValue={initial?.venue} />
        <Input name="calendar" label="Google Calendar link" defaultValue={initial?.calendar} />
      </div>
      <TextArea name="description" label="Short description (cards) *" rows={2} required defaultValue={initial?.description} />
      <TextArea name="body" label="Full description (detail page)" rows={5} defaultValue={initial?.body} />
      <div className="grid gap-4 sm:grid-cols-2">
        <MediaField label="Event image" kind="events" value={image} onChange={setImage} accept="image" />
        <MediaField
          label="Short video (optional, max ~40MB)"
          kind="events"
          value={video}
          onChange={setVideo}
          accept="video"
        />
      </div>
      <button
        disabled={status === "saving"}
        className="flex items-center gap-2 rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        <Save size={15} />
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : status === "error" ? "Failed" : "Save event"}
      </button>
    </form>
  );
}
