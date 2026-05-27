import Link from "next/link";
import Icon from "@/components/Icon";
import type { SellerStatus } from "@/types/next-auth";

interface Props {
  /**
   * `null` means the backend hasn't returned a sellerStatus yet (likely because
   * the backend contract isn't fully implemented). Treat as PENDING for UX.
   */
  status: SellerStatus | null;
  /** Optional rejection reason from backend (for REJECTED status). */
  reason?: string | null;
}

export default function PendingApprovalGate({ status, reason }: Props) {
  const effective: SellerStatus = status ?? "PENDING";

  if (effective === "REJECTED") {
    return (
      <div className="page screen-enter">
        <div
          style={{
            maxWidth: 560,
            margin: "80px auto",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "var(--danger-soft, #fee2e2)",
              color: "var(--danger, #dc2626)",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 20px",
            }}
          >
            <Icon name="x" size={28} />
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--ink-1)",
              margin: 0,
            }}
          >
            Application rejected
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--ink-4)",
              marginTop: 10,
              lineHeight: 1.6,
            }}
          >
            Your seller application wasn&apos;t approved. You can still use
            AppStack as a buyer. If you&apos;d like to update your details and
            apply again, click below.
          </p>
          {reason && (
            <div
              style={{
                marginTop: 16,
                padding: "12px 16px",
                borderRadius: 10,
                background: "var(--surface-pressed, #f3f4f6)",
                color: "var(--ink-2)",
                fontSize: 13,
                textAlign: "left",
                lineHeight: 1.55,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  color: "var(--ink-4)",
                  marginBottom: 4,
                }}
              >
                Reason
              </div>
              {reason}
            </div>
          )}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 24,
              justifyContent: "center",
            }}
          >
            <Link
              href="/buyer"
              className="btn"
              style={{ height: 40, minWidth: 160 }}
            >
              Back to buyer dashboard
            </Link>
            <Link
              href="/buyer/become-seller"
              className="btn btn-primary"
              style={{ height: 40, minWidth: 160 }}
            >
              Reapply
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // PENDING (or unknown — defensive default)
  return (
    <div className="page screen-enter">
      <div
        style={{
          maxWidth: 560,
          margin: "80px auto",
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
          <Icon name="clock" size={28} />
        </div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--ink-1)",
            margin: 0,
          }}
        >
          Awaiting approval
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--ink-4)",
            marginTop: 10,
            lineHeight: 1.6,
          }}
        >
          Thanks — your seller application is being reviewed. We&apos;ll email
          you the moment it&apos;s approved (or if we need more info). You can
          keep using AppStack as a buyer in the meantime.
        </p>
        <div
          style={{
            marginTop: 16,
            padding: "10px 14px",
            borderRadius: 10,
            background: "var(--surface-pressed, #f3f4f6)",
            color: "var(--ink-3)",
            fontSize: 12.5,
            display: "inline-block",
          }}
        >
          <strong>What&apos;s next?</strong> An admin reviews your application,
          usually within a business day.
        </div>
        <div style={{ marginTop: 28 }}>
          <Link
            href="/buyer"
            className="btn btn-primary"
            style={{ height: 40, minWidth: 220, justifyContent: "center" }}
          >
            Back to buyer dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
