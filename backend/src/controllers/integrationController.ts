import { Request, Response } from "express";
import { asyncHandler, AppError } from "../utils/errorHandler";
import prisma from "../utils/prisma";
import { sendNotification } from "../socket/socketConnect";

export const updateSubscriptionStatusFromSaaS = asyncHandler(
  async (req: Request, res: Response) => {
    const subscriptionId = String(req.params.subscriptionId);
    const { status } = req.body as { status?: string };
    const authHeader = req.headers["authorization"] || req.headers["x-appstack-secret"];

    if (!authHeader) {
      throw new AppError("Authorization header is required", 401);
    }

    const secret = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : String(authHeader);

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { product: true },
    });

    if (!subscription) {
      throw new AppError("Subscription not found", 404);
    }

    if (!subscription.product.webhookSecret || subscription.product.webhookSecret !== secret) {
      throw new AppError("Invalid API Secret / Webhook Secret", 403);
    }

    const validStatuses = ["PENDING", "ACTIVE", "CHANGE_PENDING", "CANCEL_PENDING", "CANCELED"];
    if (!status || !validStatuses.includes(status)) {
      throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400);
    }

    const nextPlanId = subscription.pendingPlanId && status === "ACTIVE"
      ? subscription.pendingPlanId
      : undefined;

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: status as any,
        ...(nextPlanId ? { planId: nextPlanId, pendingPlanId: null } : {}),
        ...(status === "CANCELED" ? { canceledAt: new Date() } : {}),
      },
    });

    const notification = await prisma.notification.create({
      data: {
        userId: subscription.buyerId,
        title: `Subscription Status Updated`,
        message: `Your subscription status for ${subscription.product.name} is now ${status}.`,
        type: "ORDER_UPDATE",
        priority: "HIGH",
      },
    });
    sendNotification(subscription.buyerId, notification);

    return res.status(200).json({
      success: true,
      message: `Subscription status updated to ${status}`,
      subscriptionId,
      status: updated.status,
    });
  }
);
