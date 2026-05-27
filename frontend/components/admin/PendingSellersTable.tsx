"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Icon from "@/components/Icon";

export interface PendingSeller {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  businessName?: string | null;
  appliedAt?: string | null;
}

interface Props {
  /** Optional callback when the queue size changes (e.g. for the dashboard card). */
  onCountChange?: (count: number) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function PendingSellersTable({ onCountChange }: Props) {
  const [items, setItems] = useState<PendingSeller[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchPending = useCallback(async () => {
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/admin/sellers/pending`, {
        withCredentials: true,
      });
      const list: PendingSeller[] = res.data?.items ?? [];
      setItems(list);
      onCountChange?.(list.length);
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load pending sellers.";
      setError(message);
      setItems([]);
      onCountChange?.(0);
    }
  }, [onCountChange]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  async function approve(id: string) {
    setBusyId(id);
    try {
      await axios.post(
        `${API_BASE}/admin/sellers/${id}/approve`,
        {},
        { withCredentials: true },
      );
      setItems((curr) => (curr ?? []).filter((x) => x.id !== id));
      onCountChange?.((items ?? []).filter((x) => x.id !== id).length);
      toast.success("Seller approved.");
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        "Could not approve seller.";
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmReject(id: string) {
    setBusyId(id);
    try {
      await axios.post(
        `${API_BASE}/admin/sellers/${id}/reject`,
        { reason: rejectReason.trim() || null },
        { withCredentials: true },
      );
      setItems((curr) => (curr ?? []).filter((x) => x.id !== id));
      onCountChange?.((items ?? []).filter((x) => x.id !== id).length);
      toast.success("Seller rejected.");
      setRejectingId(null);
      setRejectReason("");
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        "Could not reject seller.";
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  if (items === null) {
    return (
      <div
        className="card card-pad"
        style={{ color: "var(--ink-4)", fontSize: 13 }}
      >
        Loading pending applications…
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div
        className="card card-pad"
        style={{
          color: "var(--ink-3)",
          fontSize: 13.5,
          lineHeight: 1.6,
        }}
      >
        <div
          style={{
            color: "var(--danger,#dc2626)",
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          Couldn&apos;t load pending sellers
        </div>
        <div style={{ marginBottom: 12 }}>{error}</div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={fetchPending}
          style={{ height: 36 }}
        >
          <Icon name="refresh" size={13} /> Try again
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className="card card-pad"
        style={{
          textAlign: "center",
          color: "var(--ink-4)",
          fontSize: 14,
          padding: "48px 24px",
        }}
      >
        <div
          style={{
            fontSize: 32,
            marginBottom: 8,
            opacity: 0.6,
          }}
        >
          ✓
        </div>
        No pending seller applications.
      </div>
    );
  }

  return (
    <div className="card">
      <table className="tbl">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Business</th>
            <th>Applied</th>
            <th className="col-action" />
          </tr>
        </thead>
        <tbody>
          {items.map((s) => {
            const isRejecting = rejectingId === s.id;
            return (
              <tr key={s.id}>
                <td style={{ color: "var(--ink-1)", fontWeight: 500 }}>
                  {s.firstName} {s.lastName}
                </td>
                <td className="muted">{s.email}</td>
                <td>{s.businessName ?? "—"}</td>
                <td className="muted">{formatDate(s.appliedAt)}</td>
                <td className="col-action">
                  {isRejecting ? (
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        alignItems: "center",
                      }}
                    >
                      <input
                        className="input"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Reason (optional)"
                        style={{ height: 32, fontSize: 12, minWidth: 180 }}
                        autoFocus
                      />
                      <button
                        className="btn btn-ghost btn-sm"
                        type="button"
                        onClick={() => {
                          setRejectingId(null);
                          setRejectReason("");
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        type="button"
                        disabled={busyId === s.id}
                        onClick={() => confirmReject(s.id)}
                      >
                        {busyId === s.id ? "…" : "Confirm reject"}
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        className="btn btn-ghost btn-sm"
                        type="button"
                        disabled={busyId === s.id}
                        onClick={() => {
                          setRejectingId(s.id);
                          setRejectReason("");
                        }}
                      >
                        Reject
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        type="button"
                        disabled={busyId === s.id}
                        onClick={() => approve(s.id)}
                      >
                        {busyId === s.id ? "…" : "Approve"}
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
