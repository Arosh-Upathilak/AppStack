import express from "express";
import {
  acknowledgeSubscriptionLifecycle,
  updateSubscriptionStatusFromSaaS,
} from "../controllers/integrationController";

const integrationRouter = express.Router();

integrationRouter.post("/subscriptions/:subscriptionId/status", updateSubscriptionStatusFromSaaS);
integrationRouter.post("/subscriptions/:subscriptionId/ack", acknowledgeSubscriptionLifecycle);

export default integrationRouter;
