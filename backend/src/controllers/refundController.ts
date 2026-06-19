import { Request, Response } from "express";
import { asyncHandler, AppError } from "../utils/errorHandler";
import prisma from "../utils/prisma";
import { sendNotification } from "../socket/socketConnect";
import { formatMoney, sendTransactionEmail } from "../utils/emailNotifications";
import { getPlatformSetting } from "../config/platformSettings";

export const requestRefund = asyncHandler(
  async (req: Request, res: Response) => {
    const buyerId = (req as any).user.id;
    const { invoiceId, reason } = req.body as { invoiceId?: string; reason?: string };

    if (!invoiceId) {
      throw new AppError("invoiceId is required", 400);
    }
    if (!reason || reason.trim().length < 5) {
      throw new AppError("A descriptive reason (at least 5 characters) is required", 400);
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        buyerId,
      },
    });

    if (!invoice) {
      throw new AppError("Invoice not found", 404);
    }

    if (invoice.status !== "PAID") {
      throw new AppError("Only PAID invoices can be refunded", 400);
    }

    // Enforce refundsEnabled
    const product = await prisma.product.findUnique({
      where: { id: invoice.productId },
      include: {
        plans: {
          where: { id: invoice.planId },
        },
      },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const plan = product.plans[0];
    const refundsEnabled = plan ? plan.refundsEnabled : product.refundsEnabled;
    if (!refundsEnabled) {
      throw new AppError(plan ? "Refunds are disabled for this plan" : "Refunds are disabled for this product", 400);
    }

    // Check refund window limit from config
    const refundWindowDays = await getPlatformSetting("REFUND_WINDOW_DAYS");
    const refundWindowMs = refundWindowDays * 24 * 60 * 60 * 1000;
    const invoiceAgeMs = Date.now() - new Date(invoice.createdAt).getTime();
    if (invoiceAgeMs > refundWindowMs) {
      throw new AppError(`Refunds can only be requested within ${refundWindowDays} days of payment`, 400);
    }

    // Check if a request already exists
    const existing = await prisma.refundRequest.findFirst({
      where: {
        invoiceId,
      },
    });

    if (existing) {
      throw new AppError(`A refund request already exists for this invoice (Status: ${existing.status})`, 400);
    }

    if (!invoice.subscriptionId) {
      throw new AppError("Cannot refund an invoice not linked to a subscription", 400);
    }

    const refundRequest = await prisma.refundRequest.create({
      data: {
        buyerId,
        subscriptionId: invoice.subscriptionId,
        invoiceId,
        amountCents: invoice.amountCents,
        reason,
        status: "PENDING",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Refund request submitted successfully",
      refundRequest,
    });
  }
);

export const listPendingRefunds = asyncHandler(
  async (req: Request, res: Response) => {
    const refunds = await prisma.refundRequest.findMany({
      where: {
        status: "PENDING",
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
        invoice: {
          include: {
            product: true,
            plan: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      refunds,
    });
  }
);

export const decideRefund = asyncHandler(
  async (req: Request, res: Response) => {
    const refundId = String(req.params.refundId);
    const { decision, rejectionReason } = req.body as { decision?: "APPROVE" | "REJECT"; rejectionReason?: string };

    if (!decision || (decision !== "APPROVE" && decision !== "REJECT")) {
      throw new AppError("Decision must be 'APPROVE' or 'REJECT'", 400);
    }

    const refund = await prisma.refundRequest.findUnique({
      where: { id: refundId },
      include: {
        invoice: {
          include: {
            product: true,
          },
        },
        buyer: true,
      },
    });

    if (!refund) {
      throw new AppError("Refund request not found", 404);
    }

    if (refund.status !== "PENDING") {
      throw new AppError("Refund request has already been decided", 400);
    }

    if (decision === "APPROVE") {
      // Approve refund
      await prisma.$transaction(async (tx) => {
        await tx.refundRequest.update({
          where: { id: refundId },
          data: { status: "APPROVED" },
        });

        await tx.invoice.update({
          where: { id: refund.invoiceId },
          data: { status: "REFUNDED" },
        });

        // Find original sale transaction
        const originalSaleTx = await tx.transaction.findFirst({
          where: {
            invoiceId: refund.invoiceId,
            type: "SALE",
          },
        });

        const txStatus = originalSaleTx?.status === "LOCKED" ? "LOCKED" : "AVAILABLE";

        // Create transaction record
        await tx.transaction.create({
          data: {
            sellerId: refund.invoice.product.sellerId,
            amountCents: -refund.amountCents, // refund amount is negative
            type: "REFUND",
            status: txStatus,
            description: `Refund: ${refund.invoice.product.name} - ${refund.invoice.number}`,
            invoiceId: refund.invoiceId,
          },
        });
      });

      // Notify buyer
      const buyerNotification = await prisma.notification.create({
        data: {
          userId: refund.buyerId,
          title: "Refund Request Approved",
          message: `Your refund request for ${refund.invoice.product.name} invoice ${refund.invoice.number} of $${(refund.amountCents / 100).toFixed(2)} was approved.`,
          type: "PAYMENT_STATUS",
          priority: "HIGH",
        },
      });
      sendNotification(refund.buyerId, buyerNotification);
      await sendTransactionEmail({
        to: refund.buyer.email,
        subject: "Your AppStack refund was approved",
        title: "Refund approved",
        message: `Your refund request for ${refund.invoice.product.name} was approved.`,
        details: {
          Product: refund.invoice.product.name,
          Invoice: refund.invoice.number,
          Amount: formatMoney(refund.amountCents, refund.invoice.currency),
        },
      });

      // Notify seller
      const sellerNotification = await prisma.notification.create({
        data: {
          userId: refund.invoice.product.sellerId,
          title: "Refund Approved",
          message: `A refund of $${(refund.amountCents / 100).toFixed(2)} for ${refund.invoice.product.name} was approved by administrators.`,
          type: "PAYMENT_STATUS",
          priority: "NORMAL",
        },
      });
      sendNotification(refund.invoice.product.sellerId, sellerNotification);

      return res.status(200).json({
        success: true,
        message: "Refund approved successfully.",
      });
    } else {
      // Reject refund
      await prisma.refundRequest.update({
        where: { id: refundId },
        data: {
          status: "REJECTED",
          rejectionReason: rejectionReason || "Does not meet refund criteria.",
        },
      });

      // Notify buyer
      const buyerNotification = await prisma.notification.create({
        data: {
          userId: refund.buyerId,
          title: "Refund Request Rejected",
          message: `Your refund request for ${refund.invoice.product.name} invoice ${refund.invoice.number} was rejected. Reason: ${rejectionReason || "Does not meet policy guidelines."}`,
          type: "PAYMENT_STATUS",
          priority: "HIGH",
        },
      });
      sendNotification(refund.buyerId, buyerNotification);

      return res.status(200).json({
        success: true,
        message: "Refund request rejected.",
      });
    }
  }
);
