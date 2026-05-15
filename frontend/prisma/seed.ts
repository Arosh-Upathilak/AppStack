/* eslint-disable @typescript-eslint/no-non-null-assertion */
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PRODUCTS, SUBSCRIPTIONS, INVOICES } from '../data/mock';

const prisma = new PrismaClient();

async function main() {
  console.log('seeding...');

  // -- Users -----------------------------------------------------------------
  const pwd = await bcrypt.hash('demo1234', 10);

  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@example.com' },
    update: {},
    create: {
      email: 'buyer@example.com',
      hashedPassword: pwd,
      name: 'Sarah Kim',
      emailVerifiedAt: new Date(),
      roles: { create: [{ role: 'BUYER' }] },
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: 'seller@example.com' },
    update: {},
    create: {
      email: 'seller@example.com',
      hashedPassword: pwd,
      name: 'Marcus Vendor',
      emailVerifiedAt: new Date(),
      roles: { create: [{ role: 'SELLER' }] },
      sellerProfile: {
        create: { status: 'APPROVED', companyName: 'DataTech Solutions', payoutEmail: 'pay@datatech.test' },
      },
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      hashedPassword: pwd,
      name: 'Admin User',
      emailVerifiedAt: new Date(),
      roles: { create: [{ role: 'ADMIN' }] },
    },
  });

  // -- Products + Plans ------------------------------------------------------
  for (const p of PRODUCTS) {
    const product = await prisma.product.upsert({
      where: { slug: p.id },
      update: {},
      create: {
        sellerId: seller.id,
        slug: p.id,
        title: p.name,
        description: p.tagline,
        shortDescription: p.tagline,
        category: p.category,
        similarTo: JSON.stringify(p.integrations),
        status: 'PUBLISHED',
        hue: p.hue,
        rating: p.rating,
        reviewsCount: p.reviews,
        webhookUrl: 'https://example.com/webhooks/appstack',
      },
    });

    // Three plans per product if none exist
    const existing = await prisma.plan.count({ where: { productId: product.id } });
    if (existing === 0) {
      await prisma.plan.createMany({
        data: [
          { productId: product.id, name: 'Essentials', priceCents: p.from * 100, features: JSON.stringify(['Up to 10 seats', 'Email support', 'Core features']) },
          { productId: product.id, name: 'Professional', priceCents: p.from * 100 * 3, features: JSON.stringify(['Up to 50 seats', 'Priority support', 'Advanced analytics']) },
          { productId: product.id, name: 'Enterprise', priceCents: p.from * 100 * 8, features: JSON.stringify(['Unlimited seats', 'Dedicated CSM', 'SSO + SAML']) },
        ],
      });
    }
  }

  // -- Sample subscriptions for buyer ---------------------------------------
  for (const s of SUBSCRIPTIONS.slice(0, 3)) {
    const product = await prisma.product.findUnique({ where: { slug: s.id.replace(/-(pro|net|suite|canvas|base)$/, '') } });
    const fallback = product ?? (await prisma.product.findFirst());
    if (!fallback) continue;
    const plan = await prisma.plan.findFirst({ where: { productId: fallback.id } });
    if (!plan) continue;
    await prisma.subscription.create({
      data: {
        buyerId: buyer.id,
        productId: fallback.id,
        planId: plan.id,
        recipientEmail: buyer.email,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // -- Invoices --------------------------------------------------------------
  const subs = await prisma.subscription.findMany({ where: { buyerId: buyer.id } });
  let i = 0;
  for (const inv of INVOICES) {
    const sub = subs[i % Math.max(1, subs.length)];
    if (!sub) break;
    await prisma.invoice.upsert({
      where: { number: inv.id },
      update: {},
      create: {
        subscriptionId: sub.id,
        number: inv.id,
        amountCents: inv.amount * 100,
        status: inv.status === 'paid' ? 'PAID' : 'OVERDUE',
        issuedAt: new Date(inv.date),
        paidAt: inv.status === 'paid' ? new Date(inv.date) : null,
      },
    });
    i++;
  }

  // -- System config (REQ-61) ------------------------------------------------
  await prisma.systemConfig.upsert({
    where: { key: 'sales_fund_lock_period_days' },
    update: {},
    create: { key: 'sales_fund_lock_period_days', value: '30' },
  });
  await prisma.systemConfig.upsert({
    where: { key: 'payment_retry_max' },
    update: {},
    create: { key: 'payment_retry_max', value: '3' },
  });
  await prisma.systemConfig.upsert({
    where: { key: 'payout_min_cents' },
    update: {},
    create: { key: 'payout_min_cents', value: '5000' },
  });

  console.log('seed complete:', { buyer: buyer.email, seller: seller.email, admin: admin.email });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
