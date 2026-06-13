import prisma from "../utils/prisma";
import { sendNotification } from "../socket/socketConnect";
import { processDueWebhookEvents, sendWebhookEvent } from "./webhookWorker";
import { randomBytes } from "crypto";

function addBillingPeriod(start: Date, interval: "MONTHLY" | "YEARLY") {
  const end = new Date(start);
  if (interval === "YEARLY") {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end;
}

function invoiceNumber() {
  return `INV-${new Date().getFullYear()}-${randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;
}

export async function runBillingCycle() {
  console.log("[Scheduler] Starting billing cycle check...");

  await processDueWebhookEvents();
  
  // First, unlock transactions older than 30 days
  await unlockTransactions();

  const now = new Date();

  // Find active subscriptions that have nextBillingAt <= now
  const dueSubscriptions = await prisma.subscription.findMany({
    where: {
      status: { in: ["ACTIVE", "CHANGE_PENDING"] },
      nextBillingAt: { lte: now },
    },
    include: {
      product: true,
      plan: true,
      buyer: {
        include: {
          paymentMethods: true,
        },
      },
    },
  });

  console.log(`[Scheduler] Found ${dueSubscriptions.length} subscriptions due for billing`);

  for (const sub of dueSubscriptions) {
    try {
      const amountCents = sub.plan.priceCents * sub.seats;
      const paymentMethod = sub.buyer.paymentMethods.find(m => m.isPrimary) || sub.buyer.paymentMethods[0];

      if (!paymentMethod) {
        console.warn(`[Scheduler] No payment method found for buyer ${sub.buyerId} of subscription ${sub.id}`);
        await handleBillingFailure(sub, "No payment method on file");
        continue;
      }

      // Simulate card charge logic (declined if last4 is "0000")
      const chargeSucceeded = paymentMethod.last4 !== "0000";

      if (chargeSucceeded) {
        const nextPeriodStart = sub.nextBillingAt;
        const nextPeriodEnd = addBillingPeriod(nextPeriodStart, sub.plan.billingInterval);

        // Update billing dates
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            currentPeriodStart: nextPeriodStart,
            currentPeriodEnd: nextPeriodEnd,
            nextBillingAt: nextPeriodEnd,
            status: "ACTIVE", // ensure it stays active after successful payment
          },
        });

        // Create PAID invoice
        const invoice = await prisma.invoice.create({
          data: {
            number: invoiceNumber(),
            buyerId: sub.buyerId,
            subscriptionId: sub.id,
            productId: sub.productId,
            planId: sub.planId,
            amountCents,
            currency: sub.plan.currency,
            status: "PAID",
            description: `Recurring renewal: ${sub.product.name} - ${sub.plan.name} (${sub.seats} seat${sub.seats === 1 ? "" : "s"})`,
            paidAt: now,
          },
        });

        // Create Transaction record
        await prisma.transaction.create({
          data: {
            sellerId: sub.product.sellerId,
            amountCents,
            type: "SALE",
            status: "LOCKED",
            description: `Renewal Sale: ${sub.product.name} - ${sub.plan.name} (${sub.seats} seat${sub.seats === 1 ? "" : "s"})`,
            invoiceId: invoice.id,
          },
        });

        // Notify buyer
        const notification = await prisma.notification.create({
          data: {
            userId: sub.buyerId,
            title: "Subscription Renewed Successfully",
            message: `Your subscription for ${sub.product.name} has been renewed. Invoice: ${invoice.number}.`,
            type: "PAYMENT_STATUS",
            priority: "NORMAL",
          },
        });
        sendNotification(sub.buyerId, notification);

        // Fire payment.succeeded webhook
        await sendWebhookEvent(sub.productId, "payment.succeeded", {
          subscriptionId: sub.id,
          invoiceId: invoice.id,
          amountCents,
          buyerEmail: sub.recipientEmail,
        });

        console.log(`[Scheduler] Subscription ${sub.id} successfully billed and renewed`);
      } else {
        await handleBillingFailure(sub, "Card declined by bank simulator");
      }
    } catch (err: any) {
      console.error(`[Scheduler] Failed to process subscription ${sub.id}:`, err.message);
    }
  }
}

async function handleBillingFailure(sub: any, reason: string) {
  const amountCents = sub.plan.priceCents * sub.seats;

  // Set subscription to CANCEL_PENDING or payment failed status
  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      status: "CANCEL_PENDING",
    },
  });

  const notification = await prisma.notification.create({
    data: {
      userId: sub.buyerId,
      title: "Subscription Renewal Payment Failed",
      message: `We were unable to renew your subscription for ${sub.product.name}. Reason: ${reason}.`,
      type: "PAYMENT_STATUS",
      priority: "HIGH",
    },
  });
  sendNotification(sub.buyerId, notification);

  await sendWebhookEvent(sub.productId, "payment.failed", {
    subscriptionId: sub.id,
    amountCents,
    buyerEmail: sub.recipientEmail,
    reason,
  });
}

async function unlockTransactions() {
  console.log("[Scheduler] Running transaction unlock check...");
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    const result = await prisma.transaction.updateMany({
      where: {
        status: "LOCKED",
        createdAt: { lte: thirtyDaysAgo },
      },
      data: {
        status: "AVAILABLE",
      },
    });
    console.log(`[Scheduler] Unlocked ${result.count} transactions.`);
  } catch (err: any) {
    console.error("[Scheduler] Failed to unlock transactions:", err.message);
  }
}
