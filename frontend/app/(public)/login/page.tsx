"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Icon from "@/components/Icon";
import { isValidEmailAddressFormat } from "@/lib/utils";
import { toast } from "react-toastify";
import { useRoleRedirect } from "@/hook/useRoleRedirect";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { getRecaptchaToken } from "@/lib/recaptcha";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginProps>({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // If the user is already authenticated, route them to their dashboard.
  useRoleRedirect();

  const onChangeHandler = (name: keyof LoginProps, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email || !formData.password) {
      setError("All fields are required");
      return;
    }

    if (!isValidEmailAddressFormat(formData.email)) {
      setError("Email is invalid");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password is invalid");
      return;
    }

    setLoading(true);
    const token = await getRecaptchaToken("login");
    const response = await signIn("credentials", {
      redirect: false,
      email: formData.email,
      password: formData.password,
      token,
    });
    setLoading(false);

    if (response?.error) {
      // Don't clear the form on failure — keep the user's input so they can
      // edit and retry.
      setError(response.error || "Login failed");
      toast.error(response.error || "Login failed");
      return;
    }

    // Success — clear and let useRoleRedirect handle navigation.
    setFormData({ email: "", password: "" });
    toast.success("Logged in successfully");
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
        <h1 className="pub-auth-title">Welcome back</h1>
        <p className="pub-auth-sub">Log in to your AppStack account</p>

        <form className="pub-auth-form" onSubmit={handleSignIn}>
          <label className="field-label">Email address</label>
          <input
            type="email"
            className="input"
            value={formData.email}
            onChange={(e) => onChangeHandler("email", e.target.value)}
            required
            autoComplete="email"
            placeholder="you@company.com"
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
            autoComplete="current-password"
            placeholder="••••••••"
          />

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 8,
            }}
          >
            <Link
              href="/forgot"
              style={{ fontSize: 12.5, color: "var(--brand)", fontWeight: 500 }}
            >
              Forgot password?
            </Link>
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
            disabled={loading}
            style={{ width: "100%", height: 40, marginTop: 20, fontSize: 14 }}
          >
            {loading ? (
              "Signing in…"
            ) : (
              <>
                Log in <Icon name="arrow_right" size={13} />
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

        <GoogleSignInButton callbackUrl="/" label="Log in with Google" />

        <p className="pub-auth-switch">
          Don&apos;t have an account?{" "}
          <Link href="/register">Create one free</Link>
        </p>
      </div>
    </div>
  );
}
