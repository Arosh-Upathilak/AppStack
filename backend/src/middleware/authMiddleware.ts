import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";
import jwt from "jsonwebtoken";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "demo_super_secret_jwt_key_123"
    ) as { id: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    (req as any).user = user;

    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
  }
};

export const authMiddlewareRequireRole =
  (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    const hasRole = user.roles.some((role: string) => roles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
      });
    }

    next();
  };
