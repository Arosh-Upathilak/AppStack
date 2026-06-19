'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import AppLogo from '@/components/AppLogo';
import Badge from '@/components/Badge';
import { listCategories, listProducts } from '@/lib/api/products';
import type { Product } from '@/lib/api/types';

interface MarketplaceProps {
  /** 'buyer' shows Subscribe CTA; 'public' shows "Sign up" CTA */
  mode?: 'buyer' | 'public';
}

function PromoStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.08, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, marginTop: 4, letterSpacing: '-0.02em' }}>{value}</div>
    </div>
  );
}

function ProductCard({ p, onClick }: { p: Product; onClick: () => void }) {
  const [hovered, setHovered] = React.useState(false);
  const integrations = p.similarTo.length > 0 ? p.similarTo : ['REST API'];
  return (
    <div className="card"
         style={{ padding: 20, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 14,
                  transition: 'border-color 140ms, box-shadow 140ms, transform 140ms',
                  borderColor: hovered ? 'var(--line-strong)' : undefined,
                  transform: hovered ? 'translateY(-1px)' : undefined,
                  boxShadow: hovered ? 'var(--shadow-md)' : undefined }}
         onClick={onClick}
         onMouseEnter={() => setHovered(true)}
         onMouseLeave={() => setHovered(false)}>
      <div className="row" style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <AppLogo name={p.name} hue={p.hue} size="lg" />
        <Badge tone="brand">{p.status === 'APPROVED' ? 'Approved' : p.status}</Badge>
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-1)', letterSpacing: '-0.005em' }}>{p.name}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 2 }}>{p.vendor} · {p.category}</div>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5, minHeight: 40 }}>{p.shortDescription}</p>
      <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
        <span className="row gap-1" style={{ display: 'inline-flex', alignItems: 'center', fontSize: 12 }}>
          <Icon name="star" size={12} stroke={0} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
          <strong>{p.rating || 'New'}</strong>
          <span className="muted">({p.reviewsCount.toLocaleString()})</span>
        </span>
        <span style={{ color: 'var(--ink-5)' }}>·</span>
        <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{integrations.join(' · ')}</span>
      </div>
      <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid var(--line-soft)' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: 0.05, fontWeight: 600 }}>Starting at</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink-1)', fontVariantNumeric: 'tabular-nums' }}>
            ${(p.fromCents / 100).toLocaleString()}<span style={{ color: 'var(--ink-4)', fontSize: 12, fontWeight: 500 }}>/mo</span>
          </div>
        </div>
        <button className="btn btn-soft btn-sm">View details <Icon name="arrow_right" size={11} /></button>
      </div>
    </div>
  );
}

