import crypto from "crypto";
import { Request, Response } from "express";
import { asyncHandler, AppError } from "../utils/errorHandler";
import prisma from "../utils/prisma";
import { sendNotification } from "../socket/socketConnect";
import { formatMoney, sendTransactionEmail } from "../utils/emailNotifications";
import { getPaymentProvider } from "../services/payments";

type AckAction = "activate" | "change_applied" | "cancel_applied";

function invoiceNumber() {
  return `INV-${new Date().getFullYear()}-${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;
}

function authSecret(req: Request) {
  const authHeader = req.headers["authorization"] || req.headers["x-appstack-secret"];

  if (!authHeader) {
    throw new AppError("Authorization header is required", 401);
  }

  return typeof authHeader === "string" && authHeader.startsWith("Bearer ")
    ? authHeader.substring(7)
    : String(authHeader);
}

function ensureAction(value: unknown): AckAction {
  if (
    value === "activate" ||
    value === "change_applied" ||
    value === "cancel_applied"
  ) {
    return value;
  }
  throw new AppError("action must be activate, change_applied, or cancel_applied", 400);
}

async function createSettlementIfMissing(tx: any, subscription: any, paidAt: Date) {
  const existing = await tx.invoice.findFirst({
    where: {
      subscriptionId: subscription.id,
      status: "PAID",
    },
  });

  if (existing) {
    return existing;
  }

  const method = await tx.paymentMethod.findFirst({
    where: {
      id: subscription.paymentMethodId ?? undefined,
    },
  }) || await tx.paymentMethod.findFirst({
    where: { userId: subscription.buyerId, isPrimary: true },
  }) || await tx.paymentMethod.findFirst({
    where: { userId: subscription.buyerId },
  });

  if (!method) {
    throw new AppError("No payment method found for buyer", 400);
  }

  const amountCents = subscription.plan.priceCents * subscription.seats;
  const provider = getPaymentProvider();
  const chargeResult = await provider.charge({
    amountCents,
    currency: subscription.plan.currency,
    method: {
      last4: method.last4,
      simulatorToken: method.simulatorToken,
      providerToken: method.providerToken,
    },
    descriptor: `SaaS Activation: ${subscription.product.name}`,
    idempotencyKey: `activation_${subscription.id}`,
  });

  if (!chargeResult.success) {
    throw new AppError(chargeResult.failureReason || "Activation payment failed", 400);
  }

  const invoice = await tx.invoice.create({
    data: {
      number: invoiceNumber(),
      buyerId: subscription.buyerId,
      subscriptionId: subscription.id,
      productId: subscription.productId,
      planId: subscription.planId,
      amountCents,
      currency: subscription.plan.currency,
      status: "PAID",
      description: `SaaS Activation: ${subscription.product.name} - ${subscription.plan.name} (${subscription.seats} seat${subscription.seats === 1 ? "" : "s"})`,
      paidAt,
      providerChargeRef: chargeResult.providerRef ?? null,
    },
  });

  await tx.transaction.create({
    data: {
      sellerId: subscription.product.sellerId,
      amountCents,
      type: "SALE",
      status: "LOCKED",
      description: `Sale: ${subscription.product.name} - ${subscription.plan.name} (${subscription.seats} seat${subscription.seats === 1 ? "" : "s"})`,
      invoiceId: invoice.id,
    },
  });

  return invoice;
}

async function notifyLifecycle(subscription: any, title: string, message: string) {
  const buyerNotification = await prisma.notification.create({
    data: {
      userId: subscription.buyerId,
      title,
      message,
      type: "ORDER_UPDATE",
      priority: "HIGH",
    },
  });
  sendNotification(subscription.buyerId, buyerNotification);

  const sellerNotification = await prisma.notification.create({
    data: {
      userId: subscription.product.sellerId,
      title,
      message,
      type: "ORDER_UPDATE",
      priority: "NORMAL",
    },
  });
  sendNotification(subscription.product.sellerId, sellerNotification);
}

async function handleAcknowledgement(
  subscriptionId: string,
  secret: string,
  body: {
    eventId?: string;
    action?: string;
    accepted?: boolean;
    message?: string;
  },
) {
  const action = ensureAction(body.action);
  const accepted = Boolean(body.accepted);
  const message = body.message?.trim() || null;

  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { product: true, plan: true, buyer: true },
  });

  if (!subscription) {
    throw new AppError("Subscription not found", 404);
  }

  if (!subscription.product.webhookSecret || subscription.product.webhookSecret !== secret) {
    throw new AppError("Invalid API Secret / Webhook Secret", 403);
  }

  if (body.eventId) {
    const event = await prisma.webhookEvent.findFirst({
      where: {
        id: body.eventId,
        productId: subscription.productId,
      },
    });

    if (!event) {
      throw new AppError("eventId does not match this product", 400);
    }
  }

  if (!accepted) {
    const integrationStatusMessage = message ?? "Seller SaaS rejected the requested lifecycle action.";
    let data: any = { integrationStatusMessage };

    if (action === "change_applied") {
      data = {
        status: "ACTIVE",
        pendingPlanId: null,
        integrationStatusMessage,
      };
    }

    if (action === "cancel_applied") {
      data = {
        status: "ACTIVE",
        canceledAt: null,
        adminCancellationApprovedAt: null,
        integrationStatusMessage,
      };
    }

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data,
      include: { product: true, plan: true },
    });

    await notifyLifecycle(
      subscription,
      "SaaS Integration Rejected Request",
      `${subscription.product.name} rejected ${action}. ${integrationStatusMessage}`,
    );

    return updated;
  }

  if (action === "activate") {
    if (subscription.status !== "PENDING") {
      throw new AppError("Subscription is not pending activation", 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const activated = await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "ACTIVE",
          integrationStatusMessage: null,
        },
        include: { product: true, plan: true, buyer: true },
      });

      await createSettlementIfMissing(tx, activated, new Date());
      return activated;
    });

    await notifyLifecycle(
      updated,
      "Subscription Activated",
      `${updated.product.name} has confirmed your subscription activation.`,
    );
    await sendTransactionEmail({
      to: updated.buyer.email,
      subject: "Your AppStack subscription is active",
      title: "Subscription activated",
      message: `${updated.product.name} confirmed your subscription activation.`,
      details: {
        Product: updated.product.name,
        Plan: updated.plan.name,
        Amount: formatMoney(updated.plan.priceCents * updated.seats, updated.plan.currency),
      },
    });

    return updated;
  }

  if (action === "change_applied") {
    if (subscription.status !== "CHANGE_PENDING" || !subscription.pendingPlanId) {
      throw new AppError("Subscription is not pending a plan change", 400);
    }

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "ACTIVE",
        planId: subscription.pendingPlanId,
        pendingPlanId: null,
        integrationStatusMessage: null,
      },
      include: { product: true, plan: true },
    });

    await notifyLifecycle(
      updated,
      "Subscription Plan Changed",
      `${updated.product.name} confirmed your plan change to ${updated.plan.name}.`,
    );

    return updated;
  }

  if (subscription.status !== "CANCEL_PENDING") {
    throw new AppError("Subscription is not pending cancellation", 400);
  }

  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: "CANCELED",
      canceledAt: new Date(),
      integrationStatusMessage: null,
    },
    include: { product: true, plan: true, buyer: true },
  });

  await notifyLifecycle(
    updated,
    "Subscription Canceled",
    `${updated.product.name} confirmed your subscription cancellation.`,
  );
  await sendTransactionEmail({
    to: updated.buyer?.email,
    subject: "Your AppStack subscription was canceled",
    title: "Subscription canceled",
    message: `${updated.product.name} confirmed your subscription cancellation.`,
    details: {
      Product: updated.product.name,
      Plan: updated.plan.name,
    },
  });

  return updated;
}

export const acknowledgeSubscriptionLifecycle = asyncHandler(
  async (req: Request, res: Response) => {
    const subscriptionId = String(req.params.subscriptionId);
    const updated = await handleAcknowledgement(subscriptionId, authSecret(req), req.body);

    return res.status(200).json({
      success: true,
      message: "Subscription acknowledgement processed",
      subscriptionId,
      status: updated.status,
      subscription: updated,
    });
  },
);

export const updateSubscriptionStatusFromSaaS = asyncHandler(
  async (req: Request, res: Response) => {
    const subscriptionId = String(req.params.subscriptionId);
    const { status, eventId, message } = req.body as {
      status?: string;
      eventId?: string;
      message?: string;
    };

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: { status: true, pendingPlanId: true },
    });

    if (!subscription) {
      throw new AppError("Subscription not found", 404);
    }

    const action =
      status === "ACTIVE" && subscription.status === "CHANGE_PENDING" && subscription.pendingPlanId
        ? "change_applied"
        : status === "ACTIVE"
          ? "activate"
          : status === "CANCELED"
            ? "cancel_applied"
            : undefined;

    if (!action) {
      throw new AppError("Compatibility status endpoint only supports ACTIVE or CANCELED. Use /ack for other lifecycle actions.", 400);
    }

    const updated = await handleAcknowledgement(subscriptionId, authSecret(req), {
      eventId,
      action,
      accepted: true,
      message,
    });

    return res.status(200).json({
      success: true,
      message: `Subscription status updated to ${updated.status}`,
      subscriptionId,
      status: updated.status,
      subscription: updated,
    });
  },
);
