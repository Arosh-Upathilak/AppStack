import express from "express";
import { createUser, forgotPasswordSendEmail, getCurrentUser, googleLogin, loginUser, resetPassword, sendOtp, updateProfile, verifyAccount } from "../controllers/userControllers";
import { authMiddleware } from "../middleware/authMiddleware";

const userRouter = express.Router();

userRouter.post('/createUser',createUser);
userRouter.post('/loginUser',loginUser);
userRouter.post('/google-login',googleLogin);
userRouter.post('/send-otp',sendOtp);
userRouter.post('/verify-otp/:verifyToken',verifyAccount);
userRouter.post('/forgot-password',forgotPasswordSendEmail);
userRouter.post('/reset-password/:resetToken',resetPassword);
userRouter.get('/me', authMiddleware, getCurrentUser);
userRouter.put('/me', authMiddleware, updateProfile);

export default userRouter;
