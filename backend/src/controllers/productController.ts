import { Request, Response } from "express";
import { BillingInterval, Prisma, ProductStatus } from "@prisma/client";
import { AppError, asyncHandler } from "../utils/errorHandler";
import prisma from "../utils/prisma";
import { sendNotification } from "../socket/socketConnect";
import { sendWebhookEvent } from "../services/webhookWorker";
import { formatMoney, sendTransactionEmail } from "../utils/emailNotifications";

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

function isLocalhostWebhookUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function sellerDisplayName(seller: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  const fullName = [seller.firstName, seller.lastName].filter(Boolean).join(" ");
  return fullName || seller.email;
}

function serializeProduct(product: any, options: { includeWebhookSecret?: boolean } = {}): any {
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
    webhookSecret: options.includeWebhookSecret ? product.webhookSecret : undefined,
    webhookTested: product.webhookTested,
    rejectionReason: product.rejectionReason,
    submittedAt: product.submittedAt,
    publishedAt: product.publishedAt,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    pendingChangeRequest: product.changeRequests?.[0]
      ? serializeProductChangeRequest(product.changeRequests[0], { includeProduct: false })
      : undefined,
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

function serializeProductChangeRequest(
  request: any,
  options: { includeProduct?: boolean } = {},
): any {
  return {
    id: request.id,
    productId: request.productId,
    sellerId: request.sellerId,
    type: request.type,
    status: request.status,
    payload: request.payload,
    rejectionReason: request.rejectionReason,
    submittedAt: request.submittedAt,
    reviewedAt: request.reviewedAt,
    reviewedById: request.reviewedById,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    product:
      options.includeProduct && request.product
        ? serializeProduct(request.product, { includeWebhookSecret: true })
        : undefined,
    seller: request.seller
      ? {
          id: request.seller.id,
          email: request.seller.email,
          firstName: request.seller.firstName,
          lastName: request.seller.lastName,
        }
      : undefined,
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

function productPayloadFromInput(input: ProductInput, existingProduct: any) {
  const nextName = input.name?.trim() || existingProduct.name;
  const plans = input.plans
    ? normalizePlans(input.plans)
    : existingProduct.plans.map((plan: any) => ({
        identifier: plan.identifier,
        name: plan.name,
        features: plan.features ?? [],
        priceCents: plan.priceCents,
        currency: plan.currency,
        billingInterval: plan.billingInterval,
        isActive: plan.isActive,
      }));

  if (plans.length === 0) {
    throw new AppError("At least one plan is required", 400);
  }

  return {
    name: nextName,
    shortDescription: input.shortDescription?.trim() || existingProduct.shortDescription,
    description: input.description?.trim() || existingProduct.description,
    category: input.category?.trim() || existingProduct.category,
    similarTo: input.similarTo ?? existingProduct.similarTo,
    hue: input.hue ?? existingProduct.hue,
    webhookUrl:
      input.webhookUrl === undefined
        ? existingProduct.webhookUrl
        : input.webhookUrl.trim() || null,
    webhookTested: input.webhookTested ?? existingProduct.webhookTested,
    plans,
  };
}

async function applyApprovedProductUpdate(tx: any, product: any, payload: any, adminId: string) {
  const plans = normalizePlans(payload.plans);
  const incomingIdentifiers = plans.map((plan) => plan.identifier);
  const existingPlans = await tx.productPlan.findMany({
    where: { productId: product.id },
  });

  await tx.productPlan.updateMany({
    where: {
      productId: product.id,
      identifier: { notIn: incomingIdentifiers },
    },
    data: { isActive: false },
  });

  for (const plan of plans) {
    const existing = existingPlans.find((candidate: any) => candidate.identifier === plan.identifier);
    if (existing) {
      await tx.productPlan.update({
        where: { id: existing.id },
        data: plan,
      });
    } else {
      await tx.productPlan.create({
        data: {
          ...plan,
          productId: product.id,
        },
      });
    }
  }

  return tx.product.update({
    where: { id: product.id },
    data: {
      name: payload.name,
      slug: await uniqueSlug(payload.name, product.id),
      shortDescription: payload.shortDescription,
      description: payload.description,
      category: payload.category,
      similarTo: payload.similarTo ?? [],
      hue: payload.hue ?? product.hue,
      webhookUrl: payload.webhookUrl,
      webhookTested: payload.webhookTested ?? product.webhookTested,
      status: "APPROVED",
      rejectionReason: null,
      reviewedAt: new Date(),
      reviewedById: adminId,
    },
    include: productInclude,
  });
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
    products: products.map((product) => serializeProduct(product)),
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
      include: {
        ...productInclude,
        changeRequests: {
          where: { status: "PENDING" },
          orderBy: { submittedAt: "desc" },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      products: products.map((product) => serializeProduct(product, { includeWebhookSecret: true })),
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
      product: serializeProduct(product, { includeWebhookSecret: true }),
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
      product: serializeProduct(product, { includeWebhookSecret: true }),
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

    if (!product.webhookUrl) {
      throw new AppError("A webhook URL is required before product submission", 400);
    }

    if (
      process.env.NODE_ENV !== "development" &&
      isLocalhostWebhookUrl(product.webhookUrl)
    ) {
      throw new AppError("Localhost webhook URLs are allowed only in development", 400);
    }

    if (!product.webhookTested) {
      throw new AppError("Send a successful webhook test before product submission", 400);
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
      product: serializeProduct(updatedProduct, { includeWebhookSecret: true }),
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
      products: products.map((product) => serializeProduct(product, { includeWebhookSecret: true })),
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
    product: serializeProduct(updatedProduct, { includeWebhookSecret: true }),
  });
});

export const createProductChangeRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const productId = String(req.params.productId);
    const { type, product: productInput } = req.body as {
      type?: "UPDATE" | "DELETE";
      product?: ProductInput;
    };

    await requireApprovedSeller(userId);

    if (type !== "UPDATE" && type !== "DELETE") {
      throw new AppError("type must be UPDATE or DELETE", 400);
    }

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

    if (existingProduct.status !== "APPROVED") {
      throw new AppError("Only approved products can request approved changes or deletion", 400);
    }

    const existingPending = await prisma.productChangeRequest.findFirst({
      where: {
        productId: existingProduct.id,
        status: "PENDING",
      },
    });

    if (existingPending) {
      throw new AppError("This product already has a pending change request", 400);
    }

    const payload = type === "UPDATE"
      ? productPayloadFromInput(productInput ?? {}, existingProduct)
      : null;

    const changeRequest = await prisma.$transaction(async (tx) => {
      const request = await tx.productChangeRequest.create({
        data: {
          productId: existingProduct.id,
          sellerId: userId,
          type,
          payload: payload ?? Prisma.JsonNull,
        },
        include: {
          product: { include: productInclude },
          seller: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (type === "DELETE") {
        await tx.product.update({
          where: { id: existingProduct.id },
          data: { status: "PENDING_DELETION" },
        });
      }

      return request;
    });

    await notifyAdmins(
      type === "DELETE" ? "Product Deletion Pending" : "Product Change Pending",
      `${existingProduct.name} has a pending ${type.toLowerCase()} request.`,
    );

    return res.status(201).json({
      success: true,
      message: `${type === "DELETE" ? "Deletion" : "Change"} request submitted for admin approval`,
      changeRequest: serializeProductChangeRequest(changeRequest, { includeProduct: true }),
    });
  },
);

export const listPendingProductChangeRequests = asyncHandler(
  async (_req: Request, res: Response) => {
    const requests = await prisma.productChangeRequest.findMany({
      where: { status: "PENDING" },
      include: {
        product: { include: productInclude },
        seller: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { submittedAt: "asc" },
    });

    return res.status(200).json({
      success: true,
      changeRequests: requests.map((request) =>
        serializeProductChangeRequest(request, { includeProduct: true }),
      ),
    });
  },
);

export const decideProductChangeRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = (req as any).user.id;
    const changeRequestId = String(req.params.changeRequestId);
    const { decision, rejectionReason } = req.body as {
      decision?: "APPROVE" | "REJECT";
      rejectionReason?: string;
    };

    if (decision !== "APPROVE" && decision !== "REJECT") {
      throw new AppError("decision must be APPROVE or REJECT", 400);
    }

    const request = await prisma.productChangeRequest.findUnique({
      where: { id: changeRequestId },
      include: {
        product: {
          include: {
            ...productInclude,
            subscriptions: {
              where: {
                status: { in: ["PENDING", "ACTIVE", "CHANGE_PENDING", "CANCEL_PENDING", "PAST_DUE"] },
              },
              include: {
                buyer: true,
                plan: true,
                invoices: {
                  where: { status: "PAID" },
                  orderBy: { issuedAt: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
        seller: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!request) {
      throw new AppError("Product change request not found", 404);
    }

    if (request.status !== "PENDING") {
      throw new AppError("Product change request has already been decided", 400);
    }

    if (decision === "REJECT") {
      const updated = await prisma.$transaction(async (tx) => {
        const rejected = await tx.productChangeRequest.update({
          where: { id: request.id },
          data: {
            status: "REJECTED",
            rejectionReason: rejectionReason?.trim() || "Change request did not meet marketplace requirements.",
            reviewedAt: new Date(),
            reviewedById: adminId,
          },
          include: {
            product: { include: productInclude },
            seller: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        if (request.type === "DELETE") {
          await tx.product.update({
            where: { id: request.productId },
            data: { status: "APPROVED" },
          });
        }

        return rejected;
      });

      const notification = await prisma.notification.create({
        data: {
          userId: request.sellerId,
          title: request.type === "DELETE" ? "Product Deletion Rejected" : "Product Change Rejected",
          message: `${request.product.name} change request was rejected. ${updated.rejectionReason}`,
          type: "SYSTEM_ALERT",
          priority: "NORMAL",
        },
      });
      sendNotification(request.sellerId, notification);

      return res.status(200).json({
        success: true,
        message: "Product change request rejected",
        changeRequest: serializeProductChangeRequest(updated, { includeProduct: true }),
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.productChangeRequest.update({
        where: { id: request.id },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          reviewedById: adminId,
        },
      });

      if (request.type === "UPDATE") {
        const product = await applyApprovedProductUpdate(tx, request.product, request.payload, adminId);
        return { request: updatedRequest, product, canceledSubscriptions: [] as any[] };
      }

      const canceledSubscriptions = [];
      for (const subscription of request.product.subscriptions) {
        const invoice = subscription.invoices[0];

        await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            status: "CANCELED",
            canceledAt: new Date(),
            integrationStatusMessage: "Product was unlisted by marketplace administrators.",
          },
        });

        if (invoice) {
          const existingRefund = await tx.refundRequest.findFirst({
            where: { invoiceId: invoice.id },
          });

          if (!existingRefund) {
            await tx.refundRequest.create({
              data: {
                buyerId: subscription.buyerId,
                subscriptionId: subscription.id,
                invoiceId: invoice.id,
                amountCents: invoice.amountCents,
                reason: "Automatic refund after product deletion.",
                status: "APPROVED",
              },
            });
          }

          await tx.invoice.update({
            where: { id: invoice.id },
            data: { status: "REFUNDED" },
          });

          await tx.transaction.create({
            data: {
              sellerId: request.product.sellerId,
              amountCents: -invoice.amountCents,
              type: "REFUND",
              status: "AVAILABLE",
              description: `Product deletion refund: ${request.product.name} - ${invoice.number}`,
              invoiceId: invoice.id,
            },
          });
        }

        canceledSubscriptions.push({ ...subscription, invoice });
      }

      const product = await tx.product.update({
        where: { id: request.productId },
        data: {
          status: "UNLISTED",
          reviewedAt: new Date(),
          reviewedById: adminId,
        },
        include: productInclude,
      });

      return { request: updatedRequest, product, canceledSubscriptions };
    });

    const sellerNotification = await prisma.notification.create({
      data: {
        userId: request.sellerId,
        title: request.type === "DELETE" ? "Product Deletion Approved" : "Product Change Approved",
        message:
          request.type === "DELETE"
            ? `${request.product.name} was unlisted and active current-period subscriptions were canceled.`
            : `${request.product.name} changes are now live in the marketplace.`,
        type: "SYSTEM_ALERT",
        priority: "NORMAL",
      },
    });
    sendNotification(request.sellerId, sellerNotification);

    for (const subscription of result.canceledSubscriptions) {
      const buyerNotification = await prisma.notification.create({
        data: {
          userId: subscription.buyerId,
          title: "Subscription Canceled",
          message: `${request.product.name} was unlisted. Your subscription has been canceled${subscription.invoice ? " and refunded." : "."}`,
          type: "ORDER_UPDATE",
          priority: "HIGH",
        },
      });
      sendNotification(subscription.buyerId, buyerNotification);

      await sendTransactionEmail({
        to: subscription.buyer.email,
        subject: `${request.product.name} subscription canceled`,
        title: "Subscription canceled after product removal",
        message: `${request.product.name} was unlisted from AppStack. Your subscription has been canceled${subscription.invoice ? " and the current paid invoice has been refunded." : "."}`,
        details: {
          Product: request.product.name,
          Plan: subscription.plan.name,
          Refund: subscription.invoice
            ? formatMoney(subscription.invoice.amountCents, subscription.invoice.currency)
            : "No paid invoice found",
        },
      });

      await sendWebhookEvent(request.productId, "subscription.canceled", {
        subscriptionId: subscription.id,
        buyerEmail: subscription.recipientEmail,
        planIdentifier: subscription.plan.identifier,
        reason: "product_unlisted",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product change request approved",
      product: serializeProduct(result.product, { includeWebhookSecret: true }),
    });
  },
);

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

    const existingReview = await prisma.review.findUnique({
      where: {
        productId_userId: {
          productId: product.id,
          userId,
        },
      },
    });

    return res.status(200).json({
      success: true,
      eligible: !!purchase && !existingReview,
      existingReview,
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

    const existingReview = await prisma.review.findUnique({
      where: {
        productId_userId: {
          productId: product.id,
          userId,
        },
      },
    });

    if (existingReview) {
      throw new AppError("You have already reviewed this product.", 400);
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
