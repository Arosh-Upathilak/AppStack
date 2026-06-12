import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { deleteNotification, getNotifications, updateReadNotification } from "../controllers/notificationController";


const notificationRouter = express.Router();

notificationRouter.get("/getNotifications",authMiddleware,getNotifications)
notificationRouter.post("/updateReadNotification",authMiddleware,updateReadNotification)
notificationRouter.delete("/deleteNotification",authMiddleware,deleteNotification)


export default notificationRouter
