import prisma from "../utils/prisma";
import { sendNotification } from "../socket/socketConnect";
import { processDueWebhookEvents, sendWebhookEvent } from "./webhookWorker";
import { randomBytes } from "crypto";
import { formatMoney, sendTransactionEmail } from "../utils/emailNotifications";

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
      OR: [
        {
          status: { in: ["ACTIVE", "CHANGE_PENDING"] },
          nextBillingAt: { lte: now },
        },
        {
          status: "PAST_DUE",
          nextBillingRetryAt: { lte: now },
        },
      ],
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
            billingRetryCount: 0,
            lastBillingFailureAt: null,
            nextBillingRetryAt: null,
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
        await sendTransactionEmail({
          to: sub.buyer.email,
          subject: "Your AppStack subscription renewed",
          title: "Subscription renewed",
          message: `Your ${sub.product.name} subscription renewed successfully.`,
          details: {
            Product: sub.product.name,
            Plan: sub.plan.name,
            Amount: formatMoney(amountCents, sub.plan.currency),
            Invoice: invoice.number,
          },
        });

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
  const retryCount = (sub.billingRetryCount ?? 0) + 1;
  const maxRetries = 3;
  const now = new Date();

  if (retryCount < maxRetries) {
    const nextRetry = new Date(now);
    nextRetry.setDate(nextRetry.getDate() + 1);

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: "PAST_DUE",
        billingRetryCount: retryCount,
        lastBillingFailureAt: now,
        nextBillingRetryAt: nextRetry,
        integrationStatusMessage: `Payment failed. Retry ${retryCount} of ${maxRetries} is scheduled.`,
      },
    });

    const notification = await prisma.notification.create({
      data: {
        userId: sub.buyerId,
        title: "Subscription Renewal Payment Failed",
        message: `We were unable to renew your subscription for ${sub.product.name}. Reason: ${reason}. We will retry payment.`,
        type: "PAYMENT_STATUS",
        priority: "HIGH",
      },
    });
    sendNotification(sub.buyerId, notification);

    await sendTransactionEmail({
      to: sub.buyer.email,
      subject: "AppStack payment retry scheduled",
      title: "Subscription payment failed",
      message: `We could not renew your ${sub.product.name} subscription. AppStack will retry payment automatically.`,
      details: {
        Product: sub.product.name,
        Plan: sub.plan.name,
        Amount: formatMoney(amountCents, sub.plan.currency),
        Retry: `${retryCount} of ${maxRetries}`,
        Reason: reason,
      },
    });

    await sendWebhookEvent(sub.productId, "payment.failed", {
      subscriptionId: sub.id,
      amountCents,
      buyerEmail: sub.recipientEmail,
      reason,
      retryCount,
      finalAttempt: false,
    });

    return;
  }

  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      status: "CANCELED",
      canceledAt: now,
      billingRetryCount: retryCount,
      lastBillingFailureAt: now,
      nextBillingRetryAt: null,
      integrationStatusMessage: `Payment failed after ${maxRetries} attempts. Subscription was canceled.`,
    },
  });

  const notification = await prisma.notification.create({
    data: {
      userId: sub.buyerId,
      title: "Subscription Canceled After Payment Failures",
      message: `We were unable to renew your subscription for ${sub.product.name} after ${maxRetries} attempts. Reason: ${reason}.`,
      type: "PAYMENT_STATUS",
      priority: "HIGH",
    },
  });
  sendNotification(sub.buyerId, notification);

  await sendTransactionEmail({
    to: sub.buyer.email,
    subject: "AppStack subscription canceled after payment failures",
    title: "Subscription canceled",
    message: `Your ${sub.product.name} subscription was canceled after repeated payment failures.`,
    details: {
      Product: sub.product.name,
      Plan: sub.plan.name,
      Amount: formatMoney(amountCents, sub.plan.currency),
      Attempts: retryCount,
      Reason: reason,
    },
  });

  await sendWebhookEvent(sub.productId, "payment.failed", {
    subscriptionId: sub.id,
    amountCents,
    buyerEmail: sub.recipientEmail,
    reason,
    retryCount,
    finalAttempt: true,
  });

  await sendWebhookEvent(sub.productId, "subscription.canceled", {
    subscriptionId: sub.id,
    buyerEmail: sub.recipientEmail,
    planIdentifier: sub.plan.identifier,
    reason: "payment_failed",
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
