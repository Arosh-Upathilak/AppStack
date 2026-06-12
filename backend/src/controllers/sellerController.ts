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

    const newSeller = await prisma.seller.create({
      data: {
        userId,
        payoutEmail,
        businessName,
        aboutProject,
      },
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
    const userId = (req as any).user.id;
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
      // Remove payoutEmail for non-admins to prevent leak
      const { payoutEmail, ...rest } = seller;
      return rest;
    }
    return seller;
  });

  return res.status(200).json({
    success: true,
    message: "Sellers fetched successfully",
    sellers,
  });
});

export { updateStatusOfSeller, createSellerRequest, getSellerStatus };
