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
  | "PAST_DUE"
  | "CANCELED";

export type ProductChangeType = "UPDATE" | "DELETE";
export type ProductChangeStatus = "PENDING" | "APPROVED" | "REJECTED";

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
  refundsEnabled: boolean;
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
  refundsEnabled: boolean;
  viewCount: number;
  createdAt?: string;
  updatedAt?: string;
  rating: number;
  reviewsCount: number;
  fromCents: number;
  currency: string;
  plans: ProductPlan[];
  pendingChangeRequest?: ProductChangeRequest;
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
  canceledAt?: string | null;
  pendingPlanId?: string | null;
  adminCancellationApprovedAt?: string | null;
  billingRetryCount: number;
  lastBillingFailureAt?: string | null;
  nextBillingRetryAt?: string | null;
  integrationStatusMessage?: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingAt: string;
  paymentMethod: Pick<PaymentMethod, "id" | "brand" | "last4" | "isPrimary"> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductChangeRequest {
  id: string;
  productId: string;
  sellerId: string;
  type: ProductChangeType;
  status: ProductChangeStatus;
  payload?: Partial<Product> & { plans?: ProductPlan[] } | null;
  rejectionReason?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  reviewedById?: string | null;
  product?: Product;
  seller?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
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
  product?: {
    name: string;
    slug: string;
  };
  eventType: string;
  payload: string;
  status: "PENDING" | "DELIVERED" | "FAILED";
  mode: "LIVE" | "TEST";
  attempts: number;
  lastAttempt?: string | null;
  nextAttemptAt?: string | null;
  deliveredAt?: string | null;
  responseCode?: number | null;
  responseBody?: string | null;
  createdAt: string;
  updatedAt: string;
}
