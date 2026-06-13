'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Icon from '@/components/Icon';
import AppLogo from '@/components/AppLogo';
import Badge from '@/components/Badge';
import { ToastContext } from '@/components/DashboardChrome';
import { getProduct, listReviews, checkReviewEligibility, submitProductReview } from '@/lib/api/products';
import {
  createSubscription,
  listPaymentMethods,
} from '@/lib/api/billing';
import { getErrorMessage } from '@/lib/api/errors';
import type { PaymentMethod, Product, ProductPlan, Review } from '@/lib/api/types';

interface ProductDetailProps {
  productId: string;
  mode?: 'buyer' | 'public';
}

function money(cents: number, currency = 'USD') {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div style={{ padding: 16, border: '1px solid var(--line)', borderRadius: 10 }}>
      <div className="row gap-1" style={{ marginBottom: 8 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <Icon
            key={i}
            name="star"
            size={11}
            stroke={0}
            style={{ fill: i <= review.rating ? '#f59e0b' : 'var(--line)', color: i <= review.rating ? '#f59e0b' : 'var(--line)' }}
          />
        ))}
      </div>
      <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, margin: '0 0 12px' }}>&quot;{review.body}&quot;</p>
      <div className="row gap-2">
        <div className="sb-avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{review.authorName.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600 }}>{review.authorName}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{review.authorRole ?? 'Verified buyer'}</div>
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  active,
  onClick,
}: {
  plan: ProductPlan;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card"
      style={{
        padding: 16,
        textAlign: 'left',
        borderColor: active ? 'var(--brand)' : 'var(--line)',
        boxShadow: active ? '0 0 0 1px var(--brand)' : undefined,
      }}
    >
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-1)' }}>{plan.name}</div>
        {active && <Icon name="check_circle" size={16} style={{ color: 'var(--brand)' }} />}
      </div>
      <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--ink-1)', marginBottom: 10 }}>
        {money(plan.priceCents, plan.currency)}
        <span style={{ fontSize: 12, color: 'var(--ink-4)', fontWeight: 500 }}>/{plan.billingInterval === 'YEARLY' ? 'yr' : 'mo'}</span>
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {plan.features.slice(0, 4).map(feature => (
          <span key={feature} className="row gap-2" style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
            <Icon name="check" size={12} style={{ color: 'var(--success)' }} />
            {feature}
          </span>
        ))}
      </div>
    </button>
  );
}

