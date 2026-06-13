import express from "express";
import {
  createPaymentMethod,
  deletePaymentMethod,
  listPaymentMethods,
  setPrimaryPaymentMethod,
} from "../controllers/paymentMethodController";
import { authMiddleware } from "../middleware/authMiddleware";

const paymentMethodRouter = express.Router();

paymentMethodRouter.get("/", authMiddleware, listPaymentMethods);
paymentMethodRouter.post("/", authMiddleware, createPaymentMethod);
paymentMethodRouter.post("/:id/primary", authMiddleware, setPrimaryPaymentMethod);
paymentMethodRouter.delete("/:id", authMiddleware, deletePaymentMethod);

export default paymentMethodRouter;
