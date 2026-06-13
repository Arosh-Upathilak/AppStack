import express from "express";
import {
  decideProduct,
  listPendingProducts,
} from "../controllers/productController";
import {
  listPendingCancellations,
  decideCancellation,
} from "../controllers/subscriptionController";
import {
  listPendingRefunds,
  decideRefund,
} from "../controllers/refundController";
import {
  listPendingPayouts,
  decidePayout,
} from "../controllers/sellerController";
import {
  listUsers,
  updateUserRole,
  deleteUserGDPR,
} from "../controllers/userControllers";
import {
  runBillingCycle,
} from "../services/scheduler";
import {
  authMiddleware,
  authMiddlewareRequireRole,
} from "../middleware/authMiddleware";

const adminRouter = express.Router();

adminRouter.get(
  "/products/pending",
  authMiddleware,
  authMiddlewareRequireRole("ADMIN"),
  listPendingProducts,
);
adminRouter.post(
  "/products/:productId/decision",
  authMiddleware,
  authMiddlewareRequireRole("ADMIN"),
  decideProduct,
);

adminRouter.get(
  "/cancellations/pending",
  authMiddleware,
  authMiddlewareRequireRole("ADMIN"),
  listPendingCancellations,
);
adminRouter.post(
  "/cancellations/:subscriptionId/decision",
  authMiddleware,
  authMiddlewareRequireRole("ADMIN"),
  decideCancellation,
);

adminRouter.get(
  "/refunds/pending",
  authMiddleware,
  authMiddlewareRequireRole("ADMIN"),
  listPendingRefunds,
);
adminRouter.post(
  "/refunds/:refundId/decision",
  authMiddleware,
  authMiddlewareRequireRole("ADMIN"),
  decideRefund,
);

adminRouter.get(
  "/payouts/pending",
  authMiddleware,
  authMiddlewareRequireRole("ADMIN"),
  listPendingPayouts,
);
adminRouter.post(
  "/payouts/:payoutId/decision",
  authMiddleware,
  authMiddlewareRequireRole("ADMIN"),
  decidePayout,
);

adminRouter.get(
  "/users",
  authMiddleware,
  authMiddlewareRequireRole("ADMIN"),
  listUsers,
);
adminRouter.patch(
  "/users/:userId/role",
  authMiddleware,
  authMiddlewareRequireRole("ADMIN"),
  updateUserRole,
);
adminRouter.delete(
  "/users/:userId",
  authMiddleware,
  authMiddlewareRequireRole("ADMIN"),
  deleteUserGDPR,
);

adminRouter.post(
  "/scheduler/trigger",
  authMiddleware,
  authMiddlewareRequireRole("ADMIN"),
  async (req, res, next) => {
    try {
      await runBillingCycle();
      res.status(200).json({ success: true, message: "Billing scheduler executed successfully" });
    } catch (err) {
      next(err);
    }
  }
);

export default adminRouter;
