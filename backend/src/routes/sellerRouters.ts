import express from "express";
import { createSellerRequest, getSellerStatus, updateStatusOfSeller } from "../controllers/sellerController";
import { authMiddleware } from "../middleware/authMiddleware";


const sellerRouter = express.Router();

sellerRouter.post("/submitSellerRequest",authMiddleware,createSellerRequest)
sellerRouter.post("/updateSellerRequest",authMiddleware,updateStatusOfSeller)
sellerRouter.get("/getSeller",authMiddleware,getSellerStatus)


export default sellerRouter;