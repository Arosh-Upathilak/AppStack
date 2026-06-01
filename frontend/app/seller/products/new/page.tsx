"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Icon from "@/components/Icon";
import { createProduct } from "@/lib/api/products";
import { CATEGORIES } from "@/data/mock";

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    tagline: "",
    category: CATEGORIES.find((c) => c !== "All") ?? "Productivity",
    from: "",
    description: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.tagline.trim()) {
      setError("Product name and tagline are required.");
      return;
    }
    const from = Number(form.from);
    if (!form.from || Number.isNaN(from) || from < 0) {
      setError("Enter a valid starting price.");
      return;
    }

    setBusy(true);
    try {
      const { mocked } = await createProduct({
        name: form.name.trim(),
        tagline: form.tagline.trim(),
        category: form.category,
        from,
        description: form.description.trim() || undefined,
      });
      toast.success(
        mocked ? "Product added (demo data)." : "Product published.",
      );
      router.push("/seller/products");
    } catch (err: any) {
      const msg = err?.message || "Could not create product.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "h-10 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink-1 outline-none transition-colors placeholder:text-ink-5 focus:border-brand";
  const labelCls = "text-[13px] font-medium text-ink-2";

  return (
    <div className="page screen-enter">
      <div className="mx-auto w-full max-w-xl">
        <Link
          href="/seller/products"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-ink-1"
        >
          <Icon name="arrow_left" size={15} /> Back to products
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight text-ink-1">
          Add a product
        </h1>
        <p className="mt-1 text-sm text-ink-3">
          List a new SaaS product on the AppStack marketplace.
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Product name</label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="CloudSync Pro"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Tagline</label>
            <input
              className={inputCls}
              value={form.tagline}
              onChange={(e) => set("tagline", e.target.value)}
              placeholder="Real-time data sync for distributed teams"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Category</label>
              <select
                className={inputCls}
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {CATEGORIES.filter((c) => c !== "All").map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Starting price (USD / mo)</label>
              <input
                className={inputCls}
                value={form.from}
                onChange={(e) => set("from", e.target.value)}
                inputMode="numeric"
                placeholder="29"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Description</label>
            <textarea
              className="min-h-[110px] w-full rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-ink-1 outline-none transition-colors placeholder:text-ink-5 focus:border-brand"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What does your product do? Who is it for?"
            />
          </div>

          {error && <div className="text-[13px] text-danger">{error}</div>}

          <div className="mt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
            >
              {busy ? "Publishing…" : (<><Icon name="plus" size={15} /> Publish product</>)}
            </button>
            <Link
              href="/seller/products"
              className="text-sm font-medium text-ink-3 hover:text-ink-1"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
