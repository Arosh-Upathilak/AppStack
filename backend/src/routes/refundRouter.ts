import express from "express";
import { requestRefund } from "../controllers/refundController";
import { authMiddleware } from "../middleware/authMiddleware";

const refundRouter = express.Router();

refundRouter.post("/request", authMiddleware, requestRefund);

export default refundRouter;
