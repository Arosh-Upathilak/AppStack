import express from "express";
import {
  getProduct,
  listProductReviews,
  listProducts,
  checkReviewEligibility,
  createProductReview,
} from "../controllers/productController";
import { authMiddleware } from "../middleware/authMiddleware";

const productRouter = express.Router();

productRouter.get("/", listProducts);
productRouter.get("/:productId", getProduct);
productRouter.get("/:productId/reviews", listProductReviews);

// Reviews submission & verification
productRouter.get("/:productId/review-eligibility", authMiddleware, checkReviewEligibility);
productRouter.post("/:productId/reviews", authMiddleware, createProductReview);

export default productRouter;
