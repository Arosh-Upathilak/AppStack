'use client';

import { useCallback, useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import {
  createPaymentMethod,
  deletePaymentMethod,
  listPaymentMethods,
  setPrimaryPaymentMethod,
} from '@/lib/api/billing';
import { getErrorMessage } from '@/lib/api/errors';
import type { PaymentMethod } from '@/lib/api/types';

export default function CardWallet() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listPaymentMethods();
      setMethods(response.methods ?? []);
      setStripeEnabled(!!response.stripeEnabled);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load payment methods'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void reload();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [reload]);

  async function setPrimary(id: string) {
    await setPrimaryPaymentMethod(id);
    void reload();
  }

  async function remove(id: string) {
    if (!confirm('Remove this card?')) return;
    await deletePaymentMethod(id);
    void reload();
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-1)' }}>Payment methods</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-4)', marginTop: 2 }}>
            Cards used to bill your subscriptions. {stripeEnabled ? 'Secured by Stripe.' : 'Simulator mode — add a Stripe key to use real card processing.'}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={13} /> Add card
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--danger,#dc2626)', fontSize: 13, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="muted" style={{ fontSize: 13 }}>Loading…</div>
      ) : methods.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <div className="muted" style={{ fontSize: 13.5 }}>No cards yet. Add one to enable subscriptions.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {methods.map(m => (
            <div key={m.id} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 30, borderRadius: 6, background: 'var(--brand-soft)', color: 'var(--brand)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700 }}>
                {m.brand.slice(0, 4).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-1)' }}>
                  {m.brand} •••• {m.last4}
                  {m.isPrimary && (
                    <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 999, background: 'var(--brand-soft)', color: 'var(--brand)', fontSize: 11, fontWeight: 600 }}>Primary</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 2 }}>
                  Expires {String(m.expMonth).padStart(2, '0')}/{String(m.expYear).slice(-2)}
                </div>
              </div>
              {!m.isPrimary && (
                <button className="btn" onClick={() => setPrimary(m.id)}>Make primary</button>
              )}
              <button className="btn" onClick={() => remove(m.id)} title="Remove">
                <Icon name="trash" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddCardModal onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); void reload(); }} stripeEnabled={stripeEnabled} />}
    </div>
  );
}

function AddCardModal({ onClose, onAdded, stripeEnabled }: { onClose: () => void; onAdded: () => void; stripeEnabled: boolean }) {
  const [number, setNumber] = useState('');
  const [exp, setExp] = useState('');
  const [cvc, setCvc] = useState('');
  const [setPrimary, setSetPrimary] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const [mm, yy] = exp.split('/').map(s => s.trim());
    if (!mm || !yy) { setError('Use MM/YY format for expiry.'); return; }
    const expMonth = parseInt(mm, 10);
    const expYear = 2000 + parseInt(yy, 10);
    setBusy(true); setError(null);
    try {
      await createPaymentMethod({
        number: number.replace(/\s+/g, ''),
        expMonth,
        expYear,
        cvc,
        setAsPrimary: setPrimary,
      });
      setBusy(false);
      onAdded();
    } catch (err) {
      setBusy(false);
      setError(getErrorMessage(err, 'Failed to add card.'));
      return;
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 100 }} onClick={onClose}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ width: 'min(420px, 92vw)', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Add a card</h3>
          <button className="btn" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        {!stripeEnabled && (
          <div style={{ padding: '8px 10px', background: 'var(--brand-soft)', color: 'var(--brand)', borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
            Simulator mode: any 4242… style test number works (Luhn-valid).
          </div>
        )}
        <form onSubmit={submit}>
          <label className="field-label">Card number</label>
          <input className="input" inputMode="numeric" placeholder="4242 4242 4242 4242" value={number}
                 onChange={e => setNumber(formatNumber(e.target.value))} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            <div>
              <label className="field-label">Expiry</label>
              <input className="input" placeholder="MM/YY" value={exp} onChange={e => setExp(formatExp(e.target.value))} required />
            </div>
            <div>
              <label className="field-label">CVC</label>
              <input className="input" inputMode="numeric" placeholder="123" value={cvc} onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))} required />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 13 }}>
            <input type="checkbox" checked={setPrimary} onChange={e => setSetPrimary(e.target.checked)} />
            Set as primary payment method
          </label>
          {error && <div style={{ marginTop: 12, color: 'var(--danger,#dc2626)', fontSize: 13 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy} style={{ flex: 1 }}>{busy ? 'Adding…' : 'Add card'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatNumber(s: string) {
  const d = s.replace(/\D/g, '').slice(0, 19);
  return d.replace(/(\d{4})(?=\d)/g, '$1 ');
}
function formatExp(s: string) {
  const d = s.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}
