import { Request, Response } from "express";
import { AppError, asyncHandler } from "../utils/errorHandler";
import prisma from "../utils/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { emailRegex } from "../utils/validation";
import { transporter } from "../utils/nodeMailer";
import { otpTemplate } from "../template/otpEmail";
import { redisClient } from "../config/redis";
import { resetPasswordTemplate } from "../template/resetPasswordEmail";
import { createAccountTemplate } from "../template/createAccount";
import { verifyRecaptcha } from "../utils/recaptcha";

const signAccessToken = (id: string, roles: string[]): string => {
  return jwt.sign(
    { id, roles },
    process.env.JWT_SECRET || "demo_super_secret_jwt_key_123",
    { expiresIn: "30d" }
  );
};

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

// Derive the seller application state for a user, mapped to the frontend
// SellerStatus contract (PENDING | APPROVED | REJECTED), or null when the user
// has never applied to be a seller. The schema enum uses DENIED; the frontend
// type uses REJECTED, so we translate here to keep the FE contract clean.
const getSellerStatus = async (
  userId: string,
): Promise<"PENDING" | "APPROVED" | "REJECTED" | null> => {
  const seller = await prisma.seller.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!seller) return null;

  return seller.isApproveSeller === "DENIED"
    ? "REJECTED"
    : seller.isApproveSeller;
};

// Create User
const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, role, token } = req.body;

  // Validation
  if (!firstName || !lastName || !email || !password || !role) {
    throw new AppError(
      "Email, firstName, lastName and password are required",
      400,
    );
  }

  if (!emailRegex.test(email)) {
    throw new AppError("Invalid email", 400);
  }

  if (password.length < 8) {
    throw new AppError("Password must contains at least 8 characters", 400);
  }

  // Verify reCAPTCHA
  await verifyRecaptcha(token, "create_account");

  // Check Existing User
  const existsUser = await prisma.user.findFirst({
    where: {
      email: email,
      roles: {
        has: role,
      },
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

    throw new AppError("Failed to send OTP email", 500);
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
  const { email, password, token } = req.body;

  // Validation
  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  if (!emailRegex.test(email)) {
    throw new AppError("Invalid email", 400);
  }

  // Verify reCAPTCHA
  await verifyRecaptcha(token);

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

  if (!existsUser.password) {
    throw new Error("Password not found");
  }

  // Compare Password
  const isMatchPassword = await bcrypt.compare(password, existsUser.password);

  if (!isMatchPassword) {
    throw new AppError("Credentials are wrong", 400);
  }

  const accessToken = signAccessToken(existsUser.id, existsUser.roles);

  return res.status(200).json({
    success: true,
    message: `${existsUser.roles} logged successfully`,
    accessToken,
    user: {
      id: existsUser.id,
      email: existsUser.email,
      role: existsUser.roles,
      sellerStatus: await getSellerStatus(existsUser.id),
    },
  });
});

const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const requestUser = (req as any).user;

  if (!requestUser?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const user = await prisma.user.findUnique({
    where: {
      id: requestUser.id,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const accessToken = signAccessToken(user.id, user.roles);

  return res.status(200).json({
    success: true,
    message: "Current user fetched successfully",
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.roles,
      sellerStatus: await getSellerStatus(user.id),
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
  } catch {
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

  const accessToken = signAccessToken(updatedUser.id, updatedUser.roles);

  return res.status(200).json({
    success: true,
    message: "Account verified successfully",
    accessToken,
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.roles,
      sellerStatus: await getSellerStatus(updatedUser.id),
    },
  });
});

// Forgot password
const forgotPasswordSendEmail = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, token } = req.body;
    // Validation
    if (!email) {
      throw new AppError("Email is required", 400);
    }

    if (!emailRegex.test(email)) {
      throw new AppError("Invalid email", 400);
    }

    // Verify reCAPTCHA
    await verifyRecaptcha(token, "forgot_password");

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
    } catch {
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

// Google login
const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, name } = req.body;
  if (!email) {
    throw new AppError("Email is required", 400);
  }

  const nameArray = name?.trim().split(" ") || [];

  const firstName = nameArray[0] || "";

  const lastName = nameArray.slice(1).join(" ");

  let existsUser = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  if (!existsUser) {
    existsUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        roles: { set: ["BUYER"] },
        isVerified: true,
      },
    });

    // send the user create acknowledge email
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Congratulations! Your AppStack Account Has Been Created 🎉",
        html: createAccountTemplate(name, email),
      };
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Failed to send Google welcome email:", error);
    }
  }

  const accessToken = signAccessToken(existsUser.id, existsUser.roles);

  return res.status(200).json({
    success: true,
    message: "Login Successfully",
    accessToken,
    user: {
      id: existsUser.id,
      email: existsUser.email,
      role: existsUser.roles,
      sellerStatus: await getSellerStatus(existsUser.id),
    },
  });
});

