"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import Icon from "@/components/Icon";
import { isValidEmailAddressFormat } from "@/lib/utils";
import axios from "axios";
import { toast } from "react-toastify";
import { useRoleRedirect } from "@/hook/useRoleRedirect";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { retryOnTransient } from "@/lib/retry";
import { getErrorMessage } from "@/lib/api/errors";

type Step = "type" | "details" | "otp";

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("type");
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
  const [isRegisteringAsSeller, setIsRegisteringAsSeller] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsRegisteringAsSeller(sessionStorage.getItem("registerAsSeller") === "true");
    }
  }, [step]);

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
      const token = await getRecaptchaToken("create_account");
      const response = await retryOnTransient(() =>
        axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/createUser`, {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
          role: "BUYER",
          token,
        }),
      );
      setVerifyToken(response.data.verifyToken);
      setTimer(60);
      setError("");
      setBusy(false);
      toast.success("Verification code sent");
      setStep("otp");
    } catch (error) {
      const message = getErrorMessage(error, "OTP sent failed");

      setError(message);
      toast.error(message);
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
      toast.success("Account verified successfully");


      const token = await getRecaptchaToken("login");
      const response = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
        token,
      });

      if (response?.error) {
        toast.error(response?.error || "Login failed");
        if (response?.url) router.replace("/register");
      } else {
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
        });
        setError("");
        toast.success("Account created successfully");
        if (isRegisteringAsSeller) {
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("registerAsSeller");
          }
          router.replace("/buyer/become-seller");
        } else {
          router.replace("/buyer");
        }
      }
    } catch (error) {
      const message = getErrorMessage(error, "OTP verification failed");

      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (step !== "otp" || timer <= 0) return;
    const timeout = window.setTimeout(() => {
      setTimer((prev) => {
        return Math.max(0, prev - 1);
      });
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [step, timer]);

  const resendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setResendOtpSending(true);
      await retryOnTransient(() =>
        axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/send-otp`, {
          email: formData.email,
        }),
      );
      toast.success("Verification code resent");
      setTimer(60);
    } catch (error) {
      const message = getErrorMessage(error, "OTP resend failed");
      setError(message);
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

        {step === "type" && (
          <>
            <h1 className="pub-auth-title" style={{ textAlign: "center" }}>Choose account type</h1>
            <p className="pub-auth-sub" style={{ textAlign: "center", marginBottom: 24 }}>
              Are you registering to browse products or to sell your own software?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    sessionStorage.removeItem("registerAsSeller");
                  }
                  setStep("details");
                }}
                className="card card-pad"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  textAlign: "left",
                  gap: 8,
                  cursor: "pointer",
                  width: "100%",
                  border: "1px solid var(--line)",
                  background: "var(--surface)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--brand)";
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--line)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", background: "var(--brand-soft)", color: "var(--brand)" }}>
                    <Icon name="compass" size={16} />
                  </div>
                  <strong style={{ fontSize: 15, color: "var(--ink-1)" }}>Register as Buyer</strong>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "var(--ink-3)" }}>
                  I want to browse the catalogue, make purchases, and manage my active subscriptions.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    sessionStorage.setItem("registerAsSeller", "true");
                  }
                  setStep("details");
                }}
                className="card card-pad"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  textAlign: "left",
                  gap: 8,
                  cursor: "pointer",
                  width: "100%",
                  border: "1px solid var(--line)",
                  background: "var(--surface)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--brand)";
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--line)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", background: "var(--success-soft)", color: "var(--success)" }}>
                    <Icon name="store" size={16} />
                  </div>
                  <strong style={{ fontSize: 15, color: "var(--ink-1)" }}>Register as Seller</strong>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "var(--ink-3)" }}>
                  I want to list my products, define billing plans, track earnings, and manage buyers.
                </p>
              </button>
            </div>
            
            <p className="pub-auth-switch" style={{ marginTop: 24 }}>
              Already have an account? <Link href="/login">Log in</Link>
            </p>
          </>
        )}

        {step === "details" && (
          <>
            <h1 className="pub-auth-title">Create your account</h1>
            <p className="pub-auth-sub">
              {isRegisteringAsSeller
                ? "Enter your details to create your base account. You will be redirected to apply as a seller next."
                : "Start as a buyer — you can apply to sell from your dashboard once you're signed in."}
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
                    Send verification code <Icon name="arrow_right" size={13} />
                  </>
                )}
              </button>
            </form>

            <GoogleSignInButton callbackUrl="/" label="Sign up with Google" />

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
              expires in 5 minutes.
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
                style={{ width: "100%", height: 40, marginTop: 16 }}
                className={`
    btn btn-primary mt-3 px-4 py-2 rounded-md text-sm font-medium transition-all
    ${
      timer > 0 || resendOtpSending
        ? "text-gray-500 cursor-not-allowed"
        : "text-white bg-[var(--brand)] hover:opacity-90"
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
  const order: Step[] = ["type", "details", "otp"];
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
