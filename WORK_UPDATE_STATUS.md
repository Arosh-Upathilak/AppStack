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
| REQ-7 Buyer review placement | Partial: mock helper exists, no submitted-review UI in this phase. | Not started: no persisted create-review endpoint yet. | Not started. |
| REQ-8 Multi-step registration / account type | Partial: registration and role selection exist. | Implemented for buyer/seller role creation path; seller approval remains separate. | Partial. |
| REQ-9 Email OTP verification | Implemented. | Implemented with Redis-backed OTP. | Implemented for email/password registration. |
| REQ-10 Seller admin approval | Implemented: become-seller and admin pending seller screens. | Implemented: seller request approval/rejection APIs and notifications. | Implemented with session refresh after approval. |
| REQ-11 Multiple roles | Implemented: role switcher and seller/buyer navigation. | Implemented: `roles` array and seller approval role promotion. | Implemented. |
| REQ-12 Login | Implemented: credentials and Google sign-in surfaces. | Implemented: credential login and Google login endpoint. | Implemented with NextAuth session. |
| REQ-13 Account recovery | Implemented. | Implemented password reset email/token flow. | Implemented. |
| REQ-14 Select plan | Implemented: product detail plan selector. | Implemented through subscription creation by `planId`. | Implemented. |
| REQ-15 Subscribe for different email | Implemented: checkout recipient email input. | Implemented: subscription stores `recipientEmail`. | Partial: recipient OTP verification is deferred. |
| REQ-16 Consent to share email | Implemented: checkout consent checkbox and settings consent list. | Implemented: `Consent` model and `GET /api/consents`. | Implemented for subscription checkout. |
| REQ-17 Credit card details if no card | Implemented: settings payment methods and checkout warning. | Implemented simulator payment methods without storing full card data. | Implemented in simulator mode. |
| REQ-18 Initiate transaction | Implemented simulator checkout. | Implemented active subscription plus paid invoice transaction. | Partial: real payment processor deferred. |
| REQ-19 Generate invoice | Implemented invoice list/download. | Implemented `Invoice` model and invoice creation/download endpoint. | Implemented as text invoice artifact. |
| REQ-20 Notify buyer and seller about transaction | Partial: in-app/socket notifications created. | Implemented notification records for buyer/seller. | Partial: email transaction notifications deferred. |
| REQ-21 Webhook to seller SaaS | Partial: seller product webhook URL captured. | Partial: webhook config persisted. | Deferred reliable delivery/retry. |
| REQ-22 Pending plan until SaaS response | Not started. | Model supports `PENDING`; current simulator activates immediately. | Deferred to webhook execution phase. |
| REQ-23 Buyer active subscriptions | Implemented in buyer settings. | Implemented `GET /api/subscriptions`. | Implemented. |
| REQ-24 Upgrade/downgrade/cancel | Partial: cancellation request implemented. | Partial: `PATCH /api/subscriptions/:id` supports cancel request. | Upgrade/downgrade deferred. |
| REQ-25 Notify SaaS on plan change | Not started. | Not started. | Deferred to webhook execution phase. |
| REQ-26 Multiple subscriptions from same plan | Implemented: checkout creates separate subscription records. | Implemented by schema/API. | Implemented. |
| REQ-27 Admin approval for cancellation | Implemented: admin cancellations queue screen (`/admin/cancellations`). | Implemented: `GET /api/admin/cancellations/pending` and `POST /api/admin/cancellations/:id/decision`. | Implemented: approve/reject updates subscription and notifies buyer. |
| REQ-28-30 Invoice history/download | Implemented. | Implemented list/download endpoints and persisted invoices. | Implemented for simulator invoices. |
| REQ-31-32 Credit card management | Implemented in buyer settings. | Implemented simulator add/delete/set-primary endpoints. | Implemented without storing full card details. |
| REQ-33-39 Scheduled payments/refunds | Implemented: buyer refund request UI and admin refunds queue (`/admin/refunds`). | Implemented: hourly billing scheduler (`services/scheduler.ts`) renews due subscriptions, generates PAID invoices and `payment.succeeded/failed` webhooks; refund request/approve/reject with reversal transactions. | Implemented in simulator mode; manual trigger via `POST /api/admin/scheduler/trigger`. |
| REQ-40-46 Create product and approval | Implemented: seller product form and admin pending product queue. | Implemented product, plans, submit, approve/reject APIs. | Implemented with notifications; webhook test is simulator flag. |
| REQ-47-53 Product edits/deletion | Partial: draft/rejected product update API exists; UI edit/delete not included. | Partial. | Deferred for approved-change/delete approval workflows. |
| REQ-54 Seller product list | Implemented. | Implemented `GET /api/seller/products`. | Implemented. |
| REQ-55-57 Seller subscription summaries / PII protection | Partial: seller overview remains mostly simulator. | Partial: subscription model exists and seller notifications avoid buyer PII beyond consented email. | Detailed seller subscription dashboards deferred. |
| REQ-58-66 Earnings, payouts, schedules | Implemented: seller earnings screen (`/seller/earnings`) and admin payouts queue (`/admin/payouts`). | Implemented: `GET /api/seller/earnings/summary` and `/transactions`, `POST /api/seller/payouts/request`, admin payout approve/reject; transactions lock for 30 days then auto-unlock to AVAILABLE. | Implemented: withdrawable balance = available − withdrawn − pending; admins notified on request. |
| REQ-67-75 Events, docs, sandbox | Partial: webhook URL stored and public copy describes integrations. | Partial: no delivery, docs portal or sandbox yet. | Deferred. |
| REQ-76-80 Admin user management | Implemented: admin users screen (`/admin/users`) with role edit and GDPR delete. | Implemented: `GET /api/admin/users`, `PATCH /api/admin/users/:id/role`, `DELETE /api/admin/users/:id` (GDPR anonymize). | Implemented: GDPR delete anonymizes PII in a transaction while preserving financial records. |
| NRQ-1-2 Scale/performance | Partial: indexed product/subscription/payment tables added. | Partial. | Load testing deferred. |
| NRQ-3-4 SEO/meta pixel | Partial: product metadata and public page metadata exist. | Not applicable. | Meta pixel deferred. |
| NRQ-5 No card/bank storage | Implemented: only brand, last4, expiry and simulator token are stored. | Implemented. | Real processor tokenization deferred. |
| NRQ-6 PII protection | Partial: seller product/subscription notifications avoid broad buyer PII. | Partial. | Full audit deferred. |
| NRQ-7 Private page protection | Implemented with NextAuth middleware and backend auth middleware. | Implemented. | Implemented. |
| NRQ-8 Cloudflare | Not started in repo. | Not started. | Deployment config deferred. |
| NRQ-9 reCAPTCHA public forms | Partial: auth/recovery forms use reCAPTCHA helpers. | Partial: backend verification exists. | Broader form coverage deferred. |
| NRQ-10 Responsive UI | Partial: existing dashboard/public UI is responsive-oriented; new tables need broader viewport QA. | Not applicable. | Browser QA recommended. |
| ORQ-1 Consent records | Implemented for subscription email sharing. | Implemented `Consent` model/API. | Implemented. |
| ORQ-2 Seller data protection agreement | Partial: model supports consent type; seller agreement UI not built. | Partial. | Deferred. |
