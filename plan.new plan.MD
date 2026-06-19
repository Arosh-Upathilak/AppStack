# Seller Approval UX Refresh Plan

## Summary
Fix the post-approval seller flow so an approved buyer immediately sees a clear path into the seller dashboard. The root issue is that admin approval updates the database and sends a `SELLER_APPROVED` notification, but the buyer's active NextAuth session still has the old role/status until re-login.

## Key Changes
- Add an authenticated backend current-user endpoint, `GET /api/auth/me`, that returns fresh `id`, `email`, `role`, `sellerStatus`, and a refreshed access token from the database.
- Extend the NextAuth `jwt` update callback to support `update({ refreshUser: true })`; when called, it fetches `/auth/me` through `API_INTERNAL_BASE_URL` and replaces token `role`, `sellerStatus`, and `accessToken`.
- Update `NotificationProvider` so when it receives or loads a `SELLER_APPROVED` notification, it stores the notification, refreshes the session, shows a success toast, and exposes a visible path to `/seller`.
- Add buyer-facing entry points after approval: public account side nav, dashboard sidebar/role switcher, buyer dashboard, and become-seller page should show seller access once the session refreshes.
- Keep rejection behavior explicit: `SELLER_REJECTED` should refresh session/status and show a clear rejected/reapply state.

## Test Plan
- Run `backend npm run lint && backend npm run build`.
- Run `frontend npm run lint && frontend npm run build`.
- Docker smoke test:
  - log in as a buyer,
  - submit seller application,
  - log in as admin and approve it,
  - confirm the buyer session updates without logout,
  - confirm a toast/notification appears,
  - confirm "Seller dashboard" is visible and `/seller` opens.
- Regression checks:
  - pending applicants still see pending state,
  - rejected applicants see rejected/reapply state,
  - admin approval list still removes approved/rejected sellers,
  - seeded seller can still open `/seller`.

## Assumptions
- The desired behavior is immediate in-session UX after admin approval, not requiring logout/login.
- Backend database roles remain the source of truth; client-side session updates must refresh from the backend rather than blindly trusting notification payloads.
