"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import PendingSellersTable from "@/components/admin/PendingSellersTable";
import { toast } from "react-toastify";
import { signOut } from "next-auth/react";
import { useNotificationStore } from "@/store/useNotificationStore";
import { markNotificationAsRead } from "@/lib/api/notification";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [bellOpen, setBellOpen] = useState(false);

  const notifications = useNotificationStore((state) => state.notifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = () => {
    toast.success("Logout successful!");
    signOut({ callbackUrl: "/" });
  };

  const handleNotificationClick = async (item: any) => {
    try {
      if (!item.isRead) {
        await markNotificationAsRead(item.id);
        markAsRead(item.id);
      }
      setBellOpen(false);
      if (item.type === "SELLER_PENDING") {
        router.push("/admin/sellers/pending");
      }
    } catch (err) {
      console.error("Failed to process notification click:", err);
    }
  };

  return (
    <div className="page screen-enter">
      <div className="page-head">
        <div>
          <h1 className="page-title">Admin dashboard</h1>
          <p className="page-sub">
            Approve sellers, manage users, and oversee platform activity.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
          {/* Real-time Notification Bell */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setBellOpen(!bellOpen)}
              className="flex items-center justify-center rounded-md p-2 text-ink-3 hover:bg-surface-hover transition-colors"
              style={{ border: "1px solid var(--line)", background: "var(--surface)", cursor: "pointer" }}
              title="Notifications"
            >
              <Icon name="bell" size={18} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    background: "var(--brand, #2563eb)",
                    color: "white",
                    fontSize: 9,
                    fontWeight: 700,
                    borderRadius: "50%",
                    width: 15,
                    height: 15,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <div
                className="card shadow-lg"
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  width: 320,
                  maxHeight: 400,
                  overflowY: "auto",
                  zIndex: 100,
                  marginTop: 8,
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  background: "var(--surface)",
                  borderColor: "var(--line)",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13, borderBottom: "1px solid var(--line-soft)", paddingBottom: 6 }}>
                  Recent Notifications
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: 12, textAlign: "center", fontSize: 12, color: "var(--ink-4)" }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        background: item.isRead ? "transparent" : "var(--brand-soft)",
                        cursor: "pointer",
                        fontSize: 12.5,
                        transition: "background 0.2s",
                      }}
                      className="hover:bg-surface-hover"
                    >
                      <div style={{ fontWeight: item.isRead ? 500 : 600, color: "var(--ink-1)" }}>
                        {item.title}
                      </div>
                      <div style={{ color: "var(--ink-3)", marginTop: 2, fontSize: 11.5 }}>
                        {item.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
          >
            <Icon name="logout" size={17} />
            <span>Log out</span>
          </button>
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
