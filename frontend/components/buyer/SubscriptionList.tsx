'use client';

import { useEffect, useState } from 'react';
import { cancelSubscription, changeSubscriptionPlan, listSubscriptionPlanOptions, listSubscriptions } from '@/lib/api/billing';
import { getErrorMessage } from '@/lib/api/errors';
import type { ProductPlan, Subscription } from '@/lib/api/types';
import Icon from '@/components/Icon';

function money(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export default function SubscriptionList() {
  const [items, setItems] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [changing, setChanging] = useState<Subscription | null>(null);
  const [planOptions, setPlanOptions] = useState<ProductPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [loadingPlans, setLoadingPlans] = useState(false);

  async function reload() {
    try {
      setError(null);
      const subscriptions = await listSubscriptions();
      setItems(subscriptions);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load subscriptions'));
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

  async function requestCancel(subscriptionId: string) {
    if (!confirm('Request cancellation for this subscription?')) return;
    try {
      setBusyId(subscriptionId);
      const updated = await cancelSubscription(subscriptionId);
      setItems(prev => prev.map(item => item.id === updated.id ? updated : item));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to request cancellation'));
    } finally {
      setBusyId(null);
    }
  }

  async function openPlanChange(subscription: Subscription) {
    try {
      setChanging(subscription);
      setLoadingPlans(true);
      setSelectedPlanId(subscription.planId);
      const response = await listSubscriptionPlanOptions(subscription.id);
      setPlanOptions(response.plans);
      setSelectedPlanId(response.currentPlanId);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load plan options'));
      setChanging(null);
    } finally {
      setLoadingPlans(false);
    }
  }

  async function submitPlanChange() {
    if (!changing || !selectedPlanId || selectedPlanId === changing.planId) return;
    try {
      setBusyId(changing.id);
      const updated = await changeSubscriptionPlan(changing.id, selectedPlanId);
      setItems(prev => prev.map(item => item.id === updated.id ? updated : item));
      setChanging(null);
      setPlanOptions([]);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to request plan change'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-1)' }}>Subscriptions</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-4)', marginTop: 2 }}>
          Active SaaS subscriptions and pending cancellation requests.
        </div>
      </div>

      {error && <div style={{ color: 'var(--danger,#dc2626)', fontSize: 13, marginBottom: 12 }}>{error}</div>}

      {loading ? (
        <div className="muted" style={{ fontSize: 13 }}>Loading...</div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <div className="muted" style={{ fontSize: 13.5 }}>No subscriptions yet. Browse the marketplace to subscribe.</div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Product</th>
                <th>Plan</th>
                <th>Renews</th>
                <th>Status</th>
                <th className="num">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={{ paddingLeft: 20 }}>
                    <div style={{ fontWeight: 600, color: 'var(--ink-1)' }}>{item.productName}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{item.recipientEmail}</div>
                    {item.integrationStatusMessage && (
                      <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{item.integrationStatusMessage}</div>
                    )}
                  </td>
                  <td>{item.planName}</td>
                  <td>{new Date(item.nextBillingAt).toLocaleDateString()}</td>
                  <td>{item.status}</td>
                  <td className="num">{money(item.priceCents * item.seats, item.currency)}</td>
                  <td className="col-action">
                    {item.status === 'ACTIVE' && (
                      <div className="row gap-1" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary btn-sm" disabled={busyId === item.id} onClick={() => openPlanChange(item)}>
                          <Icon name="edit" size={11} /> Plan
                        </button>
                        <button className="btn btn-secondary btn-sm" disabled={busyId === item.id} onClick={() => requestCancel(item.id)}>
                          <Icon name="x" size={11} /> Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {changing && (
        <div className="modal-overlay" onClick={() => setChanging(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Change plan</h3>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{changing.productName}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setChanging(null)}>
                <Icon name="x" size={14} />
              </button>
            </div>
            {loadingPlans ? (
              <div className="muted" style={{ fontSize: 13 }}>Loading plans...</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {planOptions.map(plan => (
                  <label
                    key={plan.id}
                    style={{
                      display: 'grid',
                      gap: 4,
                      padding: 12,
                      border: '1px solid var(--line)',
                      borderColor: selectedPlanId === plan.id ? 'var(--brand)' : 'var(--line)',
                      borderRadius: 8,
                    }}
                  >
                    <span className="row gap-2">
                      <input
                        type="radio"
                        checked={selectedPlanId === plan.id}
                        onChange={() => setSelectedPlanId(plan.id)}
                      />
                      <strong style={{ fontSize: 13.5 }}>{plan.name}</strong>
                      <span className="muted" style={{ fontSize: 12 }}>{money(plan.priceCents, plan.currency)}/{plan.billingInterval === 'YEARLY' ? 'yr' : 'mo'}</span>
                    </span>
                    <span className="muted" style={{ fontSize: 12, paddingLeft: 24 }}>{plan.features.slice(0, 3).join(', ')}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="row gap-2" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
              <button className="btn btn-secondary" onClick={() => setChanging(null)} disabled={busyId === changing.id}>Cancel</button>
              <button className="btn btn-primary" onClick={submitPlanChange} disabled={busyId === changing.id || selectedPlanId === changing.planId}>
                {busyId === changing.id ? 'Requesting...' : 'Request change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
