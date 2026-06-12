import { Request, Response, NextFunction } from "express";

// Custom Error Class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  // isOperational: true → expected error (user mistake)
  // isOperational: false → system bug

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
  ) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Clean stack trace (remove constructor noise)
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error Logger
export const logError = (error: unknown, context: string = "") => {
  const timestamp = new Date().toLocaleString("en-LK", {
    timeZone: "Asia/Colombo",
  });
  const contextStr = context ? ` [${context}]` : "";

  if (error instanceof AppError) {
    console.error(`${timestamp}${contextStr} AppError:`, {
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack,
    });
  } else if (error instanceof Error) {
    console.error(`${timestamp}${contextStr} Error:`, {
      message: error.message,
      stack: error.stack,
    });
  } else {
    console.error(`${timestamp}${contextStr} Unknown error:`, error);
  }
};

// Prisma Error Handler
export const handlePrismaError = (error: any) => {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return {
      error: "Internal server error. Please try again later.",
      timestamp: new Date().toLocaleString("en-LK", {
        timeZone: "Asia/Colombo",
      }),
    };
  }

  switch (error.code) {
    case "P2002":
      return {
        error: "Duplicate value (already exists)",
        details: error.meta?.target?.join(", "),
        timestamp: new Date().toLocaleString("en-LK", {
          timeZone: "Asia/Colombo",
        }),
      };

    case "P2025":
      return {
        error: "Record not found",
        timestamp: new Date().toLocaleString("en-LK", {
          timeZone: "Asia/Colombo",
        }),
      };

    case "P2003":
      return {
        error: "Foreign key constraint failed",
        timestamp: new Date().toLocaleString("en-LK", {
          timeZone: "Asia/Colombo",
        }),
      };

    default:
      return {
        error: "Database error",
        code: error.code,
        timestamp: new Date().toLocaleString("en-LK", {
          timeZone: "Asia/Colombo",
        }),
      };
  }
};

// Prisma Status Mapping
export const getStatusCodeFromPrismaError = (error: any): number => {
  switch (error.code) {
    case "P2002":
      return 409; // Conflict
    case "P2025":
      return 404; // Not Found
    case "P2003":
    case "P2014":
      return 400; // Bad Request
    case "P2021":
    case "P2022":
      return 500; // Internal Server Error
    default:
      return 500;
  }
};

// Main Error Handler
export const handleServerError = (
  error: unknown,
  res: Response,
  context: string = "",
) => {
  const timestamp = new Date().toLocaleString("en-LK", {
    timeZone: "Asia/Colombo",
  });

  // Log error
  logError(error, context);

  // Custom AppError
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      timestamp,
    });
  }

  // Prisma error
  if (typeof error === "object" && error !== null && "code" in error) {
    const err = error as any;
    return res
      .status(getStatusCodeFromPrismaError(err))
      .json(handlePrismaError(err));
  }

  // Unknown error
  return res.status(500).json({
    success: false,
    error: "Internal server error",
    timestamp,
  });
};

// Async Handler (IMPORTANT)
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      handleServerError(error, res, `${req.method} ${req.path}`);
    });
  };
};
