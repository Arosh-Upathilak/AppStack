"use client";

import React, { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { toast } from "react-toastify";
import { getSettings, updateSettings } from "@/lib/api/admin";
import type { PlatformSettings } from "@/lib/api/admin";
import { getErrorMessage } from "@/lib/api/errors";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [salesFundLockDays, setSalesFundLockDays] = useState(30);
  const [billingMaxRetries, setBillingMaxRetries] = useState(3);
  const [billingRetryDelayDays, setBillingRetryDelayDays] = useState(1);
  const [payoutMinDollars, setPayoutMinDollars] = useState(10);
  const [refundWindowDays, setRefundWindowDays] = useState(30);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      setSettings(data);
      setSalesFundLockDays(data.SALES_FUND_LOCK_DAYS);
      setBillingMaxRetries(data.BILLING_MAX_RETRIES);
      setBillingRetryDelayDays(data.BILLING_RETRY_DELAY_DAYS);
      setPayoutMinDollars(data.PAYOUT_MIN_CENTS / 100);
      setRefundWindowDays(data.REFUND_WINDOW_DAYS);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load platform settings"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await updateSettings({
        SALES_FUND_LOCK_DAYS: salesFundLockDays,
        BILLING_MAX_RETRIES: billingMaxRetries,
        BILLING_RETRY_DELAY_DAYS: billingRetryDelayDays,
        PAYOUT_MIN_CENTS: Math.round(payoutMinDollars * 100),
        REFUND_WINDOW_DAYS: refundWindowDays,
      });
      toast.success(updated.message || "Settings updated successfully!");
      setSettings(updated.settings);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update settings"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page screen-enter" style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <div className="row gap-2" style={{ color: "var(--ink-3)" }}>
          <Icon name="refresh" className="animate-spin" size={18} />
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page screen-enter" style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 640 }}>
      <div>
        <h1 className="page-title">Platform settings</h1>
        <p className="page-sub">
          Manage system-wide defaults for lock periods, retry limits, payout thresholds, and refund windows.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "var(--ink-1)", borderBottom: "1px solid var(--line-soft)", paddingBottom: 10 }}>
          Configuration Parameters
        </h2>

        <div>
          <label className="field-label" style={{ fontWeight: 600, color: "var(--ink-1)" }}>
            Sales Fund Lock Period (Days)
          </label>
          <input
            type="number"
            className="input"
            value={salesFundLockDays}
            onChange={(e) => setSalesFundLockDays(Math.max(0, parseInt(e.target.value) || 0))}
            min="0"
            required
          />
          <p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
            Number of days seller funds are held in escrow before becoming withdrawable.
          </p>
        </div>

        <div>
          <label className="field-label" style={{ fontWeight: 600, color: "var(--ink-1)" }}>
            Billing Max Retries
          </label>
          <input
            type="number"
            className="input"
            value={billingMaxRetries}
            onChange={(e) => setBillingMaxRetries(Math.max(0, parseInt(e.target.value) || 0))}
            min="0"
            required
          />
          <p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
            Maximum consecutive failed attempts before a recurring subscription goes into failed state.
          </p>
        </div>

        <div>
          <label className="field-label" style={{ fontWeight: 600, color: "var(--ink-1)" }}>
            Billing Retry Delay (Days)
          </label>
          <input
            type="number"
            className="input"
            value={billingRetryDelayDays}
            onChange={(e) => setBillingRetryDelayDays(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            required
          />
          <p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
            Number of days to wait between consecutive billing retries.
          </p>
        </div>

        <div>
          <label className="field-label" style={{ fontWeight: 600, color: "var(--ink-1)" }}>
            Minimum Payout ($ USD)
          </label>
          <input
            type="number"
            className="input"
            value={payoutMinDollars}
            onChange={(e) => setPayoutMinDollars(Math.max(0.01, parseFloat(e.target.value) || 0))}
            step="0.01"
            min="0.01"
            required
          />
          <p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
            Minimum balance required for a seller to request a manual payout.
          </p>
        </div>

        <div>
          <label className="field-label" style={{ fontWeight: 600, color: "var(--ink-1)" }}>
            Refund Eligibility Window (Days)
          </label>
          <input
            type="number"
            className="input"
            value={refundWindowDays}
            onChange={(e) => setRefundWindowDays(Math.max(0, parseInt(e.target.value) || 0))}
            min="0"
            required
          />
          <p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
            Time window after invoice payment during which a buyer is allowed to request a refund.
          </p>
        </div>

        <div className="row" style={{ justifyContent: "flex-end", borderTop: "1px solid var(--line-soft)", paddingTop: 16, marginTop: 8 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <>
                <Icon name="refresh" className="animate-spin" size={14} style={{ marginRight: 6 }} />
                <span>Saving changes...</span>
              </>
            ) : (
              <span>Save Settings</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
