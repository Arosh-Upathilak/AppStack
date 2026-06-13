import crypto from "crypto";
import { Request, Response } from "express";
import { AppError, asyncHandler } from "../utils/errorHandler";
import prisma from "../utils/prisma";
import { sendNotification } from "../socket/socketConnect";
import { sendWebhookEvent } from "../services/webhookWorker";

const includeSubscription = {
  product: true,
  plan: true,
  paymentMethod: true,
};

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
  return `INV-${new Date().getFullYear()}-${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;
}

function serializeSubscription(subscription: any) {
  return {
    id: subscription.id,
    buyerId: subscription.buyerId,
    productId: subscription.productId,
    planId: subscription.planId,
    productName: subscription.product?.name,
    productSlug: subscription.product?.slug,
    vendor: subscription.product?.category,
    planName: subscription.plan?.name,
    planIdentifier: subscription.plan?.identifier,
    priceCents: subscription.plan?.priceCents,
    currency: subscription.plan?.currency ?? "USD",
    billingInterval: subscription.plan?.billingInterval,
    recipientEmail: subscription.recipientEmail,
    seats: subscription.seats,
    status: subscription.status,
    canceledAt: subscription.canceledAt,
    adminCancellationApprovedAt: subscription.adminCancellationApprovedAt,
    integrationStatusMessage: subscription.integrationStatusMessage,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    nextBillingAt: subscription.nextBillingAt,
    paymentMethod: subscription.paymentMethod
      ? {
          id: subscription.paymentMethod.id,
          brand: subscription.paymentMethod.brand,
          last4: subscription.paymentMethod.last4,
          isPrimary: subscription.paymentMethod.isPrimary,
        }
      : null,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
  };
}

async function settleSubscriptionPayment(client: any, args: {
  buyerId: string;
  subscriptionId: string;
  product: any;
  plan: any;
  seats: number;
  paidAt: Date;
  descriptionPrefix?: string;
}) {
  const existingInvoice = await client.invoice.findFirst({
    where: {
      subscriptionId: args.subscriptionId,
      status: "PAID",
    },
    include: {
      product: true,
      plan: true,
    },
  });

  if (existingInvoice) {
    return { invoice: existingInvoice, transaction: null };
  }

  const amountCents = args.plan.priceCents * args.seats;
  const invoice = await client.invoice.create({
    data: {
      number: invoiceNumber(),
      buyerId: args.buyerId,
      subscriptionId: args.subscriptionId,
      productId: args.product.id,
      planId: args.plan.id,
      amountCents,
      currency: args.plan.currency,
      status: "PAID",
      description: `${args.descriptionPrefix ?? "Sale"}: ${args.product.name} - ${args.plan.name} (${args.seats} seat${args.seats === 1 ? "" : "s"})`,
      paidAt: args.paidAt,
    },
    include: {
      product: true,
      plan: true,
    },
  });

  const transaction = await client.transaction.create({
    data: {
      sellerId: args.product.sellerId,
      amountCents,
      type: "SALE",
      status: "LOCKED",
      description: `Sale: ${args.product.name} - ${args.plan.name} (${args.seats} seat${args.seats === 1 ? "" : "s"})`,
      invoiceId: invoice.id,
    },
  });

  return { invoice, transaction };
}

function serializeInvoice(invoice: any) {
  return {
    id: invoice.id,
    number: invoice.number,
    buyerId: invoice.buyerId,
    subscriptionId: invoice.subscriptionId,
    productId: invoice.productId,
    planId: invoice.planId,
    productName: invoice.product?.name,
    planName: invoice.plan?.name,
    amountCents: invoice.amountCents,
    currency: invoice.currency,
    status: invoice.status,
    description: invoice.description,
    issuedAt: invoice.issuedAt,
    paidAt: invoice.paidAt,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
  };
}

export const createSubscription = asyncHandler(
  async (req: Request, res: Response) => {
    const buyerId = (req as any).user.id;
    const {
      productId,
      planId,
      paymentMethodId,
      recipientEmail,
      seats,
      acceptEmailConsent,
    } = req.body as {
      productId?: string;
      planId?: string;
      paymentMethodId?: string;
      recipientEmail?: string;
      seats?: number;
      acceptEmailConsent?: boolean;
    };

    if (!productId || !planId) {
      throw new AppError("productId and planId are required", 400);
    }

    if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      throw new AppError("A valid recipientEmail is required", 400);
    }

    if (!acceptEmailConsent) {
      throw new AppError("Email sharing consent is required", 400);
    }

    const seatCount = Math.max(1, Number(seats) || 1);

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        status: "APPROVED",
      },
      include: {
        plans: true,
      },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const plan = product.plans.find((candidate) => candidate.id === planId);
    if (!plan || !plan.isActive) {
      throw new AppError("Plan not found", 404);
    }

    const method = paymentMethodId
      ? await prisma.paymentMethod.findFirst({
          where: {
            id: paymentMethodId,
            userId: buyerId,
          },
        })
      : await prisma.paymentMethod.findFirst({
          where: {
            userId: buyerId,
            isPrimary: true,
          },
        });

    if (!method) {
      throw new AppError("A payment method is required", 400);
    }

    const now = new Date();
    const periodEnd = addBillingPeriod(now, plan.billingInterval);
    const requiresSaasActivation = Boolean(product.webhookUrl);

    const result = await prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.create({
        data: {
          buyerId,
          productId: product.id,
          planId: plan.id,
          paymentMethodId: method.id,
          recipientEmail: recipientEmail.toLowerCase(),
          seats: seatCount,
          status: requiresSaasActivation ? "PENDING" : "ACTIVE",
          integrationStatusMessage: requiresSaasActivation
            ? "Waiting for seller SaaS activation acknowledgement."
            : null,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          nextBillingAt: periodEnd,
        },
        include: includeSubscription,
      });

      const consent = await tx.consent.create({
        data: {
          userId: buyerId,
          subscriptionId: subscription.id,
          productId: product.id,
          planId: plan.id,
          type: "SHARE_EMAIL",
          recipientEmail: recipientEmail.toLowerCase(),
          ipAddress: req.ip,
          userAgent: req.get("user-agent") ?? null,
        },
      });

      const settlement = requiresSaasActivation
        ? { invoice: null, transaction: null }
        : await settleSubscriptionPayment(tx, {
            buyerId,
            subscriptionId: subscription.id,
            product,
            plan,
            seats: seatCount,
            paidAt: now,
          });

      return { subscription, invoice: settlement.invoice, consent, transaction: settlement.transaction };
    });

    const buyerNotification = await prisma.notification.create({
      data: {
        userId: buyerId,
        title: requiresSaasActivation ? "Subscription Pending Activation" : "Subscription Active",
        message: requiresSaasActivation
          ? `Your ${product.name} subscription is pending activation by the SaaS platform.`
          : `Your ${product.name} subscription is active.`,
        type: "SUBSCRIPTION_CREATED",
        priority: "NORMAL",
      },
    });
    sendNotification(buyerId, buyerNotification);

    const sellerNotification = await prisma.notification.create({
      data: {
        userId: product.sellerId,
        title: requiresSaasActivation ? "New Subscription Pending" : "New Subscription Active",
        message: requiresSaasActivation
          ? `${product.name} received a new subscription. Webhook dispatched. Buyer PII is limited to the consented recipient email.`
          : `${product.name} received a new active subscription.`,
        type: "SUBSCRIPTION_CREATED",
        priority: "NORMAL",
      },
    });
    sendNotification(product.sellerId, sellerNotification);

    // Fire subscription.created webhook event
    await sendWebhookEvent(product.id, "subscription.created", {
      subscriptionId: result.subscription.id,
      buyerEmail: result.subscription.recipientEmail,
      planIdentifier: plan.identifier,
      seats: seatCount,
      priceCents: plan.priceCents,
      currency: plan.currency,
    });

    return res.status(201).json({
      success: true,
      message: requiresSaasActivation
        ? "Subscription created and pending SaaS activation"
        : "Subscription created",
      subscription: serializeSubscription(result.subscription),
      invoice: result.invoice ? serializeInvoice(result.invoice) : null,
      consent: result.consent,
    });
  },
);

export const listSubscriptions = asyncHandler(
  async (req: Request, res: Response) => {
    const buyerId = (req as any).user.id;
    const subscriptions = await prisma.subscription.findMany({
      where: {
        buyerId,
      },
      include: includeSubscription,
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      subscriptions: subscriptions.map(serializeSubscription),
    });
  },
);

export const updateSubscription = asyncHandler(
  async (req: Request, res: Response) => {
    const buyerId = (req as any).user.id;
    const subscriptionId = String(req.params.subscriptionId);
    const { action, planId: newPlanId } = req.body as { action?: "cancel" | "change-plan"; planId?: string };

    if (!action || (action !== "cancel" && action !== "change-plan")) {
      throw new AppError("Action must be 'cancel' or 'change-plan'", 400);
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        buyerId,
      },
      include: {
        product: true,
        plan: true,
      },
    });

    if (!subscription) {
      throw new AppError("Subscription not found", 404);
    }

    if (action === "change-plan") {
      if (!newPlanId) {
        throw new AppError("planId is required for change-plan action", 400);
      }

      // Find new plan
      const newPlan = await prisma.productPlan.findFirst({
        where: {
          id: newPlanId,
          productId: subscription.productId,
          isActive: true,
        },
      });

      if (!newPlan) {
        throw new AppError("New plan not found or inactive", 404);
      }

      if (subscription.planId === newPlanId) {
        throw new AppError("Subscription is already on this plan", 400);
      }

      // Calculate pro-rating
      const now = new Date();
      const periodStart = subscription.currentPeriodStart.getTime();
      const periodEnd = subscription.currentPeriodEnd.getTime();
      const totalPeriod = periodEnd - periodStart;
      const remainingTime = periodEnd - now.getTime();

      let remainingRatio = remainingTime / totalPeriod;
      if (remainingRatio < 0) remainingRatio = 0;
      if (remainingRatio > 1) remainingRatio = 1;

      const oldPlanPrice = subscription.plan.priceCents;
      const newPlanPrice = newPlan.priceCents;
      const seats = subscription.seats;

      const oldPlanUnusedValue = Math.round(oldPlanPrice * seats * remainingRatio);
      const newPlanCost = Math.round(newPlanPrice * seats * remainingRatio);
      const amountToCharge = newPlanCost - oldPlanUnusedValue;

      // Charge difference if positive
      if (amountToCharge > 0) {
        await prisma.invoice.create({
          data: {
            number: invoiceNumber(),
            buyerId,
            subscriptionId: subscription.id,
            productId: subscription.productId,
            planId: newPlan.id,
            amountCents: amountToCharge,
            currency: newPlan.currency,
            status: "PAID",
            description: `Plan Upgrade Pro-rated Charge: ${subscription.product.name} - ${newPlan.name} (pro-rated difference)`,
            paidAt: now,
          },
        });
      } else if (amountToCharge < 0) {
        await prisma.invoice.create({
          data: {
            number: invoiceNumber(),
            buyerId,
            subscriptionId: subscription.id,
            productId: subscription.productId,
            planId: newPlan.id,
            amountCents: Math.abs(amountToCharge),
            currency: newPlan.currency,
            status: "REFUNDED",
            description: `Plan Downgrade Pro-rated Credit: ${subscription.product.name} - ${newPlan.name} (pro-rated credit)`,
            paidAt: now,
          },
        });
      }

      // Set subscription status to CHANGE_PENDING and store pendingPlanId
      const updated = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "CHANGE_PENDING",
          pendingPlanId: newPlan.id,
        },
        include: includeSubscription,
      });

      // Fire subscription.updated webhook event
      await sendWebhookEvent(subscription.productId, "subscription.updated", {
        subscriptionId: subscription.id,
        buyerEmail: subscription.recipientEmail,
        oldPlanIdentifier: subscription.plan.identifier,
        newPlanIdentifier: newPlan.identifier,
        seats: subscription.seats,
        proRatedAmountCents: amountToCharge,
      });

      return res.status(200).json({
        success: true,
        message: "Plan change requested, pending SaaS activation",
        subscription: serializeSubscription(updated),
      });
    }

    // Otherwise, cancellation
    const updated = await prisma.subscription.update({
      where: {
        id: subscription.id,
      },
      data: {
        status: "CANCEL_PENDING",
        canceledAt: new Date(),
      },
      include: includeSubscription,
    });

    // Notify admins
    const adminNotification = await prisma.notification.create({
      data: {
        userId: subscription.product.sellerId, // Or global admins, notify seller first
        title: "Cancellation Request",
        message: `Cancellation requested for ${subscription.product.name}. Awaiting admin approval.`,
        type: "ORDER_UPDATE",
        priority: "NORMAL",
      },
    });
    sendNotification(subscription.product.sellerId, adminNotification);

    return res.status(200).json({
      success: true,
      message: "Cancellation requested",
      subscription: serializeSubscription(updated),
    });
  },
);

export const listPendingCancellations = asyncHandler(
  async (req: Request, res: Response) => {
    const cancellations = await prisma.subscription.findMany({
      where: {
        status: "CANCEL_PENDING",
        adminCancellationApprovedAt: null,
      },
      include: {
        buyer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        product: true,
        plan: true,
      },
      orderBy: {
        canceledAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      cancellations,
    });
  }
);

export const decideCancellation = asyncHandler(
  async (req: Request, res: Response) => {
    const subscriptionId = String(req.params.subscriptionId);
    const { decision } = req.body as { decision?: "APPROVE" | "REJECT" };

    if (!decision || (decision !== "APPROVE" && decision !== "REJECT")) {
      throw new AppError("Decision must be 'APPROVE' or 'REJECT'", 400);
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        product: true,
        plan: true,
      },
    });

    if (!subscription) {
      throw new AppError("Subscription not found", 404);
    }

    if (subscription.status !== "CANCEL_PENDING") {
      throw new AppError("Subscription is not pending cancellation", 400);
    }

    if (decision === "APPROVE") {
      if (subscription.product.webhookUrl) {
        const updated = await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            adminCancellationApprovedAt: new Date(),
            integrationStatusMessage: "Cancellation approved by admin. Waiting for seller SaaS cancellation acknowledgement.",
          },
        });

        await sendWebhookEvent(subscription.productId, "subscription.canceled", {
          subscriptionId: subscription.id,
          buyerEmail: subscription.recipientEmail,
          planIdentifier: subscription.plan.identifier,
        });

        const buyerNotif = await prisma.notification.create({
          data: {
            userId: subscription.buyerId,
            title: "Cancellation Approved",
            message: `Your cancellation request for ${subscription.product.name} was approved and is waiting for SaaS confirmation.`,
            type: "ORDER_UPDATE",
            priority: "HIGH",
          },
        });
        sendNotification(subscription.buyerId, buyerNotif);

        const sellerNotif = await prisma.notification.create({
          data: {
            userId: subscription.product.sellerId,
            title: "Cancellation Pending SaaS Confirmation",
            message: `A cancellation for ${subscription.product.name} was approved. Confirm cancellation through the integration acknowledgement API.`,
            type: "ORDER_UPDATE",
            priority: "NORMAL",
          },
        });
        sendNotification(subscription.product.sellerId, sellerNotif);

        return res.status(200).json({
          success: true,
          message: "Cancellation approved and pending SaaS confirmation.",
          subscription: updated,
        });
      }

      const updated = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: "CANCELED",
          canceledAt: new Date(),
          adminCancellationApprovedAt: new Date(),
          integrationStatusMessage: null,
        },
      });

      // Fire subscription.canceled webhook event
      await sendWebhookEvent(subscription.productId, "subscription.canceled", {
        subscriptionId: subscription.id,
        buyerEmail: subscription.recipientEmail,
        planIdentifier: subscription.plan.identifier,
      });

      // Notify buyer
      const buyerNotif = await prisma.notification.create({
        data: {
          userId: subscription.buyerId,
          title: "Subscription Cancelled",
          message: `Your subscription for ${subscription.product.name} has been cancelled.`,
          type: "ORDER_UPDATE",
          priority: "HIGH",
        },
      });
      sendNotification(subscription.buyerId, buyerNotif);

      // Notify seller
      const sellerNotif = await prisma.notification.create({
        data: {
          userId: subscription.product.sellerId,
          title: "Subscription Cancelled",
          message: `A subscription for ${subscription.product.name} has been cancelled.`,
          type: "ORDER_UPDATE",
          priority: "NORMAL",
        },
      });
      sendNotification(subscription.product.sellerId, sellerNotif);

      return res.status(200).json({
        success: true,
        message: "Cancellation approved, subscription canceled.",
        subscription: updated,
      });
    } else {
      // Reject cancellation
      const updated = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: "ACTIVE",
          canceledAt: null,
          adminCancellationApprovedAt: null,
          integrationStatusMessage: null,
        },
      });

      // Notify buyer
      const buyerNotif = await prisma.notification.create({
        data: {
          userId: subscription.buyerId,
          title: "Cancellation Request Rejected",
          message: `Your request to cancel the subscription for ${subscription.product.name} was rejected. Your subscription remains active.`,
          type: "ORDER_UPDATE",
          priority: "HIGH",
        },
      });
      sendNotification(subscription.buyerId, buyerNotif);

      return res.status(200).json({
        success: true,
        message: "Cancellation request rejected, subscription remains active.",
        subscription: updated,
      });
    }
  }
);

export const listInvoices = asyncHandler(async (req: Request, res: Response) => {
  const buyerId = (req as any).user.id;
  const invoices = await prisma.invoice.findMany({
    where: {
      buyerId,
    },
    include: {
      product: true,
      plan: true,
    },
    orderBy: {
      issuedAt: "desc",
    },
  });

  return res.status(200).json({
    success: true,
    invoices: invoices.map(serializeInvoice),
  });
});

export const downloadInvoice = asyncHandler(
  async (req: Request, res: Response) => {
    const buyerId = (req as any).user.id;
    const invoiceId = String(req.params.invoiceId);

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        buyerId,
      },
      include: {
        product: true,
        plan: true,
      },
    });

    if (!invoice) {
      throw new AppError("Invoice not found", 404);
    }

    const invoiceWithRelations = invoice as any;
    const amount = (invoice.amountCents / 100).toFixed(2);
    const content = [
      "AppStack Invoice",
      `Invoice: ${invoice.number}`,
      `Issued: ${invoice.issuedAt.toISOString()}`,
      `Status: ${invoice.status}`,
      `Product: ${invoiceWithRelations.product.name}`,
      `Plan: ${invoiceWithRelations.plan.name}`,
      `Description: ${invoice.description}`,
      `Amount: ${invoice.currency} ${amount}`,
    ].join("\n");

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${invoice.number}.txt"`,
    );
    return res.status(200).send(content);
  },
);

export const listConsents = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const consents = await prisma.consent.findMany({
    where: {
      userId,
    },
    include: {
      product: true,
      plan: true,
    },
    orderBy: {
      agreedAt: "desc",
    },
  });

  return res.status(200).json({
    success: true,
    consents: consents.map((consent) => ({
      id: consent.id,
      type: consent.type,
      agreedAt: consent.agreedAt,
      ipAddress: consent.ipAddress,
      recipientEmail: consent.recipientEmail,
      product: consent.product?.name ?? "Unknown product",
      plan: consent.plan?.name ?? "Unknown plan",
    })),
  });
});
