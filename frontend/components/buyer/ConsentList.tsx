'use client';

import { useEffect, useState } from 'react';
import { listConsents } from '@/lib/api/billing';
import { getErrorMessage } from '@/lib/api/errors';
import type { Consent } from '@/lib/api/types';

const TYPE_LABEL: Record<string, string> = {
  SHARE_EMAIL: 'Email shared with vendor',
  DATA_PROTECTION: 'Vendor data protection agreement',
};

export default function ConsentList() {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const records = await listConsents();
        setConsents(records ?? []);
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load consent records'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-1)' }}>Consent records</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-4)', marginTop: 2 }}>
          For GDPR transparency, we record every consent you grant when subscribing.
        </div>
      </div>

      {error && (
        <div style={{ color: 'var(--danger,#dc2626)', fontSize: 13, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="muted" style={{ fontSize: 13 }}>Loading…</div>
      ) : consents.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <div className="muted" style={{ fontSize: 13.5 }}>No consent records yet. They’ll appear here when you subscribe to a product.</div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--ink-3)' }}>Type</th>
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--ink-3)' }}>Subscription</th>
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--ink-3)' }}>Recipient</th>
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--ink-3)' }}>Recorded</th>
              </tr>
            </thead>
            <tbody>
              {consents.map(c => (
                <tr key={c.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: '10px 14px', color: 'var(--ink-1)' }}>{TYPE_LABEL[c.type] || c.type}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--ink-2)' }}>{c.product} · {c.plan}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--ink-2)' }}>{c.recipientEmail}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--ink-3)' }}>{new Date(c.agreedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
