import crypto from "crypto";
import axios from "axios";
import prisma from "../utils/prisma";

type WebhookMode = "LIVE" | "TEST";

type SendWebhookOptions = {
  mode?: WebhookMode;
  deliverImmediately?: boolean;
};

const MAX_ATTEMPTS = 10;
const RETRY_DELAYS_MS = [
  60 * 1000,          // 1m
  5 * 60 * 1000,      // 5m
  15 * 60 * 1000,     // 15m
  60 * 60 * 1000,     // 1h
  2 * 60 * 60 * 1000, // 2h
  4 * 60 * 60 * 1000, // 4h
  8 * 60 * 60 * 1000, // 8h
  12 * 60 * 60 * 1000,// 12h
  24 * 60 * 60 * 1000,// 24h
];

export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export async function ensureWebhookSecret(productId: string): Promise<string> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { webhookSecret: true },
  });

  if (!product) {
    throw new Error(`Product ${productId} not found`);
  }

  if (product.webhookSecret) {
    return product.webhookSecret;
  }

  const secret = crypto.randomUUID();
  await prisma.product.update({
    where: { id: productId },
    data: { webhookSecret: secret },
  });
  return secret;
}

function nextRetryAt(attempts: number) {
  const delay = RETRY_DELAYS_MS[Math.min(attempts - 1, RETRY_DELAYS_MS.length - 1)];
  return new Date(Date.now() + delay);
}

function responseBody(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.data) {
      return JSON.stringify(error.response.data).substring(0, 2000);
    }
    return error.message || "Webhook delivery failed";
  }

  return error instanceof Error ? error.message : "Webhook delivery failed";
}

export async function deliverWebhookEvent(eventId: string, force = false) {
  const event = await prisma.webhookEvent.findUnique({
    where: { id: eventId },
    include: { product: true },
  });

  if (!event) {
    throw new Error(`Webhook event ${eventId} not found`);
  }

  if (event.status === "DELIVERED" && !force) {
    return event;
  }

  if (
    event.nextAttemptAt &&
    event.nextAttemptAt.getTime() > Date.now() &&
    !force
  ) {
    return event;
  }

  if (!event.product.webhookUrl) {
    return prisma.webhookEvent.update({
      where: { id: event.id },
      data: {
        status: "FAILED",
        nextAttemptAt: null,
        responseBody: "No webhook URL configured for the product",
      },
    });
  }

  const secret = await ensureWebhookSecret(event.productId);
  const signature = generateWebhookSignature(event.payload, secret);
  const attempts = event.attempts + 1;

  await prisma.webhookEvent.update({
    where: { id: event.id },
    data: {
      status: "PENDING",
      attempts,
      lastAttempt: new Date(),
      nextAttemptAt: null,
    },
  });

  try {
    const response = await axios.post(event.product.webhookUrl, event.payload, {
      headers: {
        "Content-Type": "application/json",
        "X-AppStack-Signature": signature,
        "X-AppStack-Event-Id": event.id,
      },
      timeout: 10000,
    });

    return prisma.webhookEvent.update({
      where: { id: event.id },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date(),
        responseCode: response.status,
        responseBody: JSON.stringify(response.data).substring(0, 2000),
        nextAttemptAt: null,
      },
    });
  } catch (error) {
    const failedPermanently = attempts >= MAX_ATTEMPTS;
    const responseCode = axios.isAxiosError(error)
      ? error.response?.status ?? null
      : null;

    return prisma.webhookEvent.update({
      where: { id: event.id },
      data: {
        status: failedPermanently ? "FAILED" : "PENDING",
        responseCode,
        responseBody: responseBody(error),
        nextAttemptAt: failedPermanently ? null : nextRetryAt(attempts),
      },
    });
  }
}

export async function processDueWebhookEvents(limit = 25) {
  const events = await prisma.webhookEvent.findMany({
    where: {
      status: "PENDING",
      nextAttemptAt: {
        lte: new Date(),
      },
    },
    orderBy: {
      nextAttemptAt: "asc",
    },
    take: limit,
  });

  for (const event of events) {
    try {
      await deliverWebhookEvent(event.id);
    } catch (error) {
      console.error(`[Webhook] Failed to process due event ${event.id}:`, error);
    }
  }

  return events.length;
}

export async function sendWebhookEvent(
  productId: string,
  eventType: string,
  payloadObj: unknown,
  options: SendWebhookOptions = {},
): Promise<string> {
  await ensureWebhookSecret(productId);

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error(`Product ${productId} not found`);
  }

  const mode = options.mode ?? "LIVE";
  const payload = JSON.stringify({
    event: eventType,
    mode,
    data: payloadObj,
    timestamp: new Date().toISOString(),
  });

  const dbEvent = await prisma.webhookEvent.create({
    data: {
      productId,
      eventType,
      payload,
      mode,
      status: "PENDING",
      attempts: 0,
      nextAttemptAt: new Date(),
    },
  });

  if (!product.webhookUrl) {
    await prisma.webhookEvent.update({
      where: { id: dbEvent.id },
      data: {
        status: "FAILED",
        nextAttemptAt: null,
        responseBody: "No webhook URL configured for the product",
      },
    });
    return dbEvent.id;
  }

  if (options.deliverImmediately ?? true) {
    deliverWebhookEvent(dbEvent.id).catch((err) => {
      console.error(`[Webhook] Async delivery trigger error for event ${dbEvent.id}:`, err);
    });
  }

  return dbEvent.id;
}
