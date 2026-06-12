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
