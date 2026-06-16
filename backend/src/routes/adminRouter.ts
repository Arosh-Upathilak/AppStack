import express from "express";
import {
  decideProductChangeRequest,
  decideProduct,
  listPendingProductChangeRequests,
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
  sendAdminPasswordReset,
  updateUserProfile,
  listUsers,
  updateUserRole,
  deleteUserGDPR,
  createUserByAdmin,
} from "../controllers/userControllers";
import {
  listAdminWebhookEvents,
} from "../controllers/webhookController";
import {
  getSettings,
  updateSettings,
} from "../controllers/settingsController";
import {
  runBillingCycle,
} from "../services/scheduler";
import {
  authMiddleware,
  authMiddlewareRequireRole,
} from "../middleware/authMiddleware";

const adminRouter = express.Router();

adminRouter.post(
  "/users",
  authMiddleware,
  authMiddlewareRequireRole("ADMIN"),
  createUserByAdmin,
);

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
  "/products/changes/pending",
  authMiddleware,
  authMiddlewareRequireRole("ADMIN"),
  listPendingProductChangeRequests,
);
adminRouter.post(
  "/products/changes/:changeRequestId/decision",
  authMiddleware,
  authMiddlewareRequireRole("ADMIN"),
  decideProductChangeRequest,
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
adminRouter.patch(
  "/users/:userId/profile",
  authMiddleware,
  authMiddlewareRequireRole("ADMIN"),
  updateUserProfile,
);
adminRouter.post(
  "/users/:userId/reset-password",
  authMiddleware,
  authMiddlewareRequireRole("ADMIN"),
  sendAdminPasswordReset,
);
adminRouter.delete(
  "/users/:userId",
  authMiddleware,
  authMiddlewareRequireRole("ADMIN"),
  deleteUserGDPR,
);

adminRouter.get(
  "/webhooks/events",
  authMiddleware,
  authMiddlewareRequireRole("ADMIN"),
  listAdminWebhookEvents,
);

adminRouter.get(
  "/settings",
  authMiddleware,
  authMiddlewareRequireRole("ADMIN"),
  getSettings,
);
adminRouter.patch(
  "/settings",
  authMiddleware,
  authMiddlewareRequireRole("ADMIN"),
  updateSettings,
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
