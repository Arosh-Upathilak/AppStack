"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Icon from "@/components/Icon";
import {
  decideProduct,
  listPendingProducts,
} from "@/lib/api/products";
import {
  decideProductChangeRequest,
  getPendingProductChangeRequests,
} from "@/lib/api/admin";
import { getErrorMessage } from "@/lib/api/errors";
import type { Product, ProductChangeRequest } from "@/lib/api/types";

function money(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export default function AdminPendingProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [changeRequests, setChangeRequests] = useState<ProductChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function reload() {
    try {
      const [items, changes] = await Promise.all([
        listPendingProducts(),
        getPendingProductChangeRequests(),
      ]);
      setProducts(items);
      setChangeRequests(changes);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load pending products"));
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

  async function handleDecision(productId: string, decision: "APPROVED" | "REJECTED") {
    const rejectionReason =
      decision === "REJECTED"
        ? prompt("Reason for rejection?", "Product did not meet marketplace requirements.") ?? undefined
        : undefined;

    try {
      setBusyId(productId);
      await decideProduct(productId, decision, rejectionReason);
      setProducts(prev => prev.filter(product => product.id !== productId));
      toast.success(`Product ${decision.toLowerCase()}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update product"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleChangeDecision(changeRequestId: string, decision: "APPROVE" | "REJECT") {
    const rejectionReason =
      decision === "REJECT"
        ? prompt("Reason for rejection?", "Change request did not meet marketplace requirements.") ?? undefined
        : undefined;

    try {
      setBusyId(changeRequestId);
      await decideProductChangeRequest(changeRequestId, decision, rejectionReason);
      setChangeRequests(prev => prev.filter(request => request.id !== changeRequestId));
      toast.success(`Change request ${decision.toLowerCase()}d`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to decide product change"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page screen-enter">
      <div className="page-head">
        <div>
          <h1 className="page-title">Pending Products</h1>
          <p className="page-sub">Review seller product submissions before they appear in the marketplace.</p>
        </div>
      </div>

      {loading ? (
        <div className="card card-pad">Loading pending products...</div>
      ) : products.length === 0 && changeRequests.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <div className="mb-2 text-3xl opacity-60">✓</div>
          <div className="muted" style={{ fontSize: 13.5 }}>No pending product submissions.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 18 }}>
        {products.length > 0 && (
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: 18, borderBottom: "1px solid var(--line-soft)" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>New product submissions</h2>
            </div>
            <table className="tbl">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Product</th>
                <th>Seller</th>
                <th>Category</th>
                <th>Plans</th>
                <th>Webhook</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => {
                const busy = busyId === product.id;
                return (
                  <tr key={product.id}>
                    <td style={{ paddingLeft: 20 }}>
                      <div style={{ fontWeight: 600, color: "var(--ink-1)" }}>{product.name}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{product.shortDescription}</div>
                    </td>
                    <td>{product.vendor}</td>
                    <td>{product.category}</td>
                    <td>
                      <div style={{ display: "grid", gap: 4 }}>
                        {product.plans.slice(0, 3).map(plan => (
                          <span key={plan.id} style={{ fontSize: 12 }}>
                            {plan.name}: {money(plan.priceCents, plan.currency)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className="row gap-1" style={{ display: "inline-flex", fontSize: 12 }}>
                        <Icon name={product.webhookTested ? "check_circle" : "warn"} size={12} />
                        {product.webhookTested ? "Configured" : "Not tested"}
                      </span>
                    </td>
                    <td className="col-action">
                      <div className="row gap-2" style={{ justifyContent: "flex-end" }}>
                        <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => handleDecision(product.id, "REJECTED")}>
                          Reject
                        </button>
                        <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => handleDecision(product.id, "APPROVED")}>
                          Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        )}
        {changeRequests.length > 0 && (
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: 18, borderBottom: "1px solid var(--line-soft)" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Product change requests</h2>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 20 }}>Product</th>
                  <th>Seller</th>
                  <th>Type</th>
                  <th>Requested</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {changeRequests.map(request => {
                  const busy = busyId === request.id;
                  return (
                    <tr key={request.id}>
                      <td style={{ paddingLeft: 20 }}>
                        <div style={{ fontWeight: 600, color: "var(--ink-1)" }}>{request.product?.name ?? request.productId}</div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {request.type === "UPDATE" ? request.payload?.shortDescription ?? "Product edit" : "Unlist and cancel active subscriptions"}
                        </div>
                      </td>
                      <td>{request.seller?.email ?? request.sellerId}</td>
                      <td>{request.type}</td>
                      <td>{new Date(request.submittedAt).toLocaleDateString()}</td>
                      <td className="col-action">
                        <div className="row gap-2" style={{ justifyContent: "flex-end" }}>
                          <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => handleChangeDecision(request.id, "REJECT")}>
                            Reject
                          </button>
                          <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => handleChangeDecision(request.id, "APPROVE")}>
                            Approve
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        </div>
      )}
    </div>
  );
}
