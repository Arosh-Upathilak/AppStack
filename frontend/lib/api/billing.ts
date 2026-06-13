import axios from "axios";
import { userAuthorization } from "@/hook/userAuthorization";
import type { Consent, Invoice, PaymentMethod, Subscription } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface CreateSubscriptionInput {
  productId: string;
  planId: string;
  paymentMethodId?: string;
  recipientEmail: string;
  seats: number;
  acceptEmailConsent: boolean;
}

export interface CreatePaymentMethodInput {
  number: string;
  expMonth: number;
  expYear: number;
  cvc: string;
  setAsPrimary: boolean;
}

export async function listPaymentMethods() {
  const headers = await userAuthorization();
  const res = await axios.get<{
    methods: PaymentMethod[];
    stripeEnabled: boolean;
  }>(`${API_BASE}/payment-methods`, {
    headers,
    withCredentials: true,
  });
  return res.data;
}

export async function createPaymentMethod(input: CreatePaymentMethodInput) {
  const headers = await userAuthorization();
  const res = await axios.post<{ method: PaymentMethod }>(
    `${API_BASE}/payment-methods`,
    input,
    {
      headers,
      withCredentials: true,
    },
  );
  return res.data.method;
}

export async function setPrimaryPaymentMethod(id: string) {
  const headers = await userAuthorization();
  await axios.post(
    `${API_BASE}/payment-methods/${id}/primary`,
    {},
    {
      headers,
      withCredentials: true,
    },
  );
}

export async function deletePaymentMethod(id: string) {
  const headers = await userAuthorization();
  await axios.delete(`${API_BASE}/payment-methods/${id}`, {
    headers,
    withCredentials: true,
  });
}

export async function createSubscription(input: CreateSubscriptionInput) {
  const headers = await userAuthorization();
  const res = await axios.post<{
    subscription: Subscription;
    invoice: Invoice | null;
    consent: Consent;
  }>(`${API_BASE}/subscriptions`, input, {
    headers,
    withCredentials: true,
  });
  return res.data;
}

export async function listSubscriptions() {
  const headers = await userAuthorization();
  const res = await axios.get<{ subscriptions: Subscription[] }>(
    `${API_BASE}/subscriptions`,
    {
      headers,
      withCredentials: true,
    },
  );
  return res.data.subscriptions;
}

export async function cancelSubscription(subscriptionId: string) {
  const headers = await userAuthorization();
  const res = await axios.patch<{ subscription: Subscription }>(
    `${API_BASE}/subscriptions/${subscriptionId}`,
    { action: "cancel" },
    {
      headers,
      withCredentials: true,
    },
  );
  return res.data.subscription;
}

export async function listInvoices() {
  const headers = await userAuthorization();
  const res = await axios.get<{ invoices: Invoice[] }>(`${API_BASE}/invoices`, {
    headers,
    withCredentials: true,
  });
  return res.data.invoices;
}

export async function downloadInvoice(invoiceId: string) {
  const headers = await userAuthorization();
  const res = await axios.get(`${API_BASE}/invoices/${invoiceId}/download`, {
    headers,
    responseType: "blob",
    withCredentials: true,
  });
  return res.data as Blob;
}

export async function listConsents() {
  const headers = await userAuthorization();
  const res = await axios.get<{ consents: Consent[] }>(`${API_BASE}/consents`, {
    headers,
    withCredentials: true,
  });
  return res.data.consents;
}

export async function requestRefund(invoiceId: string, reason: string) {
  const headers = await userAuthorization();
  const res = await axios.post<{ success: boolean; message: string }>(
    `${API_BASE}/refunds/request`,
    { invoiceId, reason },
    {
      headers,
      withCredentials: true,
    }
  );
  return res.data;
}
