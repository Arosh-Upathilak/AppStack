import { AppError, asyncHandler } from "../utils/errorHandler";
import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { sendNotification } from "../socket/socketConnect";

const createSellerRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { payoutEmail, businessName, aboutProject } = req.body;
    const userId = (req as any).user.id;

    // Validation
    if (!payoutEmail || !businessName) {
      throw new AppError("payoutEmail and businessName are required", 400);
    }

    const existsSeller = await prisma.seller.findFirst({
      where: {
        payoutEmail: payoutEmail,
      },
    });

    if (existsSeller) {
      throw new AppError("Account already seller", 400);
    }

    const newSeller = await prisma.$transaction(async (tx) => {
      const seller = await tx.seller.create({
        data: {
          userId,
          payoutEmail,
          businessName,
          aboutProject,
        },
      });

      await tx.consent.create({
        data: {
          userId,
          type: "DATA_PROTECTION",
          recipientEmail: payoutEmail.trim().toLowerCase(),
          ipAddress: req.ip,
          userAgent: req.get("user-agent") ?? null,
        },
      });

      return seller;
    });

    const notification = await prisma.notification.create({
      data: {
        userId,
        title: "Seller Request Submitted",
        message:
          "Your seller application has been submitted and is awaiting admin approval.",
        type: "SELLER_PENDING",
        priority: "NORMAL",
      },
    });

    sendNotification(userId, notification);

    // Notify all admin users
    try {
      const admins = await prisma.user.findMany({
        where: {
          roles: {
            has: "ADMIN",
          },
        },
      });

      for (const admin of admins) {
        const adminNotification = await prisma.notification.create({
          data: {
            userId: admin.id,
            title: "New Seller Application",
            message: `New seller application from "${businessName}" (Seller ID: ${newSeller.id}) is pending review.`,
            type: "SELLER_PENDING",
            priority: "NORMAL",
          },
        });

        sendNotification(admin.id, adminNotification);
      }
    } catch (err) {
      console.error("Failed to send socket notifications to admins:", err);
    }

    return res.status(200).json({
      success: true,
      message: "Seller request send to admin waiting for the admin approve",
    });
  },
);

const updateStatusOfSeller = asyncHandler(
  async (req: Request, res: Response) => {
    const { sellerId, status } = req.body;

    console.log("sellerId", sellerId);
    console.log("status", status);

    const existsSeller = await prisma.seller.findUnique({
      where: {
        id: sellerId,
      },
    });

    if (!existsSeller) {
      throw new AppError("Seller not found", 404);
    }

    const updatedSeller = await prisma.seller.update({
      where: {
        id: sellerId,
      },
      data: {
        isApproveSeller: status,
      },
    });

    if (status === "APPROVED") {
      await prisma.user.update({
        where: {
          id: existsSeller.userId,
        },
        data: {
          roles: {
            push: "SELLER",
          },
        },
      });
    }

    const notification = await prisma.notification.create({
      data: {
        userId: existsSeller.userId,
        title:
          status === "APPROVED"
            ? "Seller Application Approved"
            : "Seller Application Rejected",
        message:
          status === "APPROVED"
            ? "Your seller application has been approved by the admin."
            : "Your seller application has been rejected by the admin.",
        type: status === "APPROVED" ? "SELLER_APPROVED" : "SELLER_REJECTED",
        priority: "NORMAL",
      },
    });

    sendNotification(existsSeller.userId, notification);

    return res.status(200).json({
      success: true,
      message: `Seller status updated to ${status} successfully`,
      seller: updatedSeller,
    });
  },
);

const getSellerStatus = asyncHandler(async (req: Request, res: Response) => {
  const isAdmin = (req as any).user?.roles?.includes("ADMIN");

  const rawSellers = await prisma.seller.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  const sellers = rawSellers.map((seller) => {
    if (!isAdmin) {
      return {
        id: seller.id,
        userId: seller.userId,
        businessName: seller.businessName,
        aboutProject: seller.aboutProject,
        isApproveSeller: seller.isApproveSeller,
        approveByAdminId: seller.approveByAdminId,
        createdAt: seller.createdAt,
        updatedAt: seller.updatedAt,
      };
    }
    return seller;
  });

  return res.status(200).json({
    success: true,
    message: "Sellers fetched successfully",
    sellers,
  });
});

async function requireApprovedSeller(userId: string) {
  const seller = await prisma.seller.findFirst({
    where: {
      userId,
      isApproveSeller: "APPROVED",
    },
  });

  if (!seller) {
    throw new AppError("Approved seller account required", 403);
  }

  return seller;
}