function CheckoutModal({
  product,
  plan,
  methods,
  defaultEmail,
  submitting,
  onClose,
  onConfirm,
}: {
  product: Product;
  plan: ProductPlan;
  methods: PaymentMethod[];
  defaultEmail: string;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (input: { paymentMethodId: string; recipientEmail: string; seats: number; acceptEmailConsent: boolean }) => void;
}) {
  const primary = methods.find(method => method.isPrimary) ?? methods[0];
  const [paymentMethodId, setPaymentMethodId] = React.useState(primary?.id ?? '');
  const [recipientEmail, setRecipientEmail] = React.useState(defaultEmail);
  const [seats, setSeats] = React.useState(1);
  const [acceptEmailConsent, setAcceptEmailConsent] = React.useState(false);
  const total = plan.priceCents * Math.max(1, seats);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="row gap-3" style={{ alignItems: 'center', marginBottom: 16 }}>
          <AppLogo name={product.name} hue={product.hue} size="lg" />
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Confirm subscription</h3>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>{product.name} · {plan.name}</div>
          </div>
        </div>

        {methods.length === 0 ? (
          <div className="card" style={{ padding: 16, background: 'var(--surface-muted)', marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Add a payment method first</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>
              Open buyer settings and add a simulator card before subscribing.
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
            <div>
              <label className="field-label">Recipient email shared with seller</label>
              <input className="input" type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label className="field-label">Seats</label>
                <input className="input" type="number" min={1} value={seats} onChange={e => setSeats(Number(e.target.value))} />
              </div>
              <div>
                <label className="field-label">Payment method</label>
                <select className="input" value={paymentMethodId} onChange={e => setPaymentMethodId(e.target.value)}>
                  {methods.map(method => (
                    <option key={method.id} value={method.id}>
                      {method.brand} ending {method.last4}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <label style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
              <input
                type="checkbox"
                checked={acceptEmailConsent}
                onChange={e => setAcceptEmailConsent(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              I agree that AppStack may share the recipient email with {product.vendor} to activate and manage this SaaS subscription.
            </label>
          </div>
        )}

        <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
          <div className="row" style={{ justifyContent: 'space-between', padding: '10px 14px', fontSize: 13 }}>
            <span style={{ color: 'var(--ink-3)' }}>Plan</span>
            <span style={{ fontWeight: 500 }}>{plan.name}</span>
          </div>
          <div className="row" style={{ justifyContent: 'space-between', padding: '12px 14px', background: 'var(--surface-muted)' }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Total now</span>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink-1)' }}>{money(total, plan.currency)}</div>
          </div>
        </div>

        <div className="row gap-2" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={submitting || methods.length === 0 || !acceptEmailConsent}
            onClick={() => onConfirm({ paymentMethodId, recipientEmail, seats, acceptEmailConsent })}
          >
            {submitting ? 'Processing...' : <>Confirm subscription <Icon name="arrow_right" size={13} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail({ productId, mode = 'buyer' }: ProductDetailProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const toastCtx = React.useContext(ToastContext);
  const toast = toastCtx?.toast ?? (() => {});
  const [product, setProduct] = React.useState<Product | null>(null);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [methods, setMethods] = React.useState<PaymentMethod[]>([]);
  const [selectedPlanId, setSelectedPlanId] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showCheckout, setShowCheckout] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [eligible, setEligible] = React.useState(false);
  const [submittingReview, setSubmittingReview] = React.useState(false);
  const [rating, setRating] = React.useState(5);
  const [reviewBody, setReviewBody] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      Promise.all([
        getProduct(productId),
        listReviews(productId),
        mode === 'buyer' ? listPaymentMethods().catch(() => ({ methods: [] })) : Promise.resolve({ methods: [] }),
        mode === 'buyer' ? checkReviewEligibility(productId).catch(() => false) : Promise.resolve(false),
      ])
        .then(([loadedProduct, loadedReviews, paymentResponse, eligibleToReview]) => {
          if (cancelled) return;
          if (!loadedProduct) {
            setError('Product not found.');
            return;
          }
          setProduct(loadedProduct);
          setReviews(loadedReviews);
          setMethods(paymentResponse.methods);
          setEligible(eligibleToReview);
          setSelectedPlanId(loadedProduct.plans.find(plan => plan.isActive)?.id ?? loadedProduct.plans[0]?.id ?? '');
        })
        .catch(err => {
          if (!cancelled) setError(getErrorMessage(err, 'Failed to load product'));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [mode, productId]);

  if (loading) {
    return <div className="page screen-enter"><div className="card card-pad">Loading product...</div></div>;
  }

  if (error || !product) {
    return (
      <div className="page screen-enter">
        <div className="card card-pad" style={{ color: 'var(--danger,#dc2626)' }}>{error ?? 'Product not found.'}</div>
      </div>
    );
  }

  const selectedPlan = product.plans.find(plan => plan.id === selectedPlanId) ?? product.plans[0];
  const backHref = mode === 'buyer' ? '/buyer/marketplace' : '/marketplace';

  const ctaAction = () => {
    if (mode === 'public') {
      router.push(`/register?next=/marketplace/${product.slug}`);
      return;
    }
    setShowCheckout(true);
  };

  const handleConfirm = async (input: {
    paymentMethodId: string;
    recipientEmail: string;
    seats: number;
    acceptEmailConsent: boolean;
  }) => {
    if (!selectedPlan) return;
    setSubmitting(true);
    try {
      const result = await createSubscription({
        productId: product.id,
        planId: selectedPlan.id,
        paymentMethodId: input.paymentMethodId,
        recipientEmail: input.recipientEmail,
        seats: input.seats,
        acceptEmailConsent: input.acceptEmailConsent,
      });
      toast(
        result.subscription.status === "PENDING"
          ? `${product.name} is pending SaaS activation`
          : `Subscribed to ${product.name}`,
      );
      setShowCheckout(false);
      router.push('/buyer/settings');
    } catch (err) {
      toast(getErrorMessage(err, 'Could not complete subscription.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBody.trim()) return;

    setSubmittingReview(true);
    try {
      await submitProductReview(productId, { rating, body: reviewBody.trim() });
      toast('Thank you! Your review has been submitted.');
      setReviewBody('');
      setRating(5);
      // Reload reviews and eligibility
      const loadedReviews = await listReviews(productId);
      setReviews(loadedReviews);
      setEligible(false); // Can review only once or hide form after submit
      // Let's also reload the product to update the rating and reviewsCount
      const loadedProduct = await getProduct(productId);
      if (loadedProduct) {
        setProduct(loadedProduct);
      }
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to submit review.'));
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="page screen-enter">
      <div className="row gap-2" style={{ marginBottom: 18 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.push(backHref)}>
          <Icon name="arrow_left" size={12} /> Back to Marketplace
        </button>
      </div>

      <div className="card card-pad" style={{ marginBottom: 24 }}>
        <div className="row gap-4" style={{ alignItems: 'flex-start' }}>
          <AppLogo name={product.name} hue={product.hue} size="xl" />
          <div style={{ flex: 1 }}>
            <div className="row gap-2" style={{ marginBottom: 6 }}>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>{product.name}</h1>
              <Badge tone="brand"><Icon name="check" size={10} /> Approved</Badge>
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 14, marginBottom: 14, maxWidth: 680 }}>{product.shortDescription}</div>
            <div className="row gap-4" style={{ flexWrap: 'wrap' }}>
              <span className="row gap-1" style={{ display: 'inline-flex' }}>
                <Icon name="star" size={13} stroke={0} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                <strong style={{ color: 'var(--ink-1)' }}>{product.rating || 'New'}</strong>
                <span className="muted">({product.reviewsCount.toLocaleString()} reviews)</span>
              </span>
              <span className="row gap-1 muted"><Icon name="users" size={13} />{product.vendor}</span>
              <span className="row gap-1 muted"><Icon name="shield" size={13} />Consent recorded per subscription</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <div className="card card-pad">
            <h3 style={{ margin: '0 0 12px', fontSize: 17, fontWeight: 600 }}>About {product.name}</h3>
            <p style={{ color: 'var(--ink-2)', lineHeight: 1.65, margin: 0 }}>{product.description}</p>
          </div>

          <div className="card card-pad">
            <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Reviews</h3>
            {reviews.length === 0 ? (
              <div className="muted" style={{ fontSize: 13 }}>No reviews yet.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {reviews.map(review => <ReviewCard key={review.id} review={review} />)}
              </div>
            )}

            {eligible && (
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 20, paddingTop: 16 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14.5, fontWeight: 600, color: 'var(--ink-1)' }}>Write a Review</h4>
                <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="row gap-2" style={{ alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Rating:</span>
                    <div className="row gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer' }}
                        >
                          <Icon
                            name="star"
                            size={16}
                            stroke={0}
                            style={{
                              fill: star <= rating ? '#f59e0b' : 'var(--line)',
                              color: star <= rating ? '#f59e0b' : 'var(--line)',
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <textarea
                      required
                      className="input"
                      rows={3}
                      placeholder="Share your experience using this product..."
                      style={{ width: '100%', minHeight: 80, fontSize: 13, resize: 'vertical' }}
                      value={reviewBody}
                      onChange={e => setReviewBody(e.target.value)}
                    />
                  </div>
                  <div className="row" style={{ justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={submittingReview}
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        <aside className="card card-pad">
          <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 600 }}>Choose a plan</h3>
          <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
            {product.plans.filter(plan => plan.isActive).map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                active={selectedPlanId === plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
              />
            ))}
          </div>
          <button className="btn btn-primary" style={{ width: '100%', height: 42, justifyContent: 'center' }} onClick={ctaAction} disabled={!selectedPlan}>
            {mode === 'buyer' ? 'Subscribe' : 'Sign up to subscribe'} <Icon name="arrow_right" size={13} />
          </button>
          {mode === 'buyer' && methods.length === 0 && (
            <button className="btn btn-secondary" style={{ width: '100%', height: 38, justifyContent: 'center', marginTop: 10 }} onClick={() => router.push('/buyer/settings')}>
              Add payment method
            </button>
          )}
        </aside>
      </div>

      {showCheckout && selectedPlan && (
        <CheckoutModal
          product={product}
          plan={selectedPlan}
          methods={methods}
          defaultEmail={session?.user.email ?? ''}
          submitting={submitting}
          onClose={() => setShowCheckout(false)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
