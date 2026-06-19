# AppStack Horizontal Scaling Guide

This document covers recommendations for scaling AppStack horizontally to handle high traffic and load.

## 1. Stateless Architecture
The AppStack backend server is stateless. All persistent states are offloaded to:
- **PostgreSQL Database**: Main application state, billing details, and relations.
- **Redis Cache/Store**: Session storage, OTP mappings, rate limit keys, and product view deduplication keys.

Because of this, you can run multiple instances of the backend behind a load balancer (such as Nginx, AWS ALB, or Cloudflare Load Balancing) without session sticky requirements.

## 2. Shared Cache (Redis)
Ensure that all backend instances point to the same Redis cluster/instance.
- Express rate limiters use Redis.
- OTP and Reset verification tokens are stored in Redis.
- Product view tracking uses Redis to prevent duplicate counts from the same IP within an hour.
If backend instances do not share Redis, rate limits and verification tokens will not be synchronized, leading to inconsistent user experiences.

## 3. Database Indexes (Prisma)
Prisma schema defines explicit indexes on high-query paths to keep queries fast:
- `Product.sellerId`, `Product.status`, `Product.category`, `Product.createdAt`
- `ProductPlan.productId`
- `Review.productId`, `Review.userId`
- `Subscription.buyerId`, `Subscription.productId`, `Subscription.planId`, `Subscription.status`
- `Invoice.buyerId`, `Invoice.subscriptionId`, `Invoice.status`
- `PlatformSetting.key` (Primary Key)

When scaling to millions of rows, perform regular index analysis on PostgreSQL (`EXPLAIN ANALYZE`) to ensure queries hit indexes.

## 4. Background Workers & Schedulers
The backend starts background recurring cycles for billing renewals and webhook deliveries in `backend/src/index.ts`:
```typescript
runBillingCycle() // hourly
processDueWebhookEvents() // every minute
```
### Running at Scale:
If you run multiple replica instances of the backend, both schedulers will run on all instances concurrently.
- **Webhook Worker**: Multiple instances processing due webhooks is fine because it checks for pending events. However, to avoid race conditions or double delivery, it is recommended to run scheduler loops on a single dedicated instance, or lock jobs using a distributed lock system (like Redlock on Redis).
- **Billing Scheduler**: Ensure `runBillingCycle` runs sequentially. For production, consider extracting the scheduler code into a separate serverless cron job (e.g. AWS Lambda + EventBridge) that calls a private admin endpoint `/api/admin/scheduler/trigger` rather than running in-process `setInterval` loops.
