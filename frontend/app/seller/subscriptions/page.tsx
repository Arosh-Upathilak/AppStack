"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Icon from "@/components/Icon";
import {
  getSellerSubscriptions,
  type SellerProductSubscriptionSummary,
  type SellerSubscriptionRow,
  type SellerSubscriptionSummary,
} from "@/lib/api/sellers";
import { getErrorMessage } from "@/lib/api/errors";
import { toast } from "react-toastify";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "ACTIVE", label: "Active" },
  { value: "CHANGE_PENDING", label: "Change pending" },
  { value: "CANCEL_PENDING", label: "Cancel pending" },
  { value: "CANCELED", label: "Canceled" },
];

function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: Parameters<typeof Icon>[0]["name"];
}) {
  return (
    <div className="card card-pad">
      <div className="row" style={{ justifyContent: "space-between", color: "var(--ink-4)", fontSize: 13 }}>
        <span>{label}</span>
        <Icon name={icon} size={16} />
      </div>
      <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700, color: "var(--ink-1)", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
    </div>
  );
}

export default function SellerSubscriptionsPage() {
  const [summary, setSummary] = useState<SellerSubscriptionSummary | null>(null);
  const [products, setProducts] = useState<SellerProductSubscriptionSummary[]>([]);
  const [subscriptions, setSubscriptions] = useState<SellerSubscriptionRow[]>([]);
  const [productId, setProductId] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getSellerSubscriptions(productId || undefined, status || undefined);
      setSummary(response.summary);
      setProducts(response.products);
      setSubscriptions(response.subscriptions);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load seller subscriptions"));
    } finally {
      setLoading(false);
    }
  }, [productId, status]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadData]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId),
    [productId, products],
  );

  return (
    <div className="page screen-enter" style={{ display: "grid", gap: 24 }}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Subscriptions</h1>
          <p className="page-sub">
            Monitor product subscriptions and revenue without exposing buyer account PII.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => void loadData()} disabled={loading}>
            <Icon name="refresh" size={13} /> Refresh
          </button>
        </div>
      </div>

      <div
        className="card"
        style={{
          padding: 14,
          background: "var(--surface-muted)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 13,
          color: "var(--ink-3)",
        }}
      >
        <Icon name="shield" size={16} style={{ color: "var(--success)" }} />
        Seller views omit buyer account id, buyer email, payment method, and profile fields. Operational rows show product, plan, status, seats and revenue only.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 16 }}>
        <Metric label="Products" value={String(summary?.productsCount ?? 0)} icon="package" />
        <Metric label="Active subscriptions" value={String(summary?.activeSubscriptions ?? 0)} icon="check_circle" />
        <Metric label="Canceled / pending cancel" value={String(summary?.canceledSubscriptions ?? 0)} icon="trash" />
        <Metric label="Monthly recurring revenue" value={money(summary?.monthlyRecurringRevenueCents ?? 0)} icon="chart" />
        <Metric label="Total views" value={String(summary?.totalViews ?? 0)} icon="eye" />
      </div>

      <div className="card card-pad" style={{ display: "grid", gap: 16 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Product breakdown</h2>
            <div className="muted" style={{ marginTop: 4, fontSize: 12.5 }}>
              {selectedProduct ? `Filtered to ${selectedProduct.name}` : "All seller products"}
            </div>
          </div>
          <div className="row gap-2">
            <select className="input" style={{ width: 220 }} value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">All products</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            <select className="input" style={{ width: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
          {products.length === 0 ? (
            <div className="muted" style={{ gridColumn: "1 / -1", fontSize: 13 }}>
              No products found.
            </div>
          ) : (
            products.map((product) => (
              <button
                key={product.id}
                type="button"
                className="card"
                onClick={() => setProductId(product.id === productId ? "" : product.id)}
                style={{
                  padding: 14,
                  textAlign: "left",
                  borderColor: product.id === productId ? "var(--brand)" : "var(--line)",
                  boxShadow: product.id === productId ? "0 0 0 1px var(--brand)" : undefined,
                }}
              >
                <div style={{ fontWeight: 600, color: "var(--ink-1)", marginBottom: 6 }}>{product.name}</div>
                <div className="row" style={{ justifyContent: "space-between", fontSize: 12.5, color: "var(--ink-3)" }}>
                  <span>{product.activeCount} active</span>
                  <span>{product.canceledCount} canceled</span>
                </div>
                <div className="row gap-1" style={{ fontSize: 12, color: "var(--ink-4)", marginTop: 6 }}>
                  <Icon name="eye" size={12} />
                  <span>{product.viewCount ?? 0} views</span>
                </div>
                <div style={{ marginTop: 10, fontSize: 15, fontWeight: 700, color: "var(--brand)" }}>
                  {money(product.monthlyRevenueCents)}/mo
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: 18, borderBottom: "1px solid var(--line-soft)" }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Subscription records</h2>
        </div>
        {loading ? (
          <div style={{ padding: 24 }} className="muted">Loading subscriptions...</div>
        ) : subscriptions.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center" }} className="muted">
            No subscriptions match the current filters.
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Product</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Seats</th>
                <th>Current period</th>
                <th className="num">Recurring amount</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td style={{ paddingLeft: 20 }}>
                    <div style={{ fontWeight: 600, color: "var(--ink-1)" }}>{subscription.productName}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      Created {new Date(subscription.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div>{subscription.planName}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{subscription.planIdentifier}</div>
                  </td>
                  <td>{subscription.status.replace("_", " ")}</td>
                  <td>{subscription.seats}</td>
                  <td>
                    {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </td>
                  <td className="num">
                    {money(subscription.amountCents, subscription.currency)}
                    <span className="muted" style={{ fontWeight: 400 }}>
                      /{subscription.billingInterval === "YEARLY" ? "yr" : "mo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
