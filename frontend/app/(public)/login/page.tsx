"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import Icon from "@/components/Icon";
import { isValidEmailAddressFormat } from "@/lib/utils";
import { toast } from "react-toastify";
import { useRoleRedirect } from "@/hook/useRoleRedirect";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<LoginProps>({
    email: "",
    password: "",
  });
  const { data: session, status: sessionStatus } = useSession();
  const [loading, setLoading] = useState<boolean>(false);
  const [googleBusy, setGoogleBusy] = useState<boolean>(false);
  const [googleRole, setGoogleRole] = useState<"BUYER" | "SELLER">("BUYER");
  const [error, setError] = useState<string | null>(null);

  useRoleRedirect();

  const onChangeHandler = (name: keyof LoginProps, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    setLoading(true);
    e.preventDefault();

    if (!formData.email || !formData.password) {
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

    const response = await signIn("credentials", {
      redirect: false,
      email: formData.email,
      password: formData.password,
    });

    setError("");
    setFormData({
      email: "",
      password: "",
    });
    setLoading(false);
    if (response?.error) {
      toast.error(response?.error || "Login Error");
      if (response?.url) router.replace("/login");
    } else {
      setError("");
      toast.success("Successful login");
    }
  };

  if (sessionStatus === "loading") {
    return <h1>Loading...</h1>;
  }

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
            margin: "20px 0",
          }}
        >
          <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
          <span style={{ fontSize: 12, color: "var(--ink-4)" }}>
            or continue with Google
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {(["BUYER", "SELLER"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setGoogleRole(r)}
              style={{
                flex: 1,
                height: 34,
                borderRadius: 8,
                border: `1.5px solid ${googleRole === r ? "var(--brand)" : "var(--line)"}`,
                background:
                  googleRole === r ? "var(--brand-soft)" : "transparent",
                color: googleRole === r ? "var(--brand)" : "var(--ink-3)",
                fontSize: 12.5,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {r === "BUYER" ? "Buyer" : "Seller"}
            </button>
          ))}
        </div>

        <button
          type="button"
          /*onClick={continueWithGoogle}
          disabled={googleBusy}*/
          style={{
            width: "100%",
            height: 40,
            borderRadius: 8,
            border: "1.5px solid var(--line)",
            background: "var(--surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            fontSize: 14,
            fontWeight: 500,
            /*cursor: googleBusy ? "not-allowed" : "pointer",
            opacity: googleBusy ? 0.6 : 1,*/
          }}
        >
          <GoogleLogo />
          {googleBusy
            ? "Redirecting…"
            : `Continue as ${googleRole === "BUYER" ? "Buyer" : "Seller"} with Google`}
        </button>

        <p className="pub-auth-switch">
          Don&apos;t have an account?{" "}
          <Link href="/register">Create one free</Link>
        </p>
      </div>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}
