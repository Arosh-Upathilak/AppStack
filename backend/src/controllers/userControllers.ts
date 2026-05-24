import { Request, Response } from "express";
import { AppError, asyncHandler } from "../utils/errorHandler";
import prisma from "../utils/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { emailRegex } from "../utils/validation";
import { transporter } from "../utils/nodeMailer";
import { otpTemplate } from "../template/otpEmail";
import { redisClient } from "../config/redis";
import { resetPasswordTemplate } from "../template/resetPasswordEmail";

// OTP Expire time set
const OTP_EXPIRY = 300;

// Generate OTP
export const generateOTP = async (verifyToken: string): Promise<string> => {
  const otp = crypto.randomInt(100000, 999999).toString();
  const key = `verifyToken:${verifyToken}`;
  await redisClient.setEx(key, OTP_EXPIRY, otp);
  return otp;
};

// Verify OTP
const verifyOTP = async (verifyToken: string, inputOtp: string) => {
  const key = `verifyToken:${verifyToken}`;
  const storedOtp = await redisClient.get(key);
  if (!storedOtp) {
    return false;
  }
  const valid = storedOtp === inputOtp;

  if (valid) {
    await redisClient.del(key);
    return true;
  }
  return false;
};

// Create User
const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { firstName,lastName, email, password, role } = req.body;

  // Validation
  if (!firstName || !lastName || !email || !password || !role) {
    throw new AppError("Email, firstName, lastName and password are required", 400);
  }

  if (!emailRegex.test(email)) {
    throw new AppError("Invalid email", 400);
  }

  if (password.length < 8) {
    throw new AppError("Password must contains at least 8 characters", 400);
  }

  // Check Existing User
  const existsUser = await prisma.user.findFirst({
    where: {
      email: email,
    },
  });

  if (existsUser) {
    throw new AppError("Account already exists", 400);
  }

  // Create Verify Token
  const verifyToken = crypto.randomUUID();

  // Store token and email
  await redisClient.setEx(`user:${verifyToken}`, OTP_EXPIRY, email);

  // Generate OTP
  try {
    const otp = await generateOTP(verifyToken);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your AppStack Verification Code",
      html: otpTemplate(otp),
    };

    await transporter.sendMail(mailOptions);
  } catch {
    await redisClient.del(`verifyToken:${verifyToken}`);
    await redisClient.del(`user:${verifyToken}`);

    throw new AppError("Failed to send OTP email" , 500);
  }

  // Hash Password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create User
  await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      roles: { set: [role] },
      isVerified: false,
    },
  });

  return res.status(201).json({
    success: true,
    message: `${role} created successfully`,
    verifyToken,
  });
});

// Login User
const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  if (!emailRegex.test(email)) {
    throw new AppError("Invalid email", 400);
  }

  // Check User
  const existsUser = await prisma.user.findFirst({
    where: {
      email: email,
    },
  });

  if (!existsUser) {
    throw new AppError("User not found", 404);
  }

  if (!existsUser.isVerified) {
    throw new AppError(
      `Please verify the ${existsUser.roles} before login`,
      400,
    );
  }

  // Compare Password
  const isMatchPassword = await bcrypt.compare(password, existsUser.password);

  if (!isMatchPassword) {
    throw new AppError("Credentials are wrong", 400);
  }

  return res.status(200).json({
    success: true,
    message: `${existsUser.roles} logged successfully`,
    user: {
      id: existsUser.id,
      email: existsUser.email,
      role: existsUser.roles,
    },
  });
});

// Send OTP
const sendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  // Validation
  if (!emailRegex.test(email)) {
    throw new AppError("Invalid email", 400);
  }

  // Create Verify Token
  const verifyToken = crypto.randomUUID();

  // Store token and email
  await redisClient.setEx(`user:${verifyToken}`, OTP_EXPIRY, email);

  try {
    const otp = await generateOTP(verifyToken);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your AppStack Verification Code",
      html: otpTemplate(otp),
    };

    await transporter.sendMail(mailOptions);
  } catch  {
    await redisClient.del(`verifyToken:${verifyToken}`);
    await redisClient.del(`user:${verifyToken}`);

    throw new AppError("Failed to send OTP email", 500);
  }

  return res.status(200).json({
    success: true,
    message: "OTP sent successfully",
    verifyToken,
  });
});

// Verify Account
const verifyAccount = asyncHandler(async (req: Request, res: Response) => {
  const { verifyToken } = req.params as {
    verifyToken: string;
  };

  const { otp } = req.body;

  if (!verifyToken || !otp) {
    throw new AppError("OTP and token are required", 400);
  }

  // Verify OTP
  const isValid = await verifyOTP(verifyToken, otp);

  if (!isValid) {
    throw new AppError("Invalid OTP", 400);
  }

  // Get Email
  const email = await redisClient.get(`user:${verifyToken}`);

  if (!email) {
    throw new AppError("Verification expired", 400);
  }

  // Update User as verified
  const updatedUser = await prisma.user.update({
    where: {
      email,
    },
    data: {
      isVerified: true,
    },
  });

  // Cleanup
  await redisClient.del(`user:${verifyToken}`);

  return res.status(200).json({
    success: true,
    message: "Account verified successfully",
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.roles,
    },
  });
});

// Forgot password
const forgotPasswordSendEmail = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    // Validation
    if (!email) {
      throw new AppError("Email is required", 400);
    }

    if (!emailRegex.test(email)) {
      throw new AppError("Invalid email", 400);
    }

    // Check User

    const existsUser = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!existsUser) {
      throw new AppError("User not found", 404);
    }

    // Create Reset Token
    const resetToken = crypto.randomUUID();

    // Store Reset Token
    await redisClient.setEx(`reset:${resetToken}`, OTP_EXPIRY, email);

    // Reset Link
    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;

    // Send reset Email
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Reset Your AppStack Password",
        html: resetPasswordTemplate(resetLink),
      };
      await transporter.sendMail(mailOptions);
    } catch  {
      await redisClient.del(`reset:${resetToken}`);
      throw new AppError("Failed to send reset email", 500);
    }

    return res.status(200).json({
      success: true,
      message: "Reset link sent to email successfully",
    });
  },
);

// Reset password
const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { resetToken } = req.params as {
    resetToken: string;
  };
  const { password } = req.body;

  // Validation
  if (!password) {
    throw new AppError("Password is required", 400);
  }

  if (password.length < 8) {
    throw new AppError("Password must contains at least 8 characters", 400);
  }

  // Get Email
  const email = await redisClient.get(`reset:${resetToken}`);

  if (!email) {
    throw new AppError("Reset link expired or invalid", 400);
  }

  // Check User
  const existsUser = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  if (!existsUser) {
    throw new AppError("User not found", 404);
  }

  // Hash Password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Update Password
  await prisma.user.update({
    where: {
      email,
    },
    data: {
      password: hashedPassword,
    },
  });

  // Cleanup
  await redisClient.del(`reset:${resetToken}`);
  return res.status(200).json({
    success: true,
    message: "Password reset successfully",
  });
});

export {
  createUser,
  loginUser,
  sendOtp,
  verifyAccount,
  forgotPasswordSendEmail,
  resetPassword
};
