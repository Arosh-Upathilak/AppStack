/**
 * reCAPTCHA v3 client helper.
 *
 * Returns a token for the given action when NEXT_PUBLIC_RECAPTCHA_SITE_KEY is
 * configured. When no site key is set (local/demo), it resolves to an empty
 * string — the backend's verifyRecaptcha() skips verification in dev, so the
 * auth flows still work end-to-end without a live key.
 */
const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (typeof window === "undefined" || !SITE_KEY) return Promise.resolve();
  if (window.grecaptcha) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load reCAPTCHA"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export async function getRecaptchaToken(action: string): Promise<string> {
  if (!SITE_KEY) return "";
  try {
    await loadScript();
    if (!window.grecaptcha) return "";
    await new Promise<void>((resolve) => window.grecaptcha!.ready(resolve));
    return await window.grecaptcha.execute(SITE_KEY, { action });
  } catch {
    // Don't block auth on a reCAPTCHA load failure in dev.
    return "";
  }
}
