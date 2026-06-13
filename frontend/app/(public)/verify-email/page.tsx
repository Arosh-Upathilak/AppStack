"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import Icon from "@/components/Icon";
import { getErrorMessage } from "@/lib/api/errors";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "";
  const verifyToken = searchParams.get("verifyToken") || "";

  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(60);
  const [resendOtpSending, setResendOtpSending] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setBusy(true);
      setError("");

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/verify-otp/${verifyToken}`,
        {
          otp: code,
        },
      );

      toast.success(
        res.data?.message || "Account verified successfully",
      );

      router.push("/login");
    } catch (err) {
      setError(getErrorMessage(err, "Invalid verification code"));
    } finally {
      setBusy(false);
    }
  };

  const resendOtp = async () => {
    try {
      setResendOtpSending(true);

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/send-otp`,
        {
          email,
        },
      );

      toast.success("OTP sent successfully");

      const newToken = res.data?.verifyToken;

      if (newToken) {
        router.replace(
          `/verify-email?email=${encodeURIComponent(
            email,
          )}&verifyToken=${newToken}`,
        );
      }

      setTimer(60);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to resend OTP"));
    } finally {
      setResendOtpSending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(mins).padStart(
      2,
      "0",
    )}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="pub-auth-page">
      <div
        className="pub-auth-card"
        style={{ maxWidth: 520 }}
      >
        <div className="pub-auth-logo">
          <div
            className="pub-brand-mark"
            style={{
              width: 40,
              height: 40,
              fontSize: 18,
            }}
          >
            A
          </div>
        </div>

        <h1 className="pub-auth-title">
          Check your email
        </h1>

        <p className="pub-auth-sub">
          We sent a 6-digit code to{" "}
          <strong>{email}</strong>.
          <br />
          It expires in 5 minutes.
        </p>

        <form
          className="pub-auth-form"
          onSubmit={submitOtp}
        >
          <label className="field-label">
            Verification code
          </label>

          <input
            className="input"
            value={code}
            onChange={(e) =>
              setCode(
                e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 6),
              )
            }
            required
            inputMode="numeric"
            pattern="\d{6}"
            autoComplete="one-time-code"
            placeholder="••••••"
            style={{
              letterSpacing: 8,
              textAlign: "center",
              fontSize: 18,
            }}
          />

          {error && (
            <div
              style={{
                marginTop: 12,
                color:
                  "var(--danger,#dc2626)",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={
              busy || code.length !== 6
            }
            style={{
              width: "100%",
              height: 40,
              marginTop: 16,
            }}
          >
            {busy ? (
              "Verifying..."
            ) : (
              <>
                Verify and continue{" "}
                <Icon
                  name="arrow_right"
                  size={13}
                />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={resendOtp}
            disabled={
              timer > 0 || resendOtpSending
            }
            className={`btn btn-primary mt-3 ${
              timer > 0 ||
              resendOtpSending
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            style={{
              width: "100%",
              height: 40,
              marginTop: 16,
            }}
          >
            {resendOtpSending
              ? "Sending..."
              : timer > 0
                ? `Resend OTP in ${formatTime(
                    timer,
                  )}`
                : "Resend OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}
