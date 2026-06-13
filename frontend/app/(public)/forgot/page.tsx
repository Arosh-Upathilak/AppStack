"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/Icon";
import { toast } from "react-toastify";
import { isValidEmailAddressFormat } from "@/lib/utils";
import axios from "axios";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { retryOnTransient } from "@/lib/retry";
import { getErrorMessage } from "@/lib/api/errors";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBusy(true);
      setError(null);
      if (!email) {
        setError("Email required");
        return;
      }

      if (!isValidEmailAddressFormat(email)) {
        setError("Email is invalid");
        return;
      }

      const token = await getRecaptchaToken("forgot_password");

      await retryOnTransient(() =>
        axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/forgot-password`,
          {
            email: email,
            token,
          },
        ),
      );
      toast.success("Password reset link sent to your email");
      setDone(true);
    } catch (error) {
      const message = getErrorMessage(error, "Forgot email sent failed");

      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pub-auth-page">
      <div className="pub-auth-card">
        <div className="pub-auth-logo">
          <div
            className="pub-brand-mark"
            style={{ width: 40, height: 40, fontSize: 18 }}
          >
            A
          </div>
        </div>
        <h1 className="pub-auth-title">Reset your password</h1>
        <p className="pub-auth-sub">
          {done
            ? "If an account exists for that email, a reset link is on its way."
            : "Enter your email and we’ll send a reset link."}
        </p>

        {!done && (
          <form className="pub-auth-form" onSubmit={handleForgotPassword}>
            <label className="field-label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            {error && (
              <div
                style={{
                  marginTop: 12,
                  color: "var(--danger,#dc2626)",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy}
              style={{ width: "100%", height: 40, marginTop: 16 }}
            >
              {busy ? (
                "Sending…"
              ) : (
                <>
                  Send reset link <Icon name="arrow_right" size={13} />
                </>
              )}
            </button>
          </form>
        )}

        <p className="pub-auth-switch">
          <Link href="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
