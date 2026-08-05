"use client";

import { useMemo, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import type { Alumnus, TeamData } from "@/lib/types";
import { Input } from "./ProjectForm";
import { ImageField } from "./ImageField";

/** Add / edit / remove alumni entries in team.alumni (admin only). */
export function AlumniForm({
  team,
  onSaved,
}: {
  team: TeamData;
  onSaved?: (next: TeamData) => void;
}) {
  const alumni = team.alumni ?? [];
  const [editKey, setEditKey] = useState<string>("");
  const [formKey, setFormKey] = useState(0);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error" | "deleting">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [photo, setPhoto] = useState("");

  const selected = useMemo(() => {
    if (!editKey) return undefined;
    return alumni.find((a) => alumnusKey(a) === editKey);
  }, [alumni, editKey]);

  // Sync photo when selection changes via remount key on the form fields
  const startEdit = (key: string) => {
    setEditKey(key);
    const a = alumni.find((x) => alumnusKey(x) === key);
    setPhoto(a?.photo ?? "");
    setFormKey((k) => k + 1);
    setStatus("idle");
    setErrorMsg(null);
  };

  const startNew = () => {
    setEditKey("");
    setPhoto("");
    setFormKey((k) => k + 1);
    setStatus("idle");
    setErrorMsg(null);
  };

  const persist = async (nextAlumni: Alumnus[]) => {
    const next: TeamData = { ...team, alumni: nextAlumni };
    const res = await fetch("/api/admin/save", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "team", slug: "team", data: next }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error ?? `Save failed (${res.status})`);
    }
    onSaved?.(next);
    return next;
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "").trim();
    if (!name) return;

    // Only link when an explicit slug is set — don't invent one from the name.
    const slug = String(f.get("slug") ?? "").trim() || undefined;

    const entry: Alumnus = {
      name,
      slug,
      role: String(f.get("role") ?? "").trim(),
      org: String(f.get("org") ?? "").trim(),
      photo: photo || undefined,
    };

    setStatus("saving");
    setErrorMsg(null);
    try {
      let nextList: Alumnus[];
      if (editKey) {
        const idx = alumni.findIndex((a) => alumnusKey(a) === editKey);
        nextList = [...alumni];
        if (idx >= 0) nextList[idx] = entry;
        else nextList = [...alumni, entry];
      } else {
        nextList = [...alumni, entry];
      }
      await persist(nextList);
      setStatus("saved");
      startEdit(alumnusKey(entry));
      setTimeout(() => setStatus("idle"), 2500);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Save failed");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const remove = async () => {
    if (!editKey || !selected) return;
    if (!confirm(`Remove alumni “${selected.name}” from the team page?`)) return;
    setStatus("deleting");
    setErrorMsg(null);
    try {
      await persist(alumni.filter((a) => alumnusKey(a) !== editKey));
      startNew();
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Delete failed");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block max-w-md text-xs font-semibold text-ink">
        Edit existing alumnus
        <select
          value={editKey}
          onChange={(e) => {
            if (e.target.value) startEdit(e.target.value);
            else startNew();
          }}
          className="mt-1.5 w-full rounded-lg bg-white px-3 py-2.5 text-sm shadow-card-sm"
        >
          <option value="">— create new —</option>
          {alumni.map((a) => (
            <option key={alumnusKey(a)} value={alumnusKey(a)}>
              {a.name}
              {a.org ? ` · ${a.org}` : ""}
            </option>
          ))}
        </select>
      </label>

      <form
        key={`${editKey || "new"}-${formKey}`}
        onSubmit={(e) => void submit(e)}
        className="max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-card-sm"
      >
        <h2 className="text-base font-bold text-ink">
          {selected ? `Edit alumni · ${selected.name}` : "New alumni profile"}
        </h2>
        <p className="text-xs text-ink/55">
          Shows on the Team page Alumni grid. Optional slug links the card to a member profile at
          /slug.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input name="name" label="Name *" required defaultValue={selected?.name} />
          <Input
            name="slug"
            label="Profile slug (optional)"
            placeholder="auto from name"
            defaultValue={selected?.slug}
          />
          <Input
            name="role"
            label="Current role *"
            required
            defaultValue={selected?.role}
            placeholder="Quant Researcher"
          />
          <Input
            name="org"
            label="Organization *"
            required
            defaultValue={selected?.org}
            placeholder="WorldQuant"
          />
        </div>
        <ImageField label="Photo" kind="members" value={photo} onChange={setPhoto} />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={status === "saving" || status === "deleting"}
            className="flex items-center gap-2 rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            <Save size={15} />
            {status === "saving"
              ? "Saving…"
              : status === "saved"
                ? "Saved ✓"
                : status === "error"
                  ? "Failed"
                  : "Save alumni"}
          </button>
          {selected && (
            <button
              type="button"
              disabled={status === "saving" || status === "deleting"}
              onClick={() => void remove()}
              className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 size={15} />
              {status === "deleting" ? "Removing…" : "Remove"}
            </button>
          )}
        </div>
        {errorMsg && <p className="text-xs font-semibold text-red-600">{errorMsg}</p>}
      </form>
    </div>
  );
}

function alumnusKey(a: Alumnus) {
  return a.slug?.trim() || a.name.trim().toLowerCase();
}
