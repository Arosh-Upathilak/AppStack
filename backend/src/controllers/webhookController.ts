import { Request, Response } from "express";
import { asyncHandler, AppError } from "../utils/errorHandler";
import prisma from "../utils/prisma";
import crypto from "crypto";
import axios from "axios";
import { generateWebhookSignature } from "../services/webhookWorker";

// Helper to deliver in background
async function deliverWebhookBackground(eventId: string, webhookUrl: string, payload: string, signature: string) {
  try {
    const response = await axios.post(webhookUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        "X-AppStack-Signature": signature,
        "X-AppStack-Event-Id": eventId,
      },
      timeout: 10000,
    });
    await prisma.webhookEvent.update({
      where: { id: eventId },
      data: {
        status: "DELIVERED",
        lastAttempt: new Date(),
        responseCode: response.status,
        responseBody: JSON.stringify(response.data).substring(0, 2000),
      },
    });
  } catch (error: any) {
    const responseCode = error.response?.status || null;
    const responseBody = error.response?.data
      ? JSON.stringify(error.response.data).substring(0, 2000)
      : error.message || "Retry failed";

    await prisma.webhookEvent.update({
      where: { id: eventId },
      data: {
        status: "FAILED",
        lastAttempt: new Date(),
        responseCode,
        responseBody,
      },
    });
  }
}

export const listSellerWebhookEvents = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const productId = String(req.params.productId);

    // Verify product belongs to seller
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId: userId,
      },
    });

    if (!product) {
      throw new AppError("Product not found or unauthorized", 404);
    }

    const events = await prisma.webhookEvent.findMany({
      where: {
        productId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // limit to 50 logs
    });

    return res.status(200).json({
      success: true,
      events,
    });
  }
);

export const retryWebhookEvent = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const eventId = String(req.params.eventId);

    const event = await prisma.webhookEvent.findUnique({
      where: { id: eventId },
      include: {
        product: true,
      },
    });

    if (!event) {
      throw new AppError("Webhook event not found", 404);
    }

    // Check if seller owns product, or user is admin
    const isAdmin = (req as any).user.roles?.includes("ADMIN");
    if (event.product.sellerId !== userId && !isAdmin) {
      throw new AppError("Unauthorized", 403);
    }

    if (!event.product.webhookUrl) {
      throw new AppError("Product does not have a webhook URL configured", 400);
    }

    const secret = event.product.webhookSecret || "default_secret";
    const signature = generateWebhookSignature(event.payload, secret);

    // Update attempts
    const updatedEvent = await prisma.webhookEvent.update({
      where: { id: eventId },
      data: {
        status: "PENDING",
        attempts: { increment: 1 },
      },
    });

    // Asynchronous dispatch
    void deliverWebhookBackground(event.id, event.product.webhookUrl, event.payload, signature);

    return res.status(200).json({
      success: true,
      message: "Webhook retry initiated",
      event: updatedEvent,
    });
  }
);

export const listAdminWebhookEvents = asyncHandler(
  async (req: Request, res: Response) => {
    const events = await prisma.webhookEvent.findMany({
      include: {
        product: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return res.status(200).json({
      success: true,
      events,
    });
  }
);
