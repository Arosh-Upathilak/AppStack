import express from "express";
import { createSellerRequest, getSellerStatus, updateStatusOfSeller } from "../controllers/sellerController";
import { authMiddleware, authMiddlewareRequireRole } from "../middleware/authMiddleware";


const sellerRouter = express.Router();

sellerRouter.post("/submitSellerRequest",authMiddleware,createSellerRequest)
sellerRouter.post("/updateSellerRequest",authMiddleware,authMiddlewareRequireRole("ADMIN"),updateStatusOfSeller)
sellerRouter.get("/getSeller",authMiddleware,authMiddlewareRequireRole("ADMIN"),getSellerStatus)


export default sellerRouter;