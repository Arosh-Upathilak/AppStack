import axios from "axios";
import { userAuthorization } from "@/hook/userAuthorization";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface SellerApplicationInput {
  businessName: string;
  payoutEmail: string;
  aboutProject: string;
}

export interface Seller {
  id: string;
  payoutEmail: string;
  businessName: string;
  aboutProject?: string | null;
  isApproveSeller: "PENDING" | "APPROVED" | "DENIED";
  approveByAdminId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetSellersResponse {
  success: boolean;
  message: string;
  sellers: Seller[];
}

export async function submitSellerApplication(input: SellerApplicationInput) {
  const headers = await userAuthorization();

  return axios.post(`${API_BASE}/seller/submitSellerRequest`, input, {
    headers,
    withCredentials: true,
  });
}

export async function getSellers(): Promise<GetSellersResponse> {
  const headers = await userAuthorization();

  const response = await axios.get<GetSellersResponse>(
    `${API_BASE}/seller/getSeller`,
    {
      headers,
      withCredentials: true,
    },
  );

  return response.data;
}

export async function approveSeller(
  sellerId: string,
  status: "APPROVED" | "DENIED",
) {
  const headers = await userAuthorization();

  return axios.post(
    `${API_BASE}/seller/updateSellerRequest`,
    {
      sellerId,
      status,
    },
    {
      headers,
      withCredentials: true,
    },
  );
}

export interface EarningsSummary {
  totalSalesCents: number;
  totalRefundsCents: number;
  lockedCents: number;
  withdrawableCents: number;
  withdrawnCents: number;
  pendingPayoutsCents: number;
}

export interface GetEarningsSummaryResponse {
  success: boolean;
  summary: EarningsSummary;
}

export interface Transaction {
  id: string;
  sellerId: string;
  amountCents: number;
  type: "SALE" | "REFUND" | "PAYOUT" | "ADJUSTMENT";
  status: "LOCKED" | "AVAILABLE" | "WITHDRAWN";
  description: string;
  invoiceId?: string | null;
  payoutId?: string | null;
  createdAt: string;
  updatedAt: string;
  invoice?: {
    number: string;
  } | null;
}

export interface GetTransactionsResponse {
  success: boolean;
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export async function getSellerEarningsSummary(): Promise<GetEarningsSummaryResponse> {
  const headers = await userAuthorization();
  const response = await axios.get<GetEarningsSummaryResponse>(
    `${API_BASE}/seller/earnings/summary`,
    { headers, withCredentials: true }
  );
  return response.data;
}

export async function getSellerTransactions(page = 1, limit = 10): Promise<GetTransactionsResponse> {
  const headers = await userAuthorization();
  const response = await axios.get<GetTransactionsResponse>(
    `${API_BASE}/seller/earnings/transactions?page=${page}&limit=${limit}`,
    { headers, withCredentials: true }
  );
  return response.data;
}

export async function requestPayout(amountCents: number, payoutEmail?: string) {
  const headers = await userAuthorization();
  return axios.post(
    `${API_BASE}/seller/payouts/request`,
    { amountCents, payoutEmail },
    { headers, withCredentials: true }
  );
}

export interface SellerSubscriptionSummary {
  productsCount: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  canceledSubscriptions: number;
  monthlyRecurringRevenueCents: number;
}

export interface SellerProductSubscriptionSummary {
  id: string;
  name: string;
  slug: string;
  status: string;
  activeCount: number;
  canceledCount: number;
  monthlyRevenueCents: number;
}

export interface SellerSubscriptionRow {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  planId: string;
  planName: string;
  planIdentifier: string;
  status: string;
  seats: number;
  amountCents: number;
  currency: string;
  billingInterval: "MONTHLY" | "YEARLY";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetSellerSubscriptionsResponse {
  success: boolean;
  summary: SellerSubscriptionSummary;
  products: SellerProductSubscriptionSummary[];
  subscriptions: SellerSubscriptionRow[];
}

export async function getSellerSubscriptions(
  productId?: string,
  status?: string,
): Promise<GetSellerSubscriptionsResponse> {
  const headers = await userAuthorization();
  const response = await axios.get<GetSellerSubscriptionsResponse>(
    `${API_BASE}/seller/subscriptions`,
    {
      headers,
      withCredentials: true,
      params: {
        ...(productId ? { productId } : {}),
        ...(status ? { status } : {}),
      },
    },
  );
  return response.data;
}
