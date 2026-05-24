import morgan from "morgan";
import fs from "fs";
import path from "path";
import { Request, Response, NextFunction } from "express";
import { nanoid } from "nanoid";

// Logs directory
const logsDir = path.join(__dirname, "..", "logs");

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log("📁 Created logs directory:", logsDir);
}

// Custom tokens
morgan.token("reqId", (req: Request) => (req as any).reqId || "unknown");
morgan.token("userId", (req: Request) => (req as any).user?.id || "anonymous");

// Log format
const logFormat =
  ':remote-addr - :method :url :status :res[content-length] - :response-time ms reqId=:reqId userId=:userId';

// Log files
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, "access.log"),
  { flags: "a" }
);

const errorLogStream = fs.createWriteStream(
  path.join(logsDir, "error.log"),
  { flags: "a" }
);

// Add Request ID Middleware
export const addRequestId = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    (req as any).reqId = nanoid(8);
    res.setHeader("X-Request-ID", (req as any).reqId);
    next();
  } catch (error) {
    console.error("Error generating request ID:", error);

    const fallbackId = Math.random().toString(36).substring(2, 10);
    (req as any).reqId = fallbackId;
    res.setHeader("X-Request-ID", fallbackId);

    next();
  }
};

// Request Logger
export const requestLogger = morgan(logFormat, {
  stream: accessLogStream,
  skip: (req: Request) => req.url === "/health",
});

// 🔹 Error Logger
export const errorLogger = morgan(logFormat, {
  stream: errorLogStream,
  skip: (req: Request, res: Response) => res.statusCode < 400,
});

// Security Logger
export const securityLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const suspiciousPatterns = [
    /script.*alert/i,
    /union.*select/i,
    /drop.*table/i,
    /<script/i,
    /javascript:/i,
  ];

  const url = req.url.toLowerCase();
  const userAgent = (req.get("User-Agent") || "").toLowerCase();

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url) || pattern.test(userAgent)) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: "SECURITY_ALERT",
        ip: req.ip,
        method: req.method,
        url: req.url,
        userAgent: req.get("User-Agent"),
        reqId: (req as any).reqId,
        pattern: pattern.source,
      };

      fs.appendFileSync(
        path.join(logsDir, "security.log"),
        JSON.stringify(logEntry) + "\n"
      );
    }
  }

  next();
};