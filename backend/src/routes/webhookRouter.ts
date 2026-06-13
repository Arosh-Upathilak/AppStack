import express from "express";
import {
  listSellerWebhookEvents,
  retryWebhookEvent,
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
  "/:eventId/retry",
  authMiddleware,
  retryWebhookEvent
);

export default webhookRouter;