const getSellerEarningsSummary = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  await requireApprovedSeller(userId);

  // Total Sales
  const salesSum = await prisma.transaction.aggregate({
    where: { sellerId: userId, type: "SALE" },
    _sum: { amountCents: true },
  });
  const totalSales = salesSum._sum.amountCents ?? 0;

  // Total Refunds
  const refundsSum = await prisma.transaction.aggregate({
    where: { sellerId: userId, type: "REFUND" },
    _sum: { amountCents: true },
  });
  const totalRefunds = Math.abs(refundsSum._sum.amountCents ?? 0);

  // Total Locked (sales & refunds in locked state)
  const lockedSum = await prisma.transaction.aggregate({
    where: { sellerId: userId, status: "LOCKED" },
    _sum: { amountCents: true },
  });
  const lockedCents = lockedSum._sum.amountCents ?? 0;

  // Total Available (gross available sales & refunds)
  const availableSum = await prisma.transaction.aggregate({
    where: { sellerId: userId, status: "AVAILABLE" },
    _sum: { amountCents: true },
  });
  const availableCents = availableSum._sum.amountCents ?? 0;

  // Total Withdrawn
  const withdrawnSum = await prisma.transaction.aggregate({
    where: { sellerId: userId, type: "PAYOUT" },
    _sum: { amountCents: true },
  });
  const withdrawnCents = Math.abs(withdrawnSum._sum.amountCents ?? 0);

  // Pending & Approved payout requests
  const pendingPayoutsSum = await prisma.payoutRequest.aggregate({
    where: { sellerId: userId, status: { in: ["PENDING", "APPROVED"] } },
    _sum: { amountCents: true },
  });
  const pendingPayoutsCents = pendingPayoutsSum._sum.amountCents ?? 0;

  // Net withdrawable: gross available minus completed payouts minus pending payouts
  const withdrawableCents = Math.max(0, availableCents - withdrawnCents - pendingPayoutsCents);

  return res.status(200).json({
    success: true,
    summary: {
      totalSalesCents: totalSales,
      totalRefundsCents: totalRefunds,
      lockedCents,
      withdrawableCents,
      withdrawnCents,
      pendingPayoutsCents,
    },
  });
});

