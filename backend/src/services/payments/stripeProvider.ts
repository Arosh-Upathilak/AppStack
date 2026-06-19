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

/**
 * Stripe Payment Provider implementation.
 * JSDoc: To integrate Stripe:
 * 1. Install stripe dependency: `npm install stripe`
 * 2. Initialize stripe client with `process.env.STRIPE_SECRET_KEY`
 * 3. Implement tokenizeCard using Stripe Elements / SetupIntents on client side, and retrieve payment method token on backend
 * 4. Implement charge method using `stripe.paymentIntents.create` with idempotency keys
 * 5. Implement refund method using `stripe.refunds.create`
 * 6. Implement disburse method using Stripe Connect Payouts: `stripe.payouts.create` or transfers
 */
export class StripeProvider implements PaymentProvider {
  async tokenizeCard(input: TokenizeCardInput): Promise<TokenizedCard> {
    // TODO(gateway): Use Stripe client-side Elements or backend PaymentMethods API
    throw new Error("Stripe provider not implemented — see PAYMENTS_INTEGRATION.md");
  }

  async charge(input: ChargeInput): Promise<ChargeResult> {
    // TODO(gateway): Implement stripe.paymentIntents.create
    throw new Error("Stripe provider not implemented — see PAYMENTS_INTEGRATION.md");
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    // TODO(gateway): Implement stripe.refunds.create
    throw new Error("Stripe provider not implemented — see PAYMENTS_INTEGRATION.md");
  }

  async disburse(input: DisburseInput): Promise<DisburseResult> {
    // TODO(gateway): Implement Stripe Connect Payouts / Transfers API
    throw new Error("Stripe provider not implemented — see PAYMENTS_INTEGRATION.md");
  }
}
