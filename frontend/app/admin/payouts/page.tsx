"use client";

import React, { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { toast } from "react-toastify";
import { getPendingPayouts, decidePayout } from "@/lib/api/admin";
import type { PayoutRequestAdmin } from "@/lib/api/admin";
import { getErrorMessage } from "@/lib/api/errors";

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutRequestAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  // Rejection modal state
  const [rejectingPayout, setRejectingPayout] = useState<PayoutRequestAdmin | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadPayouts = async () => {
    try {
      setLoading(true);
      const data = await getPendingPayouts();
      setPayouts(data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load pending payout requests"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadPayouts();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const handleApprove = async (payout: PayoutRequestAdmin) => {
    if (!confirm(`Are you sure you want to approve the payout of ${formatMoney(payout.amountCents)} for ${payout.businessName}?`)) {
      return;
    }

    try {
      const res = await decidePayout(payout.id, "APPROVE");
      toast.success(res.message || "Payout request approved and processed!");
      loadPayouts();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to approve payout request"));
    }
  };

  const handleOpenReject = (payout: PayoutRequestAdmin) => {
    setRejectingPayout(payout);
    setRejectionReason("");
  };

  const handleCloseReject = () => {
    setRejectingPayout(null);
    setRejectionReason("");
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPayout) return;

    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await decidePayout(rejectingPayout.id, "REJECT", rejectionReason.trim());
      toast.success(res.message || "Payout request rejected.");
      handleCloseReject();
      loadPayouts();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to reject payout request"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page screen-enter" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 className="page-title">Payout requests</h1>
        <p className="page-sub">
          Review and approve pending payout requests submitted by sellers.
        </p>
      </div>

      <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Pending Queue</h2>
          <button onClick={loadPayouts} className="btn btn-ghost btn-sm" disabled={loading}>
            <Icon name="refresh" size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        <div className="table-container" style={{ overflowX: "auto" }}>
          <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <th style={{ textAlign: "left", padding: "12px 8px", color: "var(--ink-3)", fontSize: 12, fontWeight: 600 }}>Submitted At</th>
                <th style={{ textAlign: "left", padding: "12px 8px", color: "var(--ink-3)", fontSize: 12, fontWeight: 600 }}>Business / Seller</th>
                <th style={{ textAlign: "left", padding: "12px 8px", color: "var(--ink-3)", fontSize: 12, fontWeight: 600 }}>Payout Email</th>
                <th style={{ textAlign: "right", padding: "12px 8px", color: "var(--ink-3)", fontSize: 12, fontWeight: 600 }}>Amount</th>
                <th style={{ textAlign: "center", padding: "12px 8px", color: "var(--ink-3)", fontSize: 12, fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--ink-4)" }}>
                    Loading pending payouts...
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--ink-4)" }}>
                    No pending payout requests.
                  </td>
                </tr>
              ) : (
                payouts.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--line-soft)", height: 48 }}>
                    <td style={{ padding: "8px", fontSize: 13.5, color: "var(--ink-2)" }}>
                      {new Date(p.createdAt).toLocaleDateString()} at {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: "8px" }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-1)" }}>{p.businessName}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{p.sellerName} ({p.sellerEmail})</div>
                    </td>
                    <td style={{ padding: "8px", fontSize: 13.5, color: "var(--ink-2)" }}>
                      {p.payoutEmail}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", fontSize: 14, fontWeight: 700, color: "var(--brand)" }}>
                      {formatMoney(p.amountCents)}
                    </td>
                    <td style={{ padding: "8px", textAlign: "center" }}>
                      <div className="row gap-1" style={{ justifyContent: "center" }}>
                        <button
                          onClick={() => handleApprove(p)}
                          className="btn btn-sm"
                          style={{
                            background: "var(--success-soft)",
                            color: "var(--success)",
                            borderColor: "transparent",
                            fontSize: 12,
                          }}
                        >
                          <Icon name="check" size={12} /> Approve
                        </button>
                        <button
                          onClick={() => handleOpenReject(p)}
                          className="btn btn-sm"
                          style={{
                            background: "var(--danger-soft)",
                            color: "var(--danger)",
                            borderColor: "transparent",
                            fontSize: 12,
                          }}
                        >
                          <Icon name="x" size={12} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectingPayout && (
        <div className="modal-overlay" onClick={handleCloseReject}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Reject payout request</h3>
              <button onClick={handleCloseReject} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
                <Icon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontSize: 13.5, color: "var(--ink-2)", marginBottom: 8 }}>
                  You are rejecting the payout request of <strong>{formatMoney(rejectingPayout.amountCents)}</strong> for <strong>{rejectingPayout.businessName}</strong>.
                </div>
                <label className="field-label">Rejection reason (sent to seller)</label>
                <textarea
                  required
                  rows={3}
                  className="input"
                  style={{ width: "100%", minHeight: 80, resize: "vertical" }}
                  placeholder="e.g. Invalid billing information or account verification required."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>

              <div className="row gap-2" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseReject} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: "var(--danger)", color: "white" }} disabled={submitting}>
                  {submitting ? "Rejecting..." : "Confirm rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
