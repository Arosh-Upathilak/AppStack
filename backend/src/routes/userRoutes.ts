import express from "express";
import { createUser, forgotPasswordSendEmail, googleLogin, loginUser, resetPassword, sendOtp, verifyAccount } from "../controllers/userControllers";

const userRouter = express.Router();

userRouter.post('/createUser',createUser);
userRouter.post('/loginUser',loginUser);
userRouter.post('/google-login',googleLogin);
userRouter.post('/send-otp',sendOtp);
userRouter.post('/verify-otp/:verifyToken',verifyAccount);
userRouter.post('/forgot-password',forgotPasswordSendEmail);
userRouter.post('/reset-password/:resetToken',resetPassword);

export default userRouter;
