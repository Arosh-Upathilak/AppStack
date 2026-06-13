"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Icon from "@/components/Icon";
import {
  createProduct,
  listSellerProducts,
  type ProductPlanInput,
  submitProduct,
  listProductWebhookEvents,
  retryWebhookEvent,
} from "@/lib/api/products";
import { getErrorMessage } from "@/lib/api/errors";
import type { Product, WebhookEvent } from "@/lib/api/types";

type DraftPlan = ProductPlanInput & { localId: string };

const emptyPlan = (): DraftPlan => ({
  localId: `plan-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  identifier: "",
  name: "",
  features: [],
  priceCents: 0,
  currency: "USD",
  billingInterval: "MONTHLY",
  isActive: true,
});

export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("CRM");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [similarTo, setSimilarTo] = useState("");
  const [plans, setPlans] = useState<DraftPlan[]>([emptyPlan()]);
  const [selectedWebhookProduct, setSelectedWebhookProduct] = useState<Product | null>(null);

  async function reload() {
    try {
      const items = await listSellerProducts();
      setProducts(items);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load seller products"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void reload();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  function updatePlan(localId: string, patch: Partial<DraftPlan>) {
    setPlans(prev => prev.map(plan => plan.localId === localId ? { ...plan, ...patch } : plan));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      setBusy(true);
      const product = await createProduct({
        name,
        shortDescription,
        description,
        category,
        webhookUrl,
        webhookTested: !!webhookUrl,
        similarTo: similarTo.split(",").map(item => item.trim()).filter(Boolean),
        plans: plans.map(plan => ({
          identifier: plan.identifier || undefined,
          name: plan.name,
          features: Array.isArray(plan.features) ? plan.features : [],
          priceCents: Number(plan.priceCents),
          currency: plan.currency,
          billingInterval: plan.billingInterval,
          isActive: plan.isActive,
        })),
      });
      setProducts(prev => [product, ...prev]);
      setName("");
      setShortDescription("");
      setDescription("");
      setWebhookUrl("");
      setSimilarTo("");
      setPlans([emptyPlan()]);
      toast.success("Product draft created");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create product"));
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(productId: string) {
    try {
      const updated = await submitProduct(productId);
      setProducts(prev => prev.map(product => product.id === updated.id ? updated : product));
      toast.success("Product submitted for approval");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to submit product"));
    }
  }

  return (
    <div className="page screen-enter">
      <div className="page-head">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-sub">Create SaaS products, plans and webhook settings for admin approval.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
        <form className="card card-pad" onSubmit={handleCreate}>
          <h2 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 600 }}>New product draft</h2>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label className="field-label">Name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label className="field-label">Short description</label>
              <input className="input" value={shortDescription} onChange={e => setShortDescription(e.target.value)} required />
            </div>
            <div>
              <label className="field-label">Description</label>
              <textarea className="input" value={description} onChange={e => setDescription(e.target.value)} required style={{ minHeight: 90, resize: "vertical" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label className="field-label">Category</label>
                <input className="input" value={category} onChange={e => setCategory(e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Similar to</label>
                <input className="input" placeholder="Slack, Notion" value={similarTo} onChange={e => setSimilarTo(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="field-label">Webhook URL</label>
              <input className="input" type="url" placeholder="https://your-app.com/webhooks/appstack" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} />
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <label className="field-label" style={{ margin: 0 }}>Plans</label>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPlans(prev => [...prev, emptyPlan()])}>
                  <Icon name="plus" size={11} /> Add plan
                </button>
              </div>
              {plans.map(plan => (
                <div key={plan.localId} className="card" style={{ padding: 12, display: "grid", gap: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 10 }}>
                    <input className="input" placeholder="Plan name" value={plan.name} onChange={e => updatePlan(plan.localId, { name: e.target.value })} required />
                    <input className="input" type="number" min={0} placeholder="Price cents" value={plan.priceCents} onChange={e => updatePlan(plan.localId, { priceCents: Number(e.target.value) })} required />
                  </div>
                  <input
                    className="input"
                    placeholder="Features, comma separated"
                    value={plan.features.join(", ")}
                    onChange={e => updatePlan(plan.localId, { features: e.target.value.split(",").map(item => item.trim()).filter(Boolean) })}
                  />
                </div>
              ))}
            </div>

            <button className="btn btn-primary" disabled={busy} type="submit" style={{ height: 40, justifyContent: "center" }}>
              {busy ? "Creating..." : <>Create draft <Icon name="arrow_right" size={13} /></>}
            </button>
          </div>
        </form>

        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: 18, borderBottom: "1px solid var(--line-soft)" }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Your products</h2>
          </div>
          {loading ? (
            <div style={{ padding: 18 }} className="muted">Loading...</div>
          ) : products.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center" }} className="muted">No products yet.</div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 20 }}>Product</th>
                  <th>Status</th>
                  <th>Plans</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    <td style={{ paddingLeft: 20 }}>
                      <div style={{ fontWeight: 600, color: "var(--ink-1)" }}>{product.name}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{product.category}</div>
                    </td>
                    <td>{product.status}</td>
                    <td>{product.plans.length}</td>
                    <td className="col-action" style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      {(product.status === "DRAFT" || product.status === "REJECTED") && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleSubmit(product.id)}>
                          Submit
                        </button>
                      )}
                      {product.status === "APPROVED" && (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedWebhookProduct(product)}>
                          <Icon name="settings" size={11} /> Webhooks
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {selectedWebhookProduct && (
        <WebhookModal
          product={selectedWebhookProduct}
          onClose={() => setSelectedWebhookProduct(null)}
        />
      )}
    </div>
  );
}

function WebhookModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  async function loadEvents() {
    try {
      setLoading(true);
      const list = await listProductWebhookEvents(product.id);
      setEvents(list);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load webhook events"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEvents();
  }, [product.id]);

  async function handleRetry(eventId: string) {
    try {
      setRetryingId(eventId);
      await retryWebhookEvent(eventId);
      toast.success("Retry initiated!");
      setTimeout(() => void loadEvents(), 1000);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to retry webhook"));
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center", zIndex: 100 }} onClick={onClose}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ width: "min(720px, 92vw)", padding: 24, display: "flex", flexDirection: "column", maxHeight: "85vh", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Webhook logs: {product.name}</h3>
            <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>Monitor and retry SaaS integration event delivery.</p>
          </div>
          <button className="btn" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>

        <div style={{ marginBottom: 16, padding: 12, background: "var(--surface-muted)", borderRadius: 8, fontSize: 13, border: "1px solid var(--line-soft)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <strong>Webhook Secret:</strong>
            <button className="btn btn-secondary btn-sm" onClick={() => {
              void navigator.clipboard.writeText(product.webhookSecret || "");
              toast.success("Secret copied!");
            }}>
              Copy secret
            </button>
          </div>
          <code style={{ wordBreak: "break-all", display: "block", padding: "6px 8px", background: "var(--surface)", border: "1px solid var(--line-soft)", borderRadius: 4, fontFamily: "monospace" }}>
            {product.webhookSecret || "No secret generated"}
          </code>
          <div style={{ marginTop: 8 }}>
            <strong>Webhook Target URL:</strong>
            <span style={{ marginLeft: 8, wordBreak: "break-all", color: "var(--ink-2)" }}>{product.webhookUrl || "None configured"}</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div className="muted" style={{ padding: 20, textAlign: "center" }}>Loading logs...</div>
          ) : events.length === 0 ? (
            <div className="muted" style={{ padding: 20, textAlign: "center" }}>No webhook events recorded for this product yet.</div>
          ) : (
            <table className="tbl" style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: 12 }}>Event / Time</th>
                  <th>Status</th>
                  <th>Code</th>
                  <th>Attempts</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id}>
                    <td style={{ paddingLeft: 12, verticalAlign: "top" }}>
                      <div style={{ fontWeight: 600 }}>{event.eventType}</div>
                      <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{new Date(event.createdAt).toLocaleString()}</div>
                      {event.responseBody && (
                        <details style={{ marginTop: 4, cursor: "pointer", fontSize: 11 }}>
                          <summary className="muted">View response details</summary>
                          <pre style={{ margin: "4px 0 0", padding: 6, background: "var(--surface-muted)", borderRadius: 4, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                            {event.responseBody}
                          </pre>
                        </details>
                      )}
                    </td>
                    <td style={{ verticalAlign: "top" }}>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        background: event.status === "DELIVERED" ? "rgba(63,221,163,0.15)" : event.status === "FAILED" ? "rgba(220,38,38,0.15)" : "rgba(234,179,8,0.15)",
                        color: event.status === "DELIVERED" ? "#3fdda3" : event.status === "FAILED" ? "#dc2626" : "#eab308"
                      }}>
                        {event.status}
                      </span>
                    </td>
                    <td style={{ verticalAlign: "top", fontVariantNumeric: "tabular-nums" }}>{event.responseCode || "-"}</td>
                    <td style={{ verticalAlign: "top", fontVariantNumeric: "tabular-nums" }}>{event.attempts}</td>
                    <td className="col-action" style={{ verticalAlign: "top" }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={retryingId !== null}
                        onClick={() => handleRetry(event.id)}
                      >
                        {retryingId === event.id ? "Retrying..." : "Retry"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
