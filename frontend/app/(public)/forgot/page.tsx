'use client';

import Link from 'next/link';
import { useState } from 'react';
import Icon from '@/components/Icon';

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch('/api/password-reset/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    setBusy(false);
    setDone(true);
  }

  return (
    <div className="pub-auth-page">
      <div className="pub-auth-card">
        <div className="pub-auth-logo">
          <div className="pub-brand-mark" style={{ width: 40, height: 40, fontSize: 18 }}>A</div>
        </div>
        <h1 className="pub-auth-title">Reset your password</h1>
        <p className="pub-auth-sub">
          {done
            ? 'If an account exists for that email, a reset link is on its way.'
            : 'Enter your email and we’ll send a reset link.'}
        </p>

        {!done && (
          <form className="pub-auth-form" onSubmit={submit}>
            <label className="field-label">Email</label>
            <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: '100%', height: 40, marginTop: 16 }}>
              {busy ? 'Sending…' : <>Send reset link <Icon name="arrow_right" size={13} /></>}
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
