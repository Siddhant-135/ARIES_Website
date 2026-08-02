"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Columns2, RectangleHorizontal, Save, Plus, Trash2 } from "lucide-react";
import type { Member, ProfileBlock } from "@/lib/types";
import { MediaField } from "./ImageField";
import { cn } from "@/lib/utils";

/**
 * Profile editor: avatar, identity, socials, drag-reorder sections.
 */
export function ProfileEditor({
  member,
  onSaved,
}: {
  member: Member;
  onSaved?: (member: Member) => void;
}) {
  const [draft, setDraft] = useState<Member>({
    ...member,
    socials: member.socials?.length ? member.socials : [],
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setDraft((d) => {
      const ids = d.blocks.map((b) => b.id);
      const from = ids.indexOf(String(active.id));
      const to = ids.indexOf(String(over.id));
      return { ...d, blocks: arrayMove(d.blocks, from, to) };
    });
  };

  const toggleSpan = (id: string) =>
    setDraft((d) => ({
      ...d,
      blocks: d.blocks.map((b) =>
        b.id === id ? { ...b, span: b.span === "full" ? "half" : "full" } : b,
      ),
    }));

  const save = async () => {
    setStatus("saving");
    setErrorMsg(null);
    const res = await fetch("/api/admin/save", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "members", slug: draft.slug, data: draft }),
    });
    const body = await res.json().catch(() => ({}));
    setStatus(res.ok ? "saved" : "error");
    if (!res.ok) setErrorMsg(body.error ?? `Save failed (${res.status})`);
    else onSaved?.(draft);
    setTimeout(() => setStatus("idle"), 2500);
  };

  const setField = (key: keyof Member) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft((d) => ({ ...d, [key]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-ink">Edit profile</h2>
        <button
          onClick={save}
          disabled={status === "saving"}
          className="flex items-center gap-2 rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          <Save size={15} />
          {status === "saving"
            ? "Saving…"
            : status === "saved"
              ? "Saved ✓"
              : status === "error"
                ? "Failed — retry"
                : "Save profile"}
        </button>
      </div>
      {errorMsg && <p className="text-xs font-semibold text-red-600">{errorMsg}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl bg-white p-6 shadow-card-sm">
          <h3 className="text-sm font-bold text-ink">Photo & identity</h3>
          <MediaField
            label="Profile photo"
            kind="members"
            value={draft.avatar}
            onChange={(url) => setDraft((d) => ({ ...d, avatar: url }))}
            accept="image"
          />
          <Field label="Name" value={draft.name} onChange={setField("name")} />
          <Field label="Role" value={draft.role} onChange={setField("role")} />
          <Field label="Year" value={draft.year ?? ""} onChange={setField("year")} />
          <Field label="Location" value={draft.location ?? ""} onChange={setField("location")} />
          <label className="block">
            <span className="text-xs font-semibold text-ink">Tagline</span>
            <textarea
              value={draft.tagline}
              onChange={setField("tagline")}
              rows={3}
              className="mt-1.5 w-full rounded-lg bg-[#f3eef8] px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple/40"
            />
          </label>
          <Field label="Resume URL" value={draft.resumeUrl ?? ""} onChange={setField("resumeUrl")} />
        </section>

        <section className="space-y-4 rounded-2xl bg-white p-6 shadow-card-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">Social links</h3>
            <button
              type="button"
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  socials: [...(d.socials ?? []), { label: "Link", url: "" }],
                }))
              }
              className="flex items-center gap-1 text-xs font-bold text-purple"
            >
              <Plus size={14} /> Add
            </button>
          </div>
          {(draft.socials ?? []).length === 0 && (
            <p className="text-xs text-ink/50">No social links yet.</p>
          )}
          {(draft.socials ?? []).map((s, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={s.label}
                onChange={(e) =>
                  setDraft((d) => {
                    const socials = [...(d.socials ?? [])];
                    socials[i] = { ...socials[i], label: e.target.value };
                    return { ...d, socials };
                  })
                }
                placeholder="Label"
                className="w-28 rounded-lg bg-[#f3eef8] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple/40"
              />
              <input
                value={s.url}
                onChange={(e) =>
                  setDraft((d) => {
                    const socials = [...(d.socials ?? [])];
                    socials[i] = { ...socials[i], url: e.target.value };
                    return { ...d, socials };
                  })
                }
                placeholder="https://…"
                className="min-w-0 flex-1 rounded-lg bg-[#f3eef8] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple/40"
              />
              <button
                type="button"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    socials: (d.socials ?? []).filter((_, j) => j !== i),
                  }))
                }
                className="rounded-lg p-2 text-ink/40 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </section>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-card-sm">
        <h3 className="text-sm font-bold text-ink">Sections</h3>
        <p className="mt-1 text-xs text-ink/60">
          Drag to reorder. Toggle width — two half-width sections sit side by side.
        </p>
        <DndContext
          id="profile-blocks-dnd"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={draft.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <ul className="mt-5 grid grid-cols-2 gap-3">
              {draft.blocks.map((b) => (
                <SortableBlockRow key={b.id} block={b} onToggleSpan={() => toggleSpan(b.id)} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
        {draft.blocks.length === 0 && (
          <p className="mt-4 text-xs text-ink/50">No content sections yet — save identity first.</p>
        )}
      </section>
    </div>
  );
}

function SortableBlockRow({
  block,
  onToggleSpan,
}: {
  block: ProfileBlock;
  onToggleSpan: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        gridColumn: block.span === "full" ? "1 / -1" : undefined,
      }}
      className={cn(
        "flex items-center gap-2 rounded-xl border border-ink/10 bg-[#f8f4fc] px-3 py-2.5",
        isDragging && "z-10 shadow-lg",
      )}
    >
      <button type="button" className="cursor-grab text-ink/40" {...attributes} {...listeners}>
        <GripVertical size={16} />
      </button>
      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink">
        {block.title || block.type}
      </span>
      <button
        type="button"
        onClick={onToggleSpan}
        className="rounded-lg p-1.5 text-ink/50 hover:bg-white"
        title={block.span === "full" ? "Make half width" : "Make full width"}
      >
        {block.span === "full" ? <RectangleHorizontal size={14} /> : <Columns2 size={14} />}
      </button>
    </li>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink">{label}</span>
      <input
        value={value}
        onChange={onChange}
        className="mt-1.5 w-full rounded-lg bg-[#f3eef8] px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple/40"
      />
    </label>
  );
}