export default function Marketplace({ mode = 'buyer' }: MarketplaceProps) {
  const router = useRouter();
  const [cat, setCat] = React.useState('All');
  const [sort, setSort] = React.useState('Popular');
  const [view, setView] = React.useState<'grid' | 'list'>('grid');
  const [query, setQuery] = React.useState('');
  const [items, setItems] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<string[]>(['All']);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      Promise.all([listProducts({ category: cat, query }), listCategories()])
        .then(([products, cats]) => {
          if (cancelled) return;
          const sorted = [...products].sort((a, b) => {
            if (sort === 'Top rated') return b.rating - a.rating;
            if (sort === 'New') return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
            return b.reviewsCount - a.reviewsCount;
          });
          setItems(sorted);
          setCategories(cats);
        })
        .catch(() => {
          if (!cancelled) setError('Could not load marketplace products.');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [cat, query, sort]);

  const basePath = mode === 'buyer' ? '/buyer/marketplace' : '/marketplace';
  const handleProductClick = (id: string) => router.push(`${basePath}/${id}`);

  return (
    <div className="page screen-enter">
      <div className="page-head">
        <div>
          <h1 className="page-title">Marketplace</h1>
          <p className="page-sub">Discover and subscribe to enterprise-grade software, all in one stack.</p>
        </div>
        <div className="page-actions">
          <div className="seg">
            <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}><Icon name="grid" size={12} /> Grid</button>
            <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><Icon name="menu" size={12} /> List</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(120deg, #0a1330 0%, #003d9b 60%, #1e6ff5 100%)', borderColor: 'transparent', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.08, background: 'radial-gradient(circle at 80% 50%, #fff 0%, transparent 50%)' }} />
        <div style={{ padding: '28px 28px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, color: '#fff', position: 'relative' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.08, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>Featured · This week</div>
            <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, marginBottom: 10, lineHeight: 1.2 }}>
              Build your enterprise stack <br />without the procurement headache.
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 0, marginBottom: 18, maxWidth: 460, lineHeight: 1.55 }}>
              10,000+ businesses centralize licenses, billing and access control on AppStack. New: SOC 2 compliance verified for every Verified Partner.
            </p>
            <div className="row gap-2">
              <button className="btn" style={{ background: '#fff', color: 'var(--ink-1)' }}><Icon name="play" size={12} /> 2 min tour</button>
              <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}><Icon name="shield" size={12} /> View security</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, alignContent: 'center' }}>
            <PromoStat label="Verified apps" value="248" />
            <PromoStat label="Active integrations" value="1.2K" />
            <PromoStat label="Avg. setup time" value="8m" />
            <PromoStat label="Customer NPS" value="71" />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          {categories.map(c => (
            <button key={c} className={`pill ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>
              {c}{cat === c && c !== 'All' && <Icon name="x" size={11} />}
            </button>
          ))}
        </div>
        <div className="row gap-2" style={{ marginLeft: 'auto' }}>
          <div className="tb-search" style={{ width: 240, marginLeft: 0 }}>
            <Icon name="search" size={13} className="tb-search-icon" />
            <input placeholder="Search apps…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <div className="seg">
            <button className={sort === 'Popular' ? 'active' : ''} onClick={() => setSort('Popular')}>Popular</button>
            <button className={sort === 'Top rated' ? 'active' : ''} onClick={() => setSort('Top rated')}>Top rated</button>
            <button className={sort === 'New' ? 'active' : ''} onClick={() => setSort('New')}>New</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, fontSize: 13, color: 'var(--ink-3)' }}>
        <span><strong style={{ color: 'var(--ink-1)' }}>{items.length}</strong> {cat === 'All' ? '' : `${cat} `}{items.length === 1 ? 'app' : 'apps'} found</span>
        <span className="muted">{loading ? 'Loading...' : 'Live catalog'}</span>
      </div>

      {error && (
        <div className="card" style={{ padding: 16, color: 'var(--danger,#dc2626)', marginBottom: 16 }}>{error}</div>
      )}

      {loading ? (
        <div className="card card-pad">Loading marketplace...</div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-1)', marginBottom: 6 }}>No apps found</div>
          <div className="muted" style={{ fontSize: 13.5 }}>
            Nothing matches{query.trim() ? ` “${query.trim()}”` : ''}{cat !== 'All' ? ` in ${cat}` : ''}. Try a different search or category.
          </div>
        </div>
      ) : view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {items.map(p => <ProductCard key={p.id} p={p} onClick={() => handleProductClick(p.id)} />)}
        </div>
      ) : (
        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Product</th>
                <th>Category</th>
                <th>Rating</th>
                <th className="num">Starts at</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(p => (
                <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => handleProductClick(p.id)}>
                  <td style={{ paddingLeft: 20 }}>
                    <div className="row gap-3">
                      <AppLogo name={p.name} hue={p.hue} size="sm" />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--ink-1)' }}>{p.name}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{p.shortDescription}</div>
                      </div>
                    </div>
                  </td>
                  <td><Badge>{p.category}</Badge></td>
                  <td>
                    <span className="row gap-1" style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <Icon name="star" size={12} stroke={0} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                      <strong style={{ color: 'var(--ink-1)' }}>{p.rating || 'New'}</strong>
                      <span className="muted">· {p.reviewsCount.toLocaleString()}</span>
                    </span>
                  </td>
                  <td className="num" style={{ fontWeight: 600, color: 'var(--ink-1)' }}>${(p.fromCents / 100).toLocaleString()}<span className="muted" style={{ fontWeight: 400 }}>/mo</span></td>
                  <td className="col-action"><button className="btn btn-secondary btn-sm">View <Icon name="arrow_right" size={11} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
