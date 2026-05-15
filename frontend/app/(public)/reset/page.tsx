'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Icon from '@/components/Icon';

export default function ResetPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const res = await fetch('/api/password-reset/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || 'Failed to reset password.');
      return;
    }
    setDone(true);
    setTimeout(() => router.push('/login'), 1500);
  }

  return (
    <div className="pub-auth-page">
      <div className="pub-auth-card">
        <div className="pub-auth-logo">
          <div className="pub-brand-mark" style={{ width: 40, height: 40, fontSize: 18 }}>A</div>
        </div>
        <h1 className="pub-auth-title">Set a new password</h1>
        <p className="pub-auth-sub">{done ? 'Updated! Redirecting to login…' : 'Choose a new password for your account.'}</p>

        {!done && (
          <form className="pub-auth-form" onSubmit={submit}>
            <label className="field-label">New password</label>
            <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} placeholder="At least 8 characters" autoComplete="new-password" />
            {error && <div style={{ marginTop: 12, color: 'var(--danger,#dc2626)', fontSize: 13 }}>{error}</div>}
            <button type="submit" className="btn btn-primary" disabled={busy || !token} style={{ width: '100%', height: 40, marginTop: 16 }}>
              {busy ? 'Saving…' : <>Update password <Icon name="arrow_right" size={13} /></>}
            </button>
          </form>
        )}

        <p className="pub-auth-switch">
          <Link href="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
