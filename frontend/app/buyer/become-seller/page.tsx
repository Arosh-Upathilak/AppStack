"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "react-toastify";
import Icon from "@/components/Icon";

export default function BecomeSellerPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [businessName, setBusinessName] = useState("");
  const [payoutEmail, setPayoutEmail] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // If the user is already a seller, send them to /seller — the seller layout
  // will show the pending gate if they're not yet approved.
  useEffect(() => {
    if (status !== "authenticated") return;
    const roles = (session?.user?.role ?? []) as string[];
    if (roles.includes("SELLER")) {
      router.replace("/seller");
    }
  }, [status, session, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/become-seller`,
        {
          businessName: businessName.trim(),
          payoutEmail: payoutEmail.trim().toLowerCase(),
          webhookUrl: webhookUrl.trim(),
          description: description.trim(),
        },
        { withCredentials: true },
      );
      setSubmitted(true);
      toast.success("Application submitted — we'll email you once reviewed.");
    } catch (err: any) {
      // Backend `/auth/become-seller` may not exist yet — surface a friendly
      // error so we can keep working against the planned contract.
      const message =
        err?.response?.data?.error ||
        err?.message ||
        "Could not submit application. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <div className="page screen-enter">
        <div
          style={{
            maxWidth: 520,
            margin: "60px auto",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "var(--brand-soft)",
              color: "var(--brand)",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 20px",
            }}
          >
            <Icon name="check" size={28} />
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "var(--ink-1)",
              margin: 0,
            }}
          >
            Application submitted
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--ink-4)",
              marginTop: 10,
              lineHeight: 1.6,
            }}
          >
            Thanks — an administrator will review your seller application
            shortly. We&apos;ll email you the moment it&apos;s approved (or if
            we need more info). You can keep using AppStack as a buyer in the
            meantime.
          </p>
          <button
            className="btn btn-primary"
            style={{ height: 40, marginTop: 24, minWidth: 200 }}
            onClick={() => router.push("/buyer")}
          >
            Back to buyer dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page screen-enter">
      <div style={{ maxWidth: 720, margin: "40px auto" }}>
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "var(--brand-soft)",
              color: "var(--brand)",
              display: "grid",
              placeItems: "center",
              marginBottom: 16,
            }}
          >
            <Icon name="package" size={22} />
          </div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "var(--ink-1)",
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            Sell your SaaS on AppStack
          </h1>
          <p
            style={{
              fontSize: 14.5,
              color: "var(--ink-4)",
              marginTop: 8,
              lineHeight: 1.6,
            }}
          >
            Reach buyers actively managing their stack. We handle payments,
            invoicing, and refunds — your platform integrates over a single
            webhook. Submit your details below and an admin will review your
            application.
          </p>
        </div>

        <form
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: 18 }}
        >
          <div>
            <label className="field-label">Business name</label>
            <input
              className="input"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              placeholder="Acme Corp"
              autoComplete="organization"
            />
          </div>

          <div>
            <label className="field-label">Payout email</label>
            <p
              style={{
                fontSize: 12,
                color: "var(--ink-4)",
                margin: "2px 0 6px",
              }}
            >
              Where you&apos;ll receive payout notifications and invoices.
            </p>
            <input
              type="email"
              className="input"
              value={payoutEmail}
              onChange={(e) => setPayoutEmail(e.target.value)}
              required
              placeholder="finance@acmecorp.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="field-label">Webhook URL</label>
            <p
              style={{
                fontSize: 12,
                color: "var(--ink-4)",
                margin: "2px 0 6px",
              }}
            >
              We&apos;ll POST subscription events here so your platform can
              activate, change, or cancel plans automatically. (REQ-43)
            </p>
            <input
              type="url"
              className="input"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              required
              placeholder="https://api.acmecorp.com/appstack/webhook"
            />
          </div>

          <div>
            <label className="field-label">About your product</label>
            <p
              style={{
                fontSize: 12,
                color: "var(--ink-4)",
                margin: "2px 0 6px",
              }}
            >
              A short description to help the reviewer understand what
              you&apos;ll be listing.
            </p>
            <textarea
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="We sell a project-management SaaS for engineering teams…"
              rows={4}
              style={{ resize: "vertical", minHeight: 96 }}
            />
          </div>

          {error && (
            <div
              style={{
                color: "var(--danger,#dc2626)",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button
              type="button"
              className="btn"
              onClick={() => router.push("/buyer")}
              style={{ height: 42 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy}
              style={{ flex: 1, height: 42, fontSize: 14 }}
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
