"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Icon from "@/components/Icon";
import {
  listProductWebhookEvents,
  listSellerProducts,
  retryWebhookEvent,
  sendTestWebhookEvent,
  type WebhookEventFilters,
} from "@/lib/api/products";
import { getErrorMessage } from "@/lib/api/errors";
import type { Product, WebhookEvent } from "@/lib/api/types";
import { toast } from "react-toastify";

const EVENT_TYPES = [
  "",
  "webhook.test",
  "subscription.created",
  "subscription.updated",
  "subscription.canceled",
  "payment.succeeded",
  "payment.failed",
];

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

function statusColor(status: WebhookEvent["status"]) {
  if (status === "DELIVERED") return "var(--success)";
  if (status === "FAILED") return "var(--danger)";
  return "var(--warning)";
}

function payloadPreview(event?: WebhookEvent | null) {
  if (!event) return "";
  try {
    return JSON.stringify(JSON.parse(event.payload), null, 2);
  } catch {
    return event.payload;
  }
}

export default function SellerIntegrationsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [filters, setFilters] = useState<WebhookEventFilters>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId) ?? products[0],
    [productId, products],
  );

  const loadProducts = useCallback(async () => {
    try {
      const list = await listSellerProducts();
      setProducts(list);
      setProductId((current) => current || list[0]?.id || "");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load seller products"));
    }
  }, []);

  const loadEvents = useCallback(async () => {
    if (!selectedProduct) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const list = await listProductWebhookEvents(selectedProduct.id, filters);
      setEvents(list);
      setSelectedEvent((current) => current ?? list[0] ?? null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load webhook events"));
    } finally {
      setLoading(false);
    }
  }, [filters, selectedProduct]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadProducts();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadProducts]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadEvents();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadEvents]);

  async function copyText(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  }

  async function handleTest() {
    if (!selectedProduct) return;
    try {
      setBusy(true);
      const event = await sendTestWebhookEvent(selectedProduct.id);
      toast.success(event.status === "DELIVERED" ? "Webhook test delivered" : "Webhook test recorded");
      setSelectedEvent(event);
      await loadProducts();
      await loadEvents();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to send test webhook"));
    } finally {
      setBusy(false);
    }
  }

  async function handleRetry(eventId: string) {
    try {
      setBusy(true);
      const event = await retryWebhookEvent(eventId);
      toast.success("Webhook retry processed");
      setSelectedEvent(event);
      await loadEvents();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to retry webhook"));
    } finally {
      setBusy(false);
    }
  }

  const eventForPreview = selectedEvent ?? events[0] ?? null;

  return (
    <div className="page screen-enter" style={{ display: "grid", gap: 24 }}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Integrations</h1>
          <p className="page-sub">
            Test signed webhooks, copy acknowledgement headers, and monitor delivery.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => void loadEvents()} disabled={loading || !selectedProduct}>
            <Icon name="refresh" size={13} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={handleTest} disabled={busy || !selectedProduct?.webhookUrl}>
            <Icon name="flask" size={13} /> Send test
          </button>
        </div>
      </div>

      <div className="card card-pad" style={{ display: "grid", gap: 16 }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Product webhook</h2>
            <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
              Product submissions require a configured URL and a successful test delivery.
            </p>
          </div>
          <select
            className="input"
            style={{ width: 280 }}
            value={selectedProduct?.id ?? ""}
            onChange={(event) => {
              setProductId(event.target.value);
              setSelectedEvent(null);
            }}
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        {!selectedProduct ? (
          <div className="muted" style={{ fontSize: 13 }}>Create a product draft before configuring integrations.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
            <div className="card" style={{ padding: 14 }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Webhook URL</div>
              <div style={{ wordBreak: "break-all", color: "var(--ink-1)", fontSize: 13.5 }}>
                {selectedProduct.webhookUrl || "No webhook URL configured"}
              </div>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                <span className="muted" style={{ fontSize: 12 }}>Webhook secret</span>
                {selectedProduct.webhookSecret && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => void copyText(selectedProduct.webhookSecret || "", "Webhook secret")}
                  >
                    <Icon name="copy" size={11} /> Copy
                  </button>
                )}
              </div>
              <code style={{ wordBreak: "break-all", fontSize: 12 }}>
                {selectedProduct.webhookSecret || "Generated when the first webhook event is created"}
              </code>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Required headers</div>
              <code style={{ display: "block", whiteSpace: "pre-wrap", fontSize: 12 }}>
                X-AppStack-Signature: {"<hmac-sha256>"}{"\n"}
                X-AppStack-Event-Id: {"<event-id>"}
              </code>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Acknowledgement authorization</div>
              <code style={{ display: "block", whiteSpace: "pre-wrap", fontSize: 12 }}>
                Authorization: Bearer {"<webhookSecret>"}
              </code>
              <div style={{ marginTop: 8, color: selectedProduct.webhookTested ? "var(--success)" : "var(--warning)", fontSize: 12.5 }}>
                {selectedProduct.webhookTested ? "Webhook test passed" : "Webhook test required before submission"}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card card-pad" style={{ display: "grid", gap: 14 }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Event log</h2>
          <div className="row gap-2">
            <select className="input" value={filters.status ?? ""} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as WebhookEventFilters["status"] }))}>
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FAILED">Failed</option>
            </select>
            <select className="input" value={filters.mode ?? ""} onChange={(event) => setFilters((current) => ({ ...current, mode: event.target.value as WebhookEventFilters["mode"] }))}>
              <option value="">All modes</option>
              <option value="LIVE">Live</option>
              <option value="TEST">Test</option>
            </select>
            <select className="input" value={filters.eventType ?? ""} onChange={(event) => setFilters((current) => ({ ...current, eventType: event.target.value }))}>
              {EVENT_TYPES.map((eventType) => (
                <option key={eventType || "all"} value={eventType}>
                  {eventType || "All events"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="muted" style={{ padding: 20 }}>Loading webhook events...</div>
        ) : events.length === 0 ? (
          <div className="muted" style={{ padding: 20 }}>No webhook events match the current filters.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.9fr)", gap: 16 }}>
            <div className="card" style={{ overflow: "hidden" }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 20 }}>Event</th>
                    <th>Status</th>
                    <th>Attempts</th>
                    <th>Next retry</th>
                    <th className="num">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td style={{ paddingLeft: 20 }}>
                        <button
                          type="button"
                          onClick={() => setSelectedEvent(event)}
                          style={{ border: 0, background: "transparent", padding: 0, textAlign: "left", cursor: "pointer" }}
                        >
                          <div style={{ fontWeight: 600, color: "var(--ink-1)" }}>{event.eventType}</div>
                          <div className="muted" style={{ fontSize: 12 }}>{event.mode} · {formatDate(event.createdAt)}</div>
                        </button>
                      </td>
                      <td style={{ color: statusColor(event.status), fontWeight: 600 }}>{event.status}</td>
                      <td>{event.attempts}</td>
                      <td>{formatDate(event.nextAttemptAt)}</td>
                      <td className="num">
                        <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => handleRetry(event.id)}>
                          Retry
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card" style={{ padding: 14, overflow: "auto", maxHeight: 520 }}>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Payload preview</h3>
                {eventForPreview && <span className="muted" style={{ fontSize: 12 }}>{eventForPreview.responseCode ?? "No response"}</span>}
              </div>
              <pre style={{ margin: 0, fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {payloadPreview(eventForPreview)}
              </pre>
              {eventForPreview?.responseBody && (
                <>
                  <h3 style={{ margin: "18px 0 8px", fontSize: 15, fontWeight: 600 }}>Last response</h3>
                  <pre style={{ margin: 0, fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {eventForPreview.responseBody}
                  </pre>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
