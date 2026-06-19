import express from "express";
import {
  downloadInvoice,
  listInvoices,
} from "../controllers/subscriptionController";
import { authMiddleware } from "../middleware/authMiddleware";

const invoiceRouter = express.Router();

invoiceRouter.get("/", authMiddleware, listInvoices);
invoiceRouter.get("/:invoiceId/download", authMiddleware, downloadInvoice);

export default invoiceRouter;
