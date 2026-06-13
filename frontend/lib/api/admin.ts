import { userAuthorization } from "@/hook/userAuthorization";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

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

export const getSellers = async ()=> {
  const headers = await userAuthorization();

  const response = await axios.get(
    `${API_BASE}/seller/getSeller`,
    {
      headers,
      withCredentials: true,
    }
  );

  return response.data;
};

export interface CancellationRequest {
  id: string;
  buyerId: string;
  productId: string;
  planId: string;
  recipientEmail: string;
  seats: number;
  status: string;
  canceledAt?: string | null;
  createdAt: string;
  buyer: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  product: {
    id: string;
    name: string;
    slug: string;
  };
  plan: {
    id: string;
    name: string;
    priceCents: number;
  };
}

export const getPendingCancellations = async (): Promise<CancellationRequest[]> => {
  const headers = await userAuthorization();
  const response = await axios.get<{ cancellations: CancellationRequest[] }>(
    `${API_BASE}/admin/cancellations/pending`,
    {
      headers,
      withCredentials: true,
    }
  );
  return response.data.cancellations;
};

export const decideCancellation = async (
  subscriptionId: string,
  decision: "APPROVE" | "REJECT"
): Promise<{ success: boolean; message: string }> => {
  const headers = await userAuthorization();
  const response = await axios.post<{ success: boolean; message: string }>(
    `${API_BASE}/admin/cancellations/${subscriptionId}/decision`,
    { decision },
    {
      headers,
      withCredentials: true,
    }
  );
  return response.data;
};

export interface RefundRequest {
  id: string;
  buyerId: string;
  subscriptionId: string;
  invoiceId: string;
  amountCents: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  createdAt: string;
  buyer: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  invoice: {
    id: string;
    number: string;
    amountCents: number;
    currency: string;
    description: string;
    product: {
      name: string;
    };
    plan: {
      name: string;
    };
  };
}

export const getPendingRefunds = async (): Promise<RefundRequest[]> => {
  const headers = await userAuthorization();
  const response = await axios.get<{ refunds: RefundRequest[] }>(
    `${API_BASE}/admin/refunds/pending`,
    {
      headers,
      withCredentials: true,
    }
  );
  return response.data.refunds;
};

export const decideRefund = async (
  refundId: string,
  decision: "APPROVE" | "REJECT",
  rejectionReason?: string
): Promise<{ success: boolean; message: string }> => {
  const headers = await userAuthorization();
  const response = await axios.post<{ success: boolean; message: string }>(
    `${API_BASE}/admin/refunds/${refundId}/decision`,
    { decision, rejectionReason },
    {
      headers,
      withCredentials: true,
    }
  );
  return response.data;
};

export interface PayoutRequestAdmin {
  id: string;
  sellerId: string;
  businessName: string;
  sellerName: string;
  sellerEmail: string;
  amountCents: number;
  status: "PENDING" | "APPROVED" | "COMPLETED" | "REJECTED" | "FAILED";
  payoutEmail: string;
  createdAt: string;
}

export interface GetPendingPayoutsResponse {
  success: boolean;
  payouts: PayoutRequestAdmin[];
}

export const getPendingPayouts = async (): Promise<PayoutRequestAdmin[]> => {
  const headers = await userAuthorization();
  const response = await axios.get<GetPendingPayoutsResponse>(
    `${API_BASE}/admin/payouts/pending`,
    { headers, withCredentials: true }
  );
  return response.data.payouts;
};

export const decidePayout = async (
  payoutId: string,
  decision: "APPROVE" | "REJECT",
  rejectionReason?: string
): Promise<{ success: boolean; message: string }> => {
  const headers = await userAuthorization();
  const response = await axios.post<{ success: boolean; message: string }>(
    `${API_BASE}/admin/payouts/${payoutId}/decision`,
    { decision, rejectionReason },
    { headers, withCredentials: true }
  );
  return response.data;
};

export interface UserAdmin {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  roles: ("BUYER" | "SELLER" | "ADMIN")[];
  isVerified: boolean;
  createdAt: string;
}

export interface GetUsersResponse {
  success: boolean;
  users: UserAdmin[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const getUsers = async (page = 1, limit = 10, search = "", role = ""): Promise<GetUsersResponse> => {
  const headers = await userAuthorization();
  const response = await axios.get<GetUsersResponse>(
    `${API_BASE}/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&role=${encodeURIComponent(role)}`,
    { headers, withCredentials: true }
  );
  return response.data;
};

export const updateUserRole = async (userId: string, roles: string[]): Promise<{ success: boolean; message: string }> => {
  const headers = await userAuthorization();
  const response = await axios.patch<{ success: boolean; message: string }>(
    `${API_BASE}/admin/users/${userId}/role`,
    { roles },
    { headers, withCredentials: true }
  );
  return response.data;
};

export const deleteUserGDPR = async (userId: string): Promise<{ success: boolean; message: string }> => {
  const headers = await userAuthorization();
  const response = await axios.delete<{ success: boolean; message: string }>(
    `${API_BASE}/admin/users/${userId}`,
    { headers, withCredentials: true }
  );
  return response.data;
};
