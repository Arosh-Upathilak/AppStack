import axios from "axios";
import { PRODUCTS, CATEGORIES } from "@/data/mock";
import { delay } from "./client";
import { withMockFallback } from "./demo";
import { userAuthorization } from "@/hook/userAuthorization";
import type { BillingInterval, Product, ProductPlan, Review, WebhookEvent } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface ProductPlanInput {
  identifier?: string;
  name: string;
  features: string[];
  priceCents: number;
  currency?: string;
  billingInterval?: BillingInterval;
  isActive?: boolean;
}

export interface ProductInput {
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  similarTo?: string[];
  hue?: string;
  webhookUrl?: string;
  webhookTested?: boolean;
  plans: ProductPlanInput[];
}

function mockProductFromLegacy(product: (typeof PRODUCTS)[number]): Product {
  const plans: ProductPlan[] = [
    {
      id: `${product.id}-professional`,
      productId: product.id,
      identifier: "professional",
      name: "Professional",
      features: ["Core features", "API access", "Priority support"],
      priceCents: product.from * 100,
      currency: "USD",
      billingInterval: "MONTHLY",
      isActive: true,
    },
  ];

  return {
    id: product.id,
    slug: product.id,
    sellerId: "mock-seller",
    name: product.name,
    vendor: product.vendor,
    shortDescription: product.tagline,
    description: product.tagline,
    category: product.category,
    similarTo: [],
    hue: product.hue,
    status: "APPROVED",
    webhookTested: true,
    rating: product.rating,
    reviewsCount: product.reviews,
    fromCents: product.from * 100,
    currency: "USD",
    plans,
  };
}

const MOCK_REVIEWS: Review[] = [
  {
    id: "r1",
    productId: "cloudsync-pro",
    authorName: "Sarah Jenkins",
    authorRole: "VP of Sales - TechCorp",
    rating: 5,
    body: "Transformed our sales pipeline visibility. The unified dashboard gives our exec team exactly what they need.",
    createdAt: "2024-10-01",
  },
  {
    id: "r2",
    productId: "cloudsync-pro",
    authorName: "Marcus Rivera",
    authorRole: "CTO - LogisticsPro",
    rating: 5,
    body: "Migration was smoother than expected and the integration model was easy to validate.",
    createdAt: "2024-09-15",
  },
];

interface ListProductsParams {
  category?: string;
  query?: string;
}

export async function listProducts(params?: ListProductsParams): Promise<Product[]> {
  const response = await withMockFallback(
    async () => {
      const res = await axios.get<{ products: Product[] }>(`${API_BASE}/products`, {
        params,
      });
      return res.data.products;
    },
    async () => {
      let items = PRODUCTS.map(mockProductFromLegacy);
      if (params?.category && params.category !== "All") {
        items = items.filter((product) => product.category === params.category);
      }
      if (params?.query) {
        const q = params.query.toLowerCase();
        items = items.filter(
          (product) =>
            product.name.toLowerCase().includes(q) ||
            product.vendor.toLowerCase().includes(q),
        );
      }
      return delay(items);
    },
    "GET /products",
  );
  return response.data;
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const response = await withMockFallback(
    async () => {
      const res = await axios.get<{ product: Product }>(`${API_BASE}/products/${id}`);
      return res.data.product;
    },
    async () => delay(PRODUCTS.map(mockProductFromLegacy).find((p) => p.id === id || p.slug === id)),
    `GET /products/${id}`,
  );
  return response.data;
}

export async function listCategories(): Promise<string[]> {
  const products = await listProducts();
  const categories = Array.from(
    new Set([...CATEGORIES.filter((category) => category !== "All"), ...products.map((p) => p.category)]),
  );
  return ["All", ...categories];
}

export async function listReviews(productId: string): Promise<Review[]> {
  const response = await withMockFallback(
    async () => {
      const res = await axios.get<{ reviews: Review[] }>(
        `${API_BASE}/products/${productId}/reviews`,
      );
      return res.data.reviews;
    },
    async () => delay(MOCK_REVIEWS.filter((review) => review.productId === productId)),
    `GET /products/${productId}/reviews`,
  );
  return response.data;
}

export async function listSellerProducts(): Promise<Product[]> {
  const headers = await userAuthorization();
  const res = await axios.get<{ products: Product[] }>(`${API_BASE}/seller/products`, {
    headers,
    withCredentials: true,
  });
  return res.data.products;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const headers = await userAuthorization();
  const res = await axios.post<{ product: Product }>(`${API_BASE}/seller/products`, input, {
    headers,
    withCredentials: true,
  });
  return res.data.product;
}

export async function submitProduct(productId: string): Promise<Product> {
  const headers = await userAuthorization();
  const res = await axios.post<{ product: Product }>(
    `${API_BASE}/seller/products/${productId}/submit`,
    {},
    {
      headers,
      withCredentials: true,
    },
  );
  return res.data.product;
}

export async function listPendingProducts(): Promise<Product[]> {
  const headers = await userAuthorization();
  const res = await axios.get<{ products: Product[] }>(
    `${API_BASE}/admin/products/pending`,
    {
      headers,
      withCredentials: true,
    },
  );
  return res.data.products;
}

export async function decideProduct(
  productId: string,
  decision: "APPROVED" | "REJECTED",
  rejectionReason?: string,
): Promise<Product> {
  const headers = await userAuthorization();
  const res = await axios.post<{ product: Product }>(
    `${API_BASE}/admin/products/${productId}/decision`,
    { decision, rejectionReason },
    {
      headers,
      withCredentials: true,
    },
  );
  return res.data.product;
}

export async function listProductWebhookEvents(productId: string): Promise<WebhookEvent[]> {
  const headers = await userAuthorization();
  const res = await axios.get<{ events: WebhookEvent[] }>(
    `${API_BASE}/webhooks/products/${productId}`,
    {
      headers,
      withCredentials: true,
    }
  );
  return res.data.events;
}

export async function retryWebhookEvent(eventId: string): Promise<WebhookEvent> {
  const headers = await userAuthorization();
  const res = await axios.post<{ event: WebhookEvent }>(
    `${API_BASE}/webhooks/${eventId}/retry`,
    {},
    {
      headers,
      withCredentials: true,
    }
  );
  return res.data.event;
}

export async function checkReviewEligibility(productId: string): Promise<boolean> {
  const headers = await userAuthorization();
  try {
    const res = await axios.get<{ eligible: boolean }>(
      `${API_BASE}/products/${productId}/review-eligibility`,
      {
        headers,
        withCredentials: true,
      }
    );
    return res.data.eligible;
  } catch {
    return false;
  }
}

export async function submitProductReview(
  productId: string,
  input: { rating: number; body: string }
): Promise<{ success: boolean; message: string; review: Review }> {
  const headers = await userAuthorization();
  const res = await axios.post<{ success: boolean; message: string; review: Review }>(
    `${API_BASE}/products/${productId}/reviews`,
    input,
    {
      headers,
      withCredentials: true,
    }
  );
  return res.data;
}
