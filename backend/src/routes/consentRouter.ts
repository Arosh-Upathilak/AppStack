import express from "express";
import { listConsents } from "../controllers/subscriptionController";
import { authMiddleware } from "../middleware/authMiddleware";

const consentRouter = express.Router();

consentRouter.get("/", authMiddleware, listConsents);

export default consentRouter;
