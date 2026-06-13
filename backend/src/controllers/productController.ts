import { Request, Response } from "express";
import { BillingInterval, ProductStatus } from "@prisma/client";
import { AppError, asyncHandler } from "../utils/errorHandler";
import prisma from "../utils/prisma";
import { sendNotification } from "../socket/socketConnect";

type PlanInput = {
  identifier?: string;
  name?: string;
  features?: string[];
  priceCents?: number;
  currency?: string;
  billingInterval?: BillingInterval;
  isActive?: boolean;
};

type ProductInput = {
  name?: string;
  shortDescription?: string;
  description?: string;
  category?: string;
  similarTo?: string[];
  hue?: string;
  webhookUrl?: string;
  webhookTested?: boolean;
  plans?: PlanInput[];
};

const productInclude = {
  seller: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  plans: {
    orderBy: {
      priceCents: "asc" as const,
    },
  },
  reviews: {
    orderBy: {
      createdAt: "desc" as const,
    },
    take: 6,
  },
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function uniqueSlug(name: string, productId?: string) {
  const base = slugify(name) || "product";
  let slug = base;
  let suffix = 2;

  while (true) {
    const exists = await prisma.product.findUnique({ where: { slug } });
    if (!exists || exists.id === productId) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

function averageRating(reviews: { rating: number }[]) {
  if (!reviews.length) return 0;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / reviews.length) * 10) / 10;
}

function sellerDisplayName(seller: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  const fullName = [seller.firstName, seller.lastName].filter(Boolean).join(" ");
  return fullName || seller.email;
}

function serializeProduct(product: any) {
  const plans = product.plans ?? [];
  const reviews = product.reviews ?? [];
  const minPlan = plans.find((plan: any) => plan.isActive) ?? plans[0];

  return {
    id: product.id,
    slug: product.slug,
    sellerId: product.sellerId,
    name: product.name,
    vendor: product.seller ? sellerDisplayName(product.seller) : "AppStack Seller",
    shortDescription: product.shortDescription,
    description: product.description,
    category: product.category,
    similarTo: product.similarTo ?? [],
    hue: product.hue,
    status: product.status,
    webhookUrl: product.webhookUrl,
    webhookTested: product.webhookTested,
    rejectionReason: product.rejectionReason,
    submittedAt: product.submittedAt,
    publishedAt: product.publishedAt,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    rating: averageRating(reviews),
    reviewsCount: reviews.length,
    fromCents: minPlan?.priceCents ?? 0,
    currency: minPlan?.currency ?? "USD",
    plans: plans.map((plan: any) => ({
      id: plan.id,
      productId: plan.productId,
      identifier: plan.identifier,
      name: plan.name,
      features: plan.features ?? [],
      priceCents: plan.priceCents,
      currency: plan.currency,
      billingInterval: plan.billingInterval,
      isActive: plan.isActive,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    })),
  };
}

function normalizePlans(plans: PlanInput[] | undefined) {
  const inputPlans = plans && plans.length > 0 ? plans : [];

  return inputPlans.map((plan, index) => {
    const name = plan.name?.trim();
    if (!name) {
      throw new AppError("Each plan requires a name", 400);
    }

    const priceCents = Number(plan.priceCents);
    if (!Number.isInteger(priceCents) || priceCents < 0) {
      throw new AppError("Each plan requires a valid priceCents value", 400);
    }

    const identifier = plan.identifier?.trim() || slugify(name) || `plan-${index + 1}`;

    return {
      identifier,
      name,
      features: Array.isArray(plan.features)
        ? plan.features.map((feature) => String(feature).trim()).filter(Boolean)
        : [],
      priceCents,
      currency: plan.currency?.trim().toUpperCase() || "USD",
      billingInterval: plan.billingInterval ?? "MONTHLY",
      isActive: plan.isActive ?? true,
    };
  });
}

async function requireApprovedSeller(userId: string) {
  const seller = await prisma.seller.findFirst({
    where: {
      userId,
      isApproveSeller: "APPROVED",
    },
  });

  if (!seller) {
    throw new AppError("Approved seller account required", 403);
  }

  return seller;
}

async function notifyAdmins(title: string, message: string) {
  const admins = await prisma.user.findMany({
    where: {
      roles: {
        has: "ADMIN",
      },
    },
  });

  for (const admin of admins) {
    const notification = await prisma.notification.create({
      data: {
        userId: admin.id,
        title,
        message,
        type: "SYSTEM_ALERT",
        priority: "NORMAL",
      },
    });
    sendNotification(admin.id, notification);
  }
}

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = typeof req.query.query === "string" ? req.query.query : "";
  const category = typeof req.query.category === "string" ? req.query.category : "";

  const products = await prisma.product.findMany({
    where: {
      status: "APPROVED",
      ...(category && category !== "All" ? { category } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { shortDescription: { contains: query, mode: "insensitive" } },
              { category: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: productInclude,
    orderBy: {
      publishedAt: "desc",
    },
  });

  return res.status(200).json({
    success: true,
    products: products.map(serializeProduct),
  });
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const productId = String(req.params.productId);

  const product = await prisma.product.findFirst({
    where: {
      status: "APPROVED",
      OR: [{ id: productId }, { slug: productId }],
    },
    include: productInclude,
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return res.status(200).json({
    success: true,
    product: serializeProduct(product),
  });
});

export const listProductReviews = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = String(req.params.productId);

    const product = await prisma.product.findFirst({
      where: {
        status: "APPROVED",
        OR: [{ id: productId }, { slug: productId }],
      },
      select: { id: true },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const reviews = await prisma.review.findMany({
      where: {
        productId: product.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      reviews,
    });
  },
);

export const listSellerProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    await requireApprovedSeller(userId);

    const products = await prisma.product.findMany({
      where: {
        sellerId: userId,
      },
      include: productInclude,
      orderBy: {
        updatedAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      products: products.map(serializeProduct),
    });
  },
);

export const createSellerProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    await requireApprovedSeller(userId);

    const input = req.body as ProductInput;
    if (!input.name || !input.shortDescription || !input.description || !input.category) {
      throw new AppError(
        "name, shortDescription, description and category are required",
        400,
      );
    }

    const plans = normalizePlans(input.plans);
    if (plans.length === 0) {
      throw new AppError("At least one plan is required", 400);
    }

    const slug = await uniqueSlug(input.name);

    const product = await prisma.product.create({
      data: {
        sellerId: userId,
        name: input.name.trim(),
        slug,
        shortDescription: input.shortDescription.trim(),
        description: input.description.trim(),
        category: input.category.trim(),
        similarTo: input.similarTo ?? [],
        hue: input.hue ?? "#003d9b",
        webhookUrl: input.webhookUrl?.trim() || null,
        webhookTested: input.webhookTested ?? false,
        plans: {
          create: plans,
        },
      },
      include: productInclude,
    });

    return res.status(201).json({
      success: true,
      message: "Product draft created",
      product: serializeProduct(product),
    });
  },
);

export const updateSellerProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const productId = String(req.params.productId);
    await requireApprovedSeller(userId);

    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId: userId,
      },
      include: {
        plans: true,
      },
    });

    if (!existingProduct) {
      throw new AppError("Product not found", 404);
    }

    if (existingProduct.status === "APPROVED") {
      throw new AppError("Approved products cannot be edited in this phase", 400);
    }

    const input = req.body as ProductInput;
    const nextName = input.name?.trim() || existingProduct.name;
    const plans = input.plans ? normalizePlans(input.plans) : null;

    const product = await prisma.$transaction(async (tx) => {
      if (plans) {
        await tx.productPlan.deleteMany({
          where: {
            productId: existingProduct.id,
          },
        });
      }

      return tx.product.update({
        where: {
          id: existingProduct.id,
        },
        data: {
          name: nextName,
          slug: await uniqueSlug(nextName, existingProduct.id),
          shortDescription:
            input.shortDescription?.trim() || existingProduct.shortDescription,
          description: input.description?.trim() || existingProduct.description,
          category: input.category?.trim() || existingProduct.category,
          similarTo: input.similarTo ?? existingProduct.similarTo,
          hue: input.hue ?? existingProduct.hue,
          webhookUrl:
            input.webhookUrl === undefined
              ? existingProduct.webhookUrl
              : input.webhookUrl.trim() || null,
          webhookTested: input.webhookTested ?? existingProduct.webhookTested,
          status: ProductStatus.DRAFT,
          rejectionReason: null,
          submittedAt: null,
          ...(plans ? { plans: { create: plans } } : {}),
        },
        include: productInclude,
      });
    });

    return res.status(200).json({
      success: true,
      message: "Product draft updated",
      product: serializeProduct(product),
    });
  },
);

