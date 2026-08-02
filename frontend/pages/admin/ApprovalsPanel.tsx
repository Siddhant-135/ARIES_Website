"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ClipboardList, History, X } from "lucide-react";

type ChangeRequest = {
  id: string;
  entity_type: string;
  entity_slug: string;
  payload: Record<string, unknown>;
  status: string;
  submitted_by: string;
  created_at: string;
};

type ChangeLogRow = {
  id: string;
  entity_type: string;
  entity_slug: string;
  actor_slug: string;
  actor_level: string | null;
  source: string;
  summary: string | null;
  created_at: string;
};

export function ApprovalsPanel() {
  const router = useRouter();
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [log, setLog] = useState<ChangeLogRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/approvals", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setRequests(data.requests ?? []);
      setLog(data.log ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (requestId: string, approve: boolean) => {
    setBusy(requestId);
    try {
      const res = await fetch("/api/admin/approvals", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, approve }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Review failed");
      await load();
      // Refresh RSC caches so /projects and /events show the approved item
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>
      )}

      <section className="rounded-2xl bg-white p-6 shadow-card-sm">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <ClipboardList size={16} /> Pending approvals
        </h2>
        <p className="mt-1 text-xs text-ink/55">
          Executive project/event/team edits wait here for OC, Co-Overall Coordinator, or Research Lead.
          Approving applies the change immediately.
        </p>
        <ul className="mt-4 space-y-3">
          {requests.length === 0 && (
            <li className="text-sm text-ink/50">No pending requests.</li>
          )}
          {requests.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/5 bg-[#f8f4fc] px-4 py-3"
            >
              <div>
                <p className="text-sm font-bold text-ink">
                  {r.payload && (r.payload as { __delete?: boolean }).__delete ? "delete " : ""}
                  {r.entity_type} · {r.entity_slug}
                </p>
                <p className="text-xs text-ink/55">
                  by {r.submitted_by} · {new Date(r.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy === r.id}
                  onClick={() => void review(r.id, true)}
                  className="flex items-center gap-1 rounded-lg bg-purple px-3 py-1.5 text-xs font-bold text-white"
                >
                  <Check size={12} /> Approve
                </button>
                <button
                  type="button"
                  disabled={busy === r.id}
                  onClick={() => void review(r.id, false)}
                  className="flex items-center gap-1 rounded-lg bg-lilac px-3 py-1.5 text-xs font-bold text-ink"
                >
                  <X size={12} /> Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-card-sm">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <History size={16} /> Recent changes
        </h2>
        <ul className="mt-4 space-y-2">
          {log.length === 0 && <li className="text-sm text-ink/50">No changes logged yet.</li>}
          {log.map((row) => (
            <li key={row.id} className="border-b border-ink/5 py-2 text-xs text-ink/70 last:border-0">
              <span className="font-semibold text-ink">{row.actor_slug}</span>
              {row.actor_level ? ` (${row.actor_level})` : ""} · {row.source} · {row.entity_type}/
              {row.entity_slug}
              {row.summary ? ` — ${row.summary}` : ""}
              <span className="text-ink/40"> · {new Date(row.created_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
