"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import PendingSellersTable from "@/components/admin/PendingSellersTable";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  return (
    <div className="page screen-enter">
      <div className="page-head">
        <div>
          <h1 className="page-title">Admin dashboard</h1>
          <p className="page-sub">
            Approve sellers, manage users, and oversee platform activity.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "var(--gap-md, 16px)",
          marginBottom: 24,
        }}
      >
        <button
          type="button"
          onClick={() => router.push("/admin/sellers/pending")}
          className="card card-pad"
          style={{
            textAlign: "left",
            cursor: "pointer",
            background:
              "linear-gradient(180deg, var(--brand-soft), var(--surface))",
            borderColor: "transparent",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "var(--brand)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Icon name="package" size={18} />
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-4)" }}>
              Pending sellers
            </div>
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "var(--ink-1)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {pendingCount ?? "—"}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--ink-4)",
              marginTop: 4,
            }}
          >
            Review applications →
          </div>
        </button>

        <div className="card card-pad" style={{ opacity: 0.6 }}>
          <div style={{ fontSize: 13, color: "var(--ink-4)" }}>Users</div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "var(--ink-1)",
              marginTop: 8,
            }}
          >
            —
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--ink-4)",
              marginTop: 4,
            }}
          >
            Coming soon
          </div>
        </div>

        <div className="card card-pad" style={{ opacity: 0.6 }}>
          <div style={{ fontSize: 13, color: "var(--ink-4)" }}>Payouts</div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "var(--ink-1)",
              marginTop: 8,
            }}
          >
            —
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--ink-4)",
              marginTop: 4,
            }}
          >
            Coming soon
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            margin: 0,
          }}
        >
          Recent pending applications
        </h2>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => router.push("/admin/sellers/pending")}
        >
          View all <Icon name="arrow_right" size={12} />
        </button>
      </div>

      <PendingSellersTable onCountChange={setPendingCount} />
    </div>
  );
}
