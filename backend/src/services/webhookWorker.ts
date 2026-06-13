import crypto from "crypto";
import axios from "axios";
import prisma from "../utils/prisma";

export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export async function sendWebhookEvent(productId: string, eventType: string, payloadObj: any): Promise<string> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error(`Product ${productId} not found`);
  }

  // Ensure secret exists
  let secret = product.webhookSecret;
  if (!secret) {
    secret = crypto.randomUUID();
    await prisma.product.update({
      where: { id: productId },
      data: { webhookSecret: secret },
    });
  }

  const payload = JSON.stringify({
    event: eventType,
    data: payloadObj,
    timestamp: new Date().toISOString(),
  });

  const signature = generateWebhookSignature(payload, secret);

  const dbEvent = await prisma.webhookEvent.create({
    data: {
      productId,
      eventType,
      payload,
      status: "PENDING",
      attempts: 0,
    },
  });

  if (product.webhookUrl) {
    // Run delivery asynchronously
    executeWebhookDelivery(dbEvent.id, product.webhookUrl, payload, signature).catch((err) => {
      console.error(`[Webhook] Async delivery trigger error for event ${dbEvent.id}:`, err);
    });
  } else {
    // No webhook URL configured, mark as failed immediately
    await prisma.webhookEvent.update({
      where: { id: dbEvent.id },
      data: {
        status: "FAILED",
        responseBody: "No webhook URL configured for the product",
      },
    });
  }

  return dbEvent.id;
}

async function executeWebhookDelivery(
  eventId: string,
  webhookUrl: string,
  payload: string,
  signature: string
) {
  let attempts = 0;
  const maxAttempts = 5;
  let delay = 1000; // 1s start delay

  while (attempts < maxAttempts) {
    attempts++;
    try {
      console.log(`[Webhook] Event ${eventId} attempting delivery to ${webhookUrl} (attempt ${attempts})`);
      const response = await axios.post(webhookUrl, payload, {
        headers: {
          "Content-Type": "application/json",
          "X-AppStack-Signature": signature,
          "X-AppStack-Event-Id": eventId,
        },
        timeout: 10000, // 10 seconds timeout
      });

      // Update delivery as successful
      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          status: "DELIVERED",
          attempts,
          lastAttempt: new Date(),
          responseCode: response.status,
          responseBody: JSON.stringify(response.data).substring(0, 2000),
        },
      });
      console.log(`[Webhook] Event ${eventId} successfully delivered on attempt ${attempts}`);
      return;
    } catch (error: any) {
      console.error(`[Webhook] Event ${eventId} delivery failure (attempt ${attempts}):`, error.message);
      
      const responseCode = error.response?.status || null;
      const responseBody = error.response?.data 
        ? JSON.stringify(error.response.data).substring(0, 2000) 
        : error.message || "Unknown delivery error";

      // Update current attempt status
      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          attempts,
          lastAttempt: new Date(),
          responseCode,
          responseBody,
        },
      });

      if (attempts >= maxAttempts) {
        await prisma.webhookEvent.update({
          where: { id: eventId },
          data: { status: "FAILED" },
        });
        console.warn(`[Webhook] Event ${eventId} failed all delivery attempts`);
        break;
      }

      // Wait with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}
