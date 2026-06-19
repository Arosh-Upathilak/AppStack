import crypto from "crypto";
import {
  PaymentProvider,
  TokenizeCardInput,
  TokenizedCard,
  ChargeInput,
  ChargeResult,
  RefundInput,
  RefundResult,
  DisburseInput,
  DisburseResult,
} from "./types";

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

export class SimulatorProvider implements PaymentProvider {
  async tokenizeCard(input: TokenizeCardInput): Promise<TokenizedCard> {
    const normalizedNumber = normalizeCardNumber(input.number);
    if (normalizedNumber.length < 12 || normalizedNumber.length > 19) {
      throw new Error("Card number must be 12 to 19 digits");
    }

    if (!passesLuhn(normalizedNumber)) {
      throw new Error("Card number failed simulator validation");
    }

    return {
      token: crypto.randomUUID(),
      brand: detectBrand(normalizedNumber),
      last4: normalizedNumber.slice(-4),
      expMonth: input.expMonth,
      expYear: input.expYear,
    };
  }

  async charge(input: ChargeInput): Promise<ChargeResult> {
    const chargeSucceeded = input.method.last4 !== "0000";
    if (chargeSucceeded) {
      return {
        success: true,
        providerRef: `ch_${crypto.randomBytes(12).toString("hex")}`,
      };
    } else {
      return {
        success: false,
        failureReason: "Card declined by bank simulator",
      };
    }
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    return {
      success: true,
      providerRef: `re_${crypto.randomBytes(12).toString("hex")}`,
    };
  }

  async disburse(input: DisburseInput): Promise<DisburseResult> {
    return {
      success: true,
      providerRef: `dp_${crypto.randomBytes(12).toString("hex")}`,
    };
  }
}
