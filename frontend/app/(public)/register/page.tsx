"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import Icon from "@/components/Icon";
import { isValidEmailAddressFormat } from "@/lib/utils";
import axios from "axios";
import { toast } from "react-toastify";
import { useRoleRedirect } from "@/hook/useRoleRedirect";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { retryOnTransient } from "@/lib/retry";

type Step = "details" | "otp";

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("details");
  const [formData, setFormData] = useState<SignUpProps>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyToken, setVerifyToken] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);
  const [resendOtpSending, setResendOtpSending] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // If the user is already authenticated, send them to their dashboard.
  useRoleRedirect();

  const onChangeHandler = (name: keyof SignUpProps, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password
    ) {
      setError("All the fields required");
      return;
    }

    if (!isValidEmailAddressFormat(formData.email)) {
      setError("Email is invalid");
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      setError("Password is invalid");
      return;
    }

    try {
      setBusy(true);
      // Always register as BUYER. Sellers self-enroll later from the buyer
      // dashboard via /buyer/become-seller (REQ-11 — one identity, roles grow
      // over time).
      //
      // TODO: stop sending `role` once Arosh's backend defaults to BUYER and
      // stops accepting `role` from the request body (closes the
      // privilege-escalation hole). Hardcoded "BUYER" here is safe in the
      // meantime because there's no code path that lets a user choose a
      // different value.
      const token = await getRecaptchaToken("create_account");
      const response = await retryOnTransient(() =>
        axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/createUser`,
          {
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            password: formData.password,
            role: "BUYER",
            token,
          },
        ),
      );
      setVerifyToken(response.data.verifyToken);
      setError("");
      setBusy(false);
      toast.success("OTP sent successful");
      setStep("otp");
    } catch (error) {
      const axiosError = error as any;
      const message = axiosError.response?.data?.error || "OTP sent failed";

      setError(message);
      toast.error(message);
      console.log(error);
    } finally {
      setBusy(false);
    }
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBusy(true);
      await retryOnTransient(() =>
        axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/verify-otp/${verifyToken}`,
          {
            otp: code,
          },
        ),
      );
      setCode("");
      setBusy(false);
      toast.success("OTP verification successful");

      // Auto sign-in. Every new account is a BUYER — no role branching.
      const response = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (response?.error) {
        toast.error(response?.error || "Login Error");
        if (response?.url) router.replace("/register");
      } else {
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
        });
        setError("");
        toast.success("Successful create account");
      }
    } catch (error) {
      const axiosError = error as any;
      const message = axiosError.response?.data?.error || "OTP verification failed";

      setError(message);
      toast.error(message);
      console.log(error);
    } finally {
      setBusy(false);
    }
  };

  const startTimer = () => {
    // Clear previous interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setTimer(60);

    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startTimer();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const resendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setResendOtpSending(true);
      await retryOnTransient(() =>
        axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/send-otp`,
          {
            email: formData.email,
          },
        ),
      );
      toast.success("Resend OTP successful");
      startTimer();
    } catch (error) {
      const axiosError = error as any;
      const message = axiosError.response?.data?.error || "OTP resend failed";
      setError(message);
      console.log(error);
    } finally {
      setResendOtpSending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="pub-auth-page">
      <div className="pub-auth-card" style={{ maxWidth: 520 }}>
        <div className="pub-auth-logo">
          <div
            className="pub-brand-mark"
            style={{ width: 40, height: 40, fontSize: 18 }}
          >
            A
          </div>
        </div>

        <Steps current={step} />

        {step === "details" && (
          <>
            <h1 className="pub-auth-title">Create your account</h1>
            <p className="pub-auth-sub">
              Start as a buyer — you can apply to sell from your dashboard once
              you&apos;re signed in.
            </p>
            <form className="pub-auth-form" onSubmit={handleSignUp}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <label className="field-label">First name</label>
                  <input
                    className="input"
                    value={formData.firstName}
                    onChange={(e) =>
                      onChangeHandler("firstName", e.target.value)
                    }
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <label className="field-label">Last name</label>
                  <input
                    className="input"
                    value={formData.lastName}
                    onChange={(e) =>
                      onChangeHandler("lastName", e.target.value)
                    }
                    required
                    autoComplete="family-name"
                  />
                </div>
              </div>
              <label className="field-label" style={{ marginTop: 14 }}>
                Work email
              </label>
              <input
                type="email"
                className="input"
                value={formData.email}
                onChange={(e) => onChangeHandler("email", e.target.value)}
                required
                autoComplete="email"
              />
              <label className="field-label" style={{ marginTop: 14 }}>
                Password
              </label>
              <input
                type="password"
                className="input"
                value={formData.password}
                onChange={(e) => onChangeHandler("password", e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
              />
              <div
                style={{
                  marginTop: 14,
                  fontSize: 12,
                  color: "var(--ink-4)",
                  lineHeight: 1.5,
                }}
              >
                By creating an account you agree to our{" "}
                <a href="#terms" style={{ color: "var(--brand)" }}>
                  Terms
                </a>{" "}
                and{" "}
                <a href="#privacy" style={{ color: "var(--brand)" }}>
                  Privacy Policy
                </a>
                . Consent is recorded for GDPR.
              </div>
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
                  "Sending code…"
                ) : (
                  <>
                    Send verification code{" "}
                    <Icon name="arrow_right" size={13} />
                  </>
                )}
              </button>
            </form>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                margin: "20px 0 14px",
              }}
            >
              <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
              <span style={{ fontSize: 12, color: "var(--ink-4)" }}>or</span>
              <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
            </div>

            <GoogleSignInButton
              callbackUrl="/"
              label="Sign up with Google"
            />

            <p className="pub-auth-switch">
              Already have an account? <Link href="/login">Log in</Link>
            </p>
          </>
        )}

        {step === "otp" && (
          <>
            <h1 className="pub-auth-title">Check your email</h1>
            <p className="pub-auth-sub">
              We sent a 6-digit code to <strong>{formData.email}</strong>. It
              expires in 10 minutes.
            </p>
            <form className="pub-auth-form" onSubmit={submitOtp}>
              <label className="field-label">Verification code</label>
              <input
                className="input"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
                inputMode="numeric"
                pattern="\d{6}"
                autoComplete="one-time-code"
                placeholder="••••••"
                style={{ letterSpacing: 8, textAlign: "center", fontSize: 18 }}
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
                disabled={busy || code.length !== 6}
                style={{ width: "100%", height: 40, marginTop: 16 }}
              >
                {busy ? (
                  "Verifying…"
                ) : (
                  <>
                    Verify and continue <Icon name="arrow_right" size={13} />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={resendOtp}
                disabled={timer > 0 || resendOtpSending}
                className={`
    mt-3 px-4 py-2 rounded-md text-sm font-medium transition-all
    ${
      timer > 0 || resendOtpSending
        ? " text-gray-500 cursor-not-allowed"
        : " text-white hover:bg-blue-600"
    }
  `}
              >
                {resendOtpSending
                  ? "Sending..."
                  : timer > 0
                    ? `Resend OTP in ${formatTime(timer)}`
                    : "Resend OTP"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function Steps({ current }: { current: Step }) {
  const order: Step[] = ["details", "otp"];
  const idx = order.indexOf(current);
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        justifyContent: "center",
        marginBottom: 20,
      }}
    >
      {order.map((s, i) => (
        <span
          key={s}
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: i <= idx ? "var(--brand)" : "var(--line)",
            transition: "background 200ms",
          }}
        />
      ))}
    </div>
  );
}
