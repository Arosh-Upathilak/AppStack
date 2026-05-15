'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Icon from '@/components/Icon';

type Step = 'role' | 'details' | 'otp' | 'pending-approval';

interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role: 'BUYER' | 'SELLER';
}

export default function RegisterPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next');

  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<'BUYER' | 'SELLER' | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    setBusy(true); setError(null);
    const payload: RegisterPayload = {
      email: email.trim().toLowerCase(),
      password,
      name: `${firstName} ${lastName}`.trim(),
      role,
    };
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Registration failed');
      setStep('otp');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, purpose: 'REGISTER' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Verification failed');

      // REQ-10: seller stays pending approval; buyer auto-signs in.
      if (role === 'SELLER') {
        setStep('pending-approval');
        return;
      }
      const signed = await signIn('credentials', { email, password, redirect: false });
      if (signed?.error) throw new Error(signed.error);
      router.push(next || '/buyer');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function resendOtp() {
    setError(null);
    const res = await fetch('/api/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, purpose: 'REGISTER' }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || 'Could not resend code.');
    }
  }

  return (
    <div className="pub-auth-page">
      <div className="pub-auth-card" style={{ maxWidth: 520 }}>
        <div className="pub-auth-logo">
          <div className="pub-brand-mark" style={{ width: 40, height: 40, fontSize: 18 }}>A</div>
        </div>

        <Steps current={step} />

        {step === 'role' && (
          <>
            <h1 className="pub-auth-title">Create your account</h1>
            <p className="pub-auth-sub">First, tell us what brings you to AppStack.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
              {[
                { icon: 'box', label: 'Manage subscriptions', sub: 'Buy and manage SaaS tools', value: 'BUYER' as const },
                { icon: 'package', label: 'Sell my SaaS', sub: 'List products and collect payments', value: 'SELLER' as const },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setRole(opt.value); setStep('details'); }}
                  style={{
                    padding: '16px 16px',
                    border: `1.5px solid ${role === opt.value ? 'var(--brand)' : 'var(--line)'}`,
                    borderRadius: 12, cursor: 'pointer', background: 'transparent', textAlign: 'left',
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--brand-soft)', color: 'var(--brand)', display: 'grid', placeItems: 'center', marginBottom: 10 }}>
                    <Icon name={opt.icon as Parameters<typeof Icon>[0]['name']} size={16} />
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-1)' }}>{opt.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 2 }}>{opt.sub}</div>
                </button>
              ))}
            </div>
            <p className="pub-auth-switch">
              Already have an account? <Link href="/login">Log in</Link>
            </p>
          </>
        )}

        {step === 'details' && (
          <>
            <h1 className="pub-auth-title">Your details</h1>
            <p className="pub-auth-sub">Creating a {role === 'SELLER' ? 'seller' : 'buyer'} account.</p>
            <form className="pub-auth-form" onSubmit={submitDetails}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="field-label">First name</label>
                  <input className="input" value={firstName} onChange={e => setFirstName(e.target.value)} required autoComplete="given-name" />
                </div>
                <div>
                  <label className="field-label">Last name</label>
                  <input className="input" value={lastName} onChange={e => setLastName(e.target.value)} required autoComplete="family-name" />
                </div>
              </div>
              <label className="field-label" style={{ marginTop: 14 }}>Work email</label>
              <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
              <label className="field-label" style={{ marginTop: 14 }}>Password</label>
              <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" />
              <div style={{ marginTop: 14, fontSize: 12, color: 'var(--ink-4)', lineHeight: 1.5 }}>
                By creating an account you agree to our <a href="#terms" style={{ color: 'var(--brand)' }}>Terms</a> and <a href="#privacy" style={{ color: 'var(--brand)' }}>Privacy Policy</a>. Consent is recorded for GDPR.
              </div>
              {error && <div style={{ marginTop: 12, color: 'var(--danger,#dc2626)', fontSize: 13 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button type="button" className="btn" onClick={() => setStep('role')} style={{ height: 40 }}>Back</button>
                <button type="submit" className="btn btn-primary" disabled={busy} style={{ flex: 1, height: 40 }}>
                  {busy ? 'Sending code…' : <>Send verification code <Icon name="arrow_right" size={13} /></>}
                </button>
              </div>
            </form>
          </>
        )}

        {step === 'otp' && (
          <>
            <h1 className="pub-auth-title">Check your email</h1>
            <p className="pub-auth-sub">
              We sent a 6-digit code to <strong>{email}</strong>. It expires in 10 minutes.
            </p>
            <form className="pub-auth-form" onSubmit={submitOtp}>
              <label className="field-label">Verification code</label>
              <input
                className="input"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                inputMode="numeric"
                pattern="\d{6}"
                autoComplete="one-time-code"
                placeholder="••••••"
                style={{ letterSpacing: 8, textAlign: 'center', fontSize: 18 }}
              />
              {error && <div style={{ marginTop: 12, color: 'var(--danger,#dc2626)', fontSize: 13 }}>{error}</div>}
              <button type="submit" className="btn btn-primary" disabled={busy || code.length !== 6} style={{ width: '100%', height: 40, marginTop: 16 }}>
                {busy ? 'Verifying…' : <>Verify and continue <Icon name="arrow_right" size={13} /></>}
              </button>
              <button type="button" onClick={resendOtp} style={{ marginTop: 12, background: 'transparent', border: 0, color: 'var(--brand)', fontSize: 12.5, cursor: 'pointer' }}>
                Resend code
              </button>
            </form>
          </>
        )}

        {step === 'pending-approval' && (
          <>
            <h1 className="pub-auth-title">Awaiting approval</h1>
            <p className="pub-auth-sub">
              Thanks — your seller account has been created. An administrator will review it shortly. We&apos;ll email you when it&apos;s approved so you can sign in.
            </p>
            <Link href="/" className="btn btn-primary" style={{ width: '100%', height: 40, marginTop: 8 }}>
              Back to home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function Steps({ current }: { current: Step }) {
  const order: Step[] = ['role', 'details', 'otp'];
  const idx = current === 'pending-approval' ? 2 : order.indexOf(current);
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
      {order.map((s, i) => (
        <span
          key={s}
          style={{
            width: 36, height: 4, borderRadius: 2,
            background: i <= idx ? 'var(--brand)' : 'var(--line)',
            transition: 'background 200ms',
          }}
        />
      ))}
    </div>
  );
}
