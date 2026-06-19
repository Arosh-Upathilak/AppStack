# Frontend Bug Report — AppStack

**Tested:** 2026-06-18 via Chrome against the running app at `http://localhost:3000` (Docker demo build).
**Session:** logged in as `buyer@appstack.com` (BUYER role).
**Scope covered:** public site (home, marketplace, product detail, about), auth-page redirects, and the full buyer portal.
**Not covered:** seller & admin dashboards (no access as a buyer — correctly blocked); true mobile/responsive layout (Chrome window clamped to a 1200px min width); auth form internals (login/register/forgot redirect away while logged in).

Severity: 🔴 Critical (feature broken) · 🟠 Major (functional gap) · 🟡 Minor (display/UX/polish)

---

## 🔴 Critical

### 1. Settings → "Payment methods" tab stuck on "Loading…" forever
- **Where:** `/buyer/settings` → Payment methods tab.
- **Symptom:** Tab shows "Loading…" indefinitely; no cards, no error.
- **Root cause:** `GET /api/payment-methods` returns **HTTP 404 with an HTML page** (route doesn't exist in this build). `CardWallet` does `const r = await fetch('/api/payment-methods'); const j = await r.json();` with **no try/catch**. `r.json()` throws `SyntaxError: Unexpected token '<', "<!DOCTYPE"... is not valid JSON`, so `setLoading(false)` is never reached.
- **Console:** `Uncaught (in promise) SyntaxError: Unexpected token '<' …` on every visit.
- **File:** `frontend/components/buyer/CardWallet.tsx:23-27`

### 2. Settings → "Privacy & consents" tab stuck on "Loading…" forever
- **Where:** `/buyer/settings` → Privacy & consents tab.
- **Symptom & cause:** Identical to #1. `GET /api/consents` returns **HTTP 404 HTML**; `ConsentList` calls `r.json()` unguarded, throws, `setLoading(false)` never runs.
- **File:** `frontend/components/buyer/ConsentList.tsx:26-29`
- **Fix for #1 & #2:** add the missing API routes (or point fetch at the real backend), and wrap fetch/parse in try/catch with a `res.ok` check so the UI can show an error/empty state instead of hanging.

### 3. Public product page "Sign Up to Purchase" CTA is a dead end
- **Where:** `/marketplace/[product]` (e.g. `/marketplace/cloudsync-pro`), the primary pricing-panel button.
- **Symptom:** Clicking "Sign Up to Purchase" does nothing — no navigation, no modal, URL unchanged (page just scrolls to top).
- **Cause:** The public product page renders the "sign up" CTA variant and does not detect the already-authenticated session. A logged-in buyer is shown a sign-up CTA that leads nowhere useful.
- **Contrast (works):** The buyer version `/buyer/marketplace/[product]` shows a "Subscribe" CTA that correctly opens the "Confirm subscription" modal (Plan/Seats/Billing + correct `$14,796/year` total).
- **Fix:** detect session on the public product page → show "Subscribe" (open checkout) for logged-in buyers, and ensure the public/sign-up path actually routes to `/register?next=…`.

---

## 🟠 Major

### 4. Top dashboard search bar is non-functional
- **Where:** Buyer portal header — "Search subscriptions, products, invoices… ⌘K".
- **Symptom:** Typing a query (e.g. "Linear") and pressing Enter does nothing — no results dropdown, no navigation, no filtering. Appears decorative.

### 5. Header notification bell appears non-functional
- **Where:** Buyer portal header, top-right bell icon.
- **Symptom:** Clicking it produces no dropdown/panel and no navigation. (The sidebar "Notification" link works fine; only the header bell does nothing.)

### 6. Marketplace empty search has no empty state
- **Where:** `/marketplace`, search box.
- **Symptom:** Searching a term with no matches shows the header "**0 apps found**" but a completely blank content area — no "No apps found / try another search" message.

---

## 🟡 Minor (display / content / UX)

### 7. Literal `&amp;` rendered on homepage
- **Where:** Homepage feature card heading reads "**REST API &amp; webhooks**" — the HTML entity is shown as literal text instead of "&". (Double-escaping.)

### 8. "CUSTOMER NPS" stat renders with a broken digit gap
- **Where:** `/marketplace` featured banner stats.
- **Symptom:** The value "71" displays as "**7 1**" with a visible gap between digits. Other stats (248, 1.2K, 8m) render fine — issue is specific to this stat's rendering.

### 9. Category filter count drops the noun
- **Where:** `/marketplace` results count.
- **Symptom:** With no filter it reads "9 apps found"; selecting a category changes it to "**2 CRM found**" instead of "2 CRM apps found".

### 10. "Talk to sales" is a dead link
- **Where:** Homepage final CTA section (`href="#"`). The "Talk to sales" buttons on product pages also have no visible action.

### 11. Logged-in user sent to public landing instead of dashboard
- **Where:** Visiting `/login` (and `/register`) while authenticated.
- **Symptom:** Redirects to the public homepage `/` rather than the user's dashboard (`/buyer`).

### 12. `/admin` access by a buyer silently dumps to public homepage
- **Where:** Buyer navigates to `/admin`.
- **Symptom:** Silent redirect to `/` with no "access denied" feedback. Inconsistent with `/seller`, which sensibly routes a non-seller to `/buyer/become-seller`.

### 13. Inconsistent user name / avatar initials
- **Symptom:** Buyer dashboard greets "Welcome back, **buyer**"; Settings → Profile shows name "**John Buyer**" with avatar initial "**J**"; header & sidebar avatar shows "**BA**". Three different representations of the same user.

### 14. Duplicated / mismatched mock data in marketplace
- **Symptom:** Multiple cards share identical "4.8 (2,451)" rating + review counts (e.g. CloudSync Pro and Flexaro CRM). On CloudSync Pro's Reviews tab, the first review text references "**Flexaro**" (a different product).

### 15. Checkout modal fade-in is very slow
- **Where:** `/buyer/marketplace/[product]` → "Subscribe" → "Confirm subscription" modal.
- **Symptom:** The modal/backdrop takes ~2s to reach full opacity; mid-animation it's nearly invisible (no dimmed backdrop yet), which reads as "nothing happened" on first click. Polish issue, not a functional break.

---

## ✅ Verified working (no bug)
- Annual vs monthly pricing math on product pages (`$1,485 − $252 = $1,233/mo`, "Save $3,024/year", `$14,796/year`).
- Product detail tabs (Overview / Features / Integrations / Reviews / Security).
- Become-a-Seller form validation (empty required fields block submit).
- Buyer Notifications empty state ("No notifications yet").
- Header avatar dropdown (Your account / Menu & dashboards / Log out).
- `/seller` access control for a non-seller buyer (→ become-seller).