export const submitSellerProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const productId = String(req.params.productId);
    await requireApprovedSeller(userId);

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId: userId,
      },
      include: {
        plans: true,
      },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    if ((product as any).plans.filter((plan: any) => plan.isActive).length === 0) {
      throw new AppError("At least one active plan is required", 400);
    }

    const updatedProduct = await prisma.product.update({
      where: {
        id: product.id,
      },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        rejectionReason: null,
      },
      include: productInclude,
    });

    await notifyAdmins(
      "Product Pending Approval",
      `${product.name} was submitted for marketplace approval.`,
    );

    return res.status(200).json({
      success: true,
      message: "Product submitted for admin approval",
      product: serializeProduct(updatedProduct),
    });
  },
);

export const listPendingProducts = asyncHandler(
  async (_req: Request, res: Response) => {
    const products = await prisma.product.findMany({
      where: {
        status: "SUBMITTED",
      },
      include: productInclude,
      orderBy: {
        submittedAt: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      products: products.map(serializeProduct),
    });
  },
);

export const decideProduct = asyncHandler(async (req: Request, res: Response) => {
  const adminId = (req as any).user.id;
  const productId = String(req.params.productId);
  const { decision, rejectionReason } = req.body as {
    decision?: "APPROVED" | "REJECTED";
    rejectionReason?: string;
  };

  if (decision !== "APPROVED" && decision !== "REJECTED") {
    throw new AppError("decision must be APPROVED or REJECTED", 400);
  }

  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const updatedProduct = await prisma.product.update({
    where: {
      id: product.id,
    },
    data: {
      status: decision,
      reviewedAt: new Date(),
      reviewedById: adminId,
      publishedAt: decision === "APPROVED" ? new Date() : null,
      rejectionReason:
        decision === "REJECTED"
          ? rejectionReason?.trim() || "Product did not meet marketplace requirements."
          : null,
    },
    include: productInclude,
  });

  const notification = await prisma.notification.create({
    data: {
      userId: product.sellerId,
      title:
        decision === "APPROVED"
          ? "Product Approved"
          : "Product Rejected",
      message:
        decision === "APPROVED"
          ? `${product.name} is now listed in the AppStack marketplace.`
          : `${product.name} was rejected. ${updatedProduct.rejectionReason}`,
      type: "SYSTEM_ALERT",
      priority: "NORMAL",
    },
  });

  sendNotification(product.sellerId, notification);

  return res.status(200).json({
    success: true,
    message: `Product ${decision.toLowerCase()}`,
    product: serializeProduct(updatedProduct),
  });
});

export const checkReviewEligibility = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = String(req.params.productId);
    const userId = (req as any).user.id;

    const product = await prisma.product.findFirst({
      where: {
        status: "APPROVED",
        OR: [{ id: productId }, { slug: productId }],
      },
      select: { id: true },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const purchase = await prisma.subscription.findFirst({
      where: {
        buyerId: userId,
        productId: product.id,
        status: { in: ["ACTIVE", "CANCEL_PENDING", "CANCELED"] },
      },
    });

    return res.status(200).json({
      success: true,
      eligible: !!purchase,
    });
  }
);

export const createProductReview = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = String(req.params.productId);
    const userId = (req as any).user.id;
    const { rating, body } = req.body as { rating: number; body: string };

    if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new AppError("A rating between 1 and 5 is required", 400);
    }

    if (!body || !body.trim()) {
      throw new AppError("Review body text is required", 400);
    }

    const product = await prisma.product.findFirst({
      where: {
        status: "APPROVED",
        OR: [{ id: productId }, { slug: productId }],
      },
      select: { id: true, name: true },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    // Check purchaser eligibility
    const purchase = await prisma.subscription.findFirst({
      where: {
        buyerId: userId,
        productId: product.id,
        status: { in: ["ACTIVE", "CANCEL_PENDING", "CANCELED"] },
      },
    });

    if (!purchase) {
      throw new AppError("You must be a verified purchaser of this product to leave a review.", 403);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const authorName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
    const authorRole = user.roles.includes("ADMIN") ? "Admin" : user.roles.includes("SELLER") ? "Seller" : "Verified Buyer";

    const review = await prisma.review.create({
      data: {
        productId: product.id,
        userId: user.id,
        authorName,
        authorRole,
        rating,
        body: body.trim(),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review,
    });
  }
);
