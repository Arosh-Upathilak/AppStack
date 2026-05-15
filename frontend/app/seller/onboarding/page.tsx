'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Icon from '@/components/Icon';

export default function SellerOnboardingPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [payoutEmail, setPayoutEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/seller/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: companyName.trim(), payoutEmail: payoutEmail.trim().toLowerCase() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not save. Please try again.');
      router.push('/seller');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 24px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--brand-soft)', color: 'var(--brand)', display: 'grid', placeItems: 'center', marginBottom: 16 }}>
          <Icon name="package" size={22} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink-1)', margin: 0 }}>
          Finish setting up your seller account
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-4)', marginTop: 6 }}>
          A few more details before we submit your account for review.
        </p>
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="field-label">Company name</label>
          <input
            className="input"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            required
            placeholder="Acme Corp"
            autoComplete="organization"
          />
        </div>

        <div>
          <label className="field-label">Payout email</label>
          <p style={{ fontSize: 12, color: 'var(--ink-4)', margin: '2px 0 6px' }}>
            Where you&apos;ll receive payout notifications and invoices.
          </p>
          <input
            type="email"
            className="input"
            value={payoutEmail}
            onChange={e => setPayoutEmail(e.target.value)}
            required
            placeholder="finance@acmecorp.com"
            autoComplete="email"
          />
        </div>

        {error && (
          <div style={{ color: 'var(--danger,#dc2626)', fontSize: 13 }}>{error}</div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={busy}
          style={{ height: 42, fontSize: 14, marginTop: 4 }}
        >
          {busy ? 'Saving…' : <>Submit for review <Icon name="arrow_right" size={13} /></>}
        </button>
      </form>
    </div>
  );
}
