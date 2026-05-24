import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";
import { Request, Response } from "express";

const getIp = (req: Request): string => {
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  return ip.startsWith("::ffff:") ? ip.slice(7) : ip;
};

const createLimiter = (
  windowMs: number,
  max: number,
  message: string,
  skipSuccessfulRequests: boolean = false,
  keyGenerator?: (req: Request) => string,
  emailOnlyKey: boolean = false         
): RateLimitRequestHandler => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    keyGenerator: keyGenerator ?? ((req) => getIp(req)),
    // suppress IPv6 warning when key has nothing to do with IP
    ...(emailOnlyKey && { validate: { keyGeneratorIpFallback: false } }),
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: message,
        retryAfter: `${Math.ceil(windowMs / 60000)} minutes`,
      });
    },
  });
};

// General API
export const generalLimiter = createLimiter(
  15 * 60 * 1000,
  300,
  "Too many requests, please try again later"
);

// Auth 
export const authLimiter = createLimiter(
  15 * 60 * 1000,
  10,
  "Too many authentication attempts",
  false,
  (req) => `${getIp(req)}:${req.body?.email ?? "unknown"}`
);

// Register
export const registerLimiter = createLimiter(
  60 * 60 * 1000,
  5,
  "Too many registration attempts"
);

// User management
export const userManagementLimiter = createLimiter(
  15 * 60 * 1000,
  300,
  "Too many user management requests"
);

// OTP send by IP
export const userOtpIpLimiter = createLimiter(
  15 * 60 * 1000,
  10,
  "Too many OTP requests"
);

// Reset link send by IP
export const userResetEmailIpLimiter = createLimiter(
  15 * 60 * 1000,
  10,
  "Too many reset requests"
);

// OTP send by email 
export const userOtpEmailLimiter = createLimiter(
  15 * 60 * 1000,
  5,
  "Too many OTP requests for this address",
  false,
  (req) => `email:${req.body?.email ?? "unknown"}`,
  true // suppress IPv6 warning
);

// Upload
export const uploadLimiter = createLimiter(
  15 * 60 * 1000,
  20,
  "Too many file uploads"
);

// Search
export const searchLimiter = createLimiter(
  60 * 1000,
  30,
  "Too many search requests"
);

// Order
export const orderLimiter = createLimiter(
  15 * 60 * 1000,
  300,
  "Too many order operations"
);