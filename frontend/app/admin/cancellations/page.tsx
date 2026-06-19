"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getPendingCancellations,
  decideCancellation,
  type CancellationRequest,
} from "@/lib/api/admin";
import { getErrorMessage } from "@/lib/api/errors";

export default function AdminPendingCancellationsPage() {
  const [items, setItems] = useState<CancellationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function reload() {
    try {
      setLoading(true);
      const list = await getPendingCancellations();
      setItems(list);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load pending cancellations"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void reload();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  async function handleDecision(subscriptionId: string, decision: "APPROVE" | "REJECT") {
    try {
      setBusyId(subscriptionId);
      const res = await decideCancellation(subscriptionId, decision);
      toast.success(res.message || `Cancellation request ${decision === "APPROVE" ? "approved" : "rejected"} successfully.`);
      setItems(prev => prev.filter(item => item.id !== subscriptionId));
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update cancellation status"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page screen-enter">
      <div className="page-head">
        <div>
          <h1 className="page-title">Pending cancellations</h1>
          <p className="page-sub">
            Review and approve customer subscription cancellation requests. Approved cancellations stop renewal immediately.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 24, textAlign: "center" }}>
          <div className="muted">Loading pending cancellations...</div>
        </div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✓</div>
          <div className="muted">No pending cancellation requests found. All requests are cleared.</div>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="table-container" style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 20 }}>Buyer</th>
                  <th>SaaS Product</th>
                  <th>Plan Detail</th>
                  <th>Requested Date</th>
                  <th style={{ textAlign: "right", paddingRight: 20 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const busy = busyId === item.id;
                  const requestedAt = item.canceledAt ? new Date(item.canceledAt).toLocaleString() : new Date().toLocaleString();
                  const buyerName = item.buyer ? `${item.buyer.firstName || ""} ${item.buyer.lastName || ""}`.trim() : "Unknown Buyer";
                  const buyerEmail = item.buyer?.email || item.recipientEmail;

                  return (
                    <tr key={item.id}>
                      <td style={{ paddingLeft: 20 }}>
                        <div style={{ fontWeight: 600, color: "var(--ink-1)" }}>{buyerName}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{buyerEmail}</div>
                      </td>
                      <td>{item.product?.name || "Unknown Product"}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.plan?.name || "Unknown Plan"}</div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          ${((item.plan?.priceCents || 0) / 100).toFixed(2)} · {item.seats} seat{item.seats === 1 ? "" : "s"}
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: "var(--ink-3)" }}>{requestedAt}</td>
                      <td style={{ textAlign: "right", paddingRight: 20 }}>
                        <div style={{ display: "inline-flex", gap: 8 }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            disabled={busy}
                            onClick={() => handleDecision(item.id, "REJECT")}
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={busy}
                            onClick={() => handleDecision(item.id, "APPROVE")}
                          >
                            {busy ? "Processing..." : "Approve"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