const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Number(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const role = typeof req.query.role === "string" ? req.query.role.trim() : "";

  const whereClause: any = {};

  if (search) {
    whereClause.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role) {
    whereClause.roles = { has: role as any };
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      roles: true,
      isVerified: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  const total = await prisma.user.count({ where: whereClause });

  return res.status(200).json({
    success: true,
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.params.userId);
  const { roles } = req.body as { roles: ("BUYER" | "SELLER" | "ADMIN")[] };

  if (!roles || !Array.isArray(roles) || roles.length === 0) {
    throw new AppError("Roles array is required and cannot be empty", 400);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { roles: { set: roles } },
    select: {
      id: true,
      email: true,
      roles: true,
    },
  });

  return res.status(200).json({
    success: true,
    message: "User roles updated successfully",
    user: updatedUser,
  });
});

const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.params.userId);
  const { firstName, lastName, isVerified } = req.body as {
    firstName?: string;
    lastName?: string;
    isVerified?: boolean;
  };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.email.includes("anonymized.local")) {
    throw new AppError("Anonymized users cannot be edited", 400);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(firstName !== undefined ? { firstName: firstName.trim() || null } : {}),
      ...(lastName !== undefined ? { lastName: lastName.trim() || null } : {}),
      ...(isVerified !== undefined ? { isVerified: Boolean(isVerified) } : {}),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      roles: true,
      isVerified: true,
      createdAt: true,
    },
  });

  return res.status(200).json({
    success: true,
    message: "User profile updated successfully",
    user: updatedUser,
  });
});

const sendAdminPasswordReset = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.params.userId);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.email || user.email.includes("anonymized.local")) {
    throw new AppError("Cannot send a reset email for this user", 400);
  }

  const resetToken = crypto.randomUUID();
  await redisClient.setEx(`reset:${resetToken}`, OTP_EXPIRY, user.email);
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Reset Your AppStack Password",
      html: resetPasswordTemplate(resetLink),
    });
  } catch {
    await redisClient.del(`reset:${resetToken}`);
    throw new AppError("Failed to send reset email", 500);
  }

  return res.status(200).json({
    success: true,
    message: "Password reset email sent successfully",
  });
});

const deleteUserGDPR = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.params.userId);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const anonymizedEmail = `gdpr-${userId}@anonymized.local`;

  await prisma.$transaction(async (tx) => {
    // Update User PII
    await tx.user.update({
      where: { id: userId },
      data: {
        firstName: "Anonymized",
        lastName: "User",
        email: anonymizedEmail,
        password: null,
        isVerified: false,
        roles: { set: [] }, // Clear roles to prevent login
      },
    });

    // Anonymize Consents
    await tx.consent.updateMany({
      where: { userId },
      data: {
        recipientEmail: anonymizedEmail,
        ipAddress: "0.0.0.0", // Clear IP
        userAgent: "GDPR Anonymized",
      },
    });

    // Anonymize Subscriptions
    await tx.subscription.updateMany({
      where: { buyerId: userId },
      data: {
        recipientEmail: anonymizedEmail,
      },
    });
  });

  return res.status(200).json({
    success: true,
    message: "User personal data anonymized successfully under GDPR guidelines.",
  });
});

export {
  createUser,
  getCurrentUser,
  loginUser,
  sendOtp,
  verifyAccount,
  forgotPasswordSendEmail,
  resetPassword,
  googleLogin,
  listUsers,
  updateUserProfile,
  sendAdminPasswordReset,
  updateUserRole,
  deleteUserGDPR,
};
