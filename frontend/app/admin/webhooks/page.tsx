"use client";

import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/Icon";
import {
  listAdminWebhookEvents,
  type AdminWebhookEventFilters,
} from "@/lib/api/admin";
import { retryWebhookEvent } from "@/lib/api/products";
import { getErrorMessage } from "@/lib/api/errors";
import type { WebhookEvent } from "@/lib/api/types";
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

export default function AdminWebhookEventsPage() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [filters, setFilters] = useState<AdminWebhookEventFilters>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const list = await listAdminWebhookEvents(filters);
      setEvents(list);
      setSelectedEvent((current) => current ?? list[0] ?? null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load webhook events"));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadEvents();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadEvents]);

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
          <h1 className="page-title">Webhook events</h1>
          <p className="page-sub">
            Monitor seller SaaS delivery, retries, and test events across the marketplace.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => void loadEvents()} disabled={loading}>
            <Icon name="refresh" size={13} /> Refresh
          </button>
        </div>
      </div>

      <div className="card card-pad" style={{ display: "grid", gap: 14 }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Event log</h2>
          <div className="row gap-2">
            <select className="input" value={filters.status ?? ""} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as AdminWebhookEventFilters["status"] }))}>
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FAILED">Failed</option>
            </select>
            <select className="input" value={filters.mode ?? ""} onChange={(event) => setFilters((current) => ({ ...current, mode: event.target.value as AdminWebhookEventFilters["mode"] }))}>
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
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(320px, 0.85fr)", gap: 16 }}>
            <div className="card" style={{ overflow: "hidden" }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 20 }}>Product</th>
                    <th>Event</th>
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
                        <div style={{ fontWeight: 600, color: "var(--ink-1)" }}>{event.product?.name ?? event.productId}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{event.product?.slug ?? event.productId}</div>
                      </td>
                      <td>
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
