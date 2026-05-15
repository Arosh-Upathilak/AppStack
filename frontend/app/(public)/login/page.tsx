'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Icon from '@/components/Icon';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (!res || res.error) {
        throw new Error('Invalid email or password.');
      }
      // Decide destination by role — server already set cookie; ask the session
      const me = await fetch('/api/me').then(r => r.json()).catch(() => null);
      const roles: string[] = me?.roles ?? [];
      const dest =
        next ||
        (roles.includes('ADMIN') ? '/admin' :
         roles.includes('SELLER') ? '/seller' :
         '/buyer');
      router.push(dest);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pub-auth-page">
      <div className="pub-auth-card">
        <div className="pub-auth-logo">
          <div className="pub-brand-mark" style={{ width: 40, height: 40, fontSize: 18 }}>A</div>
        </div>
        <h1 className="pub-auth-title">Welcome back</h1>
        <p className="pub-auth-sub">Log in to your AppStack account</p>

        <form className="pub-auth-form" onSubmit={submit}>
          <label className="field-label">Email address</label>
          <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="you@company.com" />

          <label className="field-label" style={{ marginTop: 14 }}>Password</label>
          <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" placeholder="••••••••" />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <Link href="/forgot" style={{ fontSize: 12.5, color: 'var(--brand)', fontWeight: 500 }}>Forgot password?</Link>
          </div>

          {error && <div style={{ marginTop: 12, color: 'var(--danger,#dc2626)', fontSize: 13 }}>{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: '100%', height: 40, marginTop: 20, fontSize: 14 }}>
            {busy ? 'Signing in…' : <>Log in <Icon name="arrow_right" size={13} /></>}
          </button>
        </form>

        <p className="pub-auth-switch">
          Don&apos;t have an account? <Link href="/register">Create one free</Link>
        </p>
      </div>
    </div>
  );
}
