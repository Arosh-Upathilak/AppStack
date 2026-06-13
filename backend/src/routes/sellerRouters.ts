import express from "express";
import {
  createSellerRequest,
  getSellerStatus,
  updateStatusOfSeller,
  getSellerEarningsSummary,
  getSellerTransactions,
  requestPayout,
  getSellerSubscriptionSummary,
} from "../controllers/sellerController";
import {
  createSellerProduct,
  listSellerProducts,
  submitSellerProduct,
  updateSellerProduct,
} from "../controllers/productController";
import { authMiddleware, authMiddlewareRequireRole } from "../middleware/authMiddleware";


const sellerRouter = express.Router();

sellerRouter.post("/submitSellerRequest", authMiddleware, createSellerRequest);
sellerRouter.post("/updateSellerRequest", authMiddleware, authMiddlewareRequireRole("ADMIN"), updateStatusOfSeller);
sellerRouter.get("/getSeller", authMiddleware, authMiddlewareRequireRole("ADMIN"), getSellerStatus);
sellerRouter.get("/products", authMiddleware, authMiddlewareRequireRole("SELLER"), listSellerProducts);
sellerRouter.post("/products", authMiddleware, authMiddlewareRequireRole("SELLER"), createSellerProduct);
sellerRouter.put("/products/:productId", authMiddleware, authMiddlewareRequireRole("SELLER"), updateSellerProduct);
sellerRouter.post("/products/:productId/submit", authMiddleware, authMiddlewareRequireRole("SELLER"), submitSellerProduct);
sellerRouter.get("/subscriptions", authMiddleware, authMiddlewareRequireRole("SELLER"), getSellerSubscriptionSummary);

// Earnings & Payouts
sellerRouter.get("/earnings/summary", authMiddleware, authMiddlewareRequireRole("SELLER"), getSellerEarningsSummary);
sellerRouter.get("/earnings/transactions", authMiddleware, authMiddlewareRequireRole("SELLER"), getSellerTransactions);
sellerRouter.post("/payouts/request", authMiddleware, authMiddlewareRequireRole("SELLER"), requestPayout);


export default sellerRouter;
