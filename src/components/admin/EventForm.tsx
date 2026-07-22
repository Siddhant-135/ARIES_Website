"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Input, TextArea } from "./ProjectForm";

/** Create/edit an event; writes content/events/<slug>.json. */
export function EventForm() {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const title = String(f.get("title") ?? "").trim();
    const slug =
      String(f.get("slug") ?? "").trim() ||
      title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const data = {
      title,
      type: f.get("type"),
      date: f.get("date"),
      startTime: f.get("startTime"),
      endTime: f.get("endTime"),
      venue: f.get("venue"),
      description: f.get("description"),
      body: f.get("body"),
      links: f.get("calendar")
        ? [{ label: "Save to Google Calendar", url: f.get("calendar") }]
        : [],
    };

    setStatus("saving");
    const res = await fetch("/api/admin/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "events", slug, data }),
    });
    setStatus(res.ok ? "saved" : "error");
    if (res.ok) (e.target as HTMLFormElement).reset();
    setTimeout(() => setStatus("idle"), 2500);
  };

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-card-sm">
      <h2 className="text-base font-bold text-ink">New event</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="title" label="Event title *" required />
        <Input name="slug" label="Slug (optional, auto from title)" />
        <label className="block">
          <span className="text-xs font-semibold text-ink">Type *</span>
          <select
            name="type"
            required
            className="mt-1.5 w-full rounded-lg bg-[#f3eef8] px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple/40"
          >
            <option>Talk</option>
            <option>Workshop</option>
            <option>Hackathon</option>
            <option>Event</option>
          </select>
        </label>
        <Input name="date" label="Date *" type="date" required />
        <Input name="startTime" label="Start time" placeholder="11:00 AM" />
        <Input name="endTime" label="End time" placeholder="01:00 PM" />
        <Input name="venue" label="Venue" placeholder="LH 114, IIT Delhi" />
        <Input name="calendar" label="Google Calendar link" />
      </div>
      <TextArea name="description" label="Short description (cards) *" rows={2} required />
      <TextArea name="body" label="Full description (detail page)" rows={5} />
      <button
        disabled={status === "saving"}
        className="flex items-center gap-2 rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        <Save size={15} />
        {status === "saving" ? "Saving..." : status === "saved" ? "Saved ✓" : status === "error" ? "Failed — retry" : "Create event"}
      </button>
    </form>
  );
}
