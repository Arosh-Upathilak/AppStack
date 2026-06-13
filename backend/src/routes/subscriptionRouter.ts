import express from "express";
import {
  createSubscription,
  listSubscriptions,
  updateSubscription,
} from "../controllers/subscriptionController";
import { authMiddleware } from "../middleware/authMiddleware";

const subscriptionRouter = express.Router();

subscriptionRouter.get("/", authMiddleware, listSubscriptions);
subscriptionRouter.post("/", authMiddleware, createSubscription);
subscriptionRouter.patch("/:subscriptionId", authMiddleware, updateSubscription);

export default subscriptionRouter;
