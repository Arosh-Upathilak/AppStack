import { PaymentProvider } from "./types";
import { SimulatorProvider } from "./simulatorProvider";
import { StripeProvider } from "./stripeProvider";

let provider: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (provider) return provider;

  const type = process.env.PAYMENT_PROVIDER || "simulator";
  if (type.toLowerCase() === "stripe") {
    provider = new StripeProvider();
  } else {
    provider = new SimulatorProvider();
  }

  return provider;
}
