import express from "express";
import {
  listSellerWebhookEvents,
  retryWebhookEvent,
  sendTestWebhookEvent,
  updateSellerWebhookConfig,
} from "../controllers/webhookController";
import { authMiddleware, authMiddlewareRequireRole } from "../middleware/authMiddleware";

const webhookRouter = express.Router();

webhookRouter.get(
  "/products/:productId",
  authMiddleware,
  authMiddlewareRequireRole("SELLER"),
  listSellerWebhookEvents
);

webhookRouter.post(
  "/products/:productId/test",
  authMiddleware,
  authMiddlewareRequireRole("SELLER"),
  sendTestWebhookEvent
);

webhookRouter.put(
  "/products/:productId/config",
  authMiddleware,
  authMiddlewareRequireRole("SELLER"),
  updateSellerWebhookConfig
);

webhookRouter.post(
  "/:eventId/retry",
  authMiddleware,
  retryWebhookEvent
);

export default webhookRouter;
