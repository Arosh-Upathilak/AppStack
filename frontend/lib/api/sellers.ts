import axios from "axios";
import { withMockFallback } from "./demo";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface PendingSeller {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  businessName?: string | null;
  appliedAt?: string | null;
}

/**
 * In-memory mock queue used only when the backend admin endpoints aren't
 * reachable. Approve/reject mutate this so the demo behaves believably.
 */
let mockPending: PendingSeller[] = [
  {
    id: "mock-1",
    firstName: "Nadia",
    lastName: "Fernando",
    email: "nadia@brightapps.io",
    businessName: "BrightApps",
    appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "mock-2",
    firstName: "Tom",
    lastName: "Перейра",
    email: "tom@ledgerly.co",
    businessName: "Ledgerly",
    appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    id: "mock-3",
    firstName: "Wei",
    lastName: "Zhang",
    email: "wei@pulsemetrics.dev",
    businessName: "PulseMetrics",
    appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
  },
];

export async function listPendingSellers() {
  return withMockFallback(
    async () => {
      const res = await axios.get(`${API_BASE}/admin/sellers/pending`, {
        withCredentials: true,
      });
      return (res.data?.items ?? []) as PendingSeller[];
    },
    () => [...mockPending],
    "GET /admin/sellers/pending",
  );
}

export interface SellerApplicationInput {
  businessName: string;
  payoutEmail: string;
  webhookUrl: string;
  description: string;
}

export async function submitSellerApplication(input: SellerApplicationInput) {
  return withMockFallback(
    async () => {
      await axios.post(`${API_BASE}/auth/become-seller`, input, {
        withCredentials: true,
      });
    },
    () => {
      // Demo: pretend the application was queued for admin review.
    },
    "POST /auth/become-seller",
  );
}

export async function approveSeller(id: string) {
  return withMockFallback(
    async () => {
      await axios.post(
        `${API_BASE}/admin/sellers/${id}/approve`,
        {},
        { withCredentials: true },
      );
    },
    () => {
      mockPending = mockPending.filter((s) => s.id !== id);
    },
    `POST /admin/sellers/${id}/approve`,
  );
}

export async function rejectSeller(id: string, reason: string | null) {
  return withMockFallback(
    async () => {
      await axios.post(
        `${API_BASE}/admin/sellers/${id}/reject`,
        { reason },
        { withCredentials: true },
      );
    },
    () => {
      mockPending = mockPending.filter((s) => s.id !== id);
    },
    `POST /admin/sellers/${id}/reject`,
  );
}
