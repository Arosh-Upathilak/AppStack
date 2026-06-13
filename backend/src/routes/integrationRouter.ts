import express from "express";
import { updateSubscriptionStatusFromSaaS } from "../controllers/integrationController";

const integrationRouter = express.Router();

integrationRouter.post("/subscriptions/:subscriptionId/status", updateSubscriptionStatusFromSaaS);

export default integrationRouter;
