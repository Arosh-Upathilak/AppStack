"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import Icon from "@/components/Icon";
import { submitSellerApplication } from "@/lib/api/sellers";

export default function BecomeSellerPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [businessName, setBusinessName] = useState("");
  const [payoutEmail, setPayoutEmail] = useState("");
  const [aboutProject, setAboutProject] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    const roles = (session?.user?.role ?? []) as string[];
    if (roles.includes("SELLER")) {
      router.replace("/seller");
    }
    setPayoutEmail(session?.user?.email as string);
  }, [status, session, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await submitSellerApplication({
        businessName: businessName.trim(),
        payoutEmail: payoutEmail.trim().toLowerCase(),
        aboutProject: aboutProject.trim(),
      });

      setBusinessName("");
      setAboutProject("");

      setSubmitted(true);

      toast.success(
        response?.data.message ||
          "Application submitted — we'll email you once reviewed.",
      );
    } catch (err) {
      const axiosError = err as any;
      const message =
        axiosError?.message ||
        "Could not submit application. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  // Shared .input class (globals.css) — full-border focus + ring, consistent
  // with every other form in the app.
  const inputCls = "input";
  const labelCls = "text-[13px] font-medium text-ink-2";
  const hintCls = "mt-1 mb-1.5 text-xs text-ink-4";

  if (submitted) {
    return (
      <div className="page screen-enter">
        <div className="mx-auto mt-16 max-w-lg text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <Icon name="check" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-ink-1">
            Application submitted
          </h1>
          <p className="mt-2.5 text-sm leading-relaxed text-ink-4">
            Thanks — an administrator will review your seller application
            shortly. We&apos;ll email you the moment it&apos;s approved (or if
            we need more info). You can keep using AppStack as a buyer in the
            meantime.
          </p>
          <button
            onClick={() => router.push("/buyer")}
            className="mt-6 inline-flex h-10 min-w-[200px] items-center justify-center rounded-md bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            Back to buyer dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page screen-enter">
      <div className="mx-auto my-10 max-w-2xl">
        <div className="mb-7">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <Icon name="package" size={22} />
          </div>
          <h1 className="text-[26px] font-bold tracking-tight text-ink-1">
            Sell your SaaS on AppStack
          </h1>
          <p className="mt-2 text-[14.5px] leading-relaxed text-ink-4">
            Reach buyers actively managing their stack. We handle payments,
            invoicing, and refunds — your platform integrates over a single
            webhook. Submit your details below and an admin will review your
            application.
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-[18px]">
          <div className="flex flex-col">
            <label className={labelCls}>Payout email</label>
            <p className={hintCls}>
              Where you&apos;ll receive payout notifications and invoices.
            </p>
            <input
              type="email"
              className={inputCls}
              value={payoutEmail}
              readOnly
            />
          </div>

          <div className="flex flex-col">
            <label className={labelCls}>Business name</label>
            <input
              className={`${inputCls} mt-1.5`}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              placeholder="Acme Corp"
              autoComplete="organization"
            />
          </div>

          <div className="flex flex-col">
            <label className={labelCls}>About your product</label>
            <p className={hintCls}>
              A short description to help the reviewer understand what
              you&apos;ll be listing.
            </p>
            <textarea
              className="min-h-[96px] w-full resize-y rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-ink-1 outline-none transition-colors placeholder:text-ink-5 focus:border-brand"
              value={aboutProject}
              onChange={(e) => setAboutProject(e.target.value)}
              required
              placeholder="We sell a project-management SaaS for engineering teams…"
              rows={4}
            />
          </div>

          {error && (
            <div className="text-[13px] leading-relaxed text-danger">
              {error}
            </div>
          )}

          <div className="mt-1 flex gap-2.5">
            <button
              type="button"
              onClick={() => router.push("/buyer")}
              className="h-[42px] rounded-md border border-line bg-surface px-5 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-[42px] flex-1 items-center justify-center gap-2 rounded-md bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
            >
              {busy ? (
                "Submitting…"
              ) : (
                <>
                  Submit for review <Icon name="arrow_right" size={13} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
