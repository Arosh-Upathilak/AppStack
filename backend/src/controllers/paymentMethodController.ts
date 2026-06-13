import crypto from "crypto";
import { Request, Response } from "express";
import { AppError, asyncHandler } from "../utils/errorHandler";
import prisma from "../utils/prisma";

function normalizeCardNumber(number: string) {
  return String(number ?? "").replace(/\D/g, "");
}

function passesLuhn(number: string) {
  let sum = 0;
  let doubleDigit = false;

  for (let index = number.length - 1; index >= 0; index -= 1) {
    let digit = Number(number[index]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }

  return sum % 10 === 0;
}

function detectBrand(number: string) {
  if (number.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(number) || /^2(2[2-9]|[3-6]|7[01]|720)/.test(number)) {
    return "Mastercard";
  }
  if (/^3[47]/.test(number)) return "Amex";
  if (/^6(?:011|5)/.test(number)) return "Discover";
  return "Card";
}

function serializeMethod(method: any) {
  return {
    id: method.id,
    brand: method.brand,
    last4: method.last4,
    expMonth: method.expMonth,
    expYear: method.expYear,
    isPrimary: method.isPrimary,
    createdAt: method.createdAt,
    updatedAt: method.updatedAt,
  };
}

export const listPaymentMethods = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const methods = await prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    });

    return res.status(200).json({
      success: true,
      stripeEnabled: false,
      methods: methods.map(serializeMethod),
    });
  },
);

export const createPaymentMethod = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { number, expMonth, expYear, setAsPrimary } = req.body as {
      number?: string;
      expMonth?: number;
      expYear?: number;
      setAsPrimary?: boolean;
    };

    const normalizedNumber = normalizeCardNumber(number ?? "");
    if (normalizedNumber.length < 12 || normalizedNumber.length > 19) {
      throw new AppError("Card number must be 12 to 19 digits", 400);
    }

    if (!passesLuhn(normalizedNumber)) {
      throw new AppError("Card number failed simulator validation", 400);
    }

    const month = Number(expMonth);
    const year = Number(expYear);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new AppError("Invalid expiry month", 400);
    }

    if (
      !Number.isInteger(year) ||
      year < currentYear ||
      (year === currentYear && month < currentMonth)
    ) {
      throw new AppError("Card is expired", 400);
    }

    const existingCount = await prisma.paymentMethod.count({
      where: { userId },
    });

    const makePrimary = setAsPrimary ?? existingCount === 0;

    const method = await prisma.$transaction(async (tx) => {
      if (makePrimary) {
        await tx.paymentMethod.updateMany({
          where: { userId },
          data: { isPrimary: false },
        });
      }

      return tx.paymentMethod.create({
        data: {
          userId,
          brand: detectBrand(normalizedNumber),
          last4: normalizedNumber.slice(-4),
          expMonth: month,
          expYear: year,
          isPrimary: makePrimary,
          simulatorToken: crypto.randomUUID(),
        },
      });
    });

    return res.status(201).json({
      success: true,
      message: "Payment method added",
      method: serializeMethod(method),
    });
  },
);

export const setPrimaryPaymentMethod = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const methodId = String(req.params.id);

    const method = await prisma.paymentMethod.findFirst({
      where: {
        id: methodId,
        userId,
      },
    });

    if (!method) {
      throw new AppError("Payment method not found", 404);
    }

    await prisma.$transaction([
      prisma.paymentMethod.updateMany({
        where: { userId },
        data: { isPrimary: false },
      }),
      prisma.paymentMethod.update({
        where: { id: methodId },
        data: { isPrimary: true },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Primary payment method updated",
    });
  },
);

export const deletePaymentMethod = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const methodId = String(req.params.id);

    const method = await prisma.paymentMethod.findFirst({
      where: {
        id: methodId,
        userId,
      },
    });

    if (!method) {
      throw new AppError("Payment method not found", 404);
    }

    const activeSubscriptions = await prisma.subscription.count({
      where: {
        buyerId: userId,
        paymentMethodId: methodId,
        status: {
          in: ["ACTIVE", "PENDING", "CHANGE_PENDING"],
        },
      },
    });

    if (activeSubscriptions > 0) {
      throw new AppError("Payment method is used by active subscriptions", 400);
    }

    await prisma.paymentMethod.delete({
      where: { id: methodId },
    });

    if (method.isPrimary) {
      const replacement = await prisma.paymentMethod.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      if (replacement) {
        await prisma.paymentMethod.update({
          where: { id: replacement.id },
          data: { isPrimary: true },
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Payment method deleted",
    });
  },
);
