"use client";

import React, { useCallback, useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { getSellerEarningsSummary, getSellerTransactions, requestPayout } from "@/lib/api/sellers";
import type { EarningsSummary, Transaction } from "@/lib/api/sellers";
import { getErrorMessage } from "@/lib/api/errors";

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default function SellerEarningsPage() {
  const { data: session } = useSession();
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutEmail, setPayoutEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      const summaryRes = await getSellerEarningsSummary();
      setSummary(summaryRes.summary);

      const txRes = await getSellerTransactions(pageNum, 10);
      setTransactions(txRes.transactions);
      setPage(txRes.pagination.page);
      setTotalPages(txRes.pagination.pages);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load financial records"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadData(1);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadData]);

  useEffect(() => {
    if (session?.user?.email) {
      const timeout = window.setTimeout(() => {
        setPayoutEmail(session.user.email ?? "");
      }, 0);

      return () => window.clearTimeout(timeout);
    }
  }, [session?.user?.email]);

  const handleOpenModal = () => {
    if (!summary || summary.withdrawableCents < 1000) {
      toast.error("You need at least $10.00 in withdrawable balance to request a payout.");
      return;
    }
    // Set default value to full withdrawable balance in dollars
    setPayoutAmount((summary.withdrawableCents / 100).toFixed(2));
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPayoutAmount("");
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dollars = parseFloat(payoutAmount);
    if (isNaN(dollars) || dollars <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    const cents = Math.round(dollars * 100);
    if (cents < 1000) {
      toast.error("Minimum payout request is $10.00.");
      return;
    }

    if (summary && cents > summary.withdrawableCents) {
      toast.error("Requested amount exceeds your withdrawable balance.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await requestPayout(cents, payoutEmail);
      toast.success(res.data.message || "Payout request submitted successfully!");
      handleCloseModal();
      loadData(page);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to submit payout request"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page screen-enter" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 className="page-title">Earnings & payouts</h1>
        <p className="page-sub">
          Monitor your SaaS transaction ledger, track locked funds, and request withdraws to your account.
        </p>
      </div>

      {/* Metrics Summary Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        <div className="card card-pad" style={{ background: "var(--surface)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--ink-4)", fontSize: 13 }}>
            <span>Total Sales</span>
            <Icon name="tag" size={16} style={{ color: "var(--success)" }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8, color: "var(--ink-1)" }}>
            {summary ? formatMoney(summary.totalSalesCents) : "$0.00"}
          </div>
        </div>

        <div className="card card-pad" style={{ background: "var(--surface)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--ink-4)", fontSize: 13 }}>
            <span>Total Refunds</span>
            <Icon name="refresh" size={16} style={{ color: "var(--danger)" }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8, color: "var(--ink-1)" }}>
            {summary ? formatMoney(summary.totalRefundsCents) : "$0.00"}
          </div>
        </div>

        <div className="card card-pad" style={{ background: "var(--surface)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--ink-4)", fontSize: 13 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              Locked Funds
              <span title="Funds from purchases are locked for 30 days before becoming withdrawable." style={{ cursor: "help" }}>
                <Icon name="info" size={12} />
              </span>
            </span>
            <Icon name="lock" size={16} style={{ color: "var(--warning)" }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8, color: "var(--ink-1)" }}>
            {summary ? formatMoney(summary.lockedCents) : "$0.00"}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 4 }}>
            30 days rolling lock rule
          </div>
        </div>

        <div
          className="card card-pad"
          style={{
            background: "linear-gradient(180deg, var(--brand-soft), var(--surface))",
            border: "1px solid var(--brand-border, var(--line))",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--ink-2)", fontSize: 13, fontWeight: 500 }}>
              <span>Withdrawable Balance</span>
              <Icon name="wallet" size={16} style={{ color: "var(--brand)" }} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, marginTop: 8, color: "var(--brand)" }}>
              {summary ? formatMoney(summary.withdrawableCents) : "$0.00"}
            </div>
          </div>

          <button
            onClick={handleOpenModal}
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 12, justifyContent: "center" }}
            disabled={!summary || summary.withdrawableCents < 1000}
          >
            <Icon name="arrow_up" size={14} /> Request Payout
          </button>
        </div>
      </div>

      {/* Transactions Table Section */}
      <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Transaction Ledger</h2>
          <button
            onClick={() => loadData(page)}
            className="btn btn-ghost btn-sm"
            disabled={loading}
          >
            <Icon name="refresh" size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        <div className="table-container" style={{ overflowX: "auto" }}>
          <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <th style={{ textAlign: "left", padding: "12px 8px", color: "var(--ink-3)", fontSize: 12, fontWeight: 600 }}>Date</th>
                <th style={{ textAlign: "left", padding: "12px 8px", color: "var(--ink-3)", fontSize: 12, fontWeight: 600 }}>Description</th>
                <th style={{ textAlign: "left", padding: "12px 8px", color: "var(--ink-3)", fontSize: 12, fontWeight: 600 }}>Invoice</th>
                <th style={{ textAlign: "center", padding: "12px 8px", color: "var(--ink-3)", fontSize: 12, fontWeight: 600 }}>Type</th>
                <th style={{ textAlign: "center", padding: "12px 8px", color: "var(--ink-3)", fontSize: 12, fontWeight: 600 }}>Status</th>
                <th style={{ textAlign: "right", padding: "12px 8px", color: "var(--ink-3)", fontSize: 12, fontWeight: 600 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 24, color: "var(--ink-4)" }}>
                    Loading financial ledger...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 24, color: "var(--ink-4)" }}>
                    No transactions recorded.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  let typeColor = "var(--ink-3)";
                  let typeBg = "var(--line-soft)";
                  if (tx.type === "SALE") {
                    typeColor = "var(--success)";
                    typeBg = "var(--success-soft)";
                  } else if (tx.type === "REFUND") {
                    typeColor = "var(--danger)";
                    typeBg = "var(--danger-soft)";
                  }

                  let statusColor = "var(--ink-3)";
                  let statusBg = "var(--line-soft)";
                  if (tx.status === "AVAILABLE") {
                    statusColor = "var(--brand)";
                    statusBg = "var(--brand-soft)";
                  } else if (tx.status === "LOCKED") {
                    statusColor = "var(--warning)";
                    statusBg = "var(--warning-soft)";
                  }

                  const amountSign = tx.amountCents >= 0 ? "+" : "";
                  const amountColor = tx.amountCents >= 0 ? "var(--success)" : "var(--danger)";

                  return (
                    <tr key={tx.id} style={{ borderBottom: "1px solid var(--line-soft)", height: 48 }}>
                      <td style={{ padding: "8px", fontSize: 13.5, color: "var(--ink-2)" }}>
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "8px", fontSize: 13.5, fontWeight: 500, color: "var(--ink-1)" }}>
                        {tx.description}
                      </td>
                      <td style={{ padding: "8px", fontSize: 13, color: "var(--ink-3)" }}>
                        {tx.invoice?.number ?? "—"}
                      </td>
                      <td style={{ padding: "8px", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            padding: "2px 8px",
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 600,
                            color: typeColor,
                            background: typeBg,
                          }}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td style={{ padding: "8px", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            padding: "2px 8px",
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 600,
                            color: statusColor,
                            background: statusBg,
                          }}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "8px",
                          textAlign: "right",
                          fontSize: 14,
                          fontWeight: 700,
                          color: amountColor,
                        }}
                      >
                        {amountSign}
                        {formatMoney(tx.amountCents)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="row gap-2" style={{ justifyContent: "center", marginTop: 12 }}>
            <button
              onClick={() => loadData(page - 1)}
              disabled={page === 1 || loading}
              className="btn btn-secondary btn-sm"
            >
              <Icon name="arrow_left" size={12} /> Previous
            </button>
            <span style={{ fontSize: 13, color: "var(--ink-3)" }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => loadData(page + 1)}
              disabled={page === totalPages || loading}
              className="btn btn-secondary btn-sm"
            >
              Next <Icon name="arrow_right" size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Payout Request sliding Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Request seller payout</h3>
              <button onClick={handleCloseModal} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
                <Icon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handlePayoutSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label className="field-label">Available withdrawable balance</label>
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--brand)", margin: "4px 0" }}>
                  {summary ? formatMoney(summary.withdrawableCents) : "$0.00"}
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-4)" }}>
                  Minimum payout request amount is $10.00.
                </div>
              </div>

              <div>
                <label className="field-label">Amount to withdraw ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="10.00"
                  max={summary ? (summary.withdrawableCents / 100).toFixed(2) : "0.00"}
                  required
                  className="input"
                  placeholder="0.00"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="field-label">Destination email / account</label>
                <input
                  type="email"
                  required
                  className="input"
                  placeholder="name@business.com"
                  value={payoutEmail}
                  onChange={(e) => setPayoutEmail(e.target.value)}
                />
              </div>

              <div style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 12, background: "var(--surface-muted)", fontSize: 12, color: "var(--ink-3)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--ink-2)" }}>Note:</strong> Payout requests are verified by platform administrators. Once approved, the funds will be transferred to your designated payout account within 2-3 business days.
              </div>

              <div className="row gap-2" style={{ justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
