"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/Icon";
import { toast } from "react-toastify";
import axios from "axios";
import { retryOnTransient } from "@/lib/retry";

export default function ResetPage() {
  const router = useRouter();
   const params = useParams();
   const resetToken = params.resetToken as string;

  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);


  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBusy(true);
      setError(null);
      await retryOnTransient(() =>
        axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/reset-password/${resetToken}`,
          {
            password: password,
          },
        ),
      );
      toast.success("Password reset successfully");
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (error) {
      const axiosError = error as any;
      const message = axiosError.response?.data?.error || "Password reset failed";
      setError(message);
      toast.error(message);
      console.log(error);
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
        <h1 className="pub-auth-title">Set a new password</h1>
        <p className="pub-auth-sub">
          {done
            ? "Updated! Redirecting to login…"
            : "Choose a new password for your account."}
        </p>

        {!done && (
          <form className="pub-auth-form" onSubmit={handleResetPassword}>
            <label className="field-label">New password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="At least 8 characters"
              autoComplete="new-password"
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
              disabled={busy || !resetToken}
              style={{ width: "100%", height: 40, marginTop: 16 }}
            >
              {busy ? (
                "Saving…"
              ) : (
                <>
                  Update password <Icon name="arrow_right" size={13} />
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
