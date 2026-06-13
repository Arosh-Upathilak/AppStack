"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Icon from "@/components/Icon";
import {
  getPendingRefunds,
  decideRefund,
  type RefundRequest,
} from "@/lib/api/admin";
import { getErrorMessage } from "@/lib/api/errors";

export default function AdminPendingRefundsPage() {
  const [items, setItems] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  async function reload() {
    try {
      setLoading(true);
      const list = await getPendingRefunds();
      setItems(list);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load pending refunds"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function handleApprove(refundId: string) {
    if (!confirm("Are you sure you want to approve this refund? This will reverse the invoice payment status.")) return;
    try {
      setBusyId(refundId);
      await decideRefund(refundId, "APPROVE");
      toast.success("Refund approved successfully.");
      setItems(prev => prev.filter(item => item.id !== refundId));
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to approve refund"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRejectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectingId) return;
    try {
      setBusyId(rejectingId);
      await decideRefund(rejectingId, "REJECT", rejectionReason);
      toast.success("Refund request rejected.");
      setItems(prev => prev.filter(item => item.id !== rejectingId));
      setRejectingId(null);
      setRejectionReason("");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to reject refund"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page screen-enter">
      <div className="page-head">
        <div>
          <h1 className="page-title">Pending refunds</h1>
          <p className="page-sub">
            Review and decide on buyer refund requests for subscriptions within the 30-day policy window.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 24, textAlign: "center" }}>
          <div className="muted">Loading pending refunds...</div>
        </div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✓</div>
          <div className="muted">No pending refund requests found. All requests are cleared.</div>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Buyer</th>
                <th>SaaS Product</th>
                <th>Reason</th>
                <th>Amount</th>
                <th style={{ textAlign: "right", paddingRight: 20 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const busy = busyId === item.id;
                const buyerName = item.buyer ? `${item.buyer.firstName || ""} ${item.buyer.lastName || ""}`.trim() : "Unknown Buyer";
                const buyerEmail = item.buyer?.email || "Unknown Email";

                return (
                  <tr key={item.id}>
                    <td style={{ paddingLeft: 20 }}>
                      <div style={{ fontWeight: 600, color: "var(--ink-1)" }}>{buyerName}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{buyerEmail}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.invoice?.product?.name || "Unknown Product"}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{item.invoice?.description}</div>
                    </td>
                    <td style={{ fontSize: 13, color: "var(--ink-2)", maxWidth: 200, wordBreak: "break-word" }}>
                      "{item.reason}"
                      <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>Requested {new Date(item.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--ink-1)" }}>
                        ${((item.amountCents) / 100).toFixed(2)}
                      </div>
                      <span className="muted" style={{ fontSize: 11 }}>{item.invoice?.currency || "USD"}</span>
                    </td>
                    <td style={{ textAlign: "right", paddingRight: 20 }}>
                      <div style={{ display: "inline-flex", gap: 8 }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={busy}
                          onClick={() => {
                            setRejectingId(item.id);
                            setRejectionReason("");
                          }}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={busy}
                          onClick={() => handleApprove(item.id)}
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
      )}

      {rejectingId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center", zIndex: 100 }} onClick={() => setRejectingId(null)}>
          <div className="card" onClick={e => e.stopPropagation()} style={{ width: "min(420px, 92vw)", padding: 24 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 600 }}>Reject refund request</h3>
            <form onSubmit={handleRejectSubmit}>
              <label className="field-label">Rejection reason</label>
              <textarea
                className="input"
                required
                style={{ minHeight: 90, resize: "vertical", marginBottom: 16 }}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Explain why this refund request is rejected..."
              />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setRejectingId(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={busyId === rejectingId}>
                  Submit rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
