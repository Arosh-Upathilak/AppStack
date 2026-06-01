import axios from "axios";
import { AppError } from "./errorHandler";

/**
 * Verifies a Google reCAPTCHA v3 token.
 *
 * Dev convenience: when RECAPTCHA_SECRET_KEY is not configured and we're not in
 * production, verification is skipped so local/demo logins work without a live
 * reCAPTCHA key. In production a missing key is a hard error — we never silently
 * disable bot protection on a real deployment.
 *
 * @param token          the reCAPTCHA token sent from the frontend
 * @param expectedAction optional action name to assert (e.g. "create_account")
 * @param minScore       minimum acceptable score (default 0.5)
 */
export async function verifyRecaptcha(
  token: string | undefined,
  expectedAction?: string,
  minScore = 0.5,
): Promise<void> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new AppError("reCAPTCHA is not configured", 500);
    }
    console.warn(
      "[recaptcha] RECAPTCHA_SECRET_KEY not set — skipping verification (dev only)",
    );
    return;
  }

  const { data } = await axios.post(
    "https://www.google.com/recaptcha/api/siteverify",
    null,
    { params: { secret, response: token } },
  );

  if (!data.success) {
    throw new AppError("reCAPTCHA verification failed", 400);
  }

  if (expectedAction && data.action !== expectedAction) {
    throw new AppError("Invalid reCAPTCHA action", 400);
  }

  if (typeof data.score === "number" && data.score < minScore) {
    throw new AppError("Bot activity detected", 400);
  }
}
