'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Icon from '@/components/Icon';

export default function BuyerHome() {
  const router = useRouter();
  const { data: session } = useSession();

  const user = session?.user;
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';

  const roles = session?.user.role ?? [];
  const sellerStatus = session?.user.sellerStatus ?? null;

  const showBecomeSeller = !roles.includes('SELLER') && !sellerStatus;

  return (
    <div className="page screen-enter">
      <div className="page-head" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Welcome back, {displayName}</h1>
          <p className="page-sub">Manage your AppStack workspace and applications here.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Become a Seller card */}
        {showBecomeSeller && (
          <div
            className="card card-pad"
            style={{
              background: 'linear-gradient(180deg, var(--surface), var(--brand-soft))',
              borderColor: 'var(--brand-soft-2, var(--line))',
            }}
          >
            <div className="row gap-3" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="row gap-3">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--brand)', color: '#fff', display: 'grid', placeItems: 'center' }}>
                  <Icon name="package" size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-1)' }}>Sell your SaaS on AppStack</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>Reach buyers actively managing their stack. Apply and an admin will review your account.</div>
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => router.push('/buyer/become-seller')}>
                Apply to sell <Icon name="arrow_right" size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Pending seller application card */}
        {sellerStatus === 'PENDING' && (
          <div
            className="card card-pad"
            style={{
              background: 'linear-gradient(180deg, var(--surface), var(--warning-soft, #fef3c7))',
              borderColor: 'var(--line)',
            }}
          >
            <div className="row gap-3" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="row gap-3">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--warning, #d97706)', color: '#fff', display: 'grid', placeItems: 'center' }}>
                  <Icon name="clock" size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-1)' }}>Seller Application Pending</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>Your application is currently being reviewed by administrators. We will notify you once a decision is made.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Approved seller status */}
        {sellerStatus === 'APPROVED' && (
          <div
            className="card card-pad"
            style={{
              background: 'linear-gradient(180deg, var(--surface), var(--success-soft, #d1fae5))',
              borderColor: 'var(--line)',
            }}
          >
            <div className="row gap-3" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="row gap-3">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--success, #059669)', color: '#fff', display: 'grid', placeItems: 'center' }}>
                  <Icon name="check_circle" size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-1)' }}>Seller Application Approved!</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>You are now registered as a seller. Use the role switcher in the sidebar to open the Seller portal.</div>
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => router.push('/seller')}>
                Go to Seller Portal <Icon name="arrow_right" size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Rejected seller status */}
        {sellerStatus === 'REJECTED' && (
          <div
            className="card card-pad"
            style={{
              background: 'linear-gradient(180deg, var(--surface), var(--danger-soft, #fee2e2))',
              borderColor: 'var(--line)',
            }}
          >
            <div className="row gap-3" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="row gap-3">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--danger, #dc2626)', color: '#fff', display: 'grid', placeItems: 'center' }}>
                  <Icon name="x" size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-1)' }}>Seller Application Rejected</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>Unfortunately, your application was not approved. You can review your details and reapply below.</div>
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => router.push('/buyer/become-seller')}>
                Reapply <Icon name="arrow_right" size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Quick links info card */}
        <div className="card card-pad" style={{ background: 'var(--surface-muted)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Getting Started</h2>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>
            Use the <strong>Marketplace</strong> to browse SaaS offerings. To begin selling your own software products, apply using the Become a Seller card above. Stay updated on approvals or system alerts via the <strong>Notification</strong> tab.
          </p>
        </div>
      </div>
    </div>
  );
}
