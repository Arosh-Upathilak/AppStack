export type ProductStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "UNLISTED"
  | "PENDING_DELETION";

export type BillingInterval = "MONTHLY" | "YEARLY";

export type SubscriptionStatus =
  | "PENDING"
  | "ACTIVE"
  | "CHANGE_PENDING"
  | "CANCEL_PENDING"
  | "CANCELED";

export type InvoiceStatus = "OPEN" | "PAID" | "VOID" | "REFUNDED";

export interface ProductPlan {
  id: string;
  productId: string;
  identifier: string;
  name: string;
  features: string[];
  priceCents: number;
  currency: string;
  billingInterval: BillingInterval;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  slug: string;
  sellerId: string;
  name: string;
  vendor: string;
  shortDescription: string;
  description: string;
  category: string;
  similarTo: string[];
  hue: string;
  status: ProductStatus;
  webhookUrl?: string | null;
  webhookSecret?: string | null;
  webhookTested: boolean;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  rating: number;
  reviewsCount: number;
  fromCents: number;
  currency: string;
  plans: ProductPlan[];
}

export interface Review {
  id: string;
  productId: string;
  userId?: string | null;
  authorName: string;
  authorRole?: string | null;
  rating: number;
  body: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isPrimary: boolean;
}

export interface Subscription {
  id: string;
  buyerId: string;
  productId: string;
  planId: string;
  productName: string;
  productSlug: string;
  planName: string;
  planIdentifier: string;
  priceCents: number;
  currency: string;
  billingInterval: BillingInterval;
  recipientEmail: string;
  seats: number;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingAt: string;
  paymentMethod: Pick<PaymentMethod, "id" | "brand" | "last4" | "isPrimary"> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  number: string;
  buyerId: string;
  subscriptionId?: string | null;
  productId: string;
  planId: string;
  productName: string;
  planName: string;
  amountCents: number;
  currency: string;
  status: InvoiceStatus;
  description: string;
  issuedAt: string;
  paidAt?: string | null;
}

export interface Consent {
  id: string;
  type: "SHARE_EMAIL" | "DATA_PROTECTION";
  agreedAt: string;
  ipAddress: string | null;
  product: string;
  plan: string;
  recipientEmail: string;
}

export interface WebhookEvent {
  id: string;
  productId: string;
  eventType: string;
  payload: string;
  status: "PENDING" | "DELIVERED" | "FAILED";
  attempts: number;
  lastAttempt?: string | null;
  responseCode?: number | null;
  responseBody?: string | null;
  createdAt: string;
  updatedAt: string;
}
