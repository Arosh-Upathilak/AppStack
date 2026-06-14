# AppStack Requirement Status Matrix

Updated: 2026-06-13

| Requirement Area | Frontend | Backend | Integration |
| --- | --- | --- | --- |
| REQ-1 Public pages | Implemented: home, about, public marketplace and product detail routes exist. | Not required beyond public API availability. | Public navigation and SEO metadata are wired for main public routes. |
| REQ-2 Search and view product catalog | Implemented: marketplace queries live catalog with mock fallback. | Implemented: `GET /api/products`. | Implemented against persisted approved products. |
| REQ-3 Filter products | Implemented: category and text search controls. | Implemented: category/query filters on `GET /api/products`. | Implemented for approved products. |
| REQ-4 Product details | Implemented: product detail loads live product, plans and reviews. | Implemented: `GET /api/products/:productId`. | Implemented with ID or slug lookup. |
| REQ-5 Public reviews | Implemented: reviews render on product detail. | Implemented: `GET /api/products/:productId/reviews`. | Seeded and persisted review records are shown. |
| REQ-6 Login/register before plan selection | Implemented: public CTA routes to register; buyer checkout requires authenticated buyer route. | Implemented via route protection/auth middleware for subscription creation. | Implemented. |
| REQ-7 Buyer review placement | Implemented: verified buyers can submit one review per purchased product and see existing review state. | Implemented: review eligibility and create-review endpoints enforce purchaser and one-review-per-product rules. | Implemented. |
| REQ-8 Multi-step registration / account type | Partial: registration and role selection exist. | Implemented for buyer/seller role creation path; seller approval remains separate. | Partial. |
| REQ-9 Email OTP verification | Implemented. | Implemented with Redis-backed OTP. | Implemented for email/password registration. |
| REQ-10 Seller admin approval | Implemented: become-seller and admin pending seller screens. | Implemented: seller request approval/rejection APIs and notifications. | Implemented with session refresh after approval. |
| REQ-11 Multiple roles | Implemented: role switcher and seller/buyer navigation. | Implemented: `roles` array and seller approval role promotion. | Implemented. |
| REQ-12 Login | Implemented: credentials and Google sign-in surfaces. | Implemented: credential login and Google login endpoint. | Implemented with NextAuth session. |
| REQ-13 Account recovery | Implemented. | Implemented password reset email/token flow. | Implemented. |
| REQ-14 Select plan | Implemented: product detail plan selector. | Implemented through subscription creation by `planId`. | Implemented. |
| REQ-15 Subscribe for different email | Implemented: checkout requires OTP verification when recipient email differs from account email. | Implemented: Redis-backed recipient verification endpoint validates checkout OTP. | Implemented. |
| REQ-16 Consent to share email | Implemented: checkout consent checkbox and settings consent list. | Implemented: `Consent` model and `GET /api/consents`. | Implemented for subscription checkout. |
| REQ-17 Credit card details if no card | Implemented: settings payment methods and checkout warning. | Implemented simulator payment methods without storing full card data. | Implemented in simulator mode. |
| REQ-18 Initiate transaction | Implemented simulator checkout. | Implemented active subscription plus paid invoice transaction. | Partial: real payment processor deferred. |
| REQ-19 Generate invoice | Implemented invoice list/download. | Implemented `Invoice` model and invoice creation/download endpoint. | Implemented as text invoice artifact. |
| REQ-20 Notify buyer and seller about transaction | Implemented: in-app/socket and email notifications for subscription, activation, renewal failure/success, refund approval and cancellation paths. | Implemented notification records and Nodemailer transaction emails. | Implemented in simulator mode. |
| REQ-21 Webhook to seller SaaS | Implemented: seller integration console manages webhook URL, lists webhook events, filters logs, sends test events, and retries delivery. | Implemented: centralized signed webhook worker with persisted retry scheduling and test/live event modes. | Implemented in simulator mode with signed delivery and seller test sender. |
| REQ-22 Pending plan until SaaS response | Implemented: buyer subscription status surfaces pending activation messages. | Implemented: webhook-backed checkout creates `PENDING` subscriptions and settles simulator invoice/transaction only after SaaS activation acknowledgement. | Implemented via `POST /api/integrations/subscriptions/:subscriptionId/ack`. |
| REQ-23 Buyer active subscriptions | Implemented in buyer settings. | Implemented `GET /api/subscriptions`. | Implemented. |
| REQ-24 Upgrade/downgrade/cancel | Implemented: buyer subscriptions support plan-change requests and cancellation requests. | Implemented: `PATCH /api/subscriptions/:id` supports cancel and change-plan; plan options endpoint added. | Implemented with SaaS acknowledgement for plan changes. |
| REQ-25 Notify SaaS on plan change | Partial: buyer plan-change UI is still limited. | Implemented: plan changes emit `subscription.updated` and apply pending plan only after SaaS acknowledgement. | Implemented acknowledgement path for `change_applied`. |
| REQ-26 Multiple subscriptions from same plan | Implemented: checkout creates separate subscription records. | Implemented by schema/API. | Implemented. |
| REQ-27 Admin approval for cancellation | Implemented: admin cancellations queue screen (`/admin/cancellations`). | Implemented: `GET /api/admin/cancellations/pending` and `POST /api/admin/cancellations/:id/decision`. | Implemented: approve/reject updates subscription and notifies buyer. |
| REQ-28-30 Invoice history/download | Implemented. | Implemented list/download endpoints and persisted invoices. | Implemented for simulator invoices. |
| REQ-31-32 Credit card management | Implemented in buyer settings. | Implemented simulator add/delete/set-primary endpoints. | Implemented without storing full card details. |
| REQ-33-39 Scheduled payments/refunds | Implemented: buyer refund request UI and admin refunds queue (`/admin/refunds`). | Implemented: hourly billing scheduler renews due subscriptions, retries failed payments up to three attempts using `PAST_DUE`, generates invoices/transactions, and processes refund approvals with reversal transactions. | Implemented in simulator mode; manual trigger via `POST /api/admin/scheduler/trigger`. |
| REQ-40-46 Create product and approval | Implemented: seller product form and admin pending product queue. | Implemented product, plans, submit, approve/reject APIs. | Implemented with notifications; webhook test is simulator flag. |
| REQ-47-53 Product edits/deletion | Implemented: sellers can request approved-product edits and deletion/unlisting from the product dashboard; admins review requests in pending products. | Implemented: `ProductChangeRequest` workflow stages updates, blocks pending-deletion purchases, unlists approved deletions, cancels active subscriptions and creates simulator refunds. | Implemented as audit-preserving unlist rather than physical delete. |
| REQ-54 Seller product list | Implemented. | Implemented `GET /api/seller/products`. | Implemented. |
| REQ-55-57 Seller subscription summaries / PII protection | Implemented: `/seller/subscriptions` shows product, plan, status, seats and recurring revenue summaries with product/status filters. | Implemented: `GET /api/seller/subscriptions` returns seller-owned subscription summaries and validates status filters. | Implemented: seller subscription views intentionally omit buyer account id, buyer email, payment method and profile fields. |
| REQ-58-66 Earnings, payouts, schedules | Implemented: seller earnings screen (`/seller/earnings`) and admin payouts queue (`/admin/payouts`). | Implemented: `GET /api/seller/earnings/summary` and `/transactions`, `POST /api/seller/payouts/request`, admin payout approve/reject; transactions lock for 30 days then auto-unlock to AVAILABLE. | Implemented: withdrawable balance = available − withdrawn − pending; admins notified on request. |
| REQ-67-75 Events, docs, sandbox | Implemented: `/seller/integrations`, `/admin/webhooks` and `/docs/integrations` cover event logs, test sender, signatures, payloads and acknowledgement flow. | Implemented: webhook event filters, manual retry, test events, persisted retry metadata and ack endpoint. | Implemented docs + test sender sandbox; full mock SaaS app deferred. |
| REQ-76-80 Admin user management | Implemented: admin users screen (`/admin/users`) with profile edit, role edit, password reset email and GDPR delete. | Implemented: list users, edit roles, edit non-sensitive profile fields, send reset email, and GDPR anonymize. | Implemented: GDPR delete anonymizes PII while preserving financial records. |
| NRQ-1-2 Scale/performance | Partial: indexed product/subscription/payment tables added. | Partial. | Load testing deferred. |
| NRQ-3-4 SEO/meta pixel | Partial: product metadata and public page metadata exist. | Not applicable. | Meta pixel deferred. |
| NRQ-5 No card/bank storage | Implemented: only brand, last4, expiry and simulator token are stored. | Implemented. | Real processor tokenization deferred. |
| NRQ-6 PII protection | Partial: seller subscription dashboard avoids buyer PII and displays only operational subscription fields. | Partial: seller subscription API excludes buyer profile/payment data; broader audit still needed. | Partial. |
| NRQ-7 Private page protection | Implemented with NextAuth middleware and backend auth middleware. | Implemented. | Implemented. |
| NRQ-8 Cloudflare | Not started in repo. | Not started. | Deployment config deferred. |
| NRQ-9 reCAPTCHA public forms | Partial: auth/recovery forms use reCAPTCHA helpers. | Partial: backend verification exists. | Broader form coverage deferred. |
| NRQ-10 Responsive UI | Partial: existing dashboard/public UI is responsive-oriented; new tables need broader viewport QA. | Not applicable. | Browser QA recommended. |
| ORQ-1 Consent records | Implemented for subscription email sharing. | Implemented `Consent` model/API. | Implemented. |
| ORQ-2 Seller data protection agreement | Partial: model supports consent type; seller agreement UI not built. | Partial. | Deferred. |
