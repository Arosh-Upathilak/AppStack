import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminPassword = bcrypt.hashSync("admin123", 10);
  const buyerPassword = bcrypt.hashSync("buyer123", 10);
  const sellerPassword = bcrypt.hashSync("seller123", 10);
  const applicantPassword = bcrypt.hashSync("applicant123", 10);

  // 1. Clean existing records (optional, but good for repeatable runs)
  await prisma.consent.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.paymentMethod.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.productPlan.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.seller.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Admin
  const admin = await prisma.user.create({
    data: {
      email: "admin@appstack.com",
      firstName: "Platform",
      lastName: "Admin",
      password: adminPassword,
      isVerified: true,
      roles: { set: ["ADMIN"] },
    },
  });
  console.log("Seeded Admin: admin@appstack.com / admin123");

  // 3. Create Buyer
  const buyer = await prisma.user.create({
    data: {
      email: "buyer@appstack.com",
      firstName: "John",
      lastName: "Buyer",
      password: buyerPassword,
      isVerified: true,
      roles: { set: ["BUYER"] },
    },
  });
  console.log("Seeded Buyer: buyer@appstack.com / buyer123");

  // 4. Create Approved Seller
  const sellerUser = await prisma.user.create({
    data: {
      email: "seller@appstack.com",
      firstName: "Alice",
      lastName: "Seller",
      password: sellerPassword,
      isVerified: true,
      roles: { set: ["BUYER", "SELLER"] },
    },
  });
  await prisma.seller.create({
    data: {
      userId: sellerUser.id,
      payoutEmail: "payout-seller@appstack.com",
      businessName: "Alice SaaS Corp",
      aboutProject: "A high-performance cloud monitoring tool.",
      isApproveSeller: "APPROVED",
      approveByAdminId: admin.id,
    },
  });
  console.log("Seeded Seller: seller@appstack.com / seller123");

  const cloudSync = await prisma.product.create({
    data: {
      sellerId: sellerUser.id,
      name: "CloudSync Pro",
      slug: "cloudsync-pro",
      shortDescription: "Real-time database synchronization across multi-cloud architectures.",
      description:
        "CloudSync Pro centralizes database synchronization, audit trails and multi-cloud replication for teams that need resilient SaaS operations without stitching multiple tools together.",
      category: "Data Mgmt",
      similarTo: ["Fivetran", "Airbyte"],
      hue: "#1e6ff5",
      status: "APPROVED",
      webhookUrl: "https://example-seller.test/webhooks/appstack",
      webhookTested: true,
      submittedAt: new Date(),
      publishedAt: new Date(),
      reviewedAt: new Date(),
      reviewedById: admin.id,
      plans: {
        create: [
          {
            identifier: "essentials",
            name: "Essentials",
            features: ["5 sync jobs", "Daily sync", "Email support"],
            priceCents: 4900,
          },
          {
            identifier: "professional",
            name: "Professional",
            features: ["50 sync jobs", "Near real-time sync", "API access"],
            priceCents: 9900,
          },
          {
            identifier: "enterprise",
            name: "Enterprise",
            features: ["Unlimited jobs", "SAML SSO", "Dedicated support"],
            priceCents: 19900,
          },
        ],
      },
      reviews: {
        create: [
          {
            authorName: "Sarah Jenkins",
            authorRole: "VP of Sales - TechCorp",
            rating: 5,
            body: "The unified dashboard gives our team the operational data they need without digging through separate reporting tools.",
          },
          {
            authorName: "Marcus Rivera",
            authorRole: "CTO - LogisticsPro",
            rating: 5,
            body: "Migration was smoother than expected and the integration model was easy to validate in staging.",
          },
        ],
      },
    },
    include: {
      plans: true,
    },
  });

  await prisma.product.createMany({
    data: [
      {
        sellerId: sellerUser.id,
        name: "TeamSync Suite",
        slug: "teamsync-suite",
        shortDescription: "Unified messaging, docs and video for distributed teams.",
        description:
          "TeamSync Suite helps distributed teams manage conversations, documentation and meeting workflows from one collaborative workspace.",
        category: "Collaboration",
        similarTo: ["Slack", "Notion"],
        hue: "#00aac2",
        status: "APPROVED",
        webhookUrl: "https://example-seller.test/webhooks/teamsync",
        webhookTested: true,
        submittedAt: new Date(),
        publishedAt: new Date(),
        reviewedAt: new Date(),
        reviewedById: admin.id,
      },
      {
        sellerId: sellerUser.id,
        name: "SecureGuard Net",
        slug: "secureguard",
        shortDescription: "Zero-trust network access with continuous compliance auditing.",
        description:
          "SecureGuard Net gives teams a practical zero-trust access layer with compliance evidence, device posture checks and policy management.",
        category: "Security",
        similarTo: ["Okta", "Cloudflare Access"],
        hue: "#059669",
        status: "APPROVED",
        webhookUrl: "https://example-seller.test/webhooks/secureguard",
        webhookTested: true,
        submittedAt: new Date(),
        publishedAt: new Date(),
        reviewedAt: new Date(),
        reviewedById: admin.id,
      },
    ],
  });

  const extraProducts = await prisma.product.findMany({
    where: {
      slug: {
        in: ["teamsync-suite", "secureguard"],
      },
    },
  });

  for (const product of extraProducts) {
    await prisma.productPlan.createMany({
      data: [
        {
          productId: product.id,
          identifier: "starter",
          name: "Starter",
          features: ["Core features", "Standard support"],
          priceCents: product.slug === "teamsync-suite" ? 1200 : 9900,
        },
        {
          productId: product.id,
          identifier: "business",
          name: "Business",
          features: ["Advanced controls", "Priority support", "API access"],
          priceCents: product.slug === "teamsync-suite" ? 2900 : 19900,
        },
      ],
    });
  }

  const paymentMethod = await prisma.paymentMethod.create({
    data: {
      userId: buyer.id,
      brand: "Visa",
      last4: "4242",
      expMonth: 12,
      expYear: 2030,
      isPrimary: true,
      simulatorToken: "seed-card-token",
    },
  });

  const professionalPlan =
    cloudSync.plans.find((plan) => plan.identifier === "professional") ??
    cloudSync.plans[0];
  const periodStart = new Date();
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const subscription = await prisma.subscription.create({
    data: {
      buyerId: buyer.id,
      productId: cloudSync.id,
      planId: professionalPlan.id,
      paymentMethodId: paymentMethod.id,
      recipientEmail: "buyer@appstack.com",
      seats: 3,
      status: "ACTIVE",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      nextBillingAt: periodEnd,
    },
  });

  await prisma.invoice.create({
    data: {
      number: "INV-2026-SEED-001",
      buyerId: buyer.id,
      subscriptionId: subscription.id,
      productId: cloudSync.id,
      planId: professionalPlan.id,
      amountCents: professionalPlan.priceCents * subscription.seats,
      currency: professionalPlan.currency,
      status: "PAID",
      description: "CloudSync Pro - Professional (3 seats)",
      paidAt: periodStart,
    },
  });

  await prisma.consent.create({
    data: {
      userId: buyer.id,
      subscriptionId: subscription.id,
      productId: cloudSync.id,
      planId: professionalPlan.id,
      type: "SHARE_EMAIL",
      recipientEmail: "buyer@appstack.com",
      ipAddress: "127.0.0.1",
      userAgent: "seed",
    },
  });

  console.log("Seeded approved products, plans, simulated card, subscription, invoice and consent");

  // 5. Create Pending Seller Applicant
  const applicantUser = await prisma.user.create({
    data: {
      email: "applicant@appstack.com",
      firstName: "Bob",
      lastName: "Applicant",
      password: applicantPassword,
      isVerified: true,
      roles: { set: ["BUYER"] },
    },
  });
  await prisma.seller.create({
    data: {
      userId: applicantUser.id,
      payoutEmail: "payout-applicant@appstack.com",
      businessName: "Bob Analytics Lab",
      aboutProject: "AI-driven customer analytics suite.",
      isApproveSeller: "PENDING",
    },
  });
  console.log("Seeded Applicant: applicant@appstack.com / applicant123");

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
