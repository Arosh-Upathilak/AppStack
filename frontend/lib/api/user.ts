import axios from "axios";
import { userAuthorization } from "@/hook/userAuthorization";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface MeUser {
  id: string;
  email: string;
  role: string[];
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  sellerStatus?: string | null;
}

interface MeResponse {
  success: boolean;
  message: string;
  user: MeUser;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export const getMe = async (): Promise<MeUser> => {
  const headers = await userAuthorization();

  const response = await axios.get<MeResponse>(`${API_BASE}/auth/me`, {
    headers,
    withCredentials: true,
  });

  return response.data.user;
};

export const updateProfile = async (
  input: UpdateProfileInput,
): Promise<MeUser> => {
  const headers = await userAuthorization();

  const response = await axios.put<MeResponse>(
    `${API_BASE}/auth/me`,
    input,
    {
      headers,
      withCredentials: true,
    },
  );

  return response.data.user;
};
