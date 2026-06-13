import express ,{ NextFunction, Request, Response } from "express";
import "dotenv/config";
import { addRequestId, errorLogger, requestLogger, securityLogger } from "./middleware/requestLogger";
import cors from "cors";
import helmet from "helmet";
import http from "http";
import { generalLimiter, userManagementLimiter, userOtpEmailLimiter, userOtpIpLimiter, userResetEmailIpLimiter } from "./middleware/rateLimiter";
import { handleServerError } from "./utils/errorHandler";
import userRoutes from "./routes/userRoutes";
import { connectRedis } from "./config/redis";
import sellerRouter from "./routes/sellerRouters";
import { initSocket } from "./socket/socketConnect";
import notificationRouter from "./routes/notificationRouter";
import productRouter from "./routes/productRouter";
import paymentMethodRouter from "./routes/paymentMethodRouter";
import subscriptionRouter from "./routes/subscriptionRouter";
import invoiceRouter from "./routes/invoiceRouter";
import consentRouter from "./routes/consentRouter";
import adminRouter from "./routes/adminRouter";
import integrationRouter from "./routes/integrationRouter";
import webhookRouter from "./routes/webhookRouter";
import refundRouter from "./routes/refundRouter";
import { runBillingCycle } from "./services/scheduler";


const server = express();
const httpServer = http.createServer(server);
const port = process.env.PORT || 5000;

// Trust proxy (for real IP)
server.set("trust proxy", 1);

// Add request ID to all requests
server.use(addRequestId);

// Security logging (check for suspicious patterns)
server.use(securityLogger);

// Standard request logging
server.use(requestLogger);

// Error logging (only logs 4xx and 5xx responses)
server.use(errorLogger);

// Use for to prevent the XSS
server.use(helmet());

// Parsers
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Allowed origins (CORS)
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: (origin : any, callback : any) => {
    // allow tools like Postman
    if (!origin) return callback(null, true); 

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (
      process.env.NODE_ENV === "development" &&
      origin.startsWith("http://localhost:")
    ) {
      return callback(null, true);
    }

    return callback(
      new Error("CORS: Origin not allowed"),
      false
    );
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
  credentials: true,
};


// Apply general rate limiting to all routes
server.use(generalLimiter);

// Middleware parse JSON
server.use(express.json()); 

// Enable CORS
server.use(cors(corsOptions));

// Apply specific rate limiters to different route groups
server.use("/api/auth", userManagementLimiter);
server.use("/api/auth/send-otp", userOtpIpLimiter, userOtpEmailLimiter);
server.use("/api/auth/forgot-password", userResetEmailIpLimiter);

// Routers
// User routers
server.use("/api/auth", userRoutes);
// Public product catalog
server.use("/api/products", productRouter);
// Seller routers
server.use("/api/seller", sellerRouter);
// Buyer subscription foundation
server.use("/api/subscriptions", subscriptionRouter);
server.use("/api/invoices", invoiceRouter);
server.use("/api/payment-methods", paymentMethodRouter);
server.use("/api/consents", consentRouter);
// Admin workflows
server.use("/api/admin", adminRouter);
// Notification
server.use("/api/notification", notificationRouter);
server.use("/api/integrations", integrationRouter);
server.use("/api/webhooks", webhookRouter);
server.use("/api/refunds", refundRouter);


// Health Check
server.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});


// Test the router
server.get("/",(req : Request,res : Response)=>{
    res.send("Hello world");
});

// Rate limit info endpoint
server.get('/rate-limit-info', (req : Request, res : Response) => {
  res.status(200).json({
    general: '100 requests per 15 minutes',
    auth: '5 login attempts per 15 minutes',
    register: '3 registrations per hour',
    upload: '10 uploads per 15 minutes',
    search: '30 searches per minute',
    orders: '15 order operations per 15 minutes',
    wishlist: '20 operations per 5 minutes',
    products: '60 requests per minute',
    requestId: (req as any).reqId
  });
});

// 404 Handler
server.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// Global Error Handler
server.use(                                
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (err: any, req: Request, res: Response, next: NextFunction) => {
    handleServerError(err, res, `${req.method} ${req.path}`);
  }
);


// Start Server
const startServer = async () => {
  // Redis
  await connectRedis();

  // initialize socket
  initSocket(httpServer);

  // Start billing scheduler on startup and repeat hourly
  runBillingCycle().catch((err) => {
    console.error("Failed to run initial billing cycle:", err);
  });
  setInterval(() => {
    runBillingCycle().catch((err) => {
      console.error("Failed to run scheduled billing cycle:", err);
    });
  }, 1000 * 60 * 60); // hourly

  httpServer.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
  });
};

startServer();
