import prisma from "../utils/prisma";
import { sendNotification } from "../socket/socketConnect";
import { processDueWebhookEvents, sendWebhookEvent } from "./webhookWorker";
import { randomBytes } from "crypto";
import { formatMoney, sendTransactionEmail } from "../utils/emailNotifications";
import { getPaymentProvider } from "./payments";
import { getPlatformSetting } from "../config/platformSettings";

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
  
  // First, unlock transactions older than lock days
  await unlockTransactions();

  // Process approved payouts
  await processApprovedPayouts();

  // Process approved refunds
  await processApprovedRefunds();

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

  const provider = getPaymentProvider();

  for (const sub of dueSubscriptions) {
    try {
      const amountCents = sub.plan.priceCents * sub.seats;
      
      // Multi-card retry: gather all cards, prioritize primary
      const paymentMethodsToTry = [...sub.buyer.paymentMethods];
      paymentMethodsToTry.sort((a, b) => (a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1));

      if (paymentMethodsToTry.length === 0) {
        console.warn(`[Scheduler] No payment method found for buyer ${sub.buyerId} of subscription ${sub.id}`);
        await handleBillingFailure(sub, "No payment method on file");
        continue;
      }

      let chargeResult = null;
      let usedMethod = null;

      for (const method of paymentMethodsToTry) {
        console.log(`[Scheduler] Attempting charge of $${(amountCents / 100).toFixed(2)} on card ending in ${method.last4}...`);
        
        chargeResult = await provider.charge({
          amountCents,
          currency: sub.plan.currency,
          method: {
            last4: method.last4,
            simulatorToken: method.simulatorToken,
            providerToken: method.providerToken,
          },
          descriptor: `AppStack subscription renewal for ${sub.product.name}`,
          idempotencyKey: `renewal_${sub.id}_${sub.nextBillingAt.getTime()}`,
        });

        if (chargeResult.success) {
          usedMethod = method;
          break;
        } else {
          console.warn(`[Scheduler] Charge declined on card ending in ${method.last4}: ${chargeResult.failureReason}`);
        }
      }

      if (chargeResult && chargeResult.success && usedMethod) {
        // Update subscription to use the successful card if it differed
        if (usedMethod.id !== sub.paymentMethodId) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { paymentMethodId: usedMethod.id },
          });
        }

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
            providerChargeRef: chargeResult.providerRef ?? null,
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
        const failureReason = chargeResult?.failureReason || "All payment methods declined";
        await handleBillingFailure(sub, failureReason);
      }
    } catch (err: any) {
      console.error(`[Scheduler] Failed to process subscription ${sub.id}:`, err.message);
    }
  }
}

