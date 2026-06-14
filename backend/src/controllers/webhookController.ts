import { Request, Response } from "express";
import { asyncHandler, AppError } from "../utils/errorHandler";
import prisma from "../utils/prisma";
import {
  deliverWebhookEvent,
  ensureWebhookSecret,
  sendWebhookEvent,
} from "../services/webhookWorker";

function isLocalhostWebhookUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function isValidWebhookUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export const listSellerWebhookEvents = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const productId = String(req.params.productId);
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const eventType = typeof req.query.eventType === "string" ? req.query.eventType : undefined;
    const mode = typeof req.query.mode === "string" ? req.query.mode : undefined;

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
        ...(status ? { status: status as any } : {}),
        ...(eventType ? { eventType } : {}),
        ...(mode ? { mode: mode as any } : {}),
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

export const sendTestWebhookEvent = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const productId = String(req.params.productId);

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId: userId,
      },
    });

    if (!product) {
      throw new AppError("Product not found or unauthorized", 404);
    }

    if (!product.webhookUrl) {
      throw new AppError("Configure a webhook URL before sending a test event", 400);
    }

    const eventId = await sendWebhookEvent(
      product.id,
      "webhook.test",
      {
        productId: product.id,
        productName: product.name,
        message: "This is a test event from AppStack.",
      },
      {
        mode: "TEST",
        deliverImmediately: false,
      },
    );

    const event = await deliverWebhookEvent(eventId, true);

    if (event.status === "DELIVERED") {
      await prisma.product.update({
        where: { id: product.id },
        data: { webhookTested: true },
      });
    }

    return res.status(200).json({
      success: true,
      message:
        event.status === "DELIVERED"
          ? "Webhook test delivered successfully"
          : "Webhook test created but delivery did not succeed",
      event,
    });
  },
);

export const updateSellerWebhookConfig = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const productId = String(req.params.productId);
    const { webhookUrl } = req.body as { webhookUrl?: string };
    const nextWebhookUrl = webhookUrl?.trim() || null;

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId: userId,
      },
    });

    if (!product) {
      throw new AppError("Product not found or unauthorized", 404);
    }

    if (!nextWebhookUrl) {
      throw new AppError("webhookUrl is required", 400);
    }

    if (!isValidWebhookUrl(nextWebhookUrl)) {
      throw new AppError("webhookUrl must be a valid HTTP or HTTPS URL", 400);
    }

    if (
      process.env.NODE_ENV !== "development" &&
      isLocalhostWebhookUrl(nextWebhookUrl)
    ) {
      throw new AppError("Localhost webhook URLs are allowed only in development", 400);
    }

    const secret = await ensureWebhookSecret(product.id);
    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        webhookUrl: nextWebhookUrl,
        webhookTested:
          product.webhookUrl === nextWebhookUrl ? product.webhookTested : false,
      },
      select: {
        id: true,
        webhookUrl: true,
        webhookTested: true,
        webhookSecret: true,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        product.webhookUrl === nextWebhookUrl
          ? "Webhook configuration unchanged"
          : "Webhook URL saved. Send a successful test before submitting the product.",
      product: {
        ...updated,
        webhookSecret: updated.webhookSecret ?? secret,
      },
    });
  },
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

    const updatedEvent = await deliverWebhookEvent(event.id, true);

    return res.status(200).json({
      success: true,
      message: "Webhook retry initiated",
      event: updatedEvent,
    });
  }
);

export const listAdminWebhookEvents = asyncHandler(
  async (req: Request, res: Response) => {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const eventType = typeof req.query.eventType === "string" ? req.query.eventType : undefined;
    const mode = typeof req.query.mode === "string" ? req.query.mode : undefined;

    const events = await prisma.webhookEvent.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(eventType ? { eventType } : {}),
        ...(mode ? { mode: mode as any } : {}),
      },
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
