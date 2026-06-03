"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import Icon from "@/components/Icon";
import {
  approveSeller,
  listPendingSellers,
  rejectSeller,
  type PendingSeller,
} from "@/lib/api/sellers";

interface Props {
  /** Optional callback when the queue size changes (e.g. for the dashboard card). */
  onCountChange?: (count: number) => void;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PendingSellersTable({ onCountChange }: Props) {
  const [items, setItems] = useState<PendingSeller[] | null>(null);
  const [mocked, setMocked] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const refresh = useCallback(async () => {
    const { data, mocked } = await listPendingSellers();
    setItems(data);
    setMocked(mocked);
    onCountChange?.(data.length);
  }, [onCountChange]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function dropRow(id: string) {
    setItems((curr) => {
      const next = (curr ?? []).filter((x) => x.id !== id);
      onCountChange?.(next.length);
      return next;
    });
  }

  async function approve(id: string) {
    setBusyId(id);
    try {
      await approveSeller(id);
      dropRow(id);
      toast.success("Seller approved");
    } catch (err: any) {
      toast.error(err?.message || "Could not approve seller.");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmReject(id: string) {
    setBusyId(id);
    try {
      await rejectSeller(id, rejectReason.trim() || null);
      dropRow(id);
      toast.success("Seller rejected");
      setRejectingId(null);
      setRejectReason("");
    } catch (err: any) {
      toast.error(err?.message || "Could not reject seller.");
    } finally {
      setBusyId(null);
    }
  }

  if (items === null) {
    return (
      <div className="rounded-lg border border-line bg-surface p-5 text-sm text-ink-4">
        Loading pending applications…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface px-6 py-12 text-center text-sm text-ink-4">
        <div className="mb-2 text-3xl opacity-60">✓</div>
        No pending seller applications.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      {mocked && (
        <div className="border-b border-line bg-warning-soft px-4 py-2 text-xs font-medium text-warning">
          Showing demo data — admin endpoints not reachable.
        </div>
      )}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-ink-4">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Business</th>
            <th className="px-4 py-3">Applied</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {items.map((s) => {
            const isRejecting = rejectingId === s.id;
            const busy = busyId === s.id;
            return (
              <tr key={s.id} className="border-b border-line-soft last:border-0">
                <td className="px-4 py-3 font-medium text-ink-1">
                  {s.firstName} {s.lastName}
                </td>
                <td className="px-4 py-3 text-ink-4">{s.email}</td>
                <td className="px-4 py-3 text-ink-2">{s.businessName ?? "—"}</td>
                <td className="px-4 py-3 text-ink-4">{formatDate(s.appliedAt)}</td>
                <td className="px-4 py-3">
                  {isRejecting ? (
                    <div className="flex items-center justify-end gap-2">
                      <input
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Reason (optional)"
                        autoFocus
                        className="h-8 min-w-[180px] rounded-md border border-line bg-surface px-2.5 text-xs text-ink-1 outline-none focus:border-brand"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingId(null);
                          setRejectReason("");
                        }}
                        className="rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-3 hover:bg-surface-hover"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => confirmReject(s.id)}
                        className="rounded-md bg-danger px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {busy ? "…" : "Confirm reject"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setRejectingId(s.id);
                          setRejectReason("");
                        }}
                        className="rounded-md px-3 py-1.5 text-xs font-medium text-ink-2 hover:bg-surface-hover disabled:opacity-60"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => approve(s.id)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
                      >
                        {busy ? "…" : (<><Icon name="check" size={13} /> Approve</>)}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
