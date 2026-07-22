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
import { GripVertical, Columns2, RectangleHorizontal, Save } from "lucide-react";
import type { Member, ProfileBlock } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Drag-and-drop profile editor:
 * - reorder blocks vertically (drag the grip)
 * - toggle each block full-width / half-width (halves pack 2-up)
 * - edit identity fields
 * Saves the whole member JSON via /api/admin/save.
 */
export function ProfileEditor({ member }: { member: Member }) {
  const [draft, setDraft] = useState<Member>(member);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
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
    const res = await fetch("/api/admin/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "members", slug: draft.slug, data: draft }),
    });
    setStatus(res.ok ? "saved" : "error");
    setTimeout(() => setStatus("idle"), 2500);
  };

  const setField = (key: keyof Member) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft((d) => ({ ...d, [key]: e.target.value }));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      {/* Identity */}
      <section className="space-y-4 rounded-2xl bg-white p-6 shadow-card-sm">
        <h2 className="text-base font-bold text-ink">Profile details</h2>
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

      {/* Blocks */}
      <section className="rounded-2xl bg-white p-6 shadow-card-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-ink">Sections</h2>
            <p className="mt-1 text-xs text-ink/60">
              Drag to reorder. Toggle width — two half-width sections sit side by side.
            </p>
          </div>
          <button
            onClick={save}
            disabled={status === "saving"}
            className="flex items-center gap-2 rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            <Save size={15} />
            {status === "saving" ? "Saving..." : status === "saved" ? "Saved ✓" : status === "error" ? "Failed — retry" : "Save"}
          </button>
        </div>

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
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-[#e9e2f6] bg-[#faf8fd] px-3 py-3",
        block.span === "full" ? "col-span-2" : "col-span-2 sm:col-span-1",
        isDragging && "z-10 shadow-card",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="cursor-grab text-ink/40 hover:text-ink active:cursor-grabbing"
      >
        <GripVertical size={17} />
      </button>
      <span className="flex-1 text-sm font-bold text-ink">
        {block.title ?? block.type}
        <span className="ml-2 rounded bg-lilac px-1.5 py-0.5 text-[10px] font-semibold text-purple">
          {block.type}
        </span>
      </span>
      <button
        onClick={onToggleSpan}
        title={block.span === "full" ? "Make half width" : "Make full width"}
        className="flex items-center gap-1.5 rounded-lg border border-[#e0d6f2] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-ink/70 hover:text-purple"
      >
        {block.span === "full" ? <RectangleHorizontal size={13} /> : <Columns2 size={13} />}
        {block.span}
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
