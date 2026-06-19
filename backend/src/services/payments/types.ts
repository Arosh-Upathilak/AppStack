export interface TokenizeCardInput {
  number: string;
  expMonth: number;
  expYear: number;
}

export interface TokenizedCard {
  token: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export interface ChargeInput {
  amountCents: number;
  currency: string;
  method: {
    last4: string;
    simulatorToken?: string;
    providerToken?: string | null;
  };
  descriptor: string;
  idempotencyKey?: string;
}

export interface ChargeResult {
  success: boolean;
  providerRef?: string;
  failureReason?: string;
}

export interface RefundInput {
  amountCents: number;
  currency: string;
  providerChargeRef?: string | null;
}

export interface RefundResult {
  success: boolean;
  providerRef?: string;
  failureReason?: string;
}

export interface DisburseInput {
  amountCents: number;
  currency: string;
  destination: string; // destination identifier (e.g. email or stripe account id)
}

export interface DisburseResult {
  success: boolean;
  providerRef?: string;
  failureReason?: string;
}

export interface PaymentProvider {
  tokenizeCard(input: TokenizeCardInput): Promise<TokenizedCard>;
  charge(input: ChargeInput): Promise<ChargeResult>;
  refund(input: RefundInput): Promise<RefundResult>;
  disburse(input: DisburseInput): Promise<DisburseResult>;
}
