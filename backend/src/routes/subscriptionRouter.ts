import express from "express";
import {
  createSubscription,
  getSubscriptionPlanOptions,
  listSubscriptions,
  requestRecipientVerification,
  updateSubscription,
} from "../controllers/subscriptionController";
import { authMiddleware } from "../middleware/authMiddleware";

const subscriptionRouter = express.Router();

subscriptionRouter.get("/", authMiddleware, listSubscriptions);
subscriptionRouter.post("/recipient-verifications", authMiddleware, requestRecipientVerification);
subscriptionRouter.post("/", authMiddleware, createSubscription);
subscriptionRouter.get("/:subscriptionId/plan-options", authMiddleware, getSubscriptionPlanOptions);
subscriptionRouter.patch("/:subscriptionId", authMiddleware, updateSubscription);

export default subscriptionRouter;
