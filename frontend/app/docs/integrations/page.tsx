import Link from "next/link";

const samplePayload = `{
  "event": "subscription.created",
  "mode": "LIVE",
  "data": {
    "subscriptionId": "sub_123",
    "buyerEmail": "recipient@example.com",
    "planIdentifier": "professional",
    "seats": 3,
    "priceCents": 4900,
    "currency": "USD"
  },
  "timestamp": "2026-06-13T10:30:00.000Z"
}`;

const ackPayload = `{
  "eventId": "evt_123",
  "action": "activate",
  "accepted": true,
  "message": "Workspace provisioned"
}`;

export default function IntegrationDocsPage() {
  return (
    <main className="page screen-enter" style={{ display: "grid", gap: 24, maxWidth: 980 }}>
      <div>
        <Link href="/" className="btn btn-ghost btn-sm" style={{ marginBottom: 18 }}>
          Back to AppStack
        </Link>
        <h1 className="page-title">AppStack Integration Docs</h1>
        <p className="page-sub">
          Use signed webhooks and acknowledgement calls to activate, change, and cancel SaaS subscriptions.
        </p>
      </div>

      <section className="card card-pad" style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Webhook delivery</h2>
        <p style={{ margin: 0, color: "var(--ink-2)", lineHeight: 1.6 }}>
          AppStack sends JSON payloads to the product webhook URL configured by the seller. Delivery includes a signed payload and an event id. Failed events are retried with persisted backoff and can be retried from the seller integration console.
        </p>
        <pre style={{ margin: 0, padding: 14, borderRadius: 8, background: "var(--surface-muted)", overflowX: "auto" }}>{samplePayload}</pre>
      </section>

      <section className="card card-pad" style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Headers and signature</h2>
        <p style={{ margin: 0, color: "var(--ink-2)", lineHeight: 1.6 }}>
          Verify `X-AppStack-Signature` by calculating HMAC-SHA256 over the exact raw request body with the product webhook secret. Store `X-AppStack-Event-Id` for idempotency.
        </p>
        <pre style={{ margin: 0, padding: 14, borderRadius: 8, background: "var(--surface-muted)", overflowX: "auto" }}>{`X-AppStack-Signature: <hmac-sha256>
X-AppStack-Event-Id: <event-id>
Content-Type: application/json`}</pre>
      </section>

      <section className="card card-pad" style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Acknowledgement API</h2>
        <p style={{ margin: 0, color: "var(--ink-2)", lineHeight: 1.6 }}>
          After provisioning or applying a lifecycle change, call the acknowledgement endpoint with the product webhook secret.
        </p>
        <pre style={{ margin: 0, padding: 14, borderRadius: 8, background: "var(--surface-muted)", overflowX: "auto" }}>{`POST /api/integrations/subscriptions/:subscriptionId/ack
Authorization: Bearer <webhookSecret>
Content-Type: application/json

${ackPayload}`}</pre>
        <div style={{ color: "var(--ink-3)", fontSize: 13, lineHeight: 1.6 }}>
          Supported actions are `activate`, `change_applied`, and `cancel_applied`. Set `accepted` to `false` with a message when the SaaS cannot apply the requested action.
        </div>
      </section>

      <section className="card card-pad" style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Sandbox test events</h2>
        <p style={{ margin: 0, color: "var(--ink-2)", lineHeight: 1.6 }}>
          Sellers can send `webhook.test` events from `/seller/integrations`. A successful test marks the product webhook as ready for product submission. Test events use `mode: &quot;TEST&quot;` and do not create subscriptions, invoices, or transactions.
        </p>
      </section>

      <section className="card card-pad" style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>PII boundary</h2>
        <p style={{ margin: 0, color: "var(--ink-2)", lineHeight: 1.6 }}>
          Webhook payloads include only the consented recipient email needed to provision the SaaS subscription. AppStack does not send buyer account id, buyer profile fields, payment method details, or card data to sellers.
        </p>
      </section>

      <section className="card card-pad" style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Webhook retry guarantee</h2>
        <p style={{ margin: 0, color: "var(--ink-2)", lineHeight: 1.6 }}>
          Failed webhook deliveries are retried up to 10 times with exponential backoff extending up to 24 hours (intervals: 1m, 5m, 15m, 1h, 2h, 4h, 8h, 12h, 24h). Deliveries are durable at-least-once, and consumer endpoints should ensure idempotency based on `X-AppStack-Event-Id`.
        </p>
      </section>

      <section className="card card-pad" style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Pluggable payment provider seam</h2>
        <p style={{ margin: 0, color: "var(--ink-2)", lineHeight: 1.6 }}>
          AppStack operates on a provider interface allowing the exchange of simulator card processing for production gateways (like Stripe) simply by implementing `tokenizeCard`, `charge`, `refund`, and `disburse`. View the repository <code style={{ color: "var(--brand)" }}>PAYMENTS_INTEGRATION.md</code> for the integration blueprint.
        </p>
      </section>

      <section className="card card-pad" style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Sandbox SaaS integration receiver</h2>
        <p style={{ margin: 0, color: "var(--ink-2)", lineHeight: 1.6 }}>
          Test the full purchase loop using the mock receiver under <code style={{ color: "var(--brand)" }}>examples/mock-saas/</code>. Running the mock receiver validates request signature HMAC, prints logs, and automatically acknowledges event actions by calling AppStack back.
        </p>
      </section>
    </main>
  );
}
