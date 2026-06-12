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
