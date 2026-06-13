'use client';

import { useEffect, useState } from 'react';
import { downloadInvoice, listInvoices, requestRefund } from '@/lib/api/billing';
import { getErrorMessage } from '@/lib/api/errors';
import type { Invoice } from '@/lib/api/types';
import Icon from '@/components/Icon';
import { toast } from 'react-toastify';

function money(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export default function InvoiceList() {
  const [items, setItems] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRefundInvoice, setSelectedRefundInvoice] = useState<Invoice | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  function isRefundable(invoice: Invoice) {
    if (currentTime === null) return false;
    if (invoice.status !== 'PAID') return false;
    const ageMs = currentTime - new Date(invoice.issuedAt).getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    return ageMs <= thirtyDaysMs;
  }

  async function reload() {
    try {
      setLoading(true);
      const invoices = await listInvoices();
      setItems(invoices);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load invoices'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setCurrentTime(Date.now());
      void reload();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  async function handleDownload(invoice: Invoice) {
    try {
      const blob = await downloadInvoice(invoice.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.number}.txt`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to download invoice'));
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-1)' }}>Invoices</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-4)', marginTop: 2 }}>
          Paid simulator invoices generated during subscription checkout.
        </div>
      </div>

      {error && <div style={{ color: 'var(--danger,#dc2626)', fontSize: 13, marginBottom: 12 }}>{error}</div>}

      {loading ? (
        <div className="muted" style={{ fontSize: 13 }}>Loading...</div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <div className="muted" style={{ fontSize: 13.5 }}>No invoices yet.</div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Invoice</th>
                <th>Product</th>
                <th>Issued</th>
                <th>Status</th>
                <th className="num">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(invoice => (
                <tr key={invoice.id}>
                  <td style={{ paddingLeft: 20, fontWeight: 600, color: 'var(--ink-1)' }}>{invoice.number}</td>
                  <td>{invoice.productName} · {invoice.planName}</td>
                  <td>{new Date(invoice.issuedAt).toLocaleDateString()}</td>
                  <td>{invoice.status}</td>
                  <td className="num">{money(invoice.amountCents, invoice.currency)}</td>
                  <td className="col-action" style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleDownload(invoice)}>
                      <Icon name="download" size={11} /> Download
                    </button>
                    {isRefundable(invoice) && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setSelectedRefundInvoice(invoice);
                          setRefundReason('');
                        }}
                      >
                        Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedRefundInvoice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 100 }} onClick={() => setSelectedRefundInvoice(null)}>
          <div className="card" onClick={e => e.stopPropagation()} style={{ width: 'min(420px, 92vw)', padding: 24 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 17, fontWeight: 600 }}>Request refund</h3>
            <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
              Request a refund for invoice {selectedRefundInvoice.number} (${(selectedRefundInvoice.amountCents / 100).toFixed(2)}).
            </p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                setBusy(true);
                await requestRefund(selectedRefundInvoice.id, refundReason);
                toast.success('Refund request submitted successfully!');
                setSelectedRefundInvoice(null);
                setRefundReason('');
                void reload();
              } catch (err) {
                toast.error(getErrorMessage(err, 'Failed to submit refund request'));
              } finally {
                setBusy(false);
              }
            }}>
              <label className="field-label">Reason for refund</label>
              <textarea
                className="input"
                required
                style={{ minHeight: 80, resize: 'vertical', marginBottom: 16 }}
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                placeholder="Why do you want a refund?"
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedRefundInvoice(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'Submitting...' : 'Submit request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
