"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import { listProducts } from "@/lib/api/products";
import type { Product } from "@/lib/api/types";

export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    // Demo: show the marketplace catalog as the seller's listings.
    listProducts().then((items) => setProducts(items.slice(0, 6)));
  }, []);

  return (
    <div className="page screen-enter">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-1">
            Products
          </h1>
          <p className="mt-1 text-sm text-ink-3">
            Manage the products you sell on AppStack.
          </p>
        </div>
        <Link
          href="/seller/products/new"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          <Icon name="plus" size={15} /> Add product
        </Link>
      </div>

      {products === null ? (
        <div className="rounded-lg border border-line bg-surface p-5 text-sm text-ink-4">
          Loading products…
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface px-6 py-12 text-center text-sm text-ink-4">
          No products yet. Add your first one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-md text-sm font-semibold text-white"
                  style={{ background: p.hue }}
                >
                  {p.name.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-ink-1">
                    {p.name}
                  </div>
                  <div className="truncate text-xs text-ink-4">{p.category}</div>
                </div>
              </div>
              <p className="line-clamp-2 text-[13px] leading-relaxed text-ink-3">
                {p.tagline}
              </p>
              <div className="mt-auto flex items-center justify-between border-t border-line-soft pt-3 text-xs text-ink-4">
                <span>from ${p.from}/mo</span>
                <span className="inline-flex items-center gap-1">
                  <Icon name="star" size={12} /> {p.rating || "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
