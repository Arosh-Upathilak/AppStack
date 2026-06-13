'use client';

import { useEffect, useState } from 'react';
import { cancelSubscription, listSubscriptions } from '@/lib/api/billing';
import { getErrorMessage } from '@/lib/api/errors';
import type { Subscription } from '@/lib/api/types';
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
                      <button className="btn btn-secondary btn-sm" disabled={busyId === item.id} onClick={() => requestCancel(item.id)}>
                        <Icon name="x" size={11} /> Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