async function handleBillingFailure(sub: any, reason: string) {
  const amountCents = sub.plan.priceCents * sub.seats;
  const retryCount = (sub.billingRetryCount ?? 0) + 1;
  
  const maxRetries = await getPlatformSetting("BILLING_MAX_RETRIES");
  const retryDelayDays = await getPlatformSetting("BILLING_RETRY_DELAY_DAYS");
  
  const now = new Date();

  if (retryCount < maxRetries) {
    const nextRetry = new Date(now);
    nextRetry.setDate(nextRetry.getDate() + retryDelayDays);

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
  
  const lockDays = await getPlatformSetting("SALES_FUND_LOCK_DAYS");
  const lockCutoff = new Date();
  lockCutoff.setDate(lockCutoff.getDate() - lockDays);

  try {
    const result = await prisma.transaction.updateMany({
      where: {
        status: "LOCKED",
        createdAt: { lte: lockCutoff },
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

export async function processApprovedRefunds() {
  console.log("[Scheduler] Processing approved refunds...");
  const approvedRefunds = await prisma.refundRequest.findMany({
    where: { status: "APPROVED" },
    include: {
      invoice: {
        include: {
          product: true,
        },
      },
      buyer: true,
    },
  });

  const provider = getPaymentProvider();

  for (const refund of approvedRefunds) {
    try {
      console.log(`[Scheduler] Refunding refund request ${refund.id} via provider...`);
      const refundResult = await provider.refund({
        amountCents: refund.amountCents,
        currency: refund.invoice.currency,
        providerChargeRef: refund.invoice.providerChargeRef,
      });

      if (refundResult.success) {
        await prisma.refundRequest.update({
          where: { id: refund.id },
          data: {
            status: "COMPLETED",
            providerRefundRef: refundResult.providerRef ?? null,
          },
        });

        // Notify buyer
        const notification = await prisma.notification.create({
          data: {
            userId: refund.buyerId,
            title: "Refund Processed",
            message: `Your refund of $${(refund.amountCents / 100).toFixed(2)} for ${refund.invoice.product.name} has been processed successfully.`,
            type: "PAYMENT_STATUS",
            priority: "NORMAL",
          },
        });
        sendNotification(refund.buyerId, notification);
      } else {
        await prisma.refundRequest.update({
          where: { id: refund.id },
          data: {
            status: "FAILED",
            rejectionReason: refundResult.failureReason || "Gateway refund failed",
          },
        });

        // Notify buyer of failure
        const notification = await prisma.notification.create({
          data: {
            userId: refund.buyerId,
            title: "Refund Settlement Failed",
            message: `We encountered an issue processing your refund of $${(refund.amountCents / 100).toFixed(2)} for ${refund.invoice.product.name}.`,
            type: "PAYMENT_STATUS",
            priority: "HIGH",
          },
        });
        sendNotification(refund.buyerId, notification);
      }
    } catch (err: any) {
      console.error(`[Scheduler] Failed to process refund ${refund.id}:`, err.message);
    }
  }
}

export async function processApprovedPayouts() {
  console.log("[Scheduler] Processing approved payouts...");
  const approvedPayouts = await prisma.payoutRequest.findMany({
    where: { status: "APPROVED" },
    include: {
      seller: {
        include: {
          sellerApplications: {
            where: { isApproveSeller: "APPROVED" },
          },
        },
      },
    },
  });

  const provider = getPaymentProvider();

  for (const payout of approvedPayouts) {
    try {
      console.log(`[Scheduler] Disbursing payout request ${payout.id} via provider...`);
      const disburseResult = await provider.disburse({
        amountCents: payout.amountCents,
        currency: "USD",
        destination: payout.payoutEmail,
      });

      const businessName = payout.seller.sellerApplications[0]?.businessName || "your business";

      if (disburseResult.success) {
        await prisma.$transaction(async (tx) => {
          // Update status to COMPLETED
          await tx.payoutRequest.update({
            where: { id: payout.id },
            data: {
              status: "COMPLETED",
              providerPayoutRef: disburseResult.providerRef ?? null,
            },
          });

          // Create negative Transaction
          await tx.transaction.create({
            data: {
              sellerId: payout.sellerId,
              amountCents: -payout.amountCents,
              type: "PAYOUT",
              status: "WITHDRAWN",
              description: `Payout: Sent to ${payout.payoutEmail}`,
              payoutId: payout.id,
            },
          });
        });

        // Notify seller
        const notification = await prisma.notification.create({
          data: {
            userId: payout.sellerId,
            title: "Payout Completed",
            message: `Your payout request of $${(payout.amountCents / 100).toFixed(2)} for ${businessName} has been processed and sent.`,
            type: "PAYMENT_STATUS",
            priority: "HIGH",
          },
        });
        sendNotification(payout.sellerId, notification);
      } else {
        await prisma.payoutRequest.update({
          where: { id: payout.id },
          data: {
            status: "FAILED",
            rejectionReason: disburseResult.failureReason || "Gateway payout failed",
          },
        });

        // Notify seller of failure
        const notification = await prisma.notification.create({
          data: {
            userId: payout.sellerId,
            title: "Payout Failed",
            message: `We were unable to process your payout request of $${(payout.amountCents / 100).toFixed(2)} for ${businessName}. Reason: ${disburseResult.failureReason || "Gateway error"}.`,
            type: "PAYMENT_STATUS",
            priority: "HIGH",
          },
        });
        sendNotification(payout.sellerId, notification);
      }
    } catch (err: any) {
      console.error(`[Scheduler] Failed to process payout ${payout.id}:`, err.message);
    }
  }
}
