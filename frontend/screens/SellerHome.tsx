'use client';

import React from 'react';
import Icon from '@/components/Icon';
import { useToastContext } from '@/components/DashboardChrome';

export default function SellerHome() {
  const { toast } = useToastContext();

  return (
    <div className="page screen-enter">
      <div className="page-head" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Seller Portal</h1>
          <p className="page-sub">Track your sales and payouts here.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => toast('Exported')}>
            <Icon name="download" size={13} /> Export
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Blue Balance Overview Card */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #0a1330 0%, #003d9b 100%)',
            borderColor: 'transparent',
            color: '#fff',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: -40,
              top: -40,
              width: 240,
              height: 240,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0, 170, 194, 0.25), transparent 70%)',
            }}
          />
          <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32, position: 'relative' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.08, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                Available balance
              </div>
              <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: 8 }}>
                $14,250.00
              </div>
              <div className="row gap-2" style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                <Icon name="arrow_up" size={12} /> +12.5% this month
              </div>
              <div className="row gap-2" style={{ marginTop: 20 }}>
                <button
                  className="btn"
                  style={{ background: '#fff', color: 'var(--ink-1)', cursor: 'pointer' }}
                  onClick={() => toast('Payout requested')}
                >
                  Request payout <Icon name="arrow_right" size={12} />
                </button>
              </div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.08, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                Pending funds
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginBottom: 4 }}>
                $3,180.50
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>
                Clearing in 2-3 business days based on standard lock period.
              </div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.08, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                Last payout
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginBottom: 4 }}>
                $8,450.00
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                To Chase ··4592 · Oct 1, 2024
              </div>
              <div className="row gap-1" style={{ marginTop: 10, fontSize: 11.5 }}>
                <Icon name="check_circle" size={11} style={{ color: '#3fdda3' }} />
                <span style={{ color: 'rgba(255,255,255,0.85)' }}>Completed in 1.2 days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="card card-pad" style={{ background: 'var(--surface-muted)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Seller Overview</h2>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>
            This portal shows payout history and active balances. SaaS product management and subscription details are mocked in this version of the demo and are not backed by real APIs.
          </p>
        </div>
      </div>
    </div>
  );
}
