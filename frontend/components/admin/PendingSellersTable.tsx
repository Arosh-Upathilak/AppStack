"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import Icon from "@/components/Icon";
import {
  getSellers,
  approveSeller,
  Seller,
} from "@/lib/api/sellers";
import { useNotificationStore } from "@/store/useNotificationStore";

interface Props {
  onCountChange?: (count: number) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);

  if (Number.isNaN(d.getTime())) {
    return iso;
  }

  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PendingSellersTable({
  onCountChange,
}: Props) {
  const [items, setItems] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const notifications = useNotificationStore((state) => state.notifications);

  const refresh = useCallback(async () => {
    try {
      const response = await getSellers();

      const pendingSellers = response.sellers.filter(
        (seller) => seller.isApproveSeller === "PENDING"
      );

      setItems(pendingSellers);
    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 403) {
        toast.error("Access Denied: Admin privileges required.");
      } else {
        toast.error("Failed to fetch sellers");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    // Dynamically refresh table when a new SELLER_PENDING notification is received
    const pendingCountFromNotifications = notifications.filter(
      (n) => n.type === "SELLER_PENDING" && !n.isRead
    ).length;

    if (pendingCountFromNotifications > 0) {
      refresh();
    }
  }, [notifications, refresh]);

  useEffect(() => {
    onCountChange?.(items.length);
  }, [items, onCountChange]);

  const removeSeller = (id: string) => {
    setItems((prev) =>
      prev.filter((seller) => seller.id !== id)
    );
  };

  const handleApprove = async (sellerId: string) => {
    setBusyId(sellerId);

    try {
      await approveSeller(sellerId, "APPROVED");

      removeSeller(sellerId);

      toast.success("Seller approved successfully");
    } catch (error: any) {
      console.error(error);
      const errMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to approve seller";
      toast.error(errMsg);
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (sellerId: string) => {
    setBusyId(sellerId);

    try {
      await approveSeller(sellerId, "DENIED");

      removeSeller(sellerId);

      toast.success("Seller rejected successfully");
    } catch (error: any) {
      console.error(error);
      const errMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to reject seller";
      toast.error(errMsg);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-line bg-surface p-5 text-sm text-ink-4">
        Loading pending applications...
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
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-ink-4">
            <th className="px-4 py-3">Business Name</th>
            <th className="px-4 py-3">Payout Email</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Applied Date</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>

        <tbody>
          {items.map((seller) => {
            const busy = busyId === seller.id;
            const isNew = Date.now() - new Date(seller.createdAt).getTime() < 30000;

            return (
              <tr
                key={seller.id}
                className="border-b border-line-soft last:border-0 transition-colors duration-1000"
                style={{
                  background: isNew ? "var(--brand-soft)" : "transparent",
                }}
              >
                <td className="px-4 py-3 font-medium text-ink-1">
                  {seller.businessName}
                </td>

                <td className="px-4 py-3 text-ink-4">
                  {seller.payoutEmail}
                </td>

                <td className="px-4 py-3">
                  <span className="rounded-full bg-warning-soft px-2 py-1 text-xs font-medium text-warning">
                    {seller.isApproveSeller}
                  </span>
                </td>

                <td className="px-4 py-3 text-ink-4">
                  {formatDate(seller.createdAt)}
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleReject(seller.id)}
                      className="rounded-md px-3 py-1.5 text-xs font-medium text-ink-2 hover:bg-surface-hover disabled:opacity-60"
                    >
                      Reject
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleApprove(seller.id)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
                    >
                      {busy ? (
                        "..."
                      ) : (
                        <>
                          <Icon name="check" size={13} />
                          Approve
                        </>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}