const getSellerTransactions = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  await requireApprovedSeller(userId);

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Number(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const transactions = await prisma.transaction.findMany({
    where: { sellerId: userId },
    include: {
      invoice: {
        select: {
          number: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: limit,
  });

  const total = await prisma.transaction.count({
    where: { sellerId: userId },
  });

  return res.status(200).json({
    success: true,
    transactions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

const requestPayout = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const seller = await requireApprovedSeller(userId);

  const { amountCents, payoutEmail } = req.body as { amountCents: number; payoutEmail?: string };

  if (!amountCents || !Number.isInteger(amountCents) || amountCents <= 0) {
    throw new AppError("A valid positive amountCents is required", 400);
  }

  // Enforce minimum limit ($10.00 / 1000 cents)
  if (amountCents < 1000) {
    throw new AppError("Minimum payout amount is $10.00 (1000 cents)", 400);
  }

  // Calculate withdrawable balance
  const availableSum = await prisma.transaction.aggregate({
    where: { sellerId: userId, status: "AVAILABLE" },
    _sum: { amountCents: true },
  });
  const availableCents = availableSum._sum.amountCents ?? 0;

  const withdrawnSum = await prisma.transaction.aggregate({
    where: { sellerId: userId, type: "PAYOUT" },
    _sum: { amountCents: true },
  });
  const withdrawnCents = Math.abs(withdrawnSum._sum.amountCents ?? 0);

  const pendingPayoutsSum = await prisma.payoutRequest.aggregate({
    where: { sellerId: userId, status: { in: ["PENDING", "APPROVED"] } },
    _sum: { amountCents: true },
  });
  const pendingPayoutsCents = pendingPayoutsSum._sum.amountCents ?? 0;

  const withdrawableCents = Math.max(0, availableCents - withdrawnCents - pendingPayoutsCents);

  if (amountCents > withdrawableCents) {
    throw new AppError(`Insufficient funds. Your withdrawable balance is $${(withdrawableCents / 100).toFixed(2)}.`, 400);
  }

  const email = payoutEmail?.trim() || seller.payoutEmail;

  // Create PayoutRequest
  const payout = await prisma.payoutRequest.create({
    data: {
      sellerId: userId,
      amountCents,
      status: "PENDING",
      payoutEmail: email,
    },
  });

  // Notify admins
  try {
    const admins = await prisma.user.findMany({
      where: {
        roles: {
          has: "ADMIN",
        },
      },
    });

    for (const admin of admins) {
      const adminNotification = await prisma.notification.create({
        data: {
          userId: admin.id,
          title: "New Payout Request",
          message: `Seller "${seller.businessName}" requested a payout of $${(amountCents / 100).toFixed(2)}.`,
          type: "SYSTEM_ALERT",
          priority: "NORMAL",
        },
      });

      sendNotification(admin.id, adminNotification);
    }
  } catch (err) {
    console.error("Failed to notify admins of payout request:", err);
  }

  return res.status(201).json({
    success: true,
    message: "Payout request submitted successfully and is awaiting review.",
    payout,
  });
});

const listPendingPayouts = asyncHandler(async (_req: Request, res: Response) => {
  const payouts = await prisma.payoutRequest.findMany({
    where: { status: "PENDING" },
    include: {
      seller: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          sellerApplications: {
            where: { isApproveSeller: "APPROVED" },
            select: { businessName: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Flat structure for ease of frontend consumption
  const formattedPayouts = payouts.map(p => {
    const bizName = p.seller.sellerApplications[0]?.businessName || "Unknown Business";
    const name = [p.seller.firstName, p.seller.lastName].filter(Boolean).join(" ") || p.seller.email;
    return {
      id: p.id,
      sellerId: p.sellerId,
      businessName: bizName,
      sellerName: name,
      sellerEmail: p.seller.email,
      amountCents: p.amountCents,
      status: p.status,
      payoutEmail: p.payoutEmail,
      createdAt: p.createdAt,
    };
  });

  return res.status(200).json({
    success: true,
    payouts: formattedPayouts,
  });
});

const decidePayout = asyncHandler(async (req: Request, res: Response) => {
  const payoutId = String(req.params.payoutId);
  const { decision, rejectionReason } = req.body as { decision?: "APPROVE" | "REJECT"; rejectionReason?: string };

  if (!decision || (decision !== "APPROVE" && decision !== "REJECT")) {
    throw new AppError("Decision must be 'APPROVE' or 'REJECT'", 400);
  }

  const payout = await prisma.payoutRequest.findUnique({
    where: { id: payoutId },
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

  if (!payout) {
    throw new AppError("Payout request not found", 404);
  }

  if (payout.status !== "PENDING") {
    throw new AppError("Payout request has already been decided", 400);
  }

  const businessName = payout.seller.sellerApplications[0]?.businessName || "your business";

  if (decision === "APPROVE") {
    await prisma.$transaction(async (tx) => {
      // Update PayoutRequest
      await tx.payoutRequest.update({
        where: { id: payoutId },
        data: { status: "COMPLETED" },
      });

      // Create negative Transaction of type PAYOUT, status WITHDRAWN
      await tx.transaction.create({
        data: {
          sellerId: payout.sellerId,
          amountCents: -payout.amountCents, // Payout is negative
          type: "PAYOUT",
          status: "WITHDRAWN",
          description: `Payout: Sent to ${payout.payoutEmail}`,
          payoutId: payout.id,
        },
      });
    });

    // Notify seller
    const sellerNotification = await prisma.notification.create({
      data: {
        userId: payout.sellerId,
        title: "Payout Completed",
        message: `Your payout request of $${(payout.amountCents / 100).toFixed(2)} for ${businessName} has been processed and sent.`,
        type: "PAYMENT_STATUS",
        priority: "HIGH",
      },
    });
    sendNotification(payout.sellerId, sellerNotification);

    return res.status(200).json({
      success: true,
      message: "Payout approved and completed successfully.",
    });
  } else {
    // Reject
    await prisma.payoutRequest.update({
      where: { id: payoutId },
      data: {
        status: "REJECTED",
        rejectionReason: rejectionReason || "Does not meet withdrawal criteria.",
      },
    });

    // Notify seller
    const sellerNotification = await prisma.notification.create({
      data: {
        userId: payout.sellerId,
        title: "Payout Request Rejected",
        message: `Your payout request of $${(payout.amountCents / 100).toFixed(2)} for ${businessName} was rejected. Reason: ${rejectionReason || "Does not meet withdrawal criteria."}`,
        type: "PAYMENT_STATUS",
        priority: "HIGH",
      },
    });
    sendNotification(payout.sellerId, sellerNotification);

    return res.status(200).json({
      success: true,
      message: "Payout request rejected successfully.",
    });
  }
});

export {
  updateStatusOfSeller,
  createSellerRequest,
  getSellerStatus,
  getSellerEarningsSummary,
  getSellerTransactions,
  requestPayout,
  listPendingPayouts,
  decidePayout,
};